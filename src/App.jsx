import React, { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext.jsx';
import Header from './components/Header.jsx';
import Calendar from './components/Calendar.jsx';
import Sidebar from './components/Sidebar.jsx';
import MyCourses from './components/MyCourses.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';
import ResizableDivider from './components/ResizableDivider.jsx';
import { useAppContext } from './context/AppContext.jsx';
import { Menu, X, CalendarPlus } from 'lucide-react';
import './App.css';

// App.jsx - Make sidebar take full width on mobile
const AppContent = () => {
  const { isLoading, myCourses, hiddenCourses } = useAppContext();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const [leftColumnWidth, setLeftColumnWidth] = useState(60);
  
  // Fetch the last updated timestamp
  useEffect(() => {
    fetch('/data/last_updated.json')
      .then(res => res.json())
      .then(data => {
        setLastUpdated(data.formatted || 'Aug 24, 2025');
      })
      .catch(() => {
        // Fallback if file doesn't exist
        setLastUpdated('Aug 24, 2025');
      });
  }, []);
  
  // Function to generate ICS file content for selected courses
  const generateICSContent = () => {
    const visibleCourses = myCourses.filter(course => !hiddenCourses[course.course_id]);
    
    if (visibleCourses.length === 0) return null;
    
    // Helper to format date/time for ICS
    const formatICSDateTime = (date, timeStr) => {
      const [month, day] = [date.substring(4, 6), date.substring(6, 8)];
      let hour = 0, minute = 0;
      
      if (timeStr) {
        const timeParts = timeStr.match(/(\d+):?(\d+)?([ap]m)/i);
        if (timeParts) {
          hour = parseInt(timeParts[1]);
          minute = timeParts[2] ? parseInt(timeParts[2]) : 0;
          if (timeParts[3].toLowerCase() === 'pm' && hour < 12) hour += 12;
          if (timeParts[3].toLowerCase() === 'am' && hour === 12) hour = 0;
        }
      }
      
      return `2025${month}${day}T${hour.toString().padStart(2, '0')}${minute.toString().padStart(2, '0')}00`;
    };
    
    // Start ICS file
    let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//CrimsonCal//Harvard Course Schedule//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Harvard Fall 2025 Courses
X-WR-TIMEZONE:America/New_York
BEGIN:VTIMEZONE
TZID:America/New_York
BEGIN:DAYLIGHT
TZOFFSETFROM:-0500
TZOFFSETTO:-0400
TZNAME:EDT
DTSTART:20250309T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:-0400
TZOFFSETTO:-0500
TZNAME:EST
DTSTART:20251102T020000
RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU
END:STANDARD
END:VTIMEZONE
`;
    
    // Add each course as a recurring event
    visibleCourses.forEach(course => {
      const section = course.selectedSection || course.sections?.[0] || {};
      const dayMap = section.dayMap || course.dayMap || {};
      
      // Get days for RRULE
      const days = [];
      const firstDates = {}; // Track first occurrence for each day
      if (dayMap.monday) { days.push('MO'); firstDates.MO = '20250908'; } // First Monday
      if (dayMap.tuesday) { days.push('TU'); firstDates.TU = '20250902'; } // First Tuesday (Sept 2)
      if (dayMap.wednesday) { days.push('WE'); firstDates.WE = '20250903'; } // First Wednesday
      if (dayMap.thursday) { days.push('TH'); firstDates.TH = '20250904'; } // First Thursday
      if (dayMap.friday) { days.push('FR'); firstDates.FR = '20250905'; } // First Friday
      
      if (days.length === 0) return; // Skip courses with no scheduled days
      
      // Use the earliest day as start
      const firstDay = days[0];
      const startDateBase = firstDates[firstDay];
      
      const startTime = section.start_time || course.start_time || '9:00am';
      const endTime = section.end_time || course.end_time || '10:00am';
      
      const dtstart = formatICSDateTime(startDateBase, startTime);
      const dtend = formatICSDateTime(startDateBase, endTime);
      
      const uid = `${course.course_id}-${Date.now()}@crimsoncal`;
      const summary = `${course.subject_catalog}: ${course.course_title}`;
      
      icsContent += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}
DTSTART;TZID=America/New_York:${dtstart}
DTEND;TZID=America/New_York:${dtend}
SUMMARY:${summary}
CATEGORIES:Harvard Courses
RRULE:FREQ=WEEKLY;BYDAY=${days.join(',')};UNTIL=20251203T235959Z
EXDATE;TZID=America/New_York:20251127T${dtstart.substring(9)}
EXDATE;TZID=America/New_York:20251128T${dtstart.substring(9)}
END:VEVENT
`;
    });
    
    icsContent += 'END:VCALENDAR';
    return icsContent;
  };
  
  // Function to trigger ICS download
  const handleExportToCalendar = () => {
    const icsContent = generateICSContent();
    if (!icsContent) return;
    
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'harvard-courses-fall-2025.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const hasVisibleCourses = myCourses.some(course => !hiddenCourses[course.course_id]);
  
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50">
      <Header />
      
      <div className="flex flex-1 overflow-hidden w-full relative">
        {/* Mobile sidebar toggle button */}
        <button 
          className="md:hidden fixed bottom-4 right-4 z-40 bg-teal-600 text-white p-3 rounded-full shadow-lg hover:bg-teal-700 transition-colors duration-150"
          onClick={() => setSidebarVisible(!sidebarVisible)}
          aria-label="Toggle sidebar"
        >
          <Menu size={24} />
        </button>
        
        {/* Main content area with calendar and MyCourses */}
        <div 
          className="overflow-auto p-4 relative"
          style={{ width: `${leftColumnWidth}%` }}
        >
          <Calendar />
          <MyCourses />
          
          {/* Report Bug and Export buttons - centered below calendar */}
          <div className="flex justify-center items-center gap-4 mt-4">
            <a 
              href="https://docs.google.com/forms/d/e/1FAIpQLSdPks0Z_z6oamuEs4bMHJznTadvBFjVHmZK4l7vwdERCHWgBg/viewform?usp=header" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline hover:text-blue-700 transition-colors duration-150"
            >
              Report Bug
            </a>
            {hasVisibleCourses ? (
              <button
                onClick={handleExportToCalendar}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors duration-150"
                title="Export selected courses to calendar file"
              >
                <CalendarPlus size={16} />
                <span>Export to Calendar</span>
              </button>
            ) : (
              <span
                className="flex items-center gap-1 text-sm text-gray-400 cursor-not-allowed"
                title="No courses selected to export"
              >
                <CalendarPlus size={16} />
                <span>Export to Calendar</span>
              </span>
            )}
          </div>
          
          {/* Last updated timestamp - bottom left */}
          <div className="fixed bottom-4 left-4 text-xs text-gray-400">
            Last updated: {lastUpdated}
          </div>
        </div>
        
        {/* Mobile overlay */}
        {sidebarVisible && (
          <div 
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setSidebarVisible(false)}
          ></div>
        )}
        
        {/* Resizable divider */}
        <div className="relative">
          <ResizableDivider 
            onResize={setLeftColumnWidth}
            minLeftWidth={30}
            minRightWidth={25}
          />
        </div>
        
        {/* Sidebar - full height and width on mobile */}
        <div 
          className={`transition-all duration-300 ease-in-out fixed md:relative md:translate-x-0 inset-y-0 right-0 h-full z-40 md:z-0 w-full md:w-auto ${
            sidebarVisible ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ width: window.innerWidth >= 768 ? `${100 - leftColumnWidth}%` : '100%' }}
        >
          {/* Mobile close button */}
          <button 
            className="md:hidden absolute top-4 left-4 z-50 bg-white p-2 rounded-full shadow hover:bg-gray-100 transition-colors duration-150"
            onClick={() => setSidebarVisible(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
          <Sidebar onCloseMobile={() => setSidebarVisible(false)} />
        </div>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;