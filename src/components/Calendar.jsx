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
      const validCourses = myCourses.filter(course => {
        // Use selected section data if available, otherwise use course defaults
        const section = course.selectedSection || {};
        const startTime = section.start_time || course.start_time;
        const endTime = section.end_time || course.end_time;
        const dayMap = section.dayMap || course.dayMap;
        
        return startTime && 
               endTime && 
               days.some(day => dayMap[day]) &&
               !hiddenCourses[course.course_id];
      });
      
      // For each day, find groups of overlapping courses
      days.forEach(day => {
        // Get courses for this day
        const coursesForDay = validCourses.filter(course => {
          const section = course.selectedSection || {};
          const dayMap = section.dayMap || course.dayMap;
          return dayMap[day];
        });
        
        // Skip if no courses for this day
        if (coursesForDay.length === 0) return;
        
        // Create conflict groups
        const conflictGroups = [];
        
        // Helper function to check if a course overlaps with any course in a group
        const overlapsWithGroup = (course, group) => {
          const section = course.selectedSection || {};
          const startTime = section.start_time || course.start_time;
          const endTime = section.end_time || course.end_time;
          
          return group.some(groupCourse => {
            const groupSection = groupCourse.selectedSection || {};
            const groupStartTime = groupSection.start_time || groupCourse.start_time;
            const groupEndTime = groupSection.end_time || groupCourse.end_time;
            
            return isOverlapping(startTime, endTime, groupStartTime, groupEndTime);
          });
        };
        
        // Process each course
        coursesForDay.forEach(course => {
          // Check if this course overlaps with any existing group
          let addedToGroup = false;
          
          // Try to add to existing groups first
          for (let i = 0; i < conflictGroups.length; i++) {
            if (overlapsWithGroup(course, conflictGroups[i])) {
              conflictGroups[i].push(course);
              addedToGroup = true;
              break;
            }
          }
          
          // If not added to any existing group, create a new group
          if (!addedToGroup) {
            conflictGroups.push([course]);
          }
        });
        
        // Merge groups that share courses
        let merged = true;
        while (merged) {
          merged = false;
          
          for (let i = 0; i < conflictGroups.length; i++) {
            for (let j = i + 1; j < conflictGroups.length; j++) {
              // Check if these groups share any overlapping courses
              const shouldMerge = conflictGroups[i].some(courseI => 
                conflictGroups[j].some(courseJ => 
                  isOverlapping(
                    courseI.start_time, courseI.end_time,
                    courseJ.start_time, courseJ.end_time
                  )
                )
              );
              
              if (shouldMerge) {
                // Merge the groups
                conflictGroups[i] = [...conflictGroups[i], ...conflictGroups[j]];
                // Remove duplicate courses
                conflictGroups[i] = Array.from(new Set(conflictGroups[i].map(c => c.course_id)))
                  .map(id => conflictGroups[i].find(c => c.course_id === id));
                // Remove the second group
                conflictGroups.splice(j, 1);
                merged = true;
                break;
              }
            }
            if (merged) break;
          }
        }
        
        // Add conflict groups to result
        result[day] = conflictGroups;
      });
      
      return result;
    }, [myCourses, hiddenCourses, isOverlapping, timeToMinutes, days]);
    
    const dayNames = [
      { full: 'Monday', short: 'M' },
      { full: 'Tuesday', short: 'Tu' },
      { full: 'Wednesday', short: 'W' },
      { full: 'Thursday', short: 'Th' },
      { full: 'Friday', short: 'F' }
    ];
    
    return (
      <div
        className="rounded-xl w-full overflow-hidden"
        style={{
          background: 'var(--color-bg-secondary)',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--color-border)'
        }}
      >
        {/* Calendar header with responsive day names */}
        <div
          className="grid grid-cols-11 text-center py-3"
          style={{
            borderBottom: '1px solid var(--color-border)',
            background: '#f9fafb'
          }}
        >
          <div className="col-span-1 text-xs font-medium hidden md:block" style={{ color: 'var(--color-text-secondary)' }}>
            Eastern
          </div>
          <div className="col-span-1 text-xs font-medium md:hidden"></div>
          {dayNames.map(day => (
            <div key={day.full} className="col-span-2 text-xs md:text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              <span className="hidden md:inline">{day.full}</span>
              <span className="md:hidden">{day.short}</span>
            </div>
          ))}
        </div>
        
        {/* Calendar time slots - fit to screen width on mobile */}
        <div className="relative">
          {timeSlots.map((slot, index) => (
            <div
              key={`${slot.hour}${slot.meridiem}`}
              className="grid grid-cols-11"
              style={{
                height: '42px',
                borderBottom: index < timeSlots.length - 1 ? '1px solid var(--color-border)' : 'none'
              }}
            >
              <div className="col-span-1 text-xs text-right pr-1 font-medium" style={{ color: 'var(--color-text-secondary)', paddingTop: '2px' }}>
                {slot.hour}{slot.meridiem}
              </div>
              {/* Day columns */}
              <div className="col-span-2" style={{ borderLeft: '1px solid var(--color-border)' }}></div>
              <div className="col-span-2" style={{ borderLeft: '1px solid var(--color-border)' }}></div>
              <div className="col-span-2" style={{ borderLeft: '1px solid var(--color-border)' }}></div>
              <div className="col-span-2" style={{ borderLeft: '1px solid var(--color-border)' }}></div>
              <div className="col-span-2" style={{ borderLeft: '1px solid var(--color-border)' }}></div>
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