#!/usr/bin/env python3
"""Master merge script to combine all_courses_cleaned.json and course_analytics.json"""

import json
from collections import defaultdict
from typing import Dict, List, Any, Tuple
from datetime import datetime

def load_json(filepath: str) -> Any:
    """Load JSON file safely."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: {filepath} not found")
        return None
    except json.JSONDecodeError as e:
        print(f"Error parsing {filepath}: {e}")
        return None

def group_current_courses(courses: List[Dict]) -> Dict[str, List[Dict]]:
    """Group current courses by course_id."""
    courses_by_id = defaultdict(list)

    for course in courses:
        course_id = course.get('course_id')
        if not course_id:
            continue
        courses_by_id[course_id].append(course)

    return courses_by_id


def build_old_locations(old_master: List[Dict]) -> Dict[tuple, str]:
    """Build a lookup of (course_id, section) -> location from existing data.

    This allows preserving location data when new scrapes have empty locations
    (e.g., due to expired authentication cookies).
    """
    old_locations = {}
    if not old_master:
        return old_locations

    for course in old_master:
        course_id = course.get('course_id')
        if not course_id:
            continue
        for section in course.get('current_sections', []):
            location = section.get('location', '')
            if location:  # Only store non-empty locations
                key = (course_id, section.get('section', 'default'))
                old_locations[key] = location

    return old_locations

def merge_data(all_courses: List[Dict], analytics: Dict, old_locations: Dict[Tuple[str, str], str] = None) -> Tuple[List[Dict], int]:
    """
    Merge all_courses_cleaned with course_analytics.
    Only keeps courses that are currently being offered.

    Args:
        all_courses: List of current course data
        analytics: Dict of Q-Guide analytics by course_id
        old_locations: Optional dict of (course_id, section) -> location for preserving old data

    Returns:
        Tuple of (merged_data, locations_preserved_count)
    """
    if old_locations is None:
        old_locations = {}

    # Group current courses by course_id
    current_courses = group_current_courses(all_courses)

    # Create merged entries - one per unique course_id from current offerings
    merged_data = []
    locations_preserved = 0

    for course_id, sections in current_courses.items():
        if not course_id:
            continue
            
        # Get first section for default values
        first_section = sections[0]
        
        # Start with base entry from current course data
        entry = {
            'course_id': course_id,
            'course_code': first_section.get('subject_catalog', 'UNKNOWN'),
            'course_title': first_section.get('course_title', ''),
            
            # These will be populated from analytics if available
            'latest_course_rating': 0,
            'latest_hours_per_week': 0,
            'latest_num_students': 0,
            'latest_semester_with_data': 'N/A',
            
            # Historical data (will be populated if available)
            'historical_semesters': {},
            'all_historical_codes': [],
            'all_historical_titles': [],
            
            # Current offering details
            'current_term': first_section.get('year_term', ''),
            'current_sections': []
        }
        
        # Add all current sections
        for section in sections:
            section_id = section.get('section', 'default')
            location = section.get('location', '')

            # If location is empty, try to preserve from old data
            if not location:
                key = (course_id, section_id)
                old_location = old_locations.get(key, '')
                if old_location:
                    location = old_location
                    locations_preserved += 1

            section_info = {
                'section': section_id,
                'instructors': section.get('instructors', ''),
                'enrollment': section.get('enrollment', ''),
                'class_number': section.get('class_number', ''),
                'instruction_mode': section.get('instruction_mode', ''),
                'course_component': section.get('course_component', ''),
                'start_time': section.get('start_time', ''),
                'end_time': section.get('end_time', ''),
                'weekdays': section.get('weekdays', ''),
                'location': location,
                'grading_basis': section.get('grading_basis', ''),
            }
            
            # Add weekday flags
            for day in ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']:
                key = f'lecture_{day}'
                if key in section:
                    section_info[key] = section[key]
            
            entry['current_sections'].append(section_info)
        
        # Add description and other course-level info from first section
        entry['description'] = first_section.get('description', '')
        entry['notes'] = first_section.get('notes', '')
        entry['school'] = first_section.get('school', '')
        entry['department'] = first_section.get('department', '')
        entry['credits'] = first_section.get('credits', '')
        entry['course_requirements'] = first_section.get('course_requirements', '')
        entry['course_url'] = first_section.get('course_url', '')
        entry['course_website'] = first_section.get('course_website', '')
        entry['general_education'] = first_section.get('general_education', '')
        entry['divisional_distribution'] = first_section.get('divisional_distribution', '')
        entry['quantitative_reasoning'] = first_section.get('quantitative_reasoning', '')
        entry['course_level'] = first_section.get('course_level', '')
        entry['consent'] = first_section.get('consent', '')
        entry['term_type'] = first_section.get('term_type', '')
        entry['start_date'] = first_section.get('start_date', '')
        entry['end_date'] = first_section.get('end_date', '')
        entry['exam'] = first_section.get('exam', '')
        entry['cross_registration'] = first_section.get('cross_registration', '')
        
        # Check if we have analytics data for this course
        if course_id in analytics:
            analytics_data = analytics[course_id]
            
            # Add historical analytics
            entry['latest_course_rating'] = analytics_data.get('latest_course_rating', 0)
            entry['latest_hours_per_week'] = analytics_data.get('latest_hours_per_week', 0)
            entry['latest_num_students'] = analytics_data.get('latest_num_students', 0)
            entry['latest_semester_with_data'] = analytics_data.get('latest_semester', 'N/A')
            
            # Add historical data
            entry['historical_semesters'] = analytics_data.get('semesters', {})
            entry['all_historical_codes'] = analytics_data.get('all_course_codes', [])
            entry['all_historical_titles'] = analytics_data.get('all_course_titles', [])
            
            # Update course title from analytics if current one is empty
            if not entry['course_title'] and analytics_data.get('latest_course_title'):
                entry['course_title'] = analytics_data['latest_course_title']
        
        merged_data.append(entry)
    
    # Sort by course code for better readability
    merged_data.sort(key=lambda x: x.get('course_code', 'ZZZ'))

    return merged_data, locations_preserved

def generate_summary_stats(merged_data: List[Dict]) -> Dict:
    """Generate summary statistics for the merged data."""
    stats = {
        'total_courses': len(merged_data),
        'courses_with_analytics': 0,
        'courses_without_analytics': 0,
        'courses_with_ratings': 0,
        'courses_with_multiple_sections': 0,
        'total_sections': 0,
        'avg_rating': 0,
        'avg_hours': 0,
        'top_rated_courses': [],
        'most_sections': []
    }
    
    ratings = []
    hours = []
    
    for course in merged_data:
        has_analytics = bool(course.get('historical_semesters'))
        num_sections = len(course.get('current_sections', []))
        
        stats['total_sections'] += num_sections
        
        if has_analytics:
            stats['courses_with_analytics'] += 1
        else:
            stats['courses_without_analytics'] += 1
        
        if num_sections > 1:
            stats['courses_with_multiple_sections'] += 1
        
        rating = course.get('latest_course_rating', 0)
        if rating > 0:
            stats['courses_with_ratings'] += 1
            ratings.append(rating)
            
        hours_val = course.get('latest_hours_per_week', 0)
        if hours_val > 0:
            hours.append(hours_val)
    
    if ratings:
        stats['avg_rating'] = round(sum(ratings) / len(ratings), 2)
        
        # Get top rated courses
        top_courses = sorted(
            [(c['course_code'], c['course_title'], c['latest_course_rating']) 
             for c in merged_data if c.get('latest_course_rating', 0) > 0],
            key=lambda x: x[2],
            reverse=True
        )[:10]
        stats['top_rated_courses'] = top_courses
    
    if hours:
        stats['avg_hours'] = round(sum(hours) / len(hours), 2)
    
    # Get courses with most sections
    most_sections = sorted(
        [(c['course_code'], c['course_title'], len(c['current_sections'])) 
         for c in merged_data],
        key=lambda x: x[2],
        reverse=True
    )[:5]
    stats['most_sections'] = most_sections
    
    return stats

def main(term=None, year=None):
    """Main merge function.

    Args:
        term: Optional term (Fall/Spring) for output filename
        year: Optional year for output filename
    """
    print("Loading data files...")

    # Load all courses (current offerings)
    all_courses = load_json('results/all_courses_cleaned.json')
    if not all_courses:
        print("Failed to load all_courses_cleaned.json")
        return

    # Load analytics (historical Q guide data)
    analytics = load_json('qguide/results/course_analytics.json')
    if not analytics:
        print("Failed to load course_analytics.json")
        return

    # Load existing master data to preserve locations when new data is empty
    # (handles case where cookies expired and locations weren't scraped)
    if term and year:
        # Try term-specific file first, fall back to default
        term_lower = term.lower()
        old_master_path = f'../public/data/master_courses_{term_lower}{year}.json'
        old_master = load_json(old_master_path)
        if not old_master:
            # Fall back to default master_courses.json
            old_master = load_json('../public/data/master_courses.json')
    else:
        old_master = load_json('../public/data/master_courses.json')
    old_locations = build_old_locations(old_master)

    print(f"Loaded {len(all_courses)} current course entries")
    print(f"Loaded {len(analytics)} courses with analytics data")
    if old_locations:
        print(f"Loaded {len(old_locations)} existing locations for preservation")

    # Perform merge
    print("\nMerging data (keeping only currently offered courses)...")
    merged_data, locations_preserved = merge_data(all_courses, analytics, old_locations)
    
    # Generate statistics
    stats = generate_summary_stats(merged_data)
    
    # Save merged data
    if term and year:
        # Create term-specific filename
        term_lower = term.lower()
        output_file = f'results/master_courses_{term_lower}{year}.json'
    else:
        # Default filename
        output_file = 'results/master_courses.json'

    print(f"\nSaving merged data to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(merged_data, f, indent=2, ensure_ascii=False)
    
    # Save timestamp for when the data was generated
    timestamp_file = 'results/last_updated.json'
    timestamp_data = {
        'timestamp': datetime.now().isoformat(),
        'formatted': datetime.now().strftime('%b %d, %Y'),
        'formatted_with_time': datetime.now().strftime('%b %d, %Y at %I:%M %p')
    }
    print(f"Saving timestamp to {timestamp_file}...")
    with open(timestamp_file, 'w', encoding='utf-8') as f:
        json.dump(timestamp_data, f, indent=2)
    
    # Print summary
    print("\n" + "="*60)
    print("MERGE SUMMARY:")
    print("="*60)
    print(f"Total unique courses (currently offered): {stats['total_courses']}")
    print(f"Total sections: {stats['total_sections']}")
    print(f"Courses with Q guide analytics: {stats['courses_with_analytics']}")
    print(f"Courses without analytics (new/no data): {stats['courses_without_analytics']}")
    print(f"Courses with ratings: {stats['courses_with_ratings']}")
    print(f"Courses with multiple sections: {stats['courses_with_multiple_sections']}")
    print(f"Average rating (where available): {stats['avg_rating']}/5.0")
    print(f"Average hours per week (where available): {stats['avg_hours']}")
    if locations_preserved > 0:
        print(f"\n⚠️  Locations preserved from old data: {locations_preserved}")
        print(f"   (This may indicate expired cookies - consider updating MY_HARVARD_COOKIE)")
    
    print("\n" + "="*60)
    print("TOP 10 HIGHEST RATED COURSES (Currently Offered):")
    print("="*60)
    for i, (code, title, rating) in enumerate(stats['top_rated_courses'], 1):
        print(f"{i:2}. {code}: {rating:.2f}/5.0")
        if title:
            print(f"    {title[:70]}...")
    
    print("\n" + "="*60)
    print("COURSES WITH MOST SECTIONS:")
    print("="*60)
    for code, title, num_sections in stats['most_sections']:
        print(f"{code}: {num_sections} sections")
        if title:
            print(f"  {title[:70]}...")
    
    # Show example entries
    print("\n" + "="*60)
    print("EXAMPLE MERGED ENTRIES:")
    print("="*60)
    
    # Example 1: Course with analytics
    example_with_analytics = next((c for c in merged_data 
                                   if c.get('historical_semesters') and c.get('latest_course_rating', 0) > 0), None)
    
    if example_with_analytics:
        print(f"\n1. Course WITH historical analytics:")
        print(f"   Course: {example_with_analytics['course_code']} - {example_with_analytics['course_title'][:50]}...")
        print(f"   Course ID: {example_with_analytics['course_id']}")
        print(f"   Latest Rating: {example_with_analytics['latest_course_rating']}/5.0")
        print(f"   Latest Hours/Week: {example_with_analytics['latest_hours_per_week']}")
        print(f"   Latest Students: {example_with_analytics['latest_num_students']}")
        print(f"   Current Sections: {len(example_with_analytics['current_sections'])}")
        print(f"   Historical Semesters: {len(example_with_analytics['historical_semesters'])}")
    
    # Example 2: Course without analytics
    example_without = next((c for c in merged_data 
                           if not c.get('historical_semesters')), None)
    
    if example_without:
        print(f"\n2. Course WITHOUT historical analytics (new or no Q data):")
        print(f"   Course: {example_without['course_code']} - {example_without['course_title'][:50]}...")
        print(f"   Course ID: {example_without['course_id']}")
        print(f"   Current Sections: {len(example_without['current_sections'])}")
        print(f"   School: {example_without.get('school', 'N/A')}")
        print(f"   Department: {example_without.get('department', 'N/A')}")
    
    print(f"\n✅ Master merge complete! Data saved to {output_file}")
    print(f"   Only currently offered courses were included in the merge.")

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Merge course data with analytics')
    parser.add_argument('--term', choices=['Fall', 'Spring'],
                       help='Term for output filename (e.g., Fall or Spring)')
    parser.add_argument('--year', help='Year for output filename (e.g., 2025 or 2026)')

    args = parser.parse_args()

    main(term=args.term, year=args.year)