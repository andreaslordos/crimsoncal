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
  const { isLoading, myCourses, hiddenCourses, selectedSemester } = useAppContext();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const [leftColumnWidth, setLeftColumnWidth] = useState(60);

  const normalizedSemester = selectedSemester || '';
  const lowerSemester = normalizedSemester.toLowerCase();
  const isSpring = lowerSemester.includes('spring');
  const semesterYearMatch = normalizedSemester.match(/(\d{4})/);
  const semesterYear = semesterYearMatch ? parseInt(semesterYearMatch[1], 10) : (isSpring ? 2026 : 2025);
  
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

    const sanitizeDateString = (dateStr) => (dateStr ? dateStr.replace(/\./g, '') : '');
    const parseDateString = (dateStr) => {
      if (!dateStr) return null;
      const parsed = new Date(sanitizeDateString(dateStr));
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };
    const pad = (value) => value.toString().padStart(2, '0');
    const formatICSDate = (dateObj) => {
      if (!dateObj || Number.isNaN(dateObj.getTime())) return null;
      return `${dateObj.getFullYear()}${pad(dateObj.getMonth() + 1)}${pad(dateObj.getDate())}`;
    };
    const formatUTCDateTime = (dateObj) => {
      if (!dateObj || Number.isNaN(dateObj.getTime())) return null;
      return `${dateObj.getUTCFullYear()}${pad(dateObj.getUTCMonth() + 1)}${pad(dateObj.getUTCDate())}T${pad(dateObj.getUTCHours())}${pad(dateObj.getUTCMinutes())}${pad(dateObj.getUTCSeconds())}Z`;
    };
    const formatICSDateTime = (dateObj, timeParts) => {
      if (!dateObj || Number.isNaN(dateObj.getTime())) return null;
      const { hour, minute } = timeParts;
      return `${dateObj.getFullYear()}${pad(dateObj.getMonth() + 1)}${pad(dateObj.getDate())}T${pad(hour)}${pad(minute)}00`;
    };
    const parseTimeString = (timeStr, fallback) => {
      if (!timeStr) return fallback;
      const trimmed = timeStr.trim();
      const match = trimmed.match(/(\d+):?(\d+)?\s*([ap]m)/i);
      if (match) {
        let hour = parseInt(match[1], 10);
        const minute = match[2] ? parseInt(match[2], 10) : 0;
        const meridiem = match[3].toLowerCase();
        if (meridiem === 'pm' && hour < 12) hour += 12;
        if (meridiem === 'am' && hour === 12) hour = 0;
        return { hour, minute };
      }

      const colonMatch = trimmed.match(/(\d+):(\d+)/);
      if (colonMatch) {
        return {
          hour: parseInt(colonMatch[1], 10),
          minute: parseInt(colonMatch[2], 10)
        };
      }

      return fallback;
    };
    const getNthWeekdayOfMonth = (year, monthIndex, weekday, n) => {
      const firstOfMonth = new Date(year, monthIndex, 1);
      const firstWeekday = firstOfMonth.getDay();
      const offset = (weekday - firstWeekday + 7) % 7;
      const dayOfMonth = 1 + offset + 7 * (n - 1);
      return new Date(year, monthIndex, dayOfMonth);
    };
    const getFirstOccurrence = (startDate, targetDay) => {
      const base = new Date(startDate);
      const diff = (targetDay - base.getDay() + 7) % 7;
      base.setDate(base.getDate() + diff);
      return base;
    };

    const dayKeyToICS = {
      sunday: { code: 'SU', index: 0 },
      monday: { code: 'MO', index: 1 },
      tuesday: { code: 'TU', index: 2 },
      wednesday: { code: 'WE', index: 3 },
      thursday: { code: 'TH', index: 4 },
      friday: { code: 'FR', index: 5 },
      saturday: { code: 'SA', index: 6 }
    };

    const fallbackTermStart = new Date(semesterYear, isSpring ? 0 : 8, isSpring ? 27 : 2);
    const fallbackTermEnd = new Date(semesterYear, isSpring ? 4 : 11, isSpring ? 15 : 3);
    const defaultUntilDate = new Date(fallbackTermEnd.getFullYear(), fallbackTermEnd.getMonth(), fallbackTermEnd.getDate(), 23, 59, 59);

    const daylightStart = formatICSDate(getNthWeekdayOfMonth(semesterYear, 2, 0, 2));
    const standardStart = formatICSDate(getNthWeekdayOfMonth(semesterYear, 10, 0, 1));
    const calendarName = selectedSemester ? `Harvard ${selectedSemester} Courses` : 'Harvard Courses';

    let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//CrimsonCal//Harvard Course Schedule//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${calendarName}
