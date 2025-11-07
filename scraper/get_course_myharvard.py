import requests
from bs4 import BeautifulSoup, Tag, NavigableString
import json
from typing import Dict, List, Optional, Union, Any
from pathlib import Path

class CourseDataNotFoundError(Exception):
    pass

class CourseScraper:
    def __init__(self, url: str, debug: bool = False, cookies: Optional[str] = None):
        self.url = url
        self.debug = debug
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        }

        # If cookies not provided, try to load from cookie.txt file
        if cookies:
            self.headers['Cookie'] = cookies
        else:
            cookie_file = Path(__file__).parent / 'cookie.txt'
            if cookie_file.exists():
                with open(cookie_file, 'r') as f:
                    cookie_content = f.read().strip()
                    if cookie_content:
                        self.headers['Cookie'] = cookie_content

        self.soup: Optional[BeautifulSoup] = None

    def _make_request(self) -> str:
        """Make HTTP request and return response text."""
        response = requests.get(self.url, headers=self.headers)
        response.raise_for_status()
        return response.text

    def _safe_text(self, element: Optional[Union[Tag, NavigableString]]) -> str:
        """Safely extract text from an element."""
        if not element or not isinstance(element, (Tag, NavigableString)):
            return ""
        return element.text.strip()

    def _safe_label_text(self, label_text: str) -> str:
        """Safely extract text from a div with label."""
        if not self.soup:
            return ""

        label = self.soup.find('strong', string=label_text)
        if not label or not isinstance(label, Tag):
            return ""

        # Try to find the next sibling that contains the value
        # Check span, a, and p tags
        value = label.find_next_sibling('span') or label.find_next_sibling('a') or label.find_next_sibling('p')
        if not value or not isinstance(value, Tag):
            return ""

        return value.text.strip()

    def _safe_div_text(self, div_id: str, field_name: str) -> str:
        """Safely extract text from a div with ID."""
        if not self.soup:
            return ""

        div = self.soup.find('div', id=div_id)
        if not div or not isinstance(div, Tag):
            return ""
        p = div.find('p')
        if not p or not isinstance(p, Tag):
            return ""
        return p.text.strip()

    def _safe_div_class_text(self, div_class: str) -> str:
        """Safely extract text from a div with class name."""
        if not self.soup:
            return ""

        div = self.soup.find('div', class_=div_class)
        if not div or not isinstance(div, Tag):
            return ""

        # Find direct child paragraphs only (not nested ones)
        # This avoids duplicating content from nested <p> tags
        paragraphs = div.find_all('p', recursive=True)
        if not paragraphs:
            return ""

        # Get unique texts by using a set to track what we've seen
        seen_texts = set()
        unique_texts = []
        for p in paragraphs:
            if not isinstance(p, Tag):
                continue
            text = p.text.strip()
            if text and text not in seen_texts:
                seen_texts.add(text)
                unique_texts.append(text)

        return '\n'.join(unique_texts)

    def _extract_days(self) -> Dict[str, bool]:
        """Extract course days from the HTML."""
        if not self.soup:
            return {day: False for day in ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']}
            
        days_div = self.soup.find('div', {'role': 'group', 'aria-label': 'Week Days'})
        if not days_div or not isinstance(days_div, Tag):
            return {day: False for day in ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']}
        
        days = {day: False for day in ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']}
        
        for day_div in days_div.find_all('div', {'role': 'text'}):
            if not isinstance(day_div, Tag):
                continue
            aria_label = day_div.get('aria-label', '')
            if not isinstance(aria_label, str):
                continue
            aria_label = aria_label.lower()
            if ', selected' in aria_label:
                day_name = aria_label.replace(', selected', '').strip()
                days[day_name] = True
        
        return days

    def _extract_instructors(self) -> List[Dict[str, str]]:
        """Extract instructor information."""
        if not self.soup:
            return []
            
        instructor_div = self.soup.find('div', id='course-instructor')
        if not instructor_div or not isinstance(instructor_div, Tag):
            return []
        
        instructors = []
        for instructor_link in instructor_div.find_all('a', class_='flex'):
            if not isinstance(instructor_link, Tag):
                continue
            spans = instructor_link.find_all('span', recursive=False)
            if len(spans) < 2 or not isinstance(spans[1], Tag):
                continue
            
            href = instructor_link.get('href', '')
            if not isinstance(href, str):
                continue
            instructor_id = href.split('/')[-1]
            instructors.append({
                'name': spans[1].text.strip(),
                'id': instructor_id
            })
        
        return instructors

    def _extract_location(self) -> str:
        """Extract course location."""
        if not self.soup:
            return ""

        location_div = self.soup.find('div', id='course-location')
        if not location_div or not isinstance(location_div, Tag):
            return ""

        # Find the span inside the flex div that contains the location
        flex_div = location_div.find('div', class_='flex')
        if not flex_div or not isinstance(flex_div, Tag):
            return ""

        span = flex_div.find('span')
        if not span or not isinstance(span, Tag):
            return ""

        # Get the text from the span
        # It might be the actual location (e.g., "TBA", "Harvard Hall 201")
        # or it might contain "Sign In to see location" when not authenticated
        location_text = span.text.strip()

        # Check if it's asking to sign in (not authenticated)
        if 'sign in' in location_text.lower() or 'signin' in location_text.lower():
            return ""

        return location_text

    def _extract_course_website(self) -> str:
        """Extract course website URL from the links section."""
        if not self.soup:
            return ""

        # Find the course-links section
        links_div = self.soup.find('div', id='course-links')
        if not links_div or not isinstance(links_div, Tag):
            return ""

        # Find all links in this section
        for link in links_div.find_all('a', href=True):
            if not isinstance(link, Tag):
                continue
            href = link.get('href', '')
            if not isinstance(href, str):
                continue

            # Check if this is the course website link
            # It should contain "locator.tlt.harvard.edu"
            if 'locator.tlt.harvard.edu' in href:
                return href

            # Alternative: check if the link contains a div with text "Website"
            div = link.find('div')
            if div and isinstance(div, Tag) and div.text.strip().lower() == 'website':
                return href

        return ""

    def _extract_course_info(self) -> Dict[str, str]:
        """Extract basic course information."""
        if not self.soup:
            return {
                'class_number': '',
                'course_id': '',
                'consent': '',
                'enrolled': '',
                'waitlist': ''
            }
            
        course_info_div = self.soup.find('div', id='course-info')
        if not course_info_div or not isinstance(course_info_div, Tag):
            return {
                'class_number': '',
                'course_id': '',
                'consent': '',
                'enrolled': '',
                'waitlist': ''
            }
        
        def get_info_value(label_text: str) -> str:
            label = course_info_div.find('span', string=label_text)
            if not label or not isinstance(label, Tag):
                return ""
            value = label.find_next_sibling('span')
            if not value or not isinstance(value, Tag):
                return ""
            return value.text.strip()
        
        return {
            'class_number': get_info_value('Class Number:'),
            'course_id': get_info_value('Course ID:'),
            'consent': get_info_value('Consent:'),
            'enrollment': get_info_value('Enrollment:'),
            'waitlist': get_info_value('Waitlist:')
        }

    def _extract_event_data(self) -> Dict[str, Union[str, List[str], None]]:
        """Extract event-related data from the course-time section."""
        if not self.soup:
            return {
                'start_date': '',
                'end_date': '',
                'start_time': '',
                'end_time': '',
                'weekdays': ''
            }

        # Get the course-time div which contains all timing information
        course_time_div = self.soup.find('div', id='course-time')
        if not course_time_div or not isinstance(course_time_div, Tag):
            return {
                'start_date': '',
                'end_date': '',
                'start_time': '',
                'end_time': '',
                'weekdays': ''
            }

        start_date = ''
        end_date = ''
        start_time = ''
        end_time = ''
        weekdays = []

        # Extract date range (e.g., "Sept. 2, 2025 – Dec. 3, 2025")
        # Look for a span containing an en-dash or em-dash
        for span in course_time_div.find_all('span'):
            if not isinstance(span, Tag):
                continue
            text = span.text.strip()
            # Check if this looks like a date range
            if ('–' in text or '—' in text or ' - ' in text) and ('2025' in text or '2026' in text):
                # Split on various dash types
                parts = []
                if '–' in text:
                    parts = text.split('–')
                elif '—' in text:
                    parts = text.split('—')
                elif ' - ' in text:
                    parts = text.split(' - ')

                if len(parts) == 2:
                    start_date = parts[0].strip()
                    end_date = parts[1].strip()
                break

        # Extract time range (e.g., "10:30am - 11:45am")
        for span in course_time_div.find_all('span'):
            if not isinstance(span, Tag):
                continue
            text = span.text.strip()
            # Check if this looks like a time range (contains am/pm and dash)
            if ('am' in text.lower() or 'pm' in text.lower()) and ('-' in text or '–' in text):
                # Split on dash
                parts = []
                if '–' in text:
                    parts = text.split('–')
                elif ' - ' in text:
                    parts = text.split(' - ')
                elif '-' in text:
                    parts = text.split('-')

                if len(parts) == 2:
                    start_time = parts[0].strip()
                    end_time = parts[1].strip()
                break

        # Extract weekdays from the aria-labels
        # Look for divs with aria-labels containing ", selected"
        days_group = course_time_div.find('div', {'role': 'group', 'aria-label': 'Week Days'})
        if days_group and isinstance(days_group, Tag):
            for day_div in days_group.find_all('div', {'role': 'text'}):
                if not isinstance(day_div, Tag):
                    continue
                aria_label = day_div.get('aria-label', '')
                if not isinstance(aria_label, str):
                    continue
                if ', selected' in aria_label.lower():
                    # Extract the day name (e.g., "Monday, selected" -> "Monday")
                    day_name = aria_label.replace(', selected', '').replace(', Selected', '').strip()
                    weekdays.append(day_name)

        # Join weekdays into a comma-separated string
        weekdays_str = ', '.join(weekdays) if weekdays else ''

        return {
            'start_date': start_date,
            'end_date': end_date,
            'start_time': start_time,
            'end_time': end_time,
            'weekdays': weekdays_str
        }

    def _extract_course_title(self) -> Dict[str, str]:
        """Extract course title and related information."""
        if not self.soup:
            return {
                'course_title': '',
                'subject_catalog': ''
            }
            
        # Get the main title element
        title_elem = self.soup.find('h1', class_='text-lg')
        if not title_elem or not isinstance(title_elem, Tag):
            return {
                'course_title': '',
                'subject_catalog': ''
            }
            
        # Extract course title
        course_title_elem = title_elem.find('span', id='course-title')
        course_title = self._safe_text(course_title_elem)
        
        # Extract subject and catalog number using the course-sub-cat ID
        subject_cat_elem = title_elem.find('div', id='course-sub-cat')
        if subject_cat_elem and isinstance(subject_cat_elem, Tag):
            subject_catalog = self._safe_text(subject_cat_elem.find('span', recursive=False))
        else:
            subject_catalog = ''
        
        return {
            'course_title': course_title,
            'subject_catalog': subject_catalog
        }

    def scrape(self) -> Dict[str, Any]:
        """Main method to scrape course data."""
        try:
            # Get and parse HTML
            html_content = self._make_request()
            
            # Save HTML content if debug mode is enabled
            if self.debug:
                import os
                from datetime import datetime
                debug_dir = "debug_html"
                os.makedirs(debug_dir, exist_ok=True)
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"{debug_dir}/course_{timestamp}.html"
                with open(filename, 'w', encoding='utf-8') as f:
                    f.write(html_content)
                print(f"Saved HTML content to {filename}")
            
            self.soup = BeautifulSoup(html_content, 'html.parser')
            
            # Extract course title information
            title_info = self._extract_course_title()
            
            if not title_info['course_title']:
                raise CourseDataNotFoundError("Critical course information (course title) is missing")
            
            # Extract course time information
            course_time_div = self.soup.find('div', id='course-time')
            if not course_time_div or not isinstance(course_time_div, Tag):
                year_term = ""
                term_type = ""
            else:
                spans = course_time_div.find_all('span')
                year_term = self._safe_text(spans[0] if len(spans) > 0 else None)
                term_type = self._safe_text(spans[1] if len(spans) > 1 else None)
            
            # Combine all data
            course_data = {
                **title_info,  # This includes course_title and subject_catalog
                'instructors': self._extract_instructors(),
                'year_term': year_term,
                'term_type': term_type,
                **self._extract_event_data(),
                **self._extract_course_info(),
                **{f'lecture_{day}': value for day, value in self._extract_days().items()},
                'location': self._extract_location(),
                'course_website': self._extract_course_website(),

                # Additional course information
                'description': self._safe_div_text('course-desc', 'description'),
                'notes': self._safe_div_text('course-notes', 'notes'),
                'class-notes': self._safe_div_class_text('course-page-class-notes'),
                'school': self._safe_label_text('School'),
                'units': self._safe_label_text('Units'),
                'credits': self._safe_label_text('Credits'),
                'exam': self._safe_label_text('Exam/Final Deadline'),
                'cross_registration': self._safe_label_text('Cross Reg'),
                'department': self._safe_label_text('Department'),
                'course_component': self._safe_label_text('Course Component'),
                'instruction_mode': self._safe_label_text('Instruction Mode'),
                'grading_basis': self._safe_label_text('Grading Basis'),
                'course_requirements': self._safe_label_text('Course Requirements'),
                'general_education': self._safe_label_text('General Education'),
                'quantitative_reasoning': self._safe_label_text('Quantitative Reasoning with Data'),
                'divisional_distribution': self._safe_label_text('Divisional Distribution'),
                'course_level': self._safe_label_text('Course Level'),
            }
            
            return course_data
            
        except requests.RequestException as e:
            print(f"Error fetching the page: {e}")
            raise
        except CourseDataNotFoundError as e:
            print(f"Error: {e}")
            raise
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            raise


if __name__ == "__main__":
    url = "https://beta.my.harvard.edu/course/STAT109A/2025-Fall/001"
    # Example with debug mode enabled
    scraper = CourseScraper(url, debug=True)
    course_data = scraper.scrape()
    
    # Save the course data to a JSON file
    with open('course_data.json', 'w') as f:
        json.dump(course_data, f, indent=4)