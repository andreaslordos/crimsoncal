#!/usr/bin/env python3
"""
Parallel Harvard Course URL Scraper
Based on get_myharvard_url_chunks.py but with parallel fetching for speed.
"""

import asyncio
import aiohttp
import json
import time
from pathlib import Path
from typing import List, Dict, Any, Set, Optional, Tuple
import argparse
from tqdm.asyncio import tqdm
import logging
from datetime import datetime
from bs4 import BeautifulSoup
import re

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ParallelHarvardCourseScraper:
    def __init__(self, 
                 max_concurrent: int = 20,
                 timeout: int = 30,
                 max_retries: int = 8,
                 retry_delay: float = 1.0,
                 year: str = "2025",
                 term: str = "Fall",
                 school: str = "All"):
        """
        Initialize the parallel course scraper.
        
        Args:
            max_concurrent: Maximum number of concurrent requests
            timeout: Request timeout in seconds
            max_retries: Maximum retries per page
            retry_delay: Base delay between retries (exponential backoff)
            year: Academic year
            term: Term (Fall/Spring)
            school: School code or "All"
        """
        self.base_url = "https://beta.my.harvard.edu/search/"
        self.max_concurrent = max_concurrent
        self.timeout = timeout
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        self.year = year
        self.term = term
        self.school = school
        self.semaphore = asyncio.Semaphore(max_concurrent)
        self.session = None
        self.all_course_urls = set()  # Use set to avoid duplicates
        self.failed_pages = []
        
    async def __aenter__(self):
        """Async context manager entry."""
        timeout_config = aiohttp.ClientTimeout(total=self.timeout)
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json'
        }
        self.session = aiohttp.ClientSession(
            timeout=timeout_config,
            headers=headers,
            connector=aiohttp.TCPConnector(limit=self.max_concurrent * 2)
        )
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        if self.session:
            await self.session.close()
            # Small delay to allow connections to close properly
            await asyncio.sleep(0.25)
    
    async def fetch_multi_section_urls(self, data_url: str) -> List[str]:
        """Fetch section URLs for a multi-section course."""
        try:
            full_url = f"https://beta.my.harvard.edu{data_url}"
            async with self.session.get(full_url) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    urls = []
                    if isinstance(data, dict) and 'html' in data:
                        # The HTML is inside the 'html' key
                        html_content = data['html']
                        soup = BeautifulSoup(html_content, 'html.parser')
                        section_links = soup.find_all('a', href=re.compile(r'/course/'))
                        
                        for link in section_links:
                            href = link.get('href')
                            if href:
                                # Remove leading slash to be consistent
                                urls.append(href.lstrip('/'))
                    elif isinstance(data, list):
                        # Response is a list of URLs
                        for item in data:
                            if isinstance(item, str) and '/course/' in item:
                                # Remove quotes and leading slash
                                clean_url = item.strip('"').lstrip('/')
                                urls.append(clean_url)
                    
                    return urls
        except Exception as e:
            logger.debug(f"Error fetching multi-sections from {data_url}: {e}")
            return []
    
    async def extract_course_info_async(self, html_content: str) -> Tuple[List[str], int]:
        """
        Extract course URLs from HTML content, including all sections for multi-section courses.
        This is the async version that can fetch multi-section data.
        """
        soup = BeautifulSoup(html_content, 'html.parser')
        course_cards = soup.find_all('div', class_='bg-white')
        
        course_urls = []
        course_count = 0  # Track actual number of courses (not sections)
        
        # Collect multi-section fetch tasks
        multi_section_tasks = []
        single_section_urls = []
        
        for card in course_cards:
            # Check if this is a multi-section course by looking for the multi-sections button
            multi_section_btn = card.find('button', class_='hu-multi-sections')
            
            if multi_section_btn:
                # Multi-section course - extract data-url for async fetching
                data_url = multi_section_btn.get('data-url')
                if data_url:
                    course_count += 1
                    # Create async task to fetch sections
                    multi_section_tasks.append(self.fetch_multi_section_urls(data_url))
                continue
            
            # Look for regular course links (single section courses)
            course_links = card.find_all('a', href=re.compile(r'/course/[A-Z]'))
            
            if course_links:
                # Extract unique course URLs
                unique_urls = set()
                for link in course_links:
                    href = link.get('href')
                    if href and '/course/' in href:
                        course_path = href.lstrip('/')
                        unique_urls.add(course_path)
                
                if unique_urls:
                    # Single section course
                    single_section_urls.extend(list(unique_urls))
                    course_count += 1
        
        # Fetch all multi-section data in parallel
        if multi_section_tasks:
            multi_section_results = await asyncio.gather(*multi_section_tasks, return_exceptions=True)
            for result in multi_section_results:
                if isinstance(result, list):
                    course_urls.extend(result)
                elif not isinstance(result, Exception):
                    logger.debug(f"Unexpected multi-section result type: {type(result)}")
        
        # Add single section URLs
        course_urls.extend(single_section_urls)
        
        return course_urls, course_count
    
    async def fetch_page(self, page: int, retry_count: int = 0) -> Optional[Dict[str, Any]]:
        """
        Fetch a single page's data with retry logic.
        
        Args:
            page: Page number to fetch
            retry_count: Current retry attempt
            
        Returns:
            Page data dictionary or None if failed
        """
        async with self.semaphore:
            # Build URL with filters
            url = f"{self.base_url}?q=&sort=subject_catalog"
            url += f"&school={self.school}&term={self.year}+{self.term}"
            url += f"&page={page}"
            
            try:
                async with self.session.get(url) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        if data and 'hits' in data:
                            # Extract course info using async version
                            course_urls, course_count = await self.extract_course_info_async(data['hits'])
                            
                            return {
                                'page': page,
                                'status': 'success',
                                'urls': course_urls,
                                'course_count': course_count,
                                'total_hits': data.get('total_hits', 0)
                            }
                        else:
                            logger.warning(f"Page {page}: No 'hits' in response")
                            if retry_count < self.max_retries:
                                delay = self.retry_delay * (2 ** retry_count)
                                logger.info(f"Page {page}: Retry #{retry_count + 1}/{self.max_retries} in {delay:.1f}s (no hits)")
                                await asyncio.sleep(delay)
                                return await self.fetch_page(page, retry_count + 1)
                            else:
                                return {'page': page, 'status': 'no_hits', 'urls': [], 'course_count': 0}
                    
                    elif response.status == 429:  # Rate limited
                        if retry_count < self.max_retries:
                            delay = self.retry_delay * (2 ** retry_count)
                            logger.warning(f"Page {page}: Rate limited (429)")
                            logger.info(f"Page {page}: Retry #{retry_count + 1}/{self.max_retries} in {delay:.1f}s (rate limited)")
                            await asyncio.sleep(delay)
                            return await self.fetch_page(page, retry_count + 1)
                        else:
                            logger.error(f"Max retries exceeded for page {page} (rate limited)")
                            return {'page': page, 'status': 'rate_limited', 'urls': [], 'course_count': 0}
                    
                    else:
                        logger.warning(f"Page {page}: Unexpected status {response.status}")
                        if retry_count < self.max_retries:
                            delay = self.retry_delay * (2 ** retry_count)
                            logger.info(f"Page {page}: Retry #{retry_count + 1}/{self.max_retries} in {delay:.1f}s (status {response.status})")
                            await asyncio.sleep(delay)
                            return await self.fetch_page(page, retry_count + 1)
                        else:
                            return {'page': page, 'status': f'status_{response.status}', 'urls': [], 'course_count': 0}
                            
            except asyncio.TimeoutError:
                logger.warning(f"Page {page}: Timeout after {self.timeout}s")
                if retry_count < self.max_retries:
                    delay = self.retry_delay * (2 ** retry_count)
                    logger.info(f"Page {page}: Retry #{retry_count + 1}/{self.max_retries} in {delay:.1f}s (timeout)")
                    await asyncio.sleep(delay)
                    return await self.fetch_page(page, retry_count + 1)
                else:
                    return {'page': page, 'status': 'timeout', 'urls': [], 'course_count': 0}
                    
            except Exception as e:
                logger.error(f"Page {page}: Error - {e}")
                if retry_count < self.max_retries:
                    delay = self.retry_delay * (2 ** retry_count)
                    logger.info(f"Page {page}: Retry #{retry_count + 1}/{self.max_retries} in {delay:.1f}s (error: {type(e).__name__})")
                    await asyncio.sleep(delay)
                    return await self.fetch_page(page, retry_count + 1)
                else:
                    return {'page': page, 'status': 'error', 'urls': [], 'course_count': 0}
    
    async def get_initial_data(self) -> int:
        """Get initial data to determine total number of pages."""
        url = f"{self.base_url}?q=&sort=subject_catalog"
        url += f"&school={self.school}&term={self.year}+{self.term}"
        url += "&page=1"
        
        try:
            async with self.session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get('total_hits', 0)
        except Exception as e:
            logger.error(f"Error getting initial data: {e}")
            return 0
    
    async def fetch_all_pages(self) -> Dict[str, Any]:
        """
        Fetch all pages with course URLs in parallel.
        
        Returns:
            Dictionary with results and statistics
        """
        start_time = time.time()
        
        # Get total hits to calculate pages
        total_hits = await self.get_initial_data()
        if total_hits == 0:
            logger.error("Could not determine total number of courses")
            return {
                'urls': [],
                'failed_pages': [],
                'statistics': {
                    'total_courses': 0,
                    'total_pages': 0,
                    'successful_pages': 0,
                    'failed_pages': 0,
                    'elapsed_time': 0,
                    'timestamp': datetime.now().isoformat()
                }
            }
        
        courses_per_page = 15
        total_pages = (total_hits + courses_per_page - 1) // courses_per_page
        
        logger.info(f"Found {total_hits} total courses across {total_pages} pages")
        logger.info(f"Fetching for {self.year} {self.term}, School: {self.school}")
        logger.info(f"Max concurrent requests: {self.max_concurrent}")
        
        # Create tasks for all pages
        tasks = []
        for page in range(1, total_pages + 1):
            task = self.fetch_page(page)
            tasks.append(task)
        
        # Process with progress bar
        results = []
        successful_pages = 0
        total_course_count = 0
        
        with tqdm(total=len(tasks), desc="Fetching pages") as pbar:
            for coro in asyncio.as_completed(tasks):
                result = await coro
                if result:
                    results.append(result)
                    if result['status'] == 'success':
                        successful_pages += 1
                        # Add URLs to set (avoiding duplicates)
                        for url in result['urls']:
                            self.all_course_urls.add(url)
                        total_course_count += result.get('course_count', 0)
                    else:
                        self.failed_pages.append(result['page'])
                pbar.update(1)
        
        elapsed_time = time.time() - start_time
        
        stats = {
            'total_courses': total_course_count,
            'total_urls': len(self.all_course_urls),
            'total_pages': total_pages,
            'successful_pages': successful_pages,
            'failed_pages': len(self.failed_pages),
            'elapsed_time': elapsed_time,
            'pages_per_second': total_pages / elapsed_time if elapsed_time > 0 else 0,
            'timestamp': datetime.now().isoformat()
        }
        
        logger.info(f"\nFetch complete in {elapsed_time:.2f} seconds")
        logger.info(f"Successful pages: {stats['successful_pages']}/{stats['total_pages']}")
        logger.info(f"Failed pages: {stats['failed_pages']}")
        logger.info(f"Total courses found: {stats['total_courses']}")
        logger.info(f"Total URLs collected: {stats['total_urls']}")
        logger.info(f"Speed: {stats['pages_per_second']:.2f} pages/second")
        
        return {
            'urls': sorted(list(self.all_course_urls)),
            'failed_pages': self.failed_pages,
            'statistics': stats
        }

