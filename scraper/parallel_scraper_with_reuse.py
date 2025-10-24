#!/usr/bin/env python3
"""
Parallel Harvard Course Data Scraper
Reuses the CourseScraper class for parsing while maintaining parallel fetching.
"""

import asyncio
import aiohttp
import time
from pathlib import Path
from typing import List, Dict, Any, Optional
import argparse
from tqdm.asyncio import tqdm
import logging
from datetime import datetime
import pandas as pd
from get_course_myharvard import CourseScraper
import io

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ParallelCourseScraperWithReuse:
    def __init__(self,
                 max_concurrent: int = 50,
                 timeout: int = 30,
                 max_retries: int = 3,
                 retry_delay: float = 1.0):
        """
        Initialize the parallel scraper.

        Args:
            max_concurrent: Maximum number of concurrent requests
            timeout: Request timeout in seconds
            max_retries: Maximum retries per URL
            retry_delay: Base delay between retries (exponential backoff)
        """
        self.base_url = "https://beta.my.harvard.edu/"
        self.max_concurrent = max_concurrent
        self.timeout = timeout
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        self.semaphore = asyncio.Semaphore(max_concurrent)
        self.session = None
        self.failed_urls = []
        self.course_data = []

        # Load cookies from cookie.txt if it exists
        self.cookies = None
        cookie_file = Path(__file__).parent / 'cookie.txt'
        if cookie_file.exists():
            with open(cookie_file, 'r') as f:
                cookie_content = f.read().strip()
                if cookie_content:
                    self.cookies = cookie_content
                    logger.info("Loaded authentication cookies from cookie.txt")
        else:
            logger.warning("No cookie.txt found - location data will not be extracted")
        
    async def __aenter__(self):
        """Async context manager entry."""
        timeout_config = aiohttp.ClientTimeout(total=self.timeout)
        self.session = aiohttp.ClientSession(
            timeout=timeout_config,
            connector=aiohttp.TCPConnector(limit=self.max_concurrent * 2)
        )
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        if self.session:
            await self.session.close()
            # Small delay to allow connections to close properly
            await asyncio.sleep(0.25)
    
    def parse_course_html(self, html: str, course_url: str) -> Optional[Dict[str, Any]]:
        """Parse course HTML using the existing CourseScraper logic."""
        try:
            # Create a mock scraper instance just for parsing
            scraper = CourseScraper(f"{self.base_url}{course_url}")
            
            # Mock the BeautifulSoup parsing without making a request
            from bs4 import BeautifulSoup
            scraper.soup = BeautifulSoup(html, 'html.parser')
            
            # Extract course title information
            title_info = scraper._extract_course_title()
            
            if not title_info['course_title']:
                logger.debug(f"No course title found for {course_url}")
                return None
            
            # Extract course time information
            course_time_div = scraper.soup.find('div', id='course-time')
            from bs4.element import Tag
            if not course_time_div or not isinstance(course_time_div, Tag):
                year_term = ""
                term_type = ""
            else:
                spans = course_time_div.find_all('span')
                year_term = scraper._safe_text(spans[0] if len(spans) > 0 else None)
                term_type = scraper._safe_text(spans[1] if len(spans) > 1 else None)
            
            # Combine all data using the exact same logic as CourseScraper
            course_data = {
                **title_info,  # This includes course_title and subject_catalog
                'instructors': scraper._extract_instructors(),
                'year_term': year_term,
                'term_type': term_type,
                **scraper._extract_event_data(),
                **scraper._extract_course_info(),
                **{f'lecture_{day}': value for day, value in scraper._extract_days().items()},
                'location': scraper._extract_location(),

                # Additional course information
                'description': scraper._safe_div_text('course-desc', 'description'),
                'notes': scraper._safe_div_text('course-notes', 'notes'),
                'class-notes': scraper._safe_div_class_text('course-page-class-notes'),
                'school': scraper._safe_label_text('School'),
                'units': scraper._safe_label_text('Units'),
                'credits': scraper._safe_label_text('Credits'),
                'exam': scraper._safe_label_text('Exam/Final Deadline'),
                'cross_registration': scraper._safe_label_text('Cross Reg'),
                'department': scraper._safe_label_text('Department'),
                'course_component': scraper._safe_label_text('Course Component'),
                'instruction_mode': scraper._safe_label_text('Instruction Mode'),
                'grading_basis': scraper._safe_label_text('Grading Basis'),
                'course_requirements': scraper._safe_label_text('Course Requirements'),
                'general_education': scraper._safe_label_text('General Education'),
                'quantitative_reasoning': scraper._safe_label_text('Quantitative Reasoning with Data'),
                'divisional_distribution': scraper._safe_label_text('Divisional Distribution'),
                'course_level': scraper._safe_label_text('Course Level'),

                # Add the URL for reference
                'course_url': course_url
            }
            
            # Format instructors as comma-separated string
            if isinstance(course_data['instructors'], list):
                course_data['instructors'] = ", ".join(
                    instructor['name'] for instructor in course_data['instructors']
                )
            
            return course_data
            
        except Exception as e:
            logger.debug(f"Error parsing {course_url}: {e}")
            return None
    
    async def fetch_course(self, course_url: str, retry_count: int = 0) -> Optional[Dict[str, Any]]:
        """
        Fetch a single course's data with retry logic.
        
        Args:
            course_url: Relative course URL (e.g., 'course/COMPSCI50/2025-Fall/001')
            retry_count: Current retry attempt
            
        Returns:
            Course data dictionary or None if failed
        """
        async with self.semaphore:
            full_url = f"{self.base_url}{course_url}"
            
            try:
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                }

                # Add cookies if available
                if self.cookies:
                    headers['Cookie'] = self.cookies

                async with self.session.get(full_url, headers=headers) as response:
                    if response.status == 200:
                        html = await response.text()
                        
                        # Parse course data using CourseScraper logic
                        course_data = self.parse_course_html(html, course_url)
                        
                        if course_data:
                            course_data['status'] = 'success'
                            course_data['timestamp'] = datetime.now().isoformat()
                            return course_data
                        else:
                            logger.warning(f"Failed to parse data for {course_url}")
                            return {'url': course_url, 'status': 'parse_failed'}
                    
                    elif response.status == 404:
                        logger.warning(f"Course not found (404): {course_url}")
                        return {'url': course_url, 'status': 'not_found'}
                    
                    elif response.status == 429:  # Rate limited
                        if retry_count < self.max_retries:
                            delay = self.retry_delay * (2 ** retry_count)
                            logger.warning(f"Rate limited on {course_url}, retrying in {delay}s...")
                            await asyncio.sleep(delay)
                            return await self.fetch_course(course_url, retry_count + 1)
                        else:
                            logger.error(f"Max retries exceeded for {course_url} (rate limited)")
                            self.failed_urls.append(course_url)
                            return None
                    
                    else:
                        logger.warning(f"Unexpected status {response.status} for {course_url}")
                        if retry_count < self.max_retries:
                            delay = self.retry_delay * (2 ** retry_count)
                            await asyncio.sleep(delay)
                            return await self.fetch_course(course_url, retry_count + 1)
                        else:
                            self.failed_urls.append(course_url)
                            return None
                            
            except asyncio.TimeoutError:
                logger.warning(f"Timeout fetching {course_url}")
                if retry_count < self.max_retries:
                    delay = self.retry_delay * (2 ** retry_count)
                    await asyncio.sleep(delay)
                    return await self.fetch_course(course_url, retry_count + 1)
                else:
                    self.failed_urls.append(course_url)
                    return None
                    
            except Exception as e:
                logger.error(f"Error fetching {course_url}: {e}")
                if retry_count < self.max_retries:
                    delay = self.retry_delay * (2 ** retry_count)
                    await asyncio.sleep(delay)
                    return await self.fetch_course(course_url, retry_count + 1)
                else:
                    self.failed_urls.append(course_url)
                    return None
    
    async def fetch_batch(self, course_urls: List[str], batch_name: str = "batch") -> List[Dict[str, Any]]:
        """
        Fetch a batch of courses in parallel.
        
        Args:
            course_urls: List of course URLs to fetch
            batch_name: Name for progress bar
            
        Returns:
            List of course data dictionaries
        """
        tasks = []
        for url in course_urls:
            task = self.fetch_course(url)
            tasks.append(task)
        
        # Process with progress bar
        results = []
        with tqdm(total=len(tasks), desc=f"Fetching {batch_name}") as pbar:
            for coro in asyncio.as_completed(tasks):
                result = await coro
                if result:
                    results.append(result)
                    if result.get('status') == 'success':
                        logger.debug(f"Successfully parsed: {result.get('course_url', 'unknown')}")
                pbar.update(1)
        
        return results
    
    async def fetch_all_courses(self, course_urls: List[str]) -> Dict[str, Any]:
        """
        Fetch all courses with optimized batching.
        
        Args:
            course_urls: List of all course URLs to fetch
            
        Returns:
            Dictionary with results and statistics
        """
        start_time = time.time()
        total_courses = len(course_urls)
        
        logger.info(f"Starting parallel fetch of {total_courses} courses")
        logger.info(f"Max concurrent requests: {self.max_concurrent}")
        
        # Process in chunks for better progress tracking
        chunk_size = min(500, total_courses)
        chunks = [course_urls[i:i + chunk_size] for i in range(0, total_courses, chunk_size)]
        
        all_results = []
        for i, chunk in enumerate(chunks, 1):
            logger.info(f"Processing chunk {i}/{len(chunks)} ({len(chunk)} courses)")
            chunk_results = await self.fetch_batch(chunk, f"Chunk {i}/{len(chunks)}")
            all_results.extend(chunk_results)
            
            # Small delay between chunks to avoid overwhelming the server
            if i < len(chunks):
                await asyncio.sleep(0.5)
        
        elapsed_time = time.time() - start_time
        
        # Compile statistics
        successful = len([r for r in all_results if r.get('status') == 'success'])
        parse_failed = len([r for r in all_results if r.get('status') == 'parse_failed'])
        not_found = len([r for r in all_results if r.get('status') == 'not_found'])
        
        stats = {
            'total_requested': total_courses,
            'successful': successful,
            'parse_failed': parse_failed,
            'not_found': not_found,
            'failed': len(self.failed_urls),
            'elapsed_time': elapsed_time,
            'courses_per_second': total_courses / elapsed_time if elapsed_time > 0 else 0,
            'timestamp': datetime.now().isoformat()
        }
        
        logger.info(f"\nFetch complete in {elapsed_time:.2f} seconds")
        logger.info(f"Success: {stats['successful']}")
        logger.info(f"Parse failed: {stats['parse_failed']}")
        logger.info(f"Not found: {stats['not_found']}")
        logger.info(f"Network failed: {stats['failed']}")
        logger.info(f"Speed: {stats['courses_per_second']:.2f} courses/second")
        
        return {
            'courses': all_results,
            'failed_urls': self.failed_urls,
            'statistics': stats
        }

