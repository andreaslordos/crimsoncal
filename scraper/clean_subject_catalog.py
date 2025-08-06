#!/usr/bin/env python3
"""Clean up subject_catalog field and extract section numbers from all_courses.json"""

import json
import re
from collections import defaultdict

def extract_section_from_url(course_url):
    """Extract section identifier from course URL (the last part)."""
    if not course_url:
        return None
    
    # Pattern: course/COURSECODE/TERM/SECTION
    parts = course_url.split('/')
    if len(parts) >= 4:
        # The last part is the section identifier (can be any string)
        return parts[-1] if parts[-1] else None
    return None

def remove_section_from_catalog(subject_catalog, section):
    """
    Remove section from the end of subject_catalog if it's there.
    Returns cleaned catalog.
    """
    if not section or not subject_catalog:
        return subject_catalog
    
    # Try to remove section from the end of subject_catalog
    # It might be separated by space or directly attached
    
    # First try: section with preceding space(s)
    pattern = rf'\s+{re.escape(section)}$'
    if re.search(pattern, subject_catalog):
        return re.sub(pattern, '', subject_catalog).strip()
    
    # Second try: section directly at the end (no space)
    pattern = rf'{re.escape(section)}$'
    if re.search(pattern, subject_catalog):
        return re.sub(pattern, '', subject_catalog).strip()
    
    # Section not found at the end, return as-is
    return subject_catalog

def clean_subject_catalog(subject_catalog, is_mit=False):
    """Clean up subject_catalog formatting (normalize spaces)."""
    if not subject_catalog:
        return ""
    
    # Replace multiple spaces with single space
    cleaned = re.sub(r'\s+', ' ', subject_catalog).strip()
    
    if is_mit:
        # For MIT courses, remove space before dot in various patterns:
        # - "MIT 10 .952" -> "MIT 10.952" (number.number)
        # - "MIT 7 .MTHG" -> "MIT 7.MTHG" (number.letters)
        # - "MIT 21A .901" -> "MIT 21A.901" (number+letter.number)
        # - "MIT 21A .MTHG" -> "MIT 21A.MTHG" (number+letter.letters)
        # General pattern: any alphanumeric, space, dot, any alphanumeric
        cleaned = re.sub(r'([A-Za-z0-9]+)\s+\.([A-Za-z0-9]+)', r'\1.\2', cleaned)
    
    return cleaned

