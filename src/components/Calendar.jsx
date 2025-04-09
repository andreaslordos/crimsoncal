import { useAppContext } from "../context/AppContext";
import CourseBlock from "./CourseBlock";
import React, { useMemo } from "react";

const Calendar = () => {
    const { myCourses } = useAppContext();
    
    // Time slots
    const timeSlots = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    
    // Days of the week
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    
    // Find conflicting courses
    const coursesByDayAndTime = useMemo(() => {
      const conflicts = {};
      
      // Initialize conflicts object for each day
      days.forEach(day => {
        conflicts[day] = {};
      });
      
      // Group courses by day and time to detect conflicts
      myCourses
        .filter(course => course.start_time && days.some(day => course.dayMap[day]))
        .forEach(course => {
          days.forEach((day, dayIndex) => {
            if (course.dayMap[day]) {
              // Create a unique key for this time slot
              const timeKey = `${course.start_time}-${course.end_time}`;
              
              // Initialize array if it doesn't exist
              if (!conflicts[day][timeKey]) {
                conflicts[day][timeKey] = [];
              }
              
              // Add course to this day and time slot
              conflicts[day][timeKey].push(course);
            }
          });
        });
      
      return conflicts;
    }, [myCourses]);
    
    return (
      <div className="bg-white rounded-lg shadow w-full overflow-auto">
        {/* Calendar header */}
        <div className="grid grid-cols-6 text-center py-2 border-b">
          <div className="text-sm font-semibold text-gray-500">Eastern</div>
          <div className="text-sm font-semibold">Monday</div>
          <div className="text-sm font-semibold">Tuesday</div>
          <div className="text-sm font-semibold">Wednesday</div>
          <div className="text-sm font-semibold">Thursday</div>
          <div className="text-sm font-semibold">Friday</div>
        </div>
        
        {/* Calendar time slots */}
        <div className="relative">
          {/* Time markers */}
          {timeSlots.map((hour) => (
            <div key={hour} className="grid grid-cols-6 border-b" style={{ height: '42px' }}>
              <div className="text-xs text-gray-500 pr-2 text-right">
                {hour}{hour >= 8 && hour <= 11 ? 'am' : 'pm'}
              </div>
              <div className="border-l"></div>
              <div className="border-l"></div>
              <div className="border-l"></div>
              <div className="border-l"></div>
              <div className="border-l"></div>
            </div>
          ))}
          
          {/* Course blocks */}
          {days.map((day, dayIndex) => (
            <React.Fragment key={day}>
              {Object.entries(coursesByDayAndTime[day]).map(([timeKey, conflictingCourses]) => (
                conflictingCourses.map((course, conflictIndex) => (
                  <CourseBlock 
                    key={`${course.course_id}-${day}-${conflictIndex}`} 
                    course={course} 
                    day={day} 
                    dayIndex={dayIndex}
                    conflictIndex={conflictIndex}
                    totalConflicts={conflictingCourses.length}
                  />
                ))
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };
  
export default Calendar;