#!/usr/bin/env python3
"""
Quick script to test if authentication cookies are working.
Tests by fetching a course page and checking if location data is visible.
"""

import re
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

    # Pick test courses dynamically from the search API — past-term pages stop
    # rendering the location section, so hardcoded URLs rot every semester
    try:
        search_resp = requests.get(
            'https://my.harvard.edu/search/?q=&sort=subject_catalog&page=1',
            headers={'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json'},
            timeout=10,
        )
        hits_soup = BeautifulSoup(search_resp.json().get('hits', ''), 'html.parser')
        seen = []
        for a in hits_soup.find_all('a', href=re.compile(r'^/course/')):
            if a['href'] not in seen:
                seen.append(a['href'])
        test_urls = [(f'https://my.harvard.edu{h}', h.split('/course/')[1]) for h in seen[:5]]
    except Exception as e:
        print(f"❌ ERROR: Could not fetch course list from search API: {e}")
        return False

    if not test_urls:
        print("❌ ERROR: Search API returned no courses to test against")
        return False

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Cookie': cookies,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    }

    print("Testing authentication with sample courses...\n")
    print("=" * 70)

    any_success = False
    auth_failure_seen = False

    for url, expected_info in test_urls:
        print(f"\nTesting: {expected_info}")
        print(f"URL: {url}")

        try:
            response = requests.get(url, headers=headers, timeout=10)

            if response.status_code != 200:
                print(f"❌ FAILED: HTTP {response.status_code}")
                continue

            soup = BeautifulSoup(response.text, 'html.parser')

            # Check for location div
            location_div = soup.find('div', id='course-location')

            if not location_div:
                print("⚠️  SKIPPED: Location div not found")
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
                        auth_failure_seen = True
                        continue

                    # Success - we got location data
                    print(f"✅ SUCCESS: Location extracted")
                    print(f"   Location: '{location_text}'")
                    any_success = True
                else:
                    print("⚠️  SKIPPED: Location span not found")
            else:
                print("⚠️  SKIPPED: Location flex div not found")

        except requests.RequestException as e:
            print(f"❌ FAILED: Network error - {e}")
        except Exception as e:
            print(f"❌ FAILED: Unexpected error - {e}")

    print("\n" + "=" * 70)

    if any_success and not auth_failure_seen:
        print("\n🎉 SUCCESS: Authentication is working!")
        print("   Location data was successfully extracted.")
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