X-WR-TIMEZONE:America/New_York
BEGIN:VTIMEZONE
TZID:America/New_York
BEGIN:DAYLIGHT
TZOFFSETFROM:-0500
TZOFFSETTO:-0400
TZNAME:EDT
DTSTART:${daylightStart ?? `${semesterYear}0308`}T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:-0400
TZOFFSETTO:-0500
TZNAME:EST
DTSTART:${standardStart ?? `${semesterYear}1101`}T020000
RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU
END:STANDARD
END:VTIMEZONE
`;

    visibleCourses.forEach(course => {
      const section = course.selectedSection || course.sections?.[0] || {};
      const dayMap = section.dayMap || course.dayMap || {};

      const scheduledDays = Object.entries(dayMap)
        .filter(([, active]) => active)
        .map(([key]) => dayKeyToICS[key])
        .filter(Boolean);

      if (scheduledDays.length === 0) return;

      const courseStartDate = parseDateString(course.start_date) || fallbackTermStart;
      const courseEndDate = parseDateString(course.end_date) || fallbackTermEnd;

      const firstOccurrences = scheduledDays.map(day => getFirstOccurrence(courseStartDate, day.index));
      firstOccurrences.sort((a, b) => a.getTime() - b.getTime());
      const firstOccurrenceDate = firstOccurrences[0];

      const meetingDays = scheduledDays.map(day => day.code);

      const startFallback = { hour: 9, minute: 0 };
      const startTimeParts = parseTimeString(section.start_time || course.start_time, startFallback);
      const endFallback = {
        hour: Math.min(startTimeParts.hour + 1, 23),
        minute: startTimeParts.minute
      };
      const endTimeParts = parseTimeString(section.end_time || course.end_time, endFallback);

      const dtstart = formatICSDateTime(firstOccurrenceDate, startTimeParts);
      const dtend = formatICSDateTime(firstOccurrenceDate, endTimeParts);
      if (!dtstart || !dtend) return;

      const courseEndForUntil = new Date(courseEndDate.getFullYear(), courseEndDate.getMonth(), courseEndDate.getDate(), 23, 59, 59);
      const untilDate = formatUTCDateTime(courseEndForUntil) || formatUTCDateTime(defaultUntilDate) || (isSpring ? '20260515T235959Z' : '20251203T235959Z');

      const uid = `${course.course_id}-${Date.now()}@crimsoncal`;
      const summary = `${course.subject_catalog}: ${course.course_title}`;

      icsContent += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}
DTSTART;TZID=America/New_York:${dtstart}
DTEND;TZID=America/New_York:${dtend}
SUMMARY:${summary}
CATEGORIES:Harvard Courses
RRULE:FREQ=WEEKLY;BYDAY=${meetingDays.join(',')};UNTIL=${untilDate}
`;

      if (isSpring) {
        icsContent += `EXDATE;TZID=America/New_York:20260316T${dtstart.substring(9)}
EXDATE;TZID=America/New_York:20260317T${dtstart.substring(9)}
EXDATE;TZID=America/New_York:20260318T${dtstart.substring(9)}
EXDATE;TZID=America/New_York:20260319T${dtstart.substring(9)}
EXDATE;TZID=America/New_York:20260320T${dtstart.substring(9)}
`;
      } else {
        icsContent += `EXDATE;TZID=America/New_York:20251127T${dtstart.substring(9)}
EXDATE;TZID=America/New_York:20251128T${dtstart.substring(9)}
`;
      }

      icsContent += `END:VEVENT
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
    const sanitizedSemester = lowerSemester
      ? lowerSemester.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      : (isSpring ? 'spring-2026' : 'fall-2025');
    const filename = `harvard-courses-${sanitizedSemester || (isSpring ? 'spring-2026' : 'fall-2025')}.ics`;
    link.download = filename;
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
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors duration-150 cursor-pointer"
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