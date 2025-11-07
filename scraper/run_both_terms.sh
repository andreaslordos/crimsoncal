#!/bin/bash

# Full data pipeline script for CrimsonCal - Both Fall 2025 and Spring 2026
# This script runs all the necessary steps to generate fresh course data for both terms

# Parse command line arguments
NO_PUSH=false
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --no-push) NO_PUSH=true ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

echo "=========================================="
echo "CrimsonCal Data Pipeline - Both Terms"
echo "=========================================="
echo ""

# Change to scraper directory
cd "$(dirname "$0")"

# Function to run pipeline for a specific term
run_pipeline_for_term() {
    local TERM=$1
    local YEAR=$2
    local TERM_LOWER=$(echo "$TERM" | tr '[:upper:]' '[:lower:]')

    echo ""
    echo "=========================================="
    echo "Processing $TERM $YEAR"
    echo "=========================================="
    echo ""

    # Step 0: Get course links for this term
    echo "Step 0: Getting course links for $TERM $YEAR..."
    python3 parallel_course_scraper.py --term "$TERM" --year "$YEAR"
    if [ $? -ne 0 ]; then
        echo "Error: Failed to get course links for $TERM $YEAR"
        return 1
    fi
    echo "✓ Course links got for $TERM $YEAR"
    echo ""

    # Step 1: Scrape current course data from my.harvard
    echo "Step 1: Scraping course data for $TERM $YEAR..."
    echo "----------------------------------------"
    python3 parallel_scraper_with_reuse.py results/All_course_lines.txt
    if [ $? -ne 0 ]; then
        echo "Error: Failed to scrape course data for $TERM $YEAR"
        return 1
    fi
    echo "✓ Course data scraped successfully for $TERM $YEAR"
    echo ""

    # Step 2: Clean the subject catalog fields
    echo "Step 2: Cleaning subject catalog fields for $TERM $YEAR..."
    echo "----------------------------------------"
    python3 clean_subject_catalog.py
    if [ $? -ne 0 ]; then
        echo "Error: Failed to clean subject catalog for $TERM $YEAR"
        return 1
    fi
    echo "✓ Subject catalog cleaned successfully for $TERM $YEAR"
    echo ""

    # Step 3: Merge all data sources (with existing Q Guide data)
    echo "Step 3: Merging all data sources for $TERM $YEAR..."
    echo "----------------------------------------"
    python3 master_merge.py --term "$TERM" --year "$YEAR"
    if [ $? -ne 0 ]; then
        echo "Error: Failed to merge data for $TERM $YEAR"
        return 1
    fi
    echo "✓ Data merged successfully for $TERM $YEAR"
    echo ""

    # Copy the term-specific file to a backup
    cp "results/master_courses_${TERM_LOWER}${YEAR}.json" "results/master_courses_${TERM_LOWER}${YEAR}_backup.json"

    return 0
}

# Run pipeline for Fall 2025
run_pipeline_for_term "Fall" "2025"
if [ $? -ne 0 ]; then
    echo "Error: Failed to process Fall 2025"
    exit 1
fi

# Run pipeline for Spring 2026
run_pipeline_for_term "Spring" "2026"
if [ $? -ne 0 ]; then
    echo "Error: Failed to process Spring 2026"
    exit 1
fi

# Step 4: Copy all files to public directory
echo ""
echo "=========================================="
echo "Step 4: Copying files to public directory..."
echo "=========================================="

# Create public/data directory if it doesn't exist
mkdir -p ../public/data

# Copy Fall 2025 data
if [ -f "results/master_courses_fall2025.json" ]; then
    cp results/master_courses_fall2025.json ../public/data/
    echo "✓ Copied Fall 2025 data"
fi

# Copy Spring 2026 data
if [ -f "results/master_courses_spring2026.json" ]; then
    cp results/master_courses_spring2026.json ../public/data/
    echo "✓ Copied Spring 2026 data"
fi

# Also keep a default master_courses.json for backward compatibility (use Fall 2025 as default)
if [ -f "results/master_courses_fall2025.json" ]; then
    cp results/master_courses_fall2025.json ../public/data/master_courses.json
    echo "✓ Copied default data (Fall 2025)"
fi

# Copy timestamp file
if [ -f "results/last_updated.json" ]; then
    cp results/last_updated.json ../public/data/
    echo "✓ Copied timestamp file"
fi

echo ""
echo "✓ Files copied to public directory"
echo ""

# Step 5: Push to GitHub
if [ "$NO_PUSH" = false ]; then
    echo "=========================================="
    echo "Step 5: Committing and pushing to GitHub..."
    echo "=========================================="
    cd ../
    git add .
    git commit -m "Update data for both Fall 2025 and Spring 2026 on $(date +%Y-%m-%d)"
    git push
    echo ""
else
    echo "=========================================="
    echo "Step 5: Skipping GitHub push (--no-push flag set)"
    echo "=========================================="
    cd ../
    echo ""
fi

echo "=========================================="
echo "✅ Pipeline completed successfully for both terms!"
echo "=========================================="
echo ""
echo "Generated files:"
echo "  - ../public/data/master_courses_fall2025.json"
echo "  - ../public/data/master_courses_spring2026.json"
echo "  - ../public/data/master_courses.json (default - Fall 2025)"
echo "  - ../public/data/last_updated.json"
echo ""
echo "You can now run 'npm start' from the project root to see the updated data."