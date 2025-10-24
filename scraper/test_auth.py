#!/usr/bin/env python3
"""
Quick script to test if authentication cookies are working.
Tests by fetching a course page and checking if location data is visible.
"""

import requests
from bs4 import BeautifulSoup
from pathlib import Path
import sys

def test_authentication():
    """Test if cookies allow access to authenticated data."""

    # Read cookies from cookie.txt
    cookie_file = Path(__file__).parent / 'cookie.txt'

    if not cookie_file.exists():
        print("❌ ERROR: cookie.txt not found!")
        print(f"   Expected location: {cookie_file}")
        return False

    with open(cookie_file, 'r') as f:
        cookies = f.read().strip()

    if not cookies:
        print("❌ ERROR: cookie.txt is empty!")
        return False

    print("✓ Found cookie.txt")
    print(f"  Cookie length: {len(cookies)} characters")
    print()

    # Test URLs - courses known to have location data
    test_urls = [
        ('https://beta.my.harvard.edu/course/GENED1186/2025-Fall/001', 'GENED1186 - Harvard Hall 201'),
        ('https://beta.my.harvard.edu/course/COMPSCI2880/2026-Spring/001', 'COMPSCI2880 - To Be Announced'),
    ]

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Cookie': cookies,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    }

    print("Testing authentication with sample courses...\n")
    print("=" * 70)

    all_passed = True

    for url, expected_info in test_urls:
        print(f"\nTesting: {expected_info}")
        print(f"URL: {url}")

        try:
            response = requests.get(url, headers=headers, timeout=10)

            if response.status_code != 200:
                print(f"❌ FAILED: HTTP {response.status_code}")
                all_passed = False
                continue

            soup = BeautifulSoup(response.text, 'html.parser')

            # Check for location div
            location_div = soup.find('div', id='course-location')

            if not location_div:
                print("❌ FAILED: Location div not found")
                all_passed = False
                continue

            # Find the span with location text
            flex_div = location_div.find('div', class_='flex')
            if flex_div:
                span = flex_div.find('span')
                if span:
                    location_text = span.text.strip()

                    # Check if authentication is required
                    if 'sign in' in location_text.lower() or 'signin' in location_text.lower():
                        print(f"❌ FAILED: Authentication required")
                        print(f"   Location shows: '{location_text}'")
                        print(f"   → Cookies are expired or invalid")
                        all_passed = False
                        continue

                    # Success - we got location data
                    print(f"✅ SUCCESS: Location extracted")
                    print(f"   Location: '{location_text}'")
                else:
                    print("❌ FAILED: Location span not found")
                    all_passed = False
            else:
                print("❌ FAILED: Location flex div not found")
                all_passed = False

        except requests.RequestException as e:
            print(f"❌ FAILED: Network error - {e}")
            all_passed = False
        except Exception as e:
            print(f"❌ FAILED: Unexpected error - {e}")
            all_passed = False

    print("\n" + "=" * 70)

    if all_passed:
        print("\n🎉 SUCCESS: Authentication is working!")
        print("   All location data was successfully extracted.")
        print("   You can proceed with scraping.")
        return True
    else:
        print("\n❌ AUTHENTICATION FAILED")
        print("\n   Troubleshooting:")
        print("   1. Update cookie.txt with fresh cookies from your browser")
        print("   2. Make sure you're logged into my.harvard.edu")
        print("   3. Copy ALL cookies from the browser (including session tokens)")
        print("\n   How to get cookies:")
        print("   - Open my.harvard.edu in your browser while logged in")
        print("   - Open DevTools (F12) → Network tab")
        print("   - Refresh the page and click any request")
        print("   - Copy the entire 'Cookie' header value")
        print("   - Paste it into cookie.txt")
        return False

if __name__ == "__main__":
    success = test_authentication()
    sys.exit(0 if success else 1)
