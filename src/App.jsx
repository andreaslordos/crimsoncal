import React, { useState, useEffect, useCallback } from 'react';
import { AppProvider } from './context/AppContext.jsx';
import Header from './components/Header.jsx';
import Calendar from './components/Calendar.jsx';
import Sidebar from './components/Sidebar.jsx';
import MyCourses from './components/MyCourses.jsx';
import CourseDetails from './components/CourseDetails.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';
import ResizableDivider from './components/ResizableDivider.jsx';
import Toast, { useToast } from './components/Toast.jsx';
import { useAppContext } from './context/AppContext.jsx';
import { Menu, X, CalendarPlus, Share2 } from 'lucide-react';
import LZString from 'lz-string';
import './App.css';

// App.jsx - Make sidebar take full width on mobile
const AppContent = () => {
  const {
    isLoading,
    myCourses,
    hiddenCourses,
    selectedSemester,
    processedCourses,
    activeCalendar,
    generateCalendarShareURL,
    importSharedCalendar,
    findCalendarBySourceHash,
    parseShareURLParam,
    cleanShareURLParam,
    switchCalendar,
    changeSemester
  } = useAppContext();

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const [leftColumnWidth, setLeftColumnWidth] = useState(60);
  const [importProcessed, setImportProcessed] = useState(false);
  const [semesterPrompt, setSemesterPrompt] = useState(null);
  const pendingImportSemester = React.useRef(null);

  // Toast management
  const { toasts, addToast, removeToast } = useToast();

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

  // Handle share calendar click
  const handleShareCalendar = useCallback(() => {
    const shareURL = generateCalendarShareURL();
    if (!shareURL) {
      addToast('No courses to share', { type: 'error', duration: 3000 });
      return;
    }

    navigator.clipboard.writeText(shareURL).then(() => {
      addToast('Link copied! Share it with anyone.', { type: 'success', duration: 4000 });
    }).catch(() => {
      addToast('Failed to copy link', { type: 'error', duration: 3000 });
    });
  }, [generateCalendarShareURL, addToast]);

  // Handle import from URL on page load
  useEffect(() => {
    if (isLoading || importProcessed || processedCourses.length === 0) return;

    // If we're waiting for a specific semester to load, check if it matches
    if (pendingImportSemester.current && pendingImportSemester.current !== selectedSemester) {
      return; // Wait for the correct semester's courses to load
    }

    const shareParam = parseShareURLParam();
    if (!shareParam) {
      pendingImportSemester.current = null;
      setImportProcessed(true);
      return;
    }

    // Check for duplicate first
    const existingCalendar = findCalendarBySourceHash(shareParam);
    if (existingCalendar) {
      cleanShareURLParam();
      pendingImportSemester.current = null;
      addToast('This calendar has already been added', {
        type: 'info',
        duration: 5000,
        action: {
          label: 'View',
          onClick: () => {
            switchCalendar(existingCalendar.id);
            if (existingCalendar.semester !== selectedSemester) {
              changeSemester(existingCalendar.semester);
            }
          }
        }
      });
      setImportProcessed(true);
      return;
    }

    // Parse the share data to check semester (only if not already handling a semester switch)
    if (!pendingImportSemester.current) {
      try {
        const json = LZString.decompressFromEncodedURIComponent(shareParam);
        if (json) {
          const decompressed = JSON.parse(json);

          if (decompressed && decompressed.s && decompressed.s !== selectedSemester) {
            // Show semester mismatch prompt
            setSemesterPrompt({
              shareParam,
              targetSemester: decompressed.s
            });
            setImportProcessed(true);
            return;
          }
        }
      } catch {
        // If parsing fails, try import anyway
      }
    }

    // Proceed with import
    const result = importSharedCalendar(shareParam, processedCourses);
    cleanShareURLParam();
    pendingImportSemester.current = null;
    setImportProcessed(true);

    if (result.success) {
      addToast(`"${result.calendar.name}" added!`, { type: 'success', duration: 4000 });
      if (result.missingCourses && result.missingCourses.length > 0) {
        setTimeout(() => {
          addToast(`${result.missingCourses.length} course(s) could not be imported`, {
            type: 'warning',
            duration: 5000
          });
        }, 500);
      }
    } else if (result.error === 'invalid') {
      addToast('Invalid share link', { type: 'error', duration: 4000 });
    } else if (result.error === 'no_valid_courses') {
      addToast('No valid courses found in share link', { type: 'error', duration: 4000 });
    }
  }, [
    isLoading,
    importProcessed,
    processedCourses,
    parseShareURLParam,
    findCalendarBySourceHash,
    cleanShareURLParam,
    importSharedCalendar,
    switchCalendar,
    changeSemester,
    selectedSemester,
    addToast
  ]);

  // Handle semester prompt confirmation
  const handleSemesterPromptConfirm = useCallback(() => {
    if (!semesterPrompt) return;

    // Store the target semester in ref to track pending import
    pendingImportSemester.current = semesterPrompt.targetSemester;

    // Change semester, which will trigger data reload
    changeSemester(semesterPrompt.targetSemester);
    setSemesterPrompt(null);
    setImportProcessed(false);
  }, [semesterPrompt, changeSemester]);

  const handleSemesterPromptCancel = useCallback(() => {
    cleanShareURLParam();
    setSemesterPrompt(null);
  }, [cleanShareURLParam]);

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
    <div className="flex flex-col h-screen w-full bg-gray-50">
      <Header />

      {/* Mobile: Single page layout with everything stacked */}
      <div className="md:hidden flex-1 overflow-auto">
        <div className="p-4">
          <Calendar />

          {/* Sidebar content (filters, search, course list) */}
          <Sidebar onCloseMobile={() => {}} isMobile={true} />

          {/* CourseDetails - shown at bottom when a course is selected */}
          <CourseDetails onAddCourse={() => {}} />

          {/* Report Bug, Share, and Export buttons */}
          <div className="flex justify-center items-center gap-4 mt-4 flex-wrap">
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSdPks0Z_z6oamuEs4bMHJznTadvBFjVHmZK4l7vwdERCHWgBg/viewform?usp=header"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-gray-900 hover:underline transition-colors duration-150"
            >
              Report Bug
            </a>
            {hasVisibleCourses ? (
              <button
                onClick={handleShareCalendar}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 hover:underline transition-colors duration-150 cursor-pointer"
                title="Share calendar with others"
              >
                <Share2 size={16} />
                <span>Share Calendar</span>
              </button>
            ) : (
              <span
                className="flex items-center gap-1 text-sm text-gray-400 cursor-not-allowed"
                title="No courses to share"
              >
                <Share2 size={16} />
                <span>Share Calendar</span>
              </span>
            )}
            {hasVisibleCourses ? (
              <button
                onClick={handleExportToCalendar}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 hover:underline transition-colors duration-150 cursor-pointer"
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

          {/* Last updated timestamp */}
          <div className="text-xs text-gray-500 mt-4">
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

          {/* Footer row: Last updated (left), Report Bug, Share and Export (center) */}
          <div className="relative flex items-center justify-center mt-4">
            <div className="absolute left-0 text-xs text-gray-500">
              Last updated: {lastUpdated}
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSdPks0Z_z6oamuEs4bMHJznTadvBFjVHmZK4l7vwdERCHWgBg/viewform?usp=header"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-gray-900 hover:underline transition-colors duration-150"
              >
                Report Bug
              </a>
              {hasVisibleCourses ? (
                <button
                  onClick={handleShareCalendar}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 hover:underline transition-colors duration-150 cursor-pointer"
                  title="Share calendar with others"
                >
                  <Share2 size={16} />
                  <span>Share Calendar</span>
                </button>
              ) : (
                <span
                  className="flex items-center gap-1 text-sm text-gray-400 cursor-not-allowed"
                  title="No courses to share"
                >
                  <Share2 size={16} />
                  <span>Share Calendar</span>
                </span>
              )}
              {hasVisibleCourses ? (
                <button
                  onClick={handleExportToCalendar}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 hover:underline transition-colors duration-150 cursor-pointer"
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

      {/* Semester mismatch prompt dialog */}
      {semesterPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Different Semester
            </h3>
            <p className="text-gray-600 mb-4">
              This calendar is for {semesterPrompt.targetSemester}. Switch to {semesterPrompt.targetSemester} and import?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleSemesterPromptCancel}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSemesterPromptConfirm}
                className="px-4 py-2 text-sm bg-harvard-crimson text-white rounded hover:bg-harvard-crimson-dark transition-colors"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type || 'success'}
          onClose={() => removeToast(toast.id)}
          action={toast.action}
          duration={toast.duration || 5000}
        />
      ))}
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