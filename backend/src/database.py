from typing import Dict, Any

# Mock database - replace with actual database in production
MOCK_UNIVERSITIES = {
    "univ_001": {
        "name": "Sample University",
        "students": [
            {"name": "John Doe", "roll": "CS2021001"},
            {"name": "Jane Smith", "roll": "CS2021002"}
        ],
        "fee_structure": {
            "semester_fee": 50000,
            "hostel_fee": 25000
        }
    }
}

async def get_university_data(university_id: str) -> Dict[str, Any]:
    """Get university data from database"""
    return MOCK_UNIVERSITIES.get(university_id, {
        "name": "Unknown University",
        "students": [],
        "fee_structure": {}
    })