def load_course_urls(filepath: str) -> List[str]:
    """Load course URLs from file."""
    try:
        with open(filepath, 'r') as f:
            urls = [line.strip() for line in f if line.strip()]
        logger.info(f"Loaded {len(urls)} course URLs from {filepath}")
        return urls
    except FileNotFoundError:
        logger.error(f"File not found: {filepath}")
        return []
    except Exception as e:
        logger.error(f"Error loading URLs: {e}")
        return []

def save_results(results: Dict[str, Any], output_file: str = "results/all_courses.json"):
    """Save results to JSON file in results/ folder."""
    
    # Create results directory if it doesn't exist
    from pathlib import Path
    output_path = Path(output_file)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    if results['courses']:
        # Filter only successful courses and drop duplicates
        seen = set()
        unique_courses = []
        for course in results['courses']:
            if course.get('status') != 'success':
                continue
            key = (course.get('course_title', ''), 
                   course.get('subject_catalog', ''), 
                   course.get('year_term', ''))
            if key not in seen:
                seen.add(key)
                unique_courses.append(course)
        
        # Save to JSON
        import json
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(unique_courses, f, indent=2, ensure_ascii=False)
        logger.info(f"Course data saved to {output_file} ({len(unique_courses)} unique courses)")
        
        
        # Save statistics
        stats_file = output_file + "_stats.json"
        stats_data = {
            **results['statistics'],
            'unique_courses': len(unique_courses),
            'duplicates_removed': len(results['courses']) - len(unique_courses)
        }
        with open(stats_file, 'w', encoding='utf-8') as f:
            json.dump(stats_data, f, indent=2)
        logger.info(f"Statistics saved to {stats_file}")
    
    # Save failed URLs if any
    if results['failed_urls']:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        failed_file = output_path.parent / f"failed_{timestamp}.txt"
        with open(failed_file, 'w') as f:
            for url in results['failed_urls']:
                f.write(f"{url}\n")
        logger.info(f"Failed URLs saved to {failed_file}")