def save_results(results: Dict[str, Any], school: str, year: str, term: str):
    """Save results to files."""
    # Create output filename based on school
    output_file = f"results/{school}_course_lines.txt"
    
    # Save URLs
    with open(output_file, 'w') as f:
        for url in results['urls']:
            f.write(f"{url}\n")
    logger.info(f"URLs saved to {output_file}")
    
    # Save statistics
    stats_file = f"results/{school}_scraping_stats_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(stats_file, 'w') as f:
        json.dump(results['statistics'], f, indent=2)
    logger.info(f"Statistics saved to {stats_file}")
    
    # Save failed pages if any
    if results['failed_pages']:
        failed_file = f"{school}_failed_pages.txt"
        with open(failed_file, 'w') as f:
            for page in results['failed_pages']:
                f.write(f"{page}\n")
        logger.info(f"Failed pages saved to {failed_file}")

async def main():
    """Main execution function."""
    parser = argparse.ArgumentParser(description='Parallel Harvard Course URL Scraper')
    parser.add_argument('--school', default='All', help='School code (e.g., FAS, HMS, HLS, GSD, HKS, HGSE, HSPH, HDS, All)')
    parser.add_argument('--year', default='2025', help='Academic year (default: 2025)')
    parser.add_argument('--term', default='Fall', help='Term: Fall or Spring (default: Fall)')
    parser.add_argument('--max-concurrent', type=int, default=20,
                       help='Maximum concurrent requests (default: 20)')
    parser.add_argument('--timeout', type=int, default=30,
                       help='Request timeout in seconds (default: 30)')
    parser.add_argument('--max-retries', type=int, default=8,
                       help='Maximum retries per page (default: 8)')
    
    args = parser.parse_args()
    
    logger.info(f"Starting parallel scraper for {args.school} - {args.term} {args.year}")
    
    # Run the scraper
    async with ParallelHarvardCourseScraper(
        max_concurrent=args.max_concurrent,
        timeout=args.timeout,
        max_retries=args.max_retries,
        year=args.year,
        term=args.term,
        school=args.school
    ) as scraper:
        results = await scraper.fetch_all_pages()
        
    # Save results
    save_results(results, args.school, args.year, args.term)
    
    print(f"\n{'='*60}")
    print(f"Scraping complete for {args.school}!")
    print(f"Total time: {results['statistics']['elapsed_time']:.2f} seconds")
    print(f"Courses found: {results['statistics']['total_courses']}")
    print(f"URLs collected: {results['statistics']['total_urls']}")
    print(f"Speed: {results['statistics']['pages_per_second']:.2f} pages/second")
    print(f"Output saved to: {args.school}_course_lines.txt")
    print(f"{'='*60}")

if __name__ == "__main__":
    # For Python 3.7+
    asyncio.run(main())