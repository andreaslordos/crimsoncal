#!/bin/bash
# Copy generated data files to public directory for the React app

echo "Copying master_courses.json to public/data..."
cp results/master_courses.json ../public/data/master_courses.json

echo "Copying last_updated.json to public/data..."
cp results/last_updated.json ../public/data/last_updated.json

echo "Files copied successfully!"