async def main():
    """Main execution function."""
    parser = argparse.ArgumentParser(description='Parallel Harvard Course Data Scraper (with CourseScraper reuse)')
    parser.add_argument('input_file', help='Input file containing course URLs')
    parser.add_argument('--max-concurrent', type=int, default=50,
                       help='Maximum concurrent requests (default: 50)')
    parser.add_argument('--timeout', type=int, default=30,
                       help='Request timeout in seconds (default: 30)')
    parser.add_argument('--max-retries', type=int, default=3,
                       help='Maximum retries per URL (default: 3)')
    parser.add_argument('--output-file', default='results/all_courses.json',
                       help='Output JSON file (default: results/all_courses.json)')
    parser.add_argument('--sample', type=int,
                       help='Only process first N courses (for testing)')
    
    args = parser.parse_args()
    
    # Load course URLs
    course_urls = load_course_urls(args.input_file)
    if not course_urls:
        logger.error("No course URLs to process")
        return
    
    # Apply sample limit if specified
    if args.sample:
        course_urls = course_urls[:args.sample]
        logger.info(f"Sampling first {args.sample} courses")
    
    # Run the scraper
    async with ParallelCourseScraperWithReuse(
        max_concurrent=args.max_concurrent,
        timeout=args.timeout,
        max_retries=args.max_retries
    ) as scraper:
        results = await scraper.fetch_all_courses(course_urls)
        
    # Save results
    save_results(results, args.output_file)
    
    print(f"\n{'='*60}")
    print(f"Scraping complete!")
    print(f"Total time: {results['statistics']['elapsed_time']:.2f} seconds")
    print(f"Speed: {results['statistics']['courses_per_second']:.2f} courses/second")
    print(f"Unique courses saved: Check {args.output_file}")
    print(f"{'='*60}")

if __name__ == "__main__":
    # For Python 3.7+
    asyncio.run(main())