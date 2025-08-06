import React, { createContext, useState, useEffect, useMemo } from 'react';

// Create context
export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [coursesData, setCoursesData] = useState([]);
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
  
  // Load JSON data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load master courses JSON file
        const response = await fetch('/data/master_courses.json');
        const data = await response.json();
        
        setCoursesData(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
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
  
  // Process courses - group sections under each course
  const processedCourses = useMemo(() => {
    if (isLoading || !coursesData.length) return [];
    
    const processedList = [];
    
    coursesData.forEach(course => {
      // Skip if not matching selected semester
      if (course.current_term && !course.current_term.includes(selectedSemester.split(' ')[0])) {
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
      
      processedList.push({
        // Course-level data from JSON
        course_id: course.course_id,
        subject_catalog: course.course_code || '',
        course_title: course.course_title || '',
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
        
        // All sections for this course
        sections: sections,
        
        // Default section data (from first section, for backward compatibility)
        instructors: sections.map(s => s.instructors).filter((v, i, a) => a.indexOf(v) === i).join(', ') || 'TBA',
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
      });
    });
    
    return processedList;
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
  }, [myCourses, hiddenCourses]);

  // Get total units for selected courses
  const totalUnits = useMemo(() => {
    if (!myCourses.length) return 0;
    
    // Filter out hidden courses before calculating total
    const visibleCourses = myCourses.filter(course => !hiddenCourses[course.course_id]);
    
    return visibleCourses.reduce((total, course) => {
      const courseUnits = typeof course.units === 'number' ? course.units : 4;
      return total + courseUnits;
    }, 0);
  }, [myCourses, hiddenCourses]);

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
      coursesData,
      isLoading,
      processedCourses,
      filteredCourses,
      selectedCourse,
      setSelectedCourse,
      myCourses,
      addCourse,
      removeCourse,
      updateCourseSection,
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