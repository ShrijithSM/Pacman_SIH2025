import asyncio
import aiohttp
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import json
from difflib import SequenceMatcher

base_url = 'https://www.jainuniversity.ac.in'  # Example site

visited_urls = set()
data = []

keywords = [
    'faq', 'admission', 'application', 'enroll', 'fee', 'contact', 'course', 'campus', 'program', 'eligibility'
]

max_depth = 5 # Limit crawl depth

def is_internal_link(url):
    base_domain = urlparse(base_url).netloc
    url_domain = urlparse(url).netloc
    return base_domain == url_domain or url_domain == ''

def similar(a, b):
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

def is_relevant_link(href, text):
    target_str = (href + " " + text).lower()
    for kw in keywords:
        if kw in target_str:
            return True
        if similar(kw, target_str) > 0.6:
            return True
    return False

async def fetch(session, url):
    try:
        async with session.get(url) as response:
            if response.status != 200:
                return None
            return await response.text()
    except:
        return None

async def scrape_page(session, url, depth):
    if url in visited_urls or depth > max_depth:
        return
    visited_urls.add(url)
    print(f"Scraping (depth {depth}): {url}")
    html = await fetch(session, url)
    if not html:
        return
    soup = BeautifulSoup(html, 'html.parser')
    title = soup.title.string if soup.title else 'No Title'
    paragraphs = [p.get_text(strip=True) for p in soup.find_all('p')]
    data.append({'url': url, 'title': title, 'paragraphs': paragraphs})

    links = []
    for link in soup.find_all('a', href=True):
        href = link['href']
        text = link.get_text()
        absolute_link = urljoin(url, href)
        if absolute_link not in visited_urls and is_internal_link(absolute_link):
            if is_relevant_link(href, text):
                links.append((absolute_link, depth+1))
    tasks = [scrape_page(session, link, d) for link, d in links]
    await asyncio.gather(*tasks)

async def main():
    async with aiohttp.ClientSession() as session:
        await scrape_page(session, base_url, 0)

asyncio.run(main())

with open('scraped_data_async.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=4, ensure_ascii=False)

print("Async limited-depth scraping complete.")
