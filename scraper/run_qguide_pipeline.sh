#!/bin/bash

# Q-Guide data pipeline for CrimsonCal
# Runs: scraper.py → downloader.py → analyzer.py → master_merge.py
# Expects QGUIDE_COOKIE to be set in the environment

echo "=========================================="
echo "CrimsonCal Q-Guide Pipeline"
echo "=========================================="
echo ""

# Change to qguide directory
cd "$(dirname "$0")/qguide"

# Step 0: Write cookie to file
if [ -z "$QGUIDE_COOKIE" ]; then
    echo "Error: QGUIDE_COOKIE environment variable not set"
    exit 1
fi
echo "$QGUIDE_COOKIE" > secret_cookie.txt
echo "✓ Cookie written to secret_cookie.txt"
echo ""

# Step 1: Parse index HTML files to extract course links
echo "Step 1: Parsing Q-Guide index HTML files..."
echo "----------------------------------------"
python3 scraper.py
if [ $? -ne 0 ]; then
    echo "Error: Failed to parse Q-Guide index files"
    exit 1
fi
echo "✓ Course links extracted"
echo ""

# Step 2: Download individual Q-Guide reports
echo "Step 2: Downloading Q-Guide reports..."
echo "----------------------------------------"
python3 downloader.py
if [ $? -ne 0 ]; then
    echo "Error: Failed to download Q-Guide reports"
    exit 1
fi
echo "✓ Q-Guide reports downloaded"
echo ""

# Step 3: Analyze downloaded reports
echo "Step 3: Analyzing Q-Guide data..."
echo "----------------------------------------"
python3 analyzer.py
if [ $? -ne 0 ]; then
    echo "Error: Failed to analyze Q-Guide data"
    exit 1
fi
echo "✓ Q-Guide analysis complete"
echo ""

# Step 4: Re-run master merge to incorporate new Q-Guide data
echo "Step 4: Re-merging course data with Q-Guide analytics..."
echo "----------------------------------------"
cd ..
python3 master_merge.py
if [ $? -ne 0 ]; then
    echo "Error: Failed to merge data"
    exit 1
fi
echo "✓ Data merged with Q-Guide analytics"
echo ""

# Step 5: Copy updated files to public directory
echo "Step 5: Copying files to public directory..."
echo "----------------------------------------"
./copy_to_public.sh
if [ $? -ne 0 ]; then
    echo "Warning: copy_to_public.sh failed, trying manual copy"
    mkdir -p ../public/data
    cp results/master_courses.json ../public/data/ 2>/dev/null
    # Also copy any term-specific files
    cp results/master_courses_*.json ../public/data/ 2>/dev/null
    cp results/last_updated.json ../public/data/ 2>/dev/null
fi
echo "✓ Files copied to public directory"
echo ""

# Step 6: Commit and push
echo "=========================================="
echo "Step 6: Committing and pushing to GitHub..."
echo "=========================================="
cd ../
git add .
git commit -m "Update Q-Guide data on $(date +%Y-%m-%d)"
git push

echo ""
echo "=========================================="
echo "✅ Q-Guide pipeline completed!"
echo "=========================================="
