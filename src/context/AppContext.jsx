import React, { createContext, useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';

// Create context
export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [courseEvals, setCourseEvals] = useState([]);
  const [courseInfo, setCourseInfo] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [myCourses, setMyCourses] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('Fall 2025');
  const [filters, setFilters] = useState({
    category: 'all',
    search: '',
  });
  
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
          dynamicTyping: true
        });
        
        // Load course info data
        const infoResponse = await fetch('/data/all_courses.csv');
        const infoCsvData = await infoResponse.text();
        const infoResults = Papa.parse(infoCsvData, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true
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
  
  // Process and merge data
  const processedCourses = useMemo(() => {
    if (isLoading) return [];
    
    // Create a map of course codes to evaluation data
    const evalMap = {};
    courseEvals.forEach(evalData => {  // Changed 'eval' to 'evalData'
      const courseCode = evalData.course_code;
      if (courseCode) {
        evalMap[courseCode] = evalData;
      }
    });
    
    // Merge course info with evaluation data
    return courseInfo.map(course => {
      const courseCode = course.subject_catalog ? course.subject_catalog.replace(/\s+/g, '') : null;
      const evalData = courseCode ? evalMap[courseCode] : null;
      
      return {
        ...course,
        evalData,
        rating: evalData ? evalData.course_score_mean : null,
        displayName: `${courseCode || ''} ${course.course_title || ''}`.trim(),
        dayMap: {
          monday: course.lecture_monday === "True",
          tuesday: course.lecture_tuesday === "True",
          wednesday: course.lecture_wednesday === "True",
          thursday: course.lecture_thursday === "True",
          friday: course.lecture_friday === "True",
        },
        startTime: course.start_time,
        endTime: course.end_time,
      };
    });
  }, [courseEvals, courseInfo, isLoading]);

  // Filter courses based on filters
  const filteredCourses = useMemo(() => {
    if (!processedCourses.length) return [];
    
    return processedCourses.filter(course => {
      // Filter by search term
      if (filters.search && 
          !course.displayName.toLowerCase().includes(filters.search.toLowerCase()) &&
          !(course.description && course.description.toLowerCase().includes(filters.search.toLowerCase()))) {
        return false;
      }
      
      // Filter by category
      if (filters.category !== 'all') {
        const category = filters.category.toLowerCase();
        if (category === 'arts and humanities' && 
            !(course.divisional_distribution === 'Arts and Humanities')) {
          return false;
        }
        if (category === 'science and technology in society' && 
            !(course.divisional_distribution === 'Science & Engineering & Applied Science')) {
          return false;
        }
        if (category === 'social sciences' && 
            !(course.divisional_distribution === 'Social Sciences')) {
          return false;
        }
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
      filters,
      setFilters,
      selectedSemester,
      setSelectedSemester,
    }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook for using the context
export const useAppContext = () => React.useContext(AppContext);