def process_courses(input_file='results/all_courses.json', output_file='results/all_courses_cleaned.json'):
    """Process all courses to clean subject_catalog and extract sections."""
    
    # Load the JSON file
    print(f"Loading {input_file}...")
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            courses = json.load(f)
    except FileNotFoundError:
        print(f"Error: File {input_file} not found")
        return
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        return
    
    print(f"Loaded {len(courses)} courses")
    
    # First pass: count course_id occurrences
    course_id_counts = defaultdict(int)
    for course in courses:
        if 'course_id' in course and course['course_id']:
            course_id_counts[course['course_id']] += 1
    
    # Find course_ids that are NOT unique (appear multiple times)
    non_unique_course_ids = {cid for cid, count in course_id_counts.items() if count > 1}
    unique_course_ids = {cid for cid, count in course_id_counts.items() if count == 1}
    
    print(f"Found {len(non_unique_course_ids)} course IDs with multiple entries (have sections)")
    print(f"Found {len(unique_course_ids)} unique course IDs")
    
    # Second pass: process each course
    processed_courses = []
    stats = {
        'total': 0,
        'mit_courses': 0,
        'sections_extracted': 0,
        'subject_catalog_cleaned': 0,
        'empty_subject_catalog': 0,
        'letter_sections': 0,
        'numeric_sections': 0,
        'mixed_sections': 0
    }
    
    # Track examples for reporting
    section_examples = {
        'letter': [],
        'numeric': [],
        'mixed': []
    }
    
    for course in courses:
        stats['total'] += 1
        course_copy = course.copy()
        
        # Get subject_catalog
        subject_catalog = course_copy.get('subject_catalog', '')
        original_catalog = subject_catalog
        
        if not subject_catalog:
            stats['empty_subject_catalog'] += 1
        else:
            course_id = course_copy.get('course_id', '')
            course_url = course_copy.get('course_url', '')
            
            # Only process sections for non-unique course_ids
            if course_id in non_unique_course_ids and course_url:
                # Extract section from URL
                section = extract_section_from_url(course_url)
                if section:
                    # Remove section from subject_catalog if present
                    cleaned_catalog = remove_section_from_catalog(subject_catalog, section)
                    
                    # Only add section field if we actually removed it from catalog
                    if cleaned_catalog != subject_catalog:
                        subject_catalog = cleaned_catalog
                        course_copy['section'] = section
                        stats['sections_extracted'] += 1
                        
                        # Categorize section type
                        if section.isdigit():
                            stats['numeric_sections'] += 1
                            if len(section_examples['numeric']) < 3:
                                section_examples['numeric'].append((course_copy, original_catalog))
                        elif section.isalpha():
                            stats['letter_sections'] += 1
                            if len(section_examples['letter']) < 3:
                                section_examples['letter'].append((course_copy, original_catalog))
                        else:
                            stats['mixed_sections'] += 1
                            if len(section_examples['mixed']) < 3:
                                section_examples['mixed'].append((course_copy, original_catalog))
            
            # Check if MIT course
            is_mit = subject_catalog.strip().startswith('MIT')
            if is_mit:
                stats['mit_courses'] += 1
            
            # Clean the subject_catalog (normalize spaces)
            cleaned_catalog = clean_subject_catalog(subject_catalog, is_mit)
            
            if cleaned_catalog != original_catalog:
                stats['subject_catalog_cleaned'] += 1
                course_copy['subject_catalog'] = cleaned_catalog
                
                # Keep original for debugging/comparison
                if original_catalog != cleaned_catalog:
                    course_copy['_original_subject_catalog'] = original_catalog
        
        processed_courses.append(course_copy)
    
    # Save the cleaned data
    print(f"\nSaving cleaned data to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(processed_courses, f, indent=2, ensure_ascii=False)
    
    # Print statistics
    print("\n" + "="*60)
    print("PROCESSING STATISTICS:")
    print("="*60)
    print(f"Total courses processed: {stats['total']}")
    print(f"Unique course IDs: {len(unique_course_ids)}")
    print(f"Non-unique course IDs: {len(non_unique_course_ids)}")
    print(f"MIT courses found: {stats['mit_courses']}")
    print(f"Sections extracted: {stats['sections_extracted']}")
    print(f"  - Numeric sections (e.g., '001'): {stats['numeric_sections']}")
    print(f"  - Letter sections (e.g., 'A', 'C'): {stats['letter_sections']}")
    print(f"  - Mixed sections (e.g., '1A'): {stats['mixed_sections']}")
    print(f"Subject catalogs cleaned: {stats['subject_catalog_cleaned']}")
    print(f"Empty subject catalogs: {stats['empty_subject_catalog']}")
    
    # Show examples of different section types
    if section_examples['letter']:
        print("\n" + "="*60)
        print("EXAMPLES OF LETTER SECTIONS:")
        print("="*60)
        for course, original in section_examples['letter']:
            print(f"\nCourse ID: {course.get('course_id', 'N/A')}")
            print(f"  Original: '{original}'")
            print(f"  Cleaned:  '{course['subject_catalog']}'")
            print(f"  Section:  '{course.get('section', 'N/A')}'")
            print(f"  URL:      {course.get('course_url', 'N/A')}")
    
    if section_examples['numeric']:
        print("\n" + "="*60)
        print("EXAMPLES OF NUMERIC SECTIONS:")
        print("="*60)
        for course, original in section_examples['numeric']:
            print(f"\nCourse ID: {course.get('course_id', 'N/A')}")
            print(f"  Original: '{original}'")
            print(f"  Cleaned:  '{course['subject_catalog']}'")
            print(f"  Section:  '{course.get('section', 'N/A')}'")
            print(f"  URL:      {course.get('course_url', 'N/A')}")
    
    if section_examples['mixed']:
        print("\n" + "="*60)
        print("EXAMPLES OF MIXED SECTIONS:")
        print("="*60)
        for course, original in section_examples['mixed']:
            print(f"\nCourse ID: {course.get('course_id', 'N/A')}")
            print(f"  Original: '{original}'")
            print(f"  Cleaned:  '{course['subject_catalog']}'")
            print(f"  Section:  '{course.get('section', 'N/A')}'")
            print(f"  URL:      {course.get('course_url', 'N/A')}")
    
    # Show some general cleaning examples
    print("\n" + "="*60)
    print("EXAMPLES OF SPACE NORMALIZATION:")
    print("="*60)
    
    space_examples = 0
    for course in processed_courses:
        if '_original_subject_catalog' in course and 'section' not in course and space_examples < 3:
            print(f"\nCourse ID: {course.get('course_id', 'N/A')}")
            print(f"  Original: '{course['_original_subject_catalog']}'")
            print(f"  Cleaned:  '{course['subject_catalog']}'")
            space_examples += 1
    
    print(f"\n✅ Processing complete! Cleaned data saved to {output_file}")

if __name__ == "__main__":
    process_courses()