#!/bin/bash

# Quick update script - regenerates master_courses.json from existing scraped data
# Use this when you've made changes to the merge logic but don't need to re-scrape

echo "=========================================="
echo "CrimsonCal Quick Update"
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

# Step 1: Clean the subject catalog fields (in case logic changed)
echo "Step 1: Cleaning subject catalog fields..."
python3 clean_subject_catalog.py
if [ $? -ne 0 ]; then
    echo "Error: Failed to clean subject catalog"
    exit 1
fi
echo "✓ Subject catalog cleaned"
echo ""

# Step 2: Merge all data sources
echo "Step 2: Merging data sources..."
python3 master_merge.py
if [ $? -ne 0 ]; then
    echo "Error: Failed to merge data"
    exit 1
fi
echo "✓ Data merged successfully"
echo ""

# Step 3: Copy to public directory
echo "Step 3: Copying to public directory..."
./copy_to_public.sh
if [ $? -ne 0 ]; then
    echo "Error: Failed to copy files"
    exit 1
fi
echo "✓ Files copied"
echo ""

echo "=========================================="
echo "✅ Quick update completed!"
echo "=========================================="