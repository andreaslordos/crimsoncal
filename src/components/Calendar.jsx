// src/components/Calendar.jsx
import { useAppContext } from "../context/AppContext";
import CourseBlock from "./CourseBlock";
import React, { useMemo } from "react";

const Calendar = () => {
    const { myCourses, hiddenCourses } = useAppContext();
    
    // Time slots (9am to 11pm with proper am/pm)
    const timeSlots = [
      { hour: 9, meridiem: 'am' },
      { hour: 10, meridiem: 'am' },
      { hour: 11, meridiem: 'am' },
      { hour: 12, meridiem: 'pm' },
      { hour: 1, meridiem: 'pm' },
      { hour: 2, meridiem: 'pm' },
      { hour: 3, meridiem: 'pm' },
      { hour: 4, meridiem: 'pm' },
      { hour: 5, meridiem: 'pm' },
      { hour: 6, meridiem: 'pm' },
      { hour: 7, meridiem: 'pm' },
      { hour: 8, meridiem: 'pm' },
      { hour: 9, meridiem: 'pm' },
    ];
    
    // Days of the week
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    
    // Helper function to convert time string to minutes since midnight
    const timeToMinutes = (timeStr) => {
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
    
    // Helper function to check if two time ranges overlap
    const isOverlapping = (startA, endA, startB, endB) => {
      const startMinutesA = timeToMinutes(startA);
      const endMinutesA = timeToMinutes(endA);
      const startMinutesB = timeToMinutes(startB);
      const endMinutesB = timeToMinutes(endB);
      
      return Math.max(startMinutesA, startMinutesB) < Math.min(endMinutesA, endMinutesB);
    };
    
    // Find conflicting courses with improved conflict detection
    const coursesByDayAndTime = useMemo(() => {
      const result = {};
      
      // Initialize result object for each day
      days.forEach(day => {
        result[day] = [];
      });
      
      // Get courses with valid time data that aren't hidden
      const validCourses = myCourses.filter(course => 
        course.start_time && 
        course.end_time && 
        days.some(day => course.dayMap[day]) &&
        !hiddenCourses[course.course_id]  // Add this line to filter out hidden courses
      );
      
      // For each day, find groups of overlapping courses
      days.forEach(day => {
        // Get courses for this day
        const coursesForDay = validCourses.filter(course => course.dayMap[day]);
        
        // Track which courses have been processed
        const processedCourses = new Set();
        
        // Find conflict groups
        coursesForDay.forEach(course => {
          // Skip if already processed
          if (processedCourses.has(course.course_id)) return;
          
          // Start a new conflict group with this course
          const conflictGroup = [course];
          processedCourses.add(course.course_id);
          
          // Find all other courses that conflict with this one
          coursesForDay.forEach(otherCourse => {
            if (otherCourse.course_id !== course.course_id && 
                !processedCourses.has(otherCourse.course_id) &&
                isOverlapping(
                  course.start_time, course.end_time,
                  otherCourse.start_time, otherCourse.end_time
                )) {
              // Add to conflict group and mark as processed
              conflictGroup.push(otherCourse);
              processedCourses.add(otherCourse.course_id);
            }
          });
          
          // Add this conflict group to the results
          result[day].push(conflictGroup);
        });
      });
      
      return result;
    }, [myCourses, hiddenCourses]);
    
    const dayNames = [
      { full: 'Monday', short: 'M' },
      { full: 'Tuesday', short: 'Tu' },
      { full: 'Wednesday', short: 'W' },
      { full: 'Thursday', short: 'Th' },
      { full: 'Friday', short: 'F' }
    ];
    
    return (
      <div className="bg-white rounded-lg shadow w-full overflow-hidden">
        {/* Calendar header with responsive day names */}
        <div className="grid grid-cols-11 text-center py-2 border-b">
          <div className="col-span-1 text-xs font-semibold text-gray-500 hidden md:block">Eastern</div>
          <div className="col-span-1 text-xs font-semibold text-gray-500 md:hidden"></div>
          {dayNames.map(day => (
            <div key={day.full} className="col-span-2 text-xs md:text-sm font-semibold">
              <span className="hidden md:inline">{day.full}</span>
              <span className="md:hidden">{day.short}</span>
            </div>
          ))}
        </div>
        
        {/* Calendar time slots - fit to screen width on mobile */}
        <div className="relative">
          {timeSlots.map((slot) => (
            <div key={`${slot.hour}${slot.meridiem}`} className="grid grid-cols-11 border-b" style={{ height: '42px' }}>
              <div className="col-span-1 text-xs text-right pr-1">
                {slot.hour}{slot.meridiem}
              </div>
              {/* Day columns */}
              <div className="col-span-2 border-l"></div>
              <div className="col-span-2 border-l"></div>
              <div className="col-span-2 border-l"></div>
              <div className="col-span-2 border-l"></div>
              <div className="col-span-2 border-l"></div>
            </div>
          ))}
          
          {/* Course blocks with improved alignment */}
          {days.map((day, dayIndex) => (
            <React.Fragment key={day}>
              {coursesByDayAndTime[day].map((conflictGroup, groupIndex) => 
                conflictGroup.map((course, conflictIndex) => (
                  <CourseBlock 
                    key={`${course.course_id}-${day}-${conflictIndex}`} 
                    course={course} 
                    day={day} 
                    dayIndex={dayIndex}
                    conflictIndex={conflictIndex}
                    totalConflicts={conflictGroup.length}
                  />
                ))
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
};  
export default Calendar;