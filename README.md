# CrimsonCal

The most useful course calendar for picking Harvard classes: [crimsoncal.lordos.tech](https://crimsoncal.lordos.tech)

## Features

- 📚 Browse all Harvard courses for Fall 2025
- 📅 Visual calendar view with drag-and-drop course scheduling
- 🔍 Smart search and filtering by school, day, time, and category
- ⭐ Course ratings and workload data from Q Guide
- 📊 Historical enrollment and evaluation data
- 🎯 Section selection for multi-section courses
- 💾 Saves your selections locally

## Quick Start

### Running the App

```bash
# Install dependencies
npm install

# Start development server
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
npm run build
```

## Data Generation

The course data comes from two sources:
1. **my.harvard** - Current course offerings and sections
2. **Q Guide** - Historical ratings, workload, and enrollment data

### Updating Course Data

#### Full Pipeline (Complete Rescrape)
Use this when you need fresh data from my.harvard:

```bash
cd scraper
./run_full_pipeline.sh
```

This will:
1. Scrape current courses from my.harvard
2. Clean and normalize the data
3. Merge with existing Q Guide data
4. Copy files to the public directory
5. Update the "Last updated" timestamp

⏱ **Time:** ~10-15 minutes depending on network speed

#### Quick Update (From Existing Data)
Use this when you've modified the merge logic but don't need to rescrape:

```bash
cd scraper
./quick_update.sh
```

This will:
1. Re-clean the existing scraped data
2. Re-merge with Q Guide data
3. Copy to public directory
4. Update timestamp

⏱ **Time:** ~5 seconds

### Data Pipeline Details

The data pipeline consists of several Python scripts:

1. **`parallel_scraper_with_reuse.py`** - Scrapes course data from my.harvard
   - Input: my.harvard website
   - Output: `results/all_courses.json`

2. **`clean_subject_catalog.py`** - Cleans course codes and extracts sections
   - Input: `results/all_courses.json`
   - Output: `results/all_courses_cleaned.json`

3. **`qguide/analyzer.py`** - Processes Q Guide historical data
   - Input: `qguide/QGuides/` HTML files
   - Output: `qguide/results/course_analytics.json`

4. **`master_merge.py`** - Merges all data sources
   - Input: `results/all_courses_cleaned.json`, `qguide/results/course_analytics.json`
   - Output: `results/master_courses.json`, `results/last_updated.json`

5. **`copy_to_public.sh`** - Copies final files to React app
   - Copies both JSON files to `public/data/`

### Manual Script Execution

If you need to run individual scripts:

```bash
cd scraper

# 1. Scrape courses (choose schools: FAS, HBS, HKS, etc.)
python3 parallel_scraper_with_reuse.py --schools "FAS"

# 2. Clean data
python3 clean_subject_catalog.py

# 3. Merge everything (uses existing Q Guide data)
python3 master_merge.py

# 4. Copy to public
./copy_to_public.sh
```

## Project Structure

```
crimsoncal/
├── public/
│   └── data/
│       ├── master_courses.json    # Main course data
│       └── last_updated.json      # Timestamp of last update
├── scraper/
│   ├── run_full_pipeline.sh       # Complete data generation
│   ├── quick_update.sh            # Quick regeneration
│   ├── results/                   # Scraper output files
│   └── qguide/                    # Q Guide data and analyzer
├── src/
│   ├── components/                # React components
│   ├── context/                   # App state management
│   └── utils/                     # Utility functions
└── README.md
```

## Filters and Features

### Basic Filters
- **Search**: Course code, title, or instructor
- **Categories**: Divisional distribution and general education requirements
- **Days**: Filter by meeting days (with "only on selected days" logic)

### Advanced Filters
- **Time of Day**: Morning (9am-12pm), Afternoon (12pm-5pm), Evening (5pm-9pm)
- **Custom Time Range**: "Start after" and "End before" options
- **Schools**: Filter by Harvard school (FAS, HBS, HKS, etc.)

### Special Features
- **Multi-section Support**: Choose specific sections for courses with multiple offerings
- **Conflict Detection**: Visual indicators for time conflicts
- **Hide/Show Courses**: Temporarily hide courses from calendar while keeping them selected
- **Export**: Generate shareable URLs with your course selections

## Development

### Key Technologies
- React 18 with hooks
- Context API for state management
- Tailwind CSS for styling
- react-window for virtualized lists (performance)
- Python for data scraping

### Performance Optimizations
- Virtual scrolling for course list (handles 5000+ courses smoothly)
- Debounced search with pre-computed lowercase strings
- React.memo for expensive components
- Progressive data loading with requestIdleCallback

## Troubleshooting

### Data Issues
- **Missing courses**: Re-run the full pipeline to get latest data
- **Wrong timestamps**: Check that system time is correct when running scripts
- **Q Guide data missing**: Ensure Q Guide HTML files are in `scraper/qguide/QGuides/`

### App Issues
- **Slow performance**: Clear browser cache and localStorage
- **Filters not working**: Check browser console for errors
- **Calendar not updating**: Try refreshing the page

## Contributing

Feel free to submit issues and pull requests!

## License

MIT