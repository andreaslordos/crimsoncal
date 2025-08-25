#!/bin/bash

# Full data pipeline script for CrimsonCal
# This script runs all the necessary steps to generate fresh course data

echo "=========================================="
echo "CrimsonCal Data Pipeline"
echo "=========================================="
echo ""

# Change to scraper directory
cd "$(dirname "$0")"

# Step 0: Get course links
echo "Step 0: Getting course links..."
python3 parallel_course_scraper.py
if [ $? -ne 0 ]; then
    echo "Error: Failed to get course links"
    exit 1
fi
echo "✓ Course links got"
echo ""

# Step 1: Scrape current course data from my.harvard
echo "Step 1: Scraping current course data from my.harvard..."
echo "----------------------------------------"
python3 parallel_scraper_with_reuse.py results/All_course_lines.txt
if [ $? -ne 0 ]; then
    echo "Error: Failed to scrape course data"
    exit 1
fi
echo "✓ Course data scraped successfully"
echo ""

# Step 2: Clean the subject catalog fields
echo "Step 2: Cleaning subject catalog fields..."
echo "----------------------------------------"
python3 clean_subject_catalog.py
if [ $? -ne 0 ]; then
    echo "Error: Failed to clean subject catalog"
    exit 1
fi
echo "✓ Subject catalog cleaned successfully"
echo ""

# Step 3: Merge all data sources (with existing Q Guide data)
echo "Step 3: Merging all data sources..."
echo "----------------------------------------"
python3 master_merge.py
if [ $? -ne 0 ]; then
    echo "Error: Failed to merge data"
    exit 1
fi
echo "✓ Data merged successfully"
echo ""

# Step 4: Copy to public directory
echo "Step 4: Copying files to public directory..."
echo "----------------------------------------"
./copy_to_public.sh
if [ $? -ne 0 ]; then
    echo "Error: Failed to copy files to public directory"
    exit 1
fi
echo "✓ Files copied to public directory"
echo ""

# Step 5: Push to GitHub, with commit message on todays date.
echo "----------------------------------------"
cd ../
git add .
git commit -m "Update data on $(date +%Y-%m-%d)"
git push

echo "=========================================="
echo "✅ Pipeline completed successfully!"
echo "=========================================="
echo ""
echo "Generated files:"
echo "  - ../public/data/master_courses.json"
echo "  - ../public/data/last_updated.json"
echo ""
echo "You can now run 'npm start' from the project root to see the updated data."