import React, { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext.jsx';
import Header from './components/Header.jsx';
import Calendar from './components/Calendar.jsx';
import Sidebar from './components/Sidebar.jsx';
import MyCourses from './components/MyCourses.jsx';
import CourseDetails from './components/CourseDetails.jsx';
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
  
  // Function to generate ICS file content for selected courses along with suggested filename slug
  const generateICSExport = () => {
    const visibleCourses = myCourses.filter(course => !hiddenCourses[course.course_id]);

    if (visibleCourses.length === 0) return null;

    const timezoneId = 'America/New_York';
    const CRLF = '\r\n';

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
      if (!dateObj || Number.isNaN(dateObj.getTime()) || !timeParts) return null;
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
    const escapeICSValue = (value) => {
      if (!value) return '';
      return value
        .replace(/\\/g, '\\\\')
        .replace(/\n/g, '\\n')
        .replace(/,/g, '\\,')
        .replace(/;/g, '\\;');
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

    const now = new Date();
    const termMatch = lowerSemester.match(/(spring|summer|fall|winter)/);
    const termName = termMatch ? termMatch[1] : null;
    const explicitYearMatch = normalizedSemester.match(/(20\d{2})/);

    const parsedCourseYears = visibleCourses
      .map(course => parseDateString(course.start_date))
      .filter(Boolean)
      .map(date => date.getFullYear());

    let semesterYear = explicitYearMatch ? parseInt(explicitYearMatch[1], 10) : null;
    if (!semesterYear && parsedCourseYears.length > 0) {
      semesterYear = Math.min(...parsedCourseYears);
    }
    if (!semesterYear) {
      const currentYear = now.getFullYear();
      if (termName === 'spring') {
        semesterYear = now.getMonth() >= 6 ? currentYear + 1 : currentYear;
      } else if (termName === 'winter') {
        semesterYear = now.getMonth() >= 8 ? currentYear + 1 : currentYear;
      } else {
        semesterYear = currentYear;
      }
    }

    const termDefaults = (year) => {
      switch (termName) {
        case 'spring':
          return {
            start: new Date(year, 0, 22),
            end: new Date(year, 4, 15)
          };
        case 'summer':
          return {
            start: new Date(year, 5, 3),
            end: new Date(year, 7, 15)
          };
        case 'winter':
          return {
            start: new Date(year - 1, 11, 10),
            end: new Date(year, 0, 20)
          };
        case 'fall':
        default:
          return {
            start: new Date(year, 7, 26),
            end: new Date(year, 11, 10)
          };
      }
    };

    const termDefaultRange = termDefaults(semesterYear);
    const fallbackTermStart = new Date(termDefaultRange.start.getTime());
    const fallbackTermEnd = new Date(termDefaultRange.end.getTime());
    if (fallbackTermEnd < fallbackTermStart) {
      fallbackTermEnd.setTime(fallbackTermStart.getTime());
    }
    const defaultUntilDate = new Date(fallbackTermEnd.getFullYear(), fallbackTermEnd.getMonth(), fallbackTermEnd.getDate(), 23, 59, 59);

    const daylightStartDate = getNthWeekdayOfMonth(semesterYear, 2, 0, 2);
    const standardStartDate = getNthWeekdayOfMonth(semesterYear, 10, 0, 1);
    const calendarName = selectedSemester ? `Harvard ${selectedSemester} Courses` : `Harvard Courses ${semesterYear}`;

    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CrimsonCal//Harvard Course Schedule//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${escapeICSValue(calendarName)}`,
      `X-WR-TIMEZONE:${timezoneId}`,
      'BEGIN:VTIMEZONE',
      `TZID:${timezoneId}`,
      'BEGIN:DAYLIGHT',
      'TZOFFSETFROM:-0500',
      'TZOFFSETTO:-0400',
      'TZNAME:EDT',
      `DTSTART:${(formatICSDate(daylightStartDate) || `${semesterYear}0310`)}T020000`,
      'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
      'END:DAYLIGHT',
      'BEGIN:STANDARD',
      'TZOFFSETFROM:-0400',
      'TZOFFSETTO:-0500',
      'TZNAME:EST',
      `DTSTART:${(formatICSDate(standardStartDate) || `${semesterYear}1101`)}T020000`,
      'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
      'END:STANDARD',
      'END:VTIMEZONE'
    ];

    const dtstamp = formatUTCDateTime(new Date());
    let eventAdded = false;

    visibleCourses.forEach(course => {
      const section = course.selectedSection || course.sections?.[0] || {};
      const dayMap = section.dayMap || course.dayMap || {};

      const scheduledDays = Object.entries(dayMap)
        .filter(([, active]) => active)
        .map(([key]) => dayKeyToICS[key])
        .filter(Boolean);

      if (scheduledDays.length === 0) return;

      const courseStartDate = parseDateString(course.start_date) || new Date(fallbackTermStart.getTime());
      const courseEndDate = parseDateString(course.end_date) || new Date(fallbackTermEnd.getTime());
      if (courseEndDate < courseStartDate) {
        courseEndDate.setTime(courseStartDate.getTime());
      }

      const firstOccurrences = scheduledDays.map(day => getFirstOccurrence(courseStartDate, day.index));
      firstOccurrences.sort((a, b) => a.getTime() - b.getTime());
      const firstOccurrenceDate = firstOccurrences[0];
      if (!firstOccurrenceDate) return;

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
      const untilDate = formatUTCDateTime(courseEndForUntil) || formatUTCDateTime(defaultUntilDate);
      if (!untilDate) return;

      const sectionIdentifier = section.class_number || section.section || 'default';
      const uidSeed = `${course.course_id || course.subject_catalog || 'course'}-${sectionIdentifier}`;
      const sanitizedUidSeed = uidSeed.replace(/[^A-Za-z0-9]/g, '').toLowerCase() || `course-${Math.random().toString(36).slice(2, 8)}`;
      const uid = `${sanitizedUidSeed}-${semesterYear}@crimsoncal`;
      const summary = `${course.subject_catalog}: ${course.course_title}`.trim();

      const location = (section.location || course.location || '').trim();
      const hasLocation = location && !/(to\s*be\s*announced|tbd|tba)/i.test(location);

      const rruleParts = ['FREQ=WEEKLY'];
      if (meetingDays.length) {
        rruleParts.push(`BYDAY=${meetingDays.join(',')}`);
      }
      rruleParts.push(`UNTIL=${untilDate}`);

      const eventLines = [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART;TZID=${timezoneId}:${dtstart}`,
        `DTEND;TZID=${timezoneId}:${dtend}`,
        `SUMMARY:${escapeICSValue(summary)}`,
        'CATEGORIES:Harvard Courses',
        `RRULE:${rruleParts.join(';')}`
      ];

      if (hasLocation) {
        eventLines.push(`LOCATION:${escapeICSValue(location)}`);
        eventLines.push(`DESCRIPTION:${escapeICSValue(`Location: ${location}`)}`);
      }

      const exdates = [];
      if (termName === 'spring') {
        const springBreakMonday = getNthWeekdayOfMonth(semesterYear, 2, 1, 3);
        if (springBreakMonday) {
          for (let i = 0; i < 5; i += 1) {
            const breakDate = new Date(springBreakMonday);
            breakDate.setDate(springBreakMonday.getDate() + i);
            const dayCode = ['MO', 'TU', 'WE', 'TH', 'FR'][i];
            if (meetingDays.includes(dayCode) && breakDate >= courseStartDate && breakDate <= courseEndDate) {
              const exdateValue = formatICSDateTime(breakDate, startTimeParts);
              if (exdateValue) {
                exdates.push(`EXDATE;TZID=${timezoneId}:${exdateValue}`);
              }
            }
          }
        }
      } else if (termName === 'fall') {
        const thanksgivingThursday = getNthWeekdayOfMonth(semesterYear, 10, 4, 4);
        if (thanksgivingThursday) {
          if (meetingDays.includes('TH') && thanksgivingThursday >= courseStartDate && thanksgivingThursday <= courseEndDate) {
            const exdateValue = formatICSDateTime(thanksgivingThursday, startTimeParts);
            if (exdateValue) {
              exdates.push(`EXDATE;TZID=${timezoneId}:${exdateValue}`);
            }
          }
          if (meetingDays.includes('FR')) {
            const thanksgivingFriday = new Date(thanksgivingThursday);
            thanksgivingFriday.setDate(thanksgivingThursday.getDate() + 1);
            const exdateValue = formatICSDateTime(thanksgivingFriday, startTimeParts);
            if (exdateValue && thanksgivingFriday >= courseStartDate && thanksgivingFriday <= courseEndDate) {
              exdates.push(`EXDATE;TZID=${timezoneId}:${exdateValue}`);
            }
          }
        }
      }

      exdates.forEach(exdateLine => eventLines.push(exdateLine));

      eventLines.push('END:VEVENT');
      icsLines.push(...eventLines);
      eventAdded = true;
    });

    if (!eventAdded) {
      return null;
    }

    icsLines.push('END:VCALENDAR');

    const fileSlugBase = termName ? `${termName}-${semesterYear}` : `${semesterYear}`;
    const rawSlug = (fileSlugBase || 'harvard-courses')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
    const fileSlug = rawSlug.replace(/(^-|-$)/g, '') || 'harvard-courses';

    return {
      content: `${icsLines.join(CRLF)}${CRLF}`,
      fileSlug
    };
  };
  
  // Function to trigger ICS download
  const handleExportToCalendar = () => {
    const exportPayload = generateICSExport();
    if (!exportPayload) return;

    const { content, fileSlug } = exportPayload;
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sanitizedSemester = fileSlug.replace(/(^-|-$)/g, '') || 'harvard-courses';
    const filename = `harvard-courses-${sanitizedSemester}.ics`;
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
    <div className="flex flex-col h-screen w-full" style={{backgroundColor: 'var(--parchment-50)'}}>
      <Header />

      {/* Mobile: Single page layout with everything stacked */}
      <div className="md:hidden flex-1 overflow-auto">
        <div className="p-4">
          <Calendar />

          {/* Sidebar content (filters, search, course list) */}
          <Sidebar onCloseMobile={() => {}} isMobile={true} />

          {/* CourseDetails - shown at bottom when a course is selected */}
          <CourseDetails onAddCourse={() => {}} />

          {/* Report Bug and Export buttons */}
          <div className="flex justify-center items-center gap-4 mt-4">
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSdPks0Z_z6oamuEs4bMHJznTadvBFjVHmZK4l7vwdERCHWgBg/viewform?usp=header"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm hover:underline transition-colors duration-150 font-medium"
              style={{color: 'var(--harvard-crimson)'}}
              onMouseEnter={(e) => e.target.style.color = 'var(--harvard-crimson-dark)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--harvard-crimson)'}
            >
              Report Bug
            </a>
            {hasVisibleCourses ? (
              <button
                onClick={handleExportToCalendar}
                className="flex items-center gap-1 text-sm hover:underline transition-colors duration-150 cursor-pointer font-medium"
                style={{color: 'var(--harvard-crimson)'}}
                onMouseEnter={(e) => e.target.style.color = 'var(--harvard-crimson-dark)'}
                onMouseLeave={(e) => e.target.style.color = 'var(--harvard-crimson)'}
                title="Export selected courses to calendar file"
              >
                <CalendarPlus size={16} />
                <span>Export to Calendar</span>
              </button>
            ) : (
              <span
                className="flex items-center gap-1 text-sm cursor-not-allowed"
                style={{color: 'var(--parchment-400)'}}
                title="No courses selected to export"
              >
                <CalendarPlus size={16} />
                <span>Export to Calendar</span>
              </span>
            )}
          </div>

          {/* Last updated timestamp */}
          <div className="text-xs mt-4" style={{color: 'var(--leather-brown)'}}>
            Last updated: {lastUpdated}
          </div>
        </div>
      </div>

      {/* Desktop: Two-column resizable layout */}
      <div className="hidden md:flex flex-1 overflow-hidden w-full relative">
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
              className="text-sm hover:underline transition-colors duration-150 font-medium"
              style={{color: 'var(--harvard-crimson)'}}
              onMouseEnter={(e) => e.target.style.color = 'var(--harvard-crimson-dark)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--harvard-crimson)'}
            >
              Report Bug
            </a>
            {hasVisibleCourses ? (
              <button
                onClick={handleExportToCalendar}
                className="flex items-center gap-1 text-sm hover:underline transition-colors duration-150 cursor-pointer font-medium"
                style={{color: 'var(--harvard-crimson)'}}
                onMouseEnter={(e) => e.target.style.color = 'var(--harvard-crimson-dark)'}
                onMouseLeave={(e) => e.target.style.color = 'var(--harvard-crimson)'}
                title="Export selected courses to calendar file"
              >
                <CalendarPlus size={16} />
                <span>Export to Calendar</span>
              </button>
            ) : (
              <span
                className="flex items-center gap-1 text-sm cursor-not-allowed"
                style={{color: 'var(--parchment-400)'}}
                title="No courses selected to export"
              >
                <CalendarPlus size={16} />
                <span>Export to Calendar</span>
              </span>
            )}
          </div>

          {/* Last updated timestamp - bottom left */}
          <div className="fixed bottom-4 left-4 text-xs" style={{color: 'var(--leather-brown)'}}>
            Last updated: {lastUpdated}
          </div>
        </div>

        {/* Resizable divider */}
        <div className="relative">
          <ResizableDivider
            onResize={setLeftColumnWidth}
            minLeftWidth={30}
            minRightWidth={25}
          />
        </div>

        {/* Sidebar */}
        <div
          className="overflow-auto"
          style={{ width: `${100 - leftColumnWidth}%` }}
        >
          <Sidebar onCloseMobile={() => {}} isMobile={false} />
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