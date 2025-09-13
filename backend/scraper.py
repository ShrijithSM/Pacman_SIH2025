# backend/scraper.py
import asyncio
import aiohttp
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import json
from difflib import SequenceMatcher
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)


class WebScraper:
    def __init__(self):
        self.visited_urls = set()
        self.max_depth = 2  # Reduced depth
        self.max_pages = 20  # Limit total pages
        self.pages_scraped = 0

        self.keywords = [
            'faq', 'admission', 'application', 'enroll', 'fee', 'contact', 'course',
            'campus', 'program', 'eligibility', 'academic', 'student', 'faculty'
        ]

    def is_internal_link(self, base_url: str, url: str) -> bool:
        try:
            base_domain = urlparse(base_url).netloc
            url_domain = urlparse(url).netloc
            return base_domain == url_domain or url_domain == ''
        except Exception:
            return False

    def similar(self, a: str, b: str) -> float:
        try:
            return SequenceMatcher(None, a.lower(), b.lower()).ratio()
        except Exception:
            return 0.0

    def is_relevant_link(self, href: str, text: str) -> bool:
        try:
            target_str = (href + " " + text).lower()
            for kw in self.keywords:
                if kw in target_str:
                    return True
                if self.similar(kw, target_str) > 0.6:
                    return True
            return False
        except Exception:
            return False

    async def fetch_page(self, session: aiohttp.ClientSession, url: str) -> str:
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            async with session.get(url, timeout=10, headers=headers) as response:
                if response.status != 200:
                    logger.warning(f"HTTP {response.status} for {url}")
                    return None
                content = await response.text()
                return content
        except asyncio.TimeoutError:
            logger.warning(f"Timeout fetching {url}")
            return None
        except Exception as e:
            logger.error(f"Error fetching {url}: {str(e)}")
            return None

    async def scrape_page(self, session: aiohttp.ClientSession, url: str, base_url: str, depth: int) -> List[Dict]:
        # Check limits
        if (url in self.visited_urls or
                depth > self.max_depth or
                self.pages_scraped >= self.max_pages):
            return []

        self.visited_urls.add(url)
        self.pages_scraped += 1
        logger.info(f"Scraping (depth {depth}, page {self.pages_scraped}): {url}")

        try:
            html = await self.fetch_page(session, url)
            if not html:
                return []

            soup = BeautifulSoup(html, 'html.parser')

            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.decompose()

            title = soup.title.string.strip() if soup.title and soup.title.string else 'No Title'

            # Extract text content with better filtering
            paragraphs = []
            for p in soup.find_all('p'):
                text = p.get_text(strip=True)
                if text and len(text) > 20:  # Filter out very short paragraphs
                    paragraphs.append(text)

            headings = []
            for h in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
                text = h.get_text(strip=True)
                if text:
                    headings.append(text)

            # Only include pages with substantial content
            if not paragraphs and not headings:
                logger.info(f"Skipping {url} - no content found")
                return []

            page_data = {
                'url': url,
                'title': title,
                'paragraphs': paragraphs[:50],  # Limit paragraphs
                'headings': headings[:20]  # Limit headings
            }

            results = [page_data]

            # Find relevant links for further scraping (only if not at max depth)
            if depth < self.max_depth and self.pages_scraped < self.max_pages:
                links = []
                for link in soup.find_all('a', href=True):
                    try:
                        href = link['href']
                        text = link.get_text(strip=True)
                        absolute_link = urljoin(url, href)

                        # Clean the URL (remove fragments and query params for deduplication)
                        clean_url = absolute_link.split('#')[0].split('?')[0]

                        if (clean_url not in self.visited_urls and
                                self.is_internal_link(base_url, absolute_link) and
                                self.is_relevant_link(href, text) and
                                len(links) < 5):  # Limit links per page
                            links.append(clean_url)
                    except Exception as e:
                        logger.error(f"Error processing link: {e}")
                        continue

                # Process links with controlled concurrency
                if links:
                    semaphore = asyncio.Semaphore(3)  # Reduce concurrency

                    async def scrape_with_semaphore(link):
                        async with semaphore:
                            try:
                                return await self.scrape_page(session, link, base_url, depth + 1)
                            except Exception as e:
                                logger.error(f"Error in recursive scrape: {e}")
                                return []

                    tasks = [scrape_with_semaphore(link) for link in links]
                    try:
                        nested_results = await asyncio.gather(*tasks, return_exceptions=True)

                        for nested_result in nested_results:
                            if isinstance(nested_result, list):
                                results.extend(nested_result)
                            elif isinstance(nested_result, Exception):
                                logger.error(f"Task failed: {nested_result}")
                    except Exception as e:
                        logger.error(f"Error gathering results: {e}")

            return results

        except Exception as e:
            logger.error(f"Critical error scraping {url}: {str(e)}")
            return []


async def scrape_college_website(base_url: str) -> List[Dict]:
    """Main function to scrape college website"""
    try:
        scraper = WebScraper()

        connector = aiohttp.TCPConnector(limit=10, limit_per_host=5)
        timeout = aiohttp.ClientTimeout(total=30, connect=10)

        async with aiohttp.ClientSession(
                connector=connector,
                timeout=timeout
        ) as session:
            results = await scraper.scrape_page(session, base_url, base_url, 0)

        logger.info(f"Scraping completed. Found {len(results)} pages")

        # Log sample results for debugging
        for i, result in enumerate(results[:3]):
            logger.info(
                f"Page {i + 1}: {result.get('title', 'No title')} - {len(result.get('paragraphs', []))} paragraphs")

        return results

    except Exception as e:
        logger.error(f"Fatal error in scrape_college_website: {str(e)}")
        raise Exception(f"Scraping failed: {str(e)}")
