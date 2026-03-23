// API endpoint to get the last modified time of master_courses.json
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'master_courses.json');
    const stats = fs.statSync(filePath);
    const lastModified = stats.mtime;
    
    res.status(200).json({ 
      lastUpdated: lastModified.toISOString(),
      formatted: new Date(lastModified).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    });
  } catch (error) {
    console.error('Error getting file stats:', error);
    res.status(500).json({ error: 'Failed to get last updated time' });
  }
}