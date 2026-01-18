import React, { createContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import LZString from 'lz-string';

const DEFAULT_SEMESTER = 'Spring 2026';
const SUPPORTED_SEMESTERS = ['Fall 2025', 'Spring 2026'];
const DEFAULT_CALENDAR_PREFIX = 'Calendar';

const normalizeSemester = (semester) => (
  SUPPORTED_SEMESTERS.includes(semester) ? semester : DEFAULT_SEMESTER
);

const detectCourseSemester = (course, fallbackSemester = DEFAULT_SEMESTER) => {
  if (!course) return fallbackSemester;
  const rawTerm = `${course.current_term || course.year_term || ''}`.toLowerCase();
  if (rawTerm.includes('spring') && rawTerm.includes('2026')) return 'Spring 2026';
  if (rawTerm.includes('fall') && rawTerm.includes('2025')) return 'Fall 2025';
  return fallbackSemester;
};

const generateCalendarId = () => `calendar-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const stripSemesterSuffix = (name = '') => {
  return name.replace(/\s+\((Spring|Fall)\s+20\d{2}\)$/i, '').trim();
};

const getSemesterKey = (semester) => normalizeSemester(semester || DEFAULT_SEMESTER);

const ensureUniqueName = (desiredName, usedNamesBySemester, semester) => {
  const key = getSemesterKey(semester);
  if (!usedNamesBySemester.has(key)) {
    usedNamesBySemester.set(key, new Set());
  }

  const nameSet = usedNamesBySemester.get(key);
  if (!nameSet.has(desiredName)) {
    nameSet.add(desiredName);
    return desiredName;
  }

  let counter = 2;
  let candidate = `${desiredName} (${counter})`;
  while (nameSet.has(candidate)) {
    counter += 1;
    candidate = `${desiredName} (${counter})`;
  }
  nameSet.add(candidate);
  return candidate;
};

const getDefaultCalendarName = (calendars, semester) => {
  const key = getSemesterKey(semester);
  const takenNames = new Set(
    calendars
      .filter(cal => getSemesterKey(cal.semester) === key)
      .map(cal => cal.name)
  );

  let index = 1;
  while (takenNames.has(`${DEFAULT_CALENDAR_PREFIX} ${index}`)) {
    index += 1;
  }

  return `${DEFAULT_CALENDAR_PREFIX} ${index}`;
};

// Share URL helpers
const SHARE_DATA_VERSION = 1;

const generateShareData = (calendar) => {
  if (!calendar || !calendar.courses || calendar.courses.length === 0) {
    return null;
  }

  return {
    v: SHARE_DATA_VERSION,
    n: calendar.name || 'Shared Calendar',
    s: calendar.semester || DEFAULT_SEMESTER,
    c: calendar.courses.map(course => ({
      id: course.course_id,
      sec: course.selectedSection?.section || null,
      h: calendar.hiddenCourses?.[course.course_id] || false
    }))
  };
};

const compressShareData = (shareData) => {
  if (!shareData) return null;
  try {
    const json = JSON.stringify(shareData);
    return LZString.compressToEncodedURIComponent(json);
  } catch (error) {
    console.error('Failed to compress share data:', error);
    return null;
  }
};

const decompressShareData = (compressed) => {
  if (!compressed) return null;
  try {
    const json = LZString.decompressFromEncodedURIComponent(compressed);
    if (!json) return null;
    return JSON.parse(json);
  } catch (error) {
    console.error('Failed to decompress share data:', error);
    return null;
  }
};

const isDefaultCalendarName = (name) => {
  return /^Calendar \d+$/.test(name);
};

const getUniqueCalendarName = (baseName, existingCalendars, semester) => {
  const semesterKey = getSemesterKey(semester);
  const semesterCalendars = existingCalendars.filter(
    cal => getSemesterKey(cal.semester) === semesterKey
  );

  if (!semesterCalendars.some(cal => cal.name === baseName)) {
    return baseName;
  }

  let counter = 2;
  let candidate = `${baseName} ${counter}`;
  while (semesterCalendars.some(cal => cal.name === candidate)) {
    counter++;
    candidate = `${baseName} ${counter}`;
  }
  return candidate;
};

const migrateCalendars = (calendars = []) => {
  if (!Array.isArray(calendars) || calendars.length === 0) {
    return [];
  }

  const usedNames = new Map();
  const migrated = [];

  calendars.forEach((calendar) => {
    const fallbackSemester = normalizeSemester(calendar?.semester);
    const courses = Array.isArray(calendar?.courses) ? calendar.courses : [];
    const hidden = (calendar && typeof calendar.hiddenCourses === 'object' && calendar.hiddenCourses) ? calendar.hiddenCourses : {};

    const normalizedBaseName = stripSemesterSuffix(calendar?.name || DEFAULT_CALENDAR_PREFIX);

    const groupedCourses = courses.reduce((acc, course) => {
      const term = detectCourseSemester(course, fallbackSemester);
      if (!acc[term]) {
        acc[term] = [];
      }
      acc[term].push(course);
      return acc;
    }, {});

    const groupKeys = Object.keys(groupedCourses);

    const buildHiddenForCourses = (courseList) => {
      if (!courseList || courseList.length === 0) return {};
      return courseList.reduce((acc, currentCourse) => {
        if (currentCourse && hidden[currentCourse.course_id]) {
          acc[currentCourse.course_id] = hidden[currentCourse.course_id];
        }
        return acc;
      }, {});
    };

    if (groupKeys.length <= 1) {
      const term = groupKeys[0] || fallbackSemester;
      const coursesForTerm = groupedCourses[term] || [];
      const name = ensureUniqueName(normalizedBaseName || DEFAULT_CALENDAR_PREFIX, usedNames, term);
      migrated.push({
        ...calendar,
        id: calendar?.id || generateCalendarId(),
        name,
        semester: term,
        courses: coursesForTerm,
        hiddenCourses: coursesForTerm.length ? buildHiddenForCourses(coursesForTerm) : {}
      });
      return;
    }

    groupKeys.forEach((term, index) => {
      const termCourses = groupedCourses[term];
      const desiredName = normalizedBaseName || DEFAULT_CALENDAR_PREFIX;
      const name = ensureUniqueName(desiredName, usedNames, term);

      migrated.push({
        ...calendar,
        id: index === 0 && calendar?.id ? calendar.id : generateCalendarId(),
        name,
        semester: term,
        courses: termCourses,
        hiddenCourses: buildHiddenForCourses(termCourses)
      });
    });
  });

  return migrated;
};

// Create context
export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [coursesData, setCoursesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Initialize multiple calendars support
  const [userCalendars, setUserCalendars] = useState(() => {
    const savedCalendars = localStorage.getItem('userCalendars');
    if (savedCalendars) {
      try {
        const parsedCalendars = JSON.parse(savedCalendars);
        const migratedCalendars = migrateCalendars(parsedCalendars);

        if (migratedCalendars.length) {
          localStorage.setItem('userCalendars', JSON.stringify(migratedCalendars));
          return migratedCalendars;
        }
      } catch (error) {
        console.error('Failed to parse saved calendars, recreating defaults', error);
      }
    }

    // Migrate from old myCourses format if it exists
    const savedCourses = localStorage.getItem('myCourses');
    const savedHiddenCourses = localStorage.getItem('hiddenCourses');
    const courses = savedCourses ? JSON.parse(savedCourses) : [];
    const hidden = savedHiddenCourses ? JSON.parse(savedHiddenCourses) : {};

    // Create initial calendar with migrated data
    return [{
      id: generateCalendarId(),
      name: 'Calendar 1',
      semester: DEFAULT_SEMESTER,
      courses: courses,
      hiddenCourses: hidden
    }];
  });

  const [activeCalendarId, setActiveCalendarId] = useState(() => {
    return userCalendars[0]?.id || null;
  });
  const activeCalendarIdRef = useRef(activeCalendarId);

  useEffect(() => {
    activeCalendarIdRef.current = activeCalendarId;
  }, [activeCalendarId]);

  // Get active calendar
  const activeCalendar = useMemo(() => {
    return userCalendars.find(cal => cal.id === activeCalendarId) || userCalendars[0];
  }, [userCalendars, activeCalendarId]);

  // Load saved courses from localStorage or use empty array if nothing is saved
  const [myCourses, setMyCourses] = useState(() => {
    return activeCalendar?.courses || [];
  });

  const [selectedSemester, setSelectedSemester] = useState(() => {
    return activeCalendar?.semester || DEFAULT_SEMESTER;
  });

  const [filters, setFilters] = useState({
    categories: [],
    search: '',
    days: [],
    schools: ['Faculty of Arts & Sciences'], // FAS preselected by default
    timePresets: [], // array of 'morning', 'afternoon', 'evening'
    customStartTime: null, // e.g., '9:00am'
    customEndTime: null, // e.g., '5:00pm'
    formats: [], // course formats/components
    consents: [], // consent requirements
    courseCodePrefixes: [], // e.g., ['ECON', 'CS'] to filter multiple course prefixes
    meetsOnceAWeek: false // filter for courses that meet once a week
  });

  // State for "Fits schedule" checkbox
  const [fitsScheduleEnabled, setFitsScheduleEnabled] = useState(false);
  
  // Debounce search term for better performance
  const debouncedSearch = useDebounce(filters.search, 300);

  // Load hidden courses from active calendar
  const [hiddenCourses, setHiddenCourses] = useState(() => {
    return activeCalendar?.hiddenCourses || {};
  });

  // Save userCalendars to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('userCalendars', JSON.stringify(userCalendars));
  }, [userCalendars]);

  // Update active calendar when myCourses or hiddenCourses change
  useEffect(() => {
    const currentCalendarId = activeCalendarIdRef.current;
    if (!currentCalendarId) return;

    setUserCalendars(prevCalendars => (
      prevCalendars.map(cal => (
        cal.id === currentCalendarId
          ? {
              ...cal,
              courses: myCourses,
              hiddenCourses: hiddenCourses
            }
          : cal
      ))
    ));
  }, [myCourses, hiddenCourses]);

  // Load active calendar's data when calendar changes
  useEffect(() => {
    const calendar = userCalendars.find(cal => cal.id === activeCalendarId);
    if (calendar) {
      setMyCourses(calendar.courses || []);
      setHiddenCourses(calendar.hiddenCourses || {});
      setSelectedSemester(calendar.semester || DEFAULT_SEMESTER);
    }
  }, [activeCalendarId]);
  
  // Normalize course code (make consistent format and normalize spaces)
  const normalizeCode = (code) => {
    if (!code) return null;
    // Return uppercase version with normalized spacing (multiple spaces become single space)
    return code.toUpperCase().replace(/\s+/g, ' ').trim();
  };
  
  // Load JSON data with progressive loading
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Use requestIdleCallback for non-blocking load if available
        const processData = (data) => {
          if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
              setCoursesData(data);
              setIsLoading(false);
            }, { timeout: 1000 });
          } else {
            // Fallback for browsers without requestIdleCallback
            setTimeout(() => {
              setCoursesData(data);
              setIsLoading(false);
            }, 0);
          }
        };

        // Try to load semester-specific file first, then fall back to default
        let dataFile = '/data/master_courses.json'; // default
        let response;

        if (selectedSemester === 'Fall 2025') {
          // Try Fall 2025 specific file first
          try {
            response = await fetch('/data/master_courses_fall2025.json');
            if (response.ok) {
              dataFile = '/data/master_courses_fall2025.json';
            } else {
              throw new Error('Fall 2025 file not found');
            }
          } catch {
            // Fall back to default file
            console.log('Fall 2025 specific file not found, using default');
            response = await fetch('/data/master_courses.json');
          }
        } else if (selectedSemester === 'Spring 2026') {
          // Try Spring 2026 specific file first
          try {
            response = await fetch('/data/master_courses_spring2026.json');
            if (response.ok) {
              dataFile = '/data/master_courses_spring2026.json';
            } else {
              throw new Error('Spring 2026 file not found');
            }
          } catch {
            // Fall back to default file but we'll filter for Spring 2026 in processing
            console.log('Spring 2026 specific file not found, using default and filtering');
            response = await fetch('/data/master_courses.json');
          }
        } else {
          // Default case
          response = await fetch('/data/master_courses.json');
        }

        const data = await response.json();

        processData(data);
      } catch (error) {
        console.error("Error loading data:", error);
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedSemester]); // Reload when semester changes
  
  // Helper to convert time string to minutes for comparison
  const timeStringToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    
    let hour = 0;
    let minute = 0;
    
    if (timeStr.includes('am') || timeStr.includes('pm')) {
      const timeParts = timeStr.match(/(\d+):?(\d+)?([ap]m)/);
      if (timeParts) {
        hour = parseInt(timeParts[1]);
        minute = timeParts[2] ? parseInt(timeParts[2]) : 0;
        if (timeParts[3] === 'pm' && hour < 12) hour += 12;
        if (timeParts[3] === 'am' && hour === 12) hour = 0;
      }
    } else {
      // Try to parse HH:MM format
      const timeParts = timeStr.match(/(\d+):(\d+)/);
      if (timeParts) {
        hour = parseInt(timeParts[1]);
        minute = parseInt(timeParts[2]);
      }
    }
    
    return hour * 60 + minute;
  };

  // Parse weekdays string into day mapping
  const parseWeekdays = (weekdaysStr) => {
    if (!weekdaysStr) return null;

    const daysMap = {
      // Abbreviated forms
      'Mon': 'monday',
      'Tue': 'tuesday',
      'Wed': 'wednesday',
      'Thu': 'thursday',
      'Fri': 'friday',
      'Sat': 'saturday',
      'Sun': 'sunday',
      // Full forms
      'Monday': 'monday',
      'Tuesday': 'tuesday',
      'Wednesday': 'wednesday',
      'Thursday': 'thursday',
      'Friday': 'friday',
      'Saturday': 'saturday',
      'Sunday': 'sunday'
    };

    const dayMap = {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false
    };

    // Split by spaces or commas
    const days = weekdaysStr.split(/[\s,]+/).filter(d => d); // Filter out empty strings
    days.forEach(day => {
      const normalizedDay = daysMap[day];
      if (normalizedDay) {
        dayMap[normalizedDay] = true;
      }
    });

    return dayMap;
  };
  
  // Process courses - group sections under each course
  const processedCourses = useMemo(() => {
    if (isLoading || !coursesData.length) return [];

    // Pre-allocate array for better performance
    const processedList = new Array(coursesData.length);
    let index = 0;

    coursesData.forEach(course => {
      // Skip if not matching selected semester
      // Check both current_term and year_term fields
      const termToCheck = course.current_term || course.year_term || '';
      if (selectedSemester === 'Spring 2026') {
        // For Spring 2026, check if term contains "Spring" and "2026" (format: "2026 Spring")
        if (!termToCheck.includes('Spring') || !termToCheck.includes('2026')) {
          return;
        }
      } else if (selectedSemester === 'Fall 2025') {
        // For Fall 2025, check if term contains "Fall" and "2025" (format: "2025 Fall")
        if (!termToCheck.includes('Fall') || !termToCheck.includes('2025')) {
          return;
        }
      } else if (termToCheck && !termToCheck.includes('2025')) {
        // If a term is selected but doesn't match any known pattern, skip
        return;
      }
      
      // Process sections for this course
      const sections = (course.current_sections || []).map(section => {
        // Parse day mapping from section's lecture_* fields
        let dayMap = {
          monday: section.lecture_monday === true,
          tuesday: section.lecture_tuesday === true,
          wednesday: section.lecture_wednesday === true,
          thursday: section.lecture_thursday === true,
          friday: section.lecture_friday === true,
          saturday: section.lecture_saturday === true,
          sunday: section.lecture_sunday === true
        };
        
        // If no days are set via the lecture_* fields but a weekdays string is provided, use that
        if (!Object.values(dayMap).some(Boolean) && section.weekdays) {
          const parsedDayMap = parseWeekdays(section.weekdays);
          if (parsedDayMap) {
            dayMap = parsedDayMap;
          }
        }
        
        // Extract capacity from the enrollment field (e.g. "0/99")
        let capacity = 'n/a';
        let enrolled = 'n/a';
        if (section.enrollment && typeof section.enrollment === 'string' && section.enrollment.includes('/')) {
          const parts = section.enrollment.split('/');
          enrolled = parts[0];
          capacity = parts[1];
          if (capacity === '9999') capacity = 'n/a';
        }
        
        return {
          section: section.section || 'default',
          instructors: section.instructors || 'TBA',
          class_number: section.class_number || '',
          enrollment: section.enrollment || '',
          enrolled: enrolled,
          capacity: capacity,
          instruction_mode: section.instruction_mode || '',
          course_component: section.course_component || '',
          grading_basis: section.grading_basis || '',
          start_time: section.start_time || '',
          end_time: section.end_time || '',
          weekdays: section.weekdays || '',
          location: section.location || '',
          dayMap,
          lecture_monday: section.lecture_monday,
          lecture_tuesday: section.lecture_tuesday,
          lecture_wednesday: section.lecture_wednesday,
          lecture_thursday: section.lecture_thursday,
          lecture_friday: section.lecture_friday,
          lecture_saturday: section.lecture_saturday,
          lecture_sunday: section.lecture_sunday
        };
      });
      
      // Get the first section's data for default values (used if no section is selected)
      const firstSection = sections[0] || {};
      
      // Use first section's day map as default (not aggregate)
      const defaultDayMap = firstSection.dayMap || {
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false
      };
      
      // Create a URL-friendly unique identifier
      const urlId = `${course.course_code || ''}-${course.course_id || ''}`.toLowerCase();
      
      // Create Q guide URL if we have historical data
      let evalURL = null;
      if (course.historical_semesters && Object.keys(course.historical_semesters).length > 0) {
        evalURL = `https://qreports.fas.harvard.edu/course/${course.course_id}`;
      }
      
      // Pre-compute search strings for better performance
      const subjectCatalogLower = (course.course_code || '').toLowerCase();
      const courseTitleLower = (course.course_title || '').toLowerCase();
      
      processedList[index++] = {
        // Course-level data from JSON
        course_id: course.course_id,
        subject_catalog: course.course_code || '',
        course_title: course.course_title || '',
        // Pre-computed lowercase for search
        subject_catalog_lower: subjectCatalogLower,
        course_title_lower: courseTitleLower,
        description: course.description || '',
        notes: course.notes || '',
        school: course.school || '',
        department: course.department || '',
        credits: course.credits || 'n/a',
        units: course.credits || 4, // Default to 4 if not specified
        course_requirements: course.course_requirements || '',
        consent: course.consent || 'No Consent',
        general_education: course.general_education || '',
        divisional_distribution: course.divisional_distribution || '',
        quantitative_reasoning: course.quantitative_reasoning || '',
        course_level: course.course_level || '',
        exam: course.exam || '',
        course_website: course.course_website || '',

        // All sections for this course
        sections: sections,
        
        // Default section data (from first section, for backward compatibility)
        instructors: sections.map(s => s.instructors).filter((v, i, a) => a.indexOf(v) === i).join(', ') || 'TBA',
        instructors_lower: (sections.map(s => s.instructors).filter((v, i, a) => a.indexOf(v) === i).join(', ') || 'TBA').toLowerCase(),
        class_number: firstSection.class_number || '',
        enrollment: firstSection.enrollment || '',
        enrolled: firstSection.enrolled || 'n/a',
        capacity: firstSection.capacity || 'n/a',
        instruction_mode: firstSection.instruction_mode || '',
        course_component: firstSection.course_component || '',
        grading_basis: firstSection.grading_basis || '',
        start_time: firstSection.start_time || '',
        end_time: firstSection.end_time || '',
        weekdays: firstSection.weekdays || '',
        start_date: course.start_date || '',
        end_date: course.end_date || '',

        // Analytics data (from Q guides)
        rating: course.latest_course_rating || null,
        hours: course.latest_hours_per_week || null,
        latest_num_students: course.latest_num_students || null,
        latest_semester_with_data: course.latest_semester_with_data || 'N/A',
        
        // Historical data
        historical_semesters: course.historical_semesters || {},
        all_historical_codes: course.all_historical_codes || [],
        all_historical_titles: course.all_historical_titles || [],
        
        // UI-specific fields
        displayName: `${course.course_code || ''} ${course.course_title || ''}`.trim(),
        dayMap: defaultDayMap,
        urlId,
        evalURL,
        
        // Keep year_term for filtering
        year_term: course.current_term || '',
        
        // For backward compatibility with existing components
        lecture_monday: defaultDayMap.monday,
        lecture_tuesday: defaultDayMap.tuesday,
        lecture_wednesday: defaultDayMap.wednesday,
        lecture_thursday: defaultDayMap.thursday,
        lecture_friday: defaultDayMap.friday,
        lecture_saturday: defaultDayMap.saturday,
        lecture_sunday: defaultDayMap.sunday
      };
    });
    
    // Remove any empty slots if courses were filtered by semester
    return processedList.slice(0, index);
  }, [coursesData, isLoading, selectedSemester]);

  // For backward compatibility, create courseInfo and courseEvals arrays
  const courseInfo = processedCourses;
  const courseEvals = useMemo(() => {
    // Create evaluation data from courses that have ratings
    return processedCourses.filter(course => course.rating !== null).map(course => ({
      course_code: course.subject_catalog,
      course_score_mean: course.rating,
      workload_score_mean: course.hours,
      link: course.evalURL
    }));
  }, [processedCourses]);

  // Memoize search string processing
  const processedSearchTerm = useMemo(() => {
    return debouncedSearch ? debouncedSearch.toLowerCase().replace(/\s+/g, ' ').trim() : '';
  }, [debouncedSearch]);

  // Filter courses based on search and category filters
  const filteredCourses = useMemo(() => {
    if (!processedCourses.length) return [];

    // Get courses for selected semester for conflict checking
    const myCoursesForSemester = myCourses.filter(course => {
      const termToCheck = course.current_term || course.year_term || '';
      if (selectedSemester === 'Spring 2026') {
        return termToCheck.includes('Spring') && termToCheck.includes('2026');
      } else if (selectedSemester === 'Fall 2025') {
        return termToCheck.includes('Fall') && termToCheck.includes('2025');
      }
      return true;
    });

    return processedCourses.filter(course => {
      // Filter by course code prefixes first (if active)
      if (filters.courseCodePrefixes && filters.courseCodePrefixes.length > 0) {
        const courseCodeUpper = (course.subject_catalog || '').toUpperCase();
        // Check if course code starts with ANY of the prefixes (OR logic)
        const matchesAnyPrefix = filters.courseCodePrefixes.some(prefix => {
          const prefixUpper = prefix.toUpperCase();
          // Check if course code starts with the prefix followed by a space or number
          return courseCodeUpper.startsWith(prefixUpper + ' ') || courseCodeUpper.startsWith(prefixUpper);
        });
        if (!matchesAnyPrefix) {
          return false;
        }
      }

      // Filter by search term - use pre-computed lowercase fields
      if (processedSearchTerm) {
        const searchLower = processedSearchTerm;

        const matchesSubjectCatalog = course.subject_catalog_lower &&
                                    course.subject_catalog_lower.includes(searchLower);
        const matchesTitle = course.course_title_lower &&
                            course.course_title_lower.includes(searchLower);
        const matchesInstructor = course.instructors_lower &&
                                course.instructors_lower.includes(searchLower);

        if (!(matchesSubjectCatalog || matchesTitle || matchesInstructor)) {
          return false;
        }
      }
      
      // Filter by selected days
      if (filters.days && filters.days.length > 0) {
        // Course should ONLY meet on the selected days (no additional days)
        // First check if course meets on any non-selected days
        const meetsOnNonSelectedDays = Object.entries(course.dayMap || {})
          .some(([day, meets]) => {
            // If course meets on this day AND it's not in our selected days, exclude it
            return meets === true && !filters.days.includes(day);
          });
        
        if (meetsOnNonSelectedDays) {
          return false;
        }
        
        // Also need to ensure course meets on at least one selected day
        const meetsOnSelectedDays = filters.days.some(day => {
          return course.dayMap && course.dayMap[day] === true;
        });
        
        if (!meetsOnSelectedDays) {
          return false;
        }
      }

      // Filter by selected schools (if none selected, show all schools)
      if (filters.schools && filters.schools.length > 0) {
        if (!course.school || !filters.schools.includes(course.school)) {
          return false;
        }
      }
      // If no schools are selected, don't filter by school (show all)

      // Filter by time
      if ((filters.timePresets && filters.timePresets.length > 0) || filters.customStartTime || filters.customEndTime) {
        // Skip courses without time info
        if (!course.start_time || !course.end_time) {
          return false;
        }
        
        const courseStartMinutes = timeStringToMinutes(course.start_time);
        const courseEndMinutes = timeStringToMinutes(course.end_time);
        
        // Apply preset filters (union - course matches if it's in ANY selected preset)
        if (filters.timePresets && filters.timePresets.length > 0) {
          const matchesAnyPreset = filters.timePresets.some(preset => {
            let presetStart, presetEnd;
            switch (preset) {
              case 'morning':
                presetStart = 9 * 60; // 9:00am
                presetEnd = 12 * 60; // 12:00pm
                break;
              case 'afternoon':
                presetStart = 12 * 60; // 12:00pm
                presetEnd = 17 * 60; // 5:00pm
                break;
              case 'evening':
                presetStart = 17 * 60; // 5:00pm
                presetEnd = 21 * 60; // 9:00pm
                break;
              default:
                return false;
            }
            
            // Check if course starts within this preset range
            return courseStartMinutes >= presetStart && courseStartMinutes < presetEnd;
          });
          
          if (!matchesAnyPreset) {
            return false;
          }
        }

        // Apply custom time filters
        if (filters.customStartTime) {
          const customStartMinutes = timeStringToMinutes(filters.customStartTime);
          if (courseStartMinutes < customStartMinutes) {
            return false;
          }
        }
        
        if (filters.customEndTime) {
          const customEndMinutes = timeStringToMinutes(filters.customEndTime);
          if (courseEndMinutes > customEndMinutes) {
            return false;
          }
        }
      }

      // Filter by selected categories, if any
      if (filters.categories && filters.categories.length > 0) {
        const categoryMatch = filters.categories.some(categoryId => {
          switch(categoryId) {
            case 'arts':
              return course.divisional_distribution &&
                    course.divisional_distribution.includes('Arts and Humanities');
            case 'social':
              return course.divisional_distribution &&
                    course.divisional_distribution.includes('Social Sciences');
            case 'science-engineering':
              return course.divisional_distribution &&
                    course.divisional_distribution.includes('Science & Engineering & Applied Science');
            case 'aesthetics':
              return course.general_education &&
                    course.general_education.includes('Aesthetics and Culture');
            case 'ethics':
              return course.general_education &&
                    course.general_education.includes('Ethics and Civics');
            case 'histories':
              return course.general_education &&
                    course.general_education.includes('Histories, Societies, Individuals');
            case 'science-society':
              return course.general_education &&
                    course.general_education.includes('Science and Technology in Society');
            default:
              return false;
          }
        });
        if (!categoryMatch) return false;
      }

      // Filter by format (course component)
      if (filters.formats && filters.formats.length > 0) {
        if (!course.course_component || !filters.formats.includes(course.course_component)) {
          return false;
        }
      }

      // Filter by consent requirement
      if (filters.consents && filters.consents.length > 0) {
        if (!course.consent || !filters.consents.includes(course.consent)) {
          return false;
        }
      }

      // Filter by "meets once a week"
      if (filters.meetsOnceAWeek) {
        const dayCount = Object.values(course.dayMap || {}).filter(meets => meets === true).length;
        if (dayCount !== 1) {
          return false;
        }
      }

      // Filter by schedule conflicts if "Fits schedule" is enabled
      if (fitsScheduleEnabled) {
        // Get courses that are both added and visible (not hidden) for this semester
        const visibleSelectedCourses = myCoursesForSemester.filter(myCourse => !hiddenCourses[myCourse.course_id]);

        // Skip if no courses are selected
        if (visibleSelectedCourses.length === 0) {
          return true; // No courses to conflict with
        }

        // Don't filter out courses that are already selected
        if (myCoursesForSemester.some(myCourse => myCourse.course_id === course.course_id)) {
          return true; // Always show courses that are already in the user's calendar
        }

        // Check if this course conflicts with visible selected courses
        // A course conflicts ONLY if ALL its sections conflict
        const courseSections = course.sections?.length > 0 ? course.sections : [course];

        const allSectionsConflict = courseSections.every(courseSection => {
          const sectionStartTime = courseSection.start_time || course.start_time;
          const sectionEndTime = courseSection.end_time || course.end_time;
          let sectionDayMap = courseSection.dayMap || course.dayMap;

          // Sections without time info don't conflict
          if (!sectionStartTime || !sectionEndTime || !sectionDayMap) {
            return false; // This section fits, so not all sections conflict
          }

          // Check if this section conflicts with ANY visible selected course
          return visibleSelectedCourses.some(selectedCourse => {
            const selectedSection = selectedCourse.selectedSection || {};
            const selectedStartTime = selectedSection.start_time || selectedCourse.start_time;
            const selectedEndTime = selectedSection.end_time || selectedCourse.end_time;

            // Parse dayMap for selected course
            let selectedDayMap = selectedSection.dayMap || selectedCourse.dayMap;
            if (!selectedDayMap && selectedCourse.weekdays) {
              selectedDayMap = parseWeekdays(selectedCourse.weekdays);
            }
            if (!selectedDayMap) {
              selectedDayMap = {
                monday: selectedCourse.lecture_monday === true,
                tuesday: selectedCourse.lecture_tuesday === true,
                wednesday: selectedCourse.lecture_wednesday === true,
                thursday: selectedCourse.lecture_thursday === true,
                friday: selectedCourse.lecture_friday === true,
                saturday: selectedCourse.lecture_saturday === true,
                sunday: selectedCourse.lecture_sunday === true
              };
            }

            // Skip if selected course lacks time/day info
            if (!selectedStartTime || !selectedEndTime || !selectedDayMap) {
              return false;
            }

            // Check if they meet on any common day
            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
            const hasCommonDay = days.some(day =>
              selectedDayMap[day] === true && sectionDayMap[day] === true
            );

            if (!hasCommonDay) {
              return false;
            }

            // Check for time overlap
            const selectedStartMinutes = timeStringToMinutes(selectedStartTime);
            const selectedEndMinutes = timeStringToMinutes(selectedEndTime);
            const sectionStartMinutes = timeStringToMinutes(sectionStartTime);
            const sectionEndMinutes = timeStringToMinutes(sectionEndTime);

            return Math.max(selectedStartMinutes, sectionStartMinutes) < Math.min(selectedEndMinutes, sectionEndMinutes);
          });
        });

        if (allSectionsConflict) {
          return false;
        }
      }

      return true;
    });
  }, [processedCourses, filters.categories, filters.timePresets, filters.customStartTime, filters.customEndTime, filters.days, filters.schools, filters.formats, filters.consents, filters.courseCodePrefixes, filters.meetsOnceAWeek, processedSearchTerm, fitsScheduleEnabled, myCourses, hiddenCourses, selectedSemester]);

  // Add a course to My Courses with optional section selection
  const addCourse = (course, selectedSection = null) => {
    // Store the course with selected section info
    const courseToAdd = {
      ...course,
      selectedSection: selectedSection
    };
    
    if (!myCourses.some(c => c.course_id === course.course_id)) {
      setMyCourses([...myCourses, courseToAdd]);
    }
  };

  // Remove a course from My Courses
  const removeCourse = (courseId) => {
    setMyCourses(myCourses.filter(c => c.course_id !== courseId));
  };

  // Update selected section for a course
  const updateCourseSection = (courseId, selectedSection) => {
    setMyCourses(prevCourses => prevCourses.map(course =>
      course.course_id === courseId
        ? { ...course, selectedSection: { ...selectedSection } }
        : course
    ));
  };

  // Filter myCourses to only show courses for the selected semester
  const myCoursesForSelectedSemester = useMemo(() => {
    return myCourses.filter(course => {
      const termToCheck = course.current_term || course.year_term || '';

      if (selectedSemester === 'Spring 2026') {
        return termToCheck.includes('Spring') && termToCheck.includes('2026');
      } else if (selectedSemester === 'Fall 2025') {
        return termToCheck.includes('Fall') && termToCheck.includes('2025');
      }

      // Default to showing courses if no clear term match
      return true;
    });
  }, [myCourses, selectedSemester]);

  // Get total hours for selected courses (filtered by semester)
  const totalHours = useMemo(() => {
    if (!myCoursesForSelectedSemester.length) return 0;

    // Filter out hidden courses before calculating total
    const visibleCourses = myCoursesForSelectedSemester.filter(course => !hiddenCourses[course.course_id]);

    const sum = visibleCourses.reduce((total, course) => {
      const courseHours = course.hours || 0;
      return total + courseHours;
    }, 0);

    return Math.round(sum * 10) / 10; // Rounded to one decimal place
  }, [myCoursesForSelectedSemester, hiddenCourses]);

  // Get total units for selected courses (filtered by semester)
  const totalUnits = useMemo(() => {
    if (!myCoursesForSelectedSemester.length) return 0;

    // Filter out hidden courses before calculating total
    const visibleCourses = myCoursesForSelectedSemester.filter(course => !hiddenCourses[course.course_id]);

    return visibleCourses.reduce((total, course) => {
      const courseUnits = typeof course.units === 'number' ? course.units : 4;
      return total + courseUnits;
    }, 0);
  }, [myCoursesForSelectedSemester, hiddenCourses]);

  // Generate a shareable URL for the selected courses
  const generateShareableURL = () => {
    if (!myCoursesForSelectedSemester.length) return window.location.origin;
    const courseIds = myCoursesForSelectedSemester.map(course => course.urlId).join(',');
    return `${window.location.origin}?courses=${courseIds}`;
  };

  // Clear all selected courses
  const clearAllCourses = () => {
    setMyCourses([]);
  };

  // Toggle course visibility
  const toggleCourseVisibility = (courseId) => {
    setHiddenCourses(prev => ({
      ...prev,
      [courseId]: !prev[courseId]
    }));
  };


  // Switch to a different calendar
  const switchCalendar = (calendarId) => {
    setActiveCalendarId(calendarId);
  };

  // Create a new calendar
  const createNewCalendar = (name, semesterOverride) => {
    const calendarSemester = normalizeSemester(semesterOverride || selectedSemester);
    const sanitizedName = name?.trim();
    const assignedName = sanitizedName && sanitizedName.length
      ? sanitizedName
      : getDefaultCalendarName(userCalendars, calendarSemester);
    const newCalendar = {
      id: generateCalendarId(),
      name: assignedName,
      semester: calendarSemester,
      courses: [],
      hiddenCourses: {}
    };

    setUserCalendars(prevCalendars => [...prevCalendars, newCalendar]);
    setActiveCalendarId(newCalendar.id);

    return newCalendar;
  };

  const changeSemester = (semester) => {
    const targetSemester = normalizeSemester(semester);

    if (activeCalendar?.semester === targetSemester) {
      return;
    }

    const matchingCalendar = userCalendars.find(cal => cal.semester === targetSemester);

    if (matchingCalendar) {
      setActiveCalendarId(matchingCalendar.id);
      setSelectedSemester(targetSemester);
      return;
    }

    createNewCalendar(undefined, targetSemester);
    setSelectedSemester(targetSemester);
  };

  // Delete a calendar
  const deleteCalendar = (calendarId) => {
    // Don't delete if it's the only calendar
    if (userCalendars.length <= 1) return;

    setUserCalendars(prevCalendars => {
      const filtered = prevCalendars.filter(cal => cal.id !== calendarId);
      // If we deleted the active calendar, switch to the first one
      if (calendarId === activeCalendarId && filtered.length > 0) {
        setActiveCalendarId(filtered[0].id);
      }
      return filtered;
    });
  };

  // Rename a calendar
  const renameCalendar = (calendarId, newName) => {
    setUserCalendars(prevCalendars => {
      return prevCalendars.map(cal => {
        if (cal.id === calendarId) {
          return { ...cal, name: newName };
        }
        return cal;
      });
    });
  };

  // Duplicate a calendar
  const duplicateCalendar = (calendarId) => {
    const calendarToDuplicate = userCalendars.find(cal => cal.id === calendarId);
    if (!calendarToDuplicate) return;

    // Find the next available number for the duplicated calendar name
    const baseName = calendarToDuplicate.name.replace(/ \(copy\)| \(copy \d+\)$/, '');
    let copyNumber = 1;
    let newName = `${baseName} (copy)`;
    const semesterKey = getSemesterKey(calendarToDuplicate.semester);
    const semesterCalendars = userCalendars.filter(cal => getSemesterKey(cal.semester) === semesterKey);

    // Check if name exists and increment copy number if needed
    const nameExists = (candidate) => semesterCalendars.some(cal => cal.name === candidate);

    while (nameExists(newName)) {
      copyNumber++;
      newName = `${baseName} (copy ${copyNumber})`;
    }

    const duplicatedCalendar = {
      ...calendarToDuplicate,
      id: generateCalendarId(),
      name: newName,
      courses: [...(calendarToDuplicate.courses || [])],
      hiddenCourses: { ...(calendarToDuplicate.hiddenCourses || {}) }
    };

    setUserCalendars(prevCalendars => [...prevCalendars, duplicatedCalendar]);
    setActiveCalendarId(duplicatedCalendar.id);

    return duplicatedCalendar;
  };

  // Generate share URL for the active calendar
  const generateCalendarShareURL = useCallback(() => {
    if (!activeCalendar || !activeCalendar.courses || activeCalendar.courses.length === 0) {
      return null;
    }

    const shareData = generateShareData(activeCalendar);
    if (!shareData) return null;

    const compressed = compressShareData(shareData);
    if (!compressed) return null;

    return `${window.location.origin}?cal=${compressed}`;
  }, [activeCalendar]);

  // Check if a share hash already exists
  const findCalendarBySourceHash = useCallback((sourceHash) => {
    if (!sourceHash) return null;
    return userCalendars.find(cal => cal.sourceHash === sourceHash);
  }, [userCalendars]);

  // Import a shared calendar from URL data
  const importSharedCalendar = useCallback((compressed, availableCourses) => {
    const shareData = decompressShareData(compressed);
    if (!shareData || !shareData.c || shareData.c.length === 0) {
      return { success: false, error: 'invalid' };
    }

    // Check for duplicate import
    const existingCalendar = findCalendarBySourceHash(compressed);
    if (existingCalendar) {
      return { success: false, error: 'duplicate', calendar: existingCalendar };
    }

    // Validate courses exist in available data
    const courseMap = new Map(availableCourses.map(c => [c.course_id, c]));
    const validCourses = [];
    const missingCourses = [];

    shareData.c.forEach(sharedCourse => {
      const fullCourse = courseMap.get(sharedCourse.id);
      if (fullCourse) {
        // Find the matching section if specified
        let selectedSection = null;
        if (sharedCourse.sec && fullCourse.sections) {
          selectedSection = fullCourse.sections.find(s => s.section === sharedCourse.sec) || null;
        }
        validCourses.push({
          ...fullCourse,
          selectedSection,
          _hiddenOnImport: sharedCourse.h
        });
      } else {
        missingCourses.push(sharedCourse.id);
      }
    });

    if (validCourses.length === 0) {
      return { success: false, error: 'no_valid_courses', missingCourses };
    }

    // Build hidden courses map
    const hiddenCoursesMap = {};
    validCourses.forEach(course => {
      if (course._hiddenOnImport) {
        hiddenCoursesMap[course.course_id] = true;
      }
      delete course._hiddenOnImport;
    });

    // Generate unique name
    // If sharer used a default name like "Calendar 1", use next available number instead
    const sharedName = shareData.n || 'Shared Calendar';
    const baseName = isDefaultCalendarName(sharedName)
      ? getDefaultCalendarName(userCalendars, shareData.s)
      : sharedName;
    const uniqueName = getUniqueCalendarName(baseName, userCalendars, shareData.s);

    // Create new calendar
    const newCalendar = {
      id: generateCalendarId(),
      name: uniqueName,
      semester: normalizeSemester(shareData.s),
      courses: validCourses,
      hiddenCourses: hiddenCoursesMap,
      sourceHash: compressed
    };

    setUserCalendars(prevCalendars => [...prevCalendars, newCalendar]);
    setActiveCalendarId(newCalendar.id);
    setSelectedSemester(newCalendar.semester);

    return {
      success: true,
      calendar: newCalendar,
      missingCourses: missingCourses.length > 0 ? missingCourses : null
    };
  }, [userCalendars, findCalendarBySourceHash]);

  // Parse share URL parameter
  const parseShareURLParam = useCallback(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('cal');
  }, []);

  // Clean share URL parameter from address bar
  const cleanShareURLParam = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete('cal');
    window.history.replaceState({}, '', url.toString());
  }, []);

  return (
    <AppContext.Provider value={{
      courseEvals,
      courseInfo,
      coursesData,
      isLoading,
      processedCourses,
      filteredCourses,
      selectedCourse,
      setSelectedCourse,
      myCourses: myCoursesForSelectedSemester, // Export filtered courses
      allMyCourses: myCourses, // Keep original for internal use
      addCourse,
      removeCourse,
      updateCourseSection,
      hiddenCourses,
      toggleCourseVisibility,
      filters,
      setFilters,
      selectedSemester,
      changeSemester,
      totalHours,
      totalUnits,
      generateShareableURL,
      clearAllCourses,
      // Schedule conflict filtering
      fitsScheduleEnabled,
      setFitsScheduleEnabled,
      // Calendar management
      userCalendars,
      activeCalendarId,
      activeCalendar,
      switchCalendar,
      createNewCalendar,
      deleteCalendar,
      renameCalendar,
      duplicateCalendar,
      // Share functionality
      generateCalendarShareURL,
      importSharedCalendar,
      findCalendarBySourceHash,
      parseShareURLParam,
      cleanShareURLParam
    }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook for using the context
export const useAppContext = () => React.useContext(AppContext);
