// src/components/Calendar.jsx
import { useAppContext } from "../context/AppContext";
import CourseBlock from "./CourseBlock";
import React, { useMemo } from "react";

const Calendar = () => {
    const { myCourses } = useAppContext();
    
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
      { hour: 10, meridiem: 'pm' },
      { hour: 11, meridiem: 'pm' }
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
      
      // Get courses with valid time data
      const validCourses = myCourses.filter(course => 
        course.start_time && course.end_time && days.some(day => course.dayMap[day])
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
    }, [myCourses]);
    
    return (
      <div className="bg-white rounded-lg shadow w-full overflow-auto">
        {/* Calendar header - using grid-cols-11 for balanced layout */}
        <div className="grid grid-cols-11 text-center py-2 border-b">
          <div className="col-span-1 text-sm font-semibold text-gray-500">Eastern</div>
          <div className="col-span-2 text-sm font-semibold">Monday</div>
          <div className="col-span-2 text-sm font-semibold">Tuesday</div>
          <div className="col-span-2 text-sm font-semibold">Wednesday</div>
          <div className="col-span-2 text-sm font-semibold">Thursday</div>
          <div className="col-span-2 text-sm font-semibold">Friday</div>
        </div>
        
        {/* Calendar time slots - using grid-cols-11 for balanced layout */}
        <div className="relative">
          {/* Time markers */}
          {timeSlots.map((slot) => (
            <div key={`${slot.hour}${slot.meridiem}`} className="grid grid-cols-11 border-b" style={{ height: '42px' }}>
              <div className="col-span-1 text-xs text-gray-500 pr-2 text-right">
                {slot.hour}{slot.meridiem}
              </div>
              <div className="col-span-2 border-l"></div>
              <div className="col-span-2 border-l"></div>
              <div className="col-span-2 border-l"></div>
              <div className="col-span-2 border-l"></div>
              <div className="col-span-2 border-l"></div>
            </div>
          ))}
          
          {/* Course blocks */}
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