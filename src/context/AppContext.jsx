import React, { createContext, useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';

// Create context
export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [courseEvals, setCourseEvals] = useState([]);
  const [courseInfo, setCourseInfo] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  // Load saved courses from localStorage or use empty array if nothing is saved
  const [myCourses, setMyCourses] = useState(() => {
    const savedCourses = localStorage.getItem('myCourses');
    return savedCourses ? JSON.parse(savedCourses) : [];
  });
  const [selectedSemester, setSelectedSemester] = useState('Fall 2025');
  const [filters, setFilters] = useState({
    categories: [], 
    search: '',
  });
  // Load hidden courses from localStorage or use empty object if nothing is saved
  const [hiddenCourses, setHiddenCourses] = useState(() => {
    const savedHiddenCourses = localStorage.getItem('hiddenCourses');
    return savedHiddenCourses ? JSON.parse(savedHiddenCourses) : {};
  });
  
  // Save myCourses to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('myCourses', JSON.stringify(myCourses));
  }, [myCourses]);
  
  // Save hiddenCourses to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('hiddenCourses', JSON.stringify(hiddenCourses));
  }, [hiddenCourses]);
  
  // Normalize course code (make consistent format and normalize spaces)
  const normalizeCode = (code) => {
    if (!code) return null;
    // Return uppercase version with normalized spacing (multiple spaces become single space)
    return code.toUpperCase().replace(/\s+/g, ' ').trim();
  };
  
  // Load CSV data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load primary course evaluation data
        const evalResponse = await fetch('/data/course_ratings.csv');
        const evalCsvData = await evalResponse.text();
        const primaryEvalResults = Papa.parse(evalCsvData, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          transformHeader: header => header.trim()
        });
        
        // Load secondary course evaluation data
        const evalResponse2 = await fetch('/data/course_ratings_2.csv');
        const evalCsvData2 = await evalResponse2.text();
        const secondaryEvalResults = Papa.parse(evalCsvData2, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          transformHeader: header => header.trim()
        });
        
        // Load tertiary course evaluation data
        const evalResponse3 = await fetch('/data/course_ratings_3.csv');
        const evalCsvData3 = await evalResponse3.text();
        const tertiaryEvalResults = Papa.parse(evalCsvData3, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          transformHeader: header => header.trim()
        });
                
        // Merge evaluation data with priority
        const mergedEvals = mergeCourseEvals(
          primaryEvalResults.data, 
          secondaryEvalResults.data, 
          tertiaryEvalResults.data
        );
        
        // Load course info data
        const infoResponse = await fetch('/data/all_courses.csv');
        const infoCsvData = await infoResponse.text();
        const infoResults = Papa.parse(infoCsvData, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          transformHeader: header => header.trim()
        });
        
        // Filter courses for selected semester
        const filteredCourses = infoResults.data.filter(course => {
          return course.year_term && course.year_term.includes(selectedSemester.split(' ')[0]);
        });
        
        setCourseEvals(mergedEvals);
        setCourseInfo(filteredCourses);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [selectedSemester]);

  // Add a helper function to merge course evaluations with priority
  const mergeCourseEvals = (primary, secondary, tertiary) => {
    // Create a map using normalized course codes
    const evalMap = new Map();
    
    // Process in reverse priority order (tertiary -> secondary -> primary)
    // This way, newer data will overwrite older data for the same course
    
    // Add tertiary data (lowest priority)
    tertiary.forEach(evalData => {
      if (evalData && evalData.course_code) {
        const normalizedCode = normalizeCode(evalData.course_code);
        if (normalizedCode) {
          evalMap.set(normalizedCode, evalData);
        }
      }
    });
    
    // Add secondary data (medium priority)
    secondary.forEach(evalData => {
      if (evalData && evalData.course_code) {
        const normalizedCode = normalizeCode(evalData.course_code);
        if (normalizedCode) {
          evalMap.set(normalizedCode, evalData);
        }
      }
    });
    
    // Add primary data (highest priority)
    primary.forEach(evalData => {
      if (evalData && evalData.course_code) {
        const normalizedCode = normalizeCode(evalData.course_code);
        if (normalizedCode) {
          evalMap.set(normalizedCode, evalData);
        }
      }
    });
    
    // Convert map values back to array
    return Array.from(evalMap.values());
  };
  
  // Parse weekdays string into day mapping
  const parseWeekdays = (weekdaysStr) => {
    if (!weekdaysStr) return null;
    
    const daysMap = {
      'Mon': 'monday',
      'Tue': 'tuesday',
      'Wed': 'wednesday',
      'Thu': 'thursday',
      'Fri': 'friday',
      'Sat': 'saturday',
      'Sun': 'sunday'
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
    const days = weekdaysStr.split(/[\s,]+/);
    days.forEach(day => {
      const normalizedDay = daysMap[day];
      if (normalizedDay) {
        dayMap[normalizedDay] = true;
      }
    });
    
    return dayMap;
  };
  
  // Process and merge data
  const processedCourses = useMemo(() => {
    if (isLoading) return [];
    
    // Create a map of course codes to evaluation data
    const evalMap = {};
    courseEvals.forEach(evalData => {
      if (evalData && evalData.course_code) {
        const normalizedCode = normalizeCode(evalData.course_code);
        if (normalizedCode) {
          // If multiple evals exist for the same course, prefer the one with a higher course score mean
          if (!evalMap[normalizedCode] || 
              (evalData.course_score_mean && evalMap[normalizedCode].course_score_mean < evalData.course_score_mean)) {
            evalMap[normalizedCode] = evalData;
          }
        }
      }
    });
    
    // Merge course info with evaluation data
    return courseInfo.map(course => {
      // Generate normalized code for matching
      const normalizedCode = normalizeCode(course.subject_catalog);
      
      // Find matching evaluation data
      const evalData = normalizedCode ? evalMap[normalizedCode] : null;
      
      // Parse day mapping from lecture_* fields
      let dayMap = {
        monday: course.lecture_monday === "True",
        tuesday: course.lecture_tuesday === "True",
        wednesday: course.lecture_wednesday === "True",
        thursday: course.lecture_thursday === "True",
        friday: course.lecture_friday === "True",
        saturday: course.lecture_saturday === "True",
        sunday: course.lecture_sunday === "True"
      };
      
      // If no days are set via the lecture_* fields but a weekdays string is provided, use that
      if (!Object.values(dayMap).some(Boolean) && course.weekdays) {
        const parsedDayMap = parseWeekdays(course.weekdays);
        if (parsedDayMap) {
          dayMap = parsedDayMap;
        }
      }
      
      // Get hours from evaluation's workload score, defaulting if not available
      const hours = evalData ? evalData.workload_score_mean : null;
      
      // Get the course rating from evaluation data
      const rating = evalData ? evalData.course_score_mean : null;
      
      // Extract capacity from the enrolled field (e.g. "0/99")
      let capacity = 'n/a';
      if (course.enrolled && typeof course.enrolled === 'string' && course.enrolled.includes('/')) {
        capacity = course.enrolled.split('/')[1];
        if (capacity === '9999') capacity = 'n/a';
      }
      
      // Create a URL-friendly unique identifier
      const urlId = `${normalizedCode || ''}-${course.course_id || ''}`.toLowerCase();
      
      return {
        ...course,
        evalData,
        rating,
        hours,
        capacity,  // Added capacity field
        displayName: `${course.subject_catalog || ''} ${course.course_title || ''}`.trim(),
        dayMap,
        urlId,
        // Ensure consistent naming conventions for fields used in the UI
        subject_catalog: course.subject_catalog || '',
        course_title: course.course_title || '',
        description: course.description || '',
        notes: course.notes || '',
        units: course.units || 'n/a',
        consent: course.consent || 'No Consent',
        instructors: course.instructors || 'TBA',
        evalURL: evalData && evalData.link ? evalData.link : null,
      };
    });
  }, [courseEvals, courseInfo, isLoading]);

  // Filter courses based on search and category filters
  const filteredCourses = useMemo(() => {
    if (!processedCourses.length) return [];
    
    return processedCourses.filter(course => {
      // Filter by search term - search in multiple fields
      if (filters.search) {
        // Normalize spaces in search term
        const searchLower = filters.search.toLowerCase().replace(/\s+/g, ' ').trim();
        
        const matchesSubjectCatalog = course.subject_catalog && 
                                    course.subject_catalog.toLowerCase().replace(/\s+/g, ' ').trim().includes(searchLower);
        const matchesTitle = course.course_title && 
                            course.course_title.toLowerCase().replace(/\s+/g, ' ').trim().includes(searchLower);
        const matchesInstructor = course.instructors && 
                                course.instructors.toLowerCase().replace(/\s+/g, ' ').trim().includes(searchLower);
                                    
        if (!(matchesSubjectCatalog || matchesTitle || matchesInstructor)) {
          return false;
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
      
      return true;
    });
  }, [processedCourses, filters]);

  // Add a course to My Courses
  const addCourse = (course) => {
    if (!myCourses.some(c => c.course_id === course.course_id)) {
      setMyCourses([...myCourses, course]);
    }
  };

  // Remove a course from My Courses
  const removeCourse = (courseId) => {
    setMyCourses(myCourses.filter(c => c.course_id !== courseId));
  };

  // Get total hours for selected courses
  const totalHours = useMemo(() => {
    if (!myCourses.length) return 0;
    
    // Filter out hidden courses before calculating total
    const visibleCourses = myCourses.filter(course => !hiddenCourses[course.course_id]);
    
    const sum = visibleCourses.reduce((total, course) => {
      const courseHours = course.hours || 0;
      return total + courseHours;
    }, 0);
    
    return Math.round(sum * 10) / 10; // Rounded to one decimal place
  }, [myCourses, hiddenCourses]); // Added hiddenCourses to dependencies

  // Get total units for selected courses
  const totalUnits = useMemo(() => {
    if (!myCourses.length) return 0;
    
    // Filter out hidden courses before calculating total
    const visibleCourses = myCourses.filter(course => !hiddenCourses[course.course_id]);
    
    return visibleCourses.reduce((total, course) => {
      const courseUnits = typeof course.units === 'number' ? course.units : 4;
      return total + courseUnits;
    }, 0);
  }, [myCourses, hiddenCourses]); // Added hiddenCourses to dependencies

  // Generate a shareable URL for the selected courses
  const generateShareableURL = () => {
    if (!myCourses.length) return window.location.origin;
    const courseIds = myCourses.map(course => course.urlId).join(',');
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

  return (
    <AppContext.Provider value={{
      courseEvals,
      courseInfo,
      isLoading,
      processedCourses,
      filteredCourses,
      selectedCourse,
      setSelectedCourse,
      myCourses,
      addCourse,
      removeCourse,
      hiddenCourses,
      toggleCourseVisibility,  
      filters,
      setFilters,
      selectedSemester,
      setSelectedSemester,
      totalHours,
      totalUnits,
      generateShareableURL,
      clearAllCourses
    }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook for using the context
export const useAppContext = () => React.useContext(AppContext);