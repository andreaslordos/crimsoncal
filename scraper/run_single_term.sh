#!/bin/bash

# Single-term data pipeline for CrimsonCal
# Usage: bash run_single_term.sh <Term> <Year> [--no-push]
# Example: bash run_single_term.sh Fall 2026
# Example: bash run_single_term.sh Fall 2026 --no-push

TERM=$1
YEAR=$2
NO_PUSH=false
if [ "$3" = "--no-push" ]; then
    NO_PUSH=true
fi

if [ -z "$TERM" ] || [ -z "$YEAR" ]; then
    echo "Usage: bash run_single_term.sh <Term> <Year> [--no-push]"
    echo "Example: bash run_single_term.sh Fall 2026"
    exit 1
fi

TERM_LOWER=$(echo "$TERM" | tr '[:upper:]' '[:lower:]')

echo "=========================================="
echo "CrimsonCal Data Pipeline - $TERM $YEAR"
echo "=========================================="
echo ""

# Change to scraper directory
cd "$(dirname "$0")"

# Step 0: Get course links
echo "Step 0: Getting course links for $TERM $YEAR..."
python3 parallel_course_scraper.py --term "$TERM" --year "$YEAR"
if [ $? -ne 0 ]; then
    echo "Error: Failed to get course links for $TERM $YEAR"
    exit 1
fi
echo "✓ Course links got for $TERM $YEAR"
echo ""

# Step 1: Scrape current course data
echo "Step 1: Scraping course data for $TERM $YEAR..."
echo "----------------------------------------"
python3 parallel_scraper_with_reuse.py results/All_course_lines.txt
if [ $? -ne 0 ]; then
    echo "Error: Failed to scrape course data for $TERM $YEAR"
    exit 1
fi
echo "✓ Course data scraped successfully for $TERM $YEAR"
echo ""

# Step 2: Clean the subject catalog fields
echo "Step 2: Cleaning subject catalog fields..."
echo "----------------------------------------"
python3 clean_subject_catalog.py
if [ $? -ne 0 ]; then
    echo "Error: Failed to clean subject catalog for $TERM $YEAR"
    exit 1
fi
echo "✓ Subject catalog cleaned for $TERM $YEAR"
echo ""

# Save cleaned data with term-specific name so all terms accumulate
cp results/all_courses_cleaned.json "results/cleaned_${TERM_LOWER}${YEAR}.json"
echo "✓ Saved cleaned data as cleaned_${TERM_LOWER}${YEAR}.json"
echo ""

# Step 3: Merge all data sources (all terms into one master_courses.json)
echo "Step 3: Merging all data sources..."
echo "----------------------------------------"
python3 master_merge.py
if [ $? -ne 0 ]; then
    echo "Error: Failed to merge data for $TERM $YEAR"
    exit 1
fi
echo "✓ Data merged for $TERM $YEAR"
echo ""

# Step 4: Copy to public directory
echo "Step 4: Copying files to public directory..."
echo "----------------------------------------"
mkdir -p ../public/data

if [ -f "results/master_courses.json" ]; then
    cp results/master_courses.json ../public/data/
    echo "✓ Copied master_courses.json"
else
    echo "Error: results/master_courses.json not found"
    exit 1
fi

if [ -f "results/last_updated.json" ]; then
    cp results/last_updated.json ../public/data/
    echo "✓ Copied timestamp file"
fi

echo ""
echo "✓ Files copied to public directory"
echo ""

# Step 5: Commit and push (unless --no-push)
if [ "$NO_PUSH" = false ]; then
    echo "=========================================="
    echo "Step 5: Committing and pushing to GitHub..."
    echo "=========================================="
    cd ../
    git add .
    git commit -m "Scrape $TERM $YEAR data on $(date +%Y-%m-%d)"
    git pull --rebase origin main || true
    git push
else
    echo "=========================================="
    echo "Step 5: Skipping commit/push (--no-push)"
    echo "=========================================="
fi

echo ""
echo "=========================================="
echo "✅ Pipeline completed for $TERM $YEAR!"
echo "=========================================="
echo ""
echo "Generated files:"
echo "  - public/data/master_courses.json"
echo "  - public/data/last_updated.json"
