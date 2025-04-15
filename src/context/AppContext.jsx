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
  
  // Load CSV data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load course evaluation data
        const evalResponse = await fetch('/data/course_ratings.csv');
        const evalCsvData = await evalResponse.text();
        const evalResults = Papa.parse(evalCsvData, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          transformHeader: header => header.trim() // Trim whitespace from headers
        });
        
        // Load course info data
        const infoResponse = await fetch('/data/all_courses.csv');
        const infoCsvData = await infoResponse.text();
        const infoResults = Papa.parse(infoCsvData, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          transformHeader: header => header.trim() // Trim whitespace from headers
        });
        
        // Filter courses for selected semester
        const filteredCourses = infoResults.data.filter(course => {
          return course.year_term && course.year_term.includes(selectedSemester.split(' ')[0]);
        });
        
        setCourseEvals(evalResults.data);
        setCourseInfo(filteredCourses);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [selectedSemester]);
  
  // Normalize course code (remove spaces, make consistent format)
  const normalizeCode = (code) => {
    if (!code) return null;
    return code.replace(/\s+/g, '').toUpperCase();
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
        const searchLower = filters.search.toLowerCase();
        const matchesSubjectCatalog = course.subject_catalog && 
                                      course.subject_catalog.toLowerCase().includes(searchLower);
        const matchesTitle = course.course_title && 
                             course.course_title.toLowerCase().includes(searchLower);
        const matchesDescription = course.description && 
                                  course.description.toLowerCase().includes(searchLower);
        const matchesInstructor = course.instructors && 
                                  course.instructors.toLowerCase().includes(searchLower);
                                  
        if (!(matchesSubjectCatalog || matchesTitle || matchesDescription || matchesInstructor)) {
          return false;
        }
      }
      
      // Filter by selected categories, if any
      if (filters.categories && filters.categories.length > 0) {
        const categoryMatch = filters.categories.some(categoryId => {
          switch(categoryId) {
            case 'arts':
              return course.divisional_distribution === 'Arts and Humanities';
            case 'social':
              return course.divisional_distribution === 'Social Sciences';
            case 'science-engineering':
              return course.divisional_distribution === 'Science & Engineering & Applied Science';
            case 'aesthetics':
              return course.general_education === 'Aesthetics and Culture';
            case 'ethics':
              return course.general_education === 'Ethics and Civics';
            case 'histories':
              return course.general_education === 'Histories, Societies, Individuals';
            case 'science-society':
              return course.general_education === 'Science and Technology in Society';
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
    const sum = myCourses.reduce((total, course) => {
      const courseHours = course.hours || 4;
      return total + courseHours;
    }, 0);
    return Math.round(sum * 10) / 10; // Rounded to one decimal place
  }, [myCourses]);

  // Get total units for selected courses
  const totalUnits = useMemo(() => {
    if (!myCourses.length) return 0;
    return myCourses.reduce((total, course) => {
      const courseUnits = typeof course.units === 'number' ? course.units : 4;
      return total + courseUnits;
    }, 0);
  }, [myCourses]);

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