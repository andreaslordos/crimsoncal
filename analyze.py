import csv
from collections import defaultdict

def normalize_code(code):
    """Normalize course code (remove spaces, make consistent format)"""
    if not code:
        return None
    return code.replace(" ", "").upper()

def main():
    # Load course data from all_courses.csv
    all_courses = {}
    with open('public/data/all_courses.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if 'subject_catalog' in row and row['subject_catalog']:
                code = normalize_code(row['subject_catalog'])
                if code:
                    all_courses[code] = row['subject_catalog']

    # Load primary course ratings
    primary_ratings = set()
    with open('public/data/course_ratings.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if 'course_code' in row and row['course_code']:
                code = normalize_code(row['course_code'])
                if code:
                    primary_ratings.add(code)
    
    # Load secondary and tertiary course ratings
    fallback_courses = defaultdict(dict)
    
    # Check secondary ratings
    with open('public/data/course_ratings_2.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if 'course_code' in row and row['course_code']:
                code = normalize_code(row['course_code'])
                if code and code not in primary_ratings and code in all_courses:
                    fallback_courses[code]['secondary'] = row['course_code']
    
    # Check tertiary ratings
    with open('public/data/course_ratings_3.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if 'course_code' in row and row['course_code']:
                code = normalize_code(row['course_code'])
                if code and code not in primary_ratings and code in all_courses:
                    fallback_courses[code]['tertiary'] = row['course_code']
    
    # Print results
    print(f"Found {len(fallback_courses)} courses using fallback data that are also in all_courses:\n")
    
    # Print courses using secondary data
    secondary_courses = [code for code in fallback_courses if 'secondary' in fallback_courses[code]]
    print(f"Courses using secondary data ({len(secondary_courses)}):")
    for i, code in enumerate(sorted(secondary_courses), 1):
        print(f"{i}. {fallback_courses[code]['secondary']} (normalized: {code})")
    
    print("\n")
    
    # Print courses using tertiary data only (not in secondary)
    tertiary_only = [code for code in fallback_courses 
                    if 'tertiary' in fallback_courses[code] and 'secondary' not in fallback_courses[code]]
    print(f"Courses using tertiary data only ({len(tertiary_only)}):")
    for i, code in enumerate(sorted(tertiary_only), 1):
        print(f"{i}. {fallback_courses[code]['tertiary']} (normalized: {code})")

if __name__ == "__main__":
    main()