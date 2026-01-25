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

      // Build list of all blocks to render (courses + custom sections)
      const allBlocks = [];

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

      // Add regular courses to allBlocks
      validCourses.forEach(course => {
        allBlocks.push({
          ...course,
          isCustomSection: false
        });
      });

      // Add custom sections to allBlocks (only if parent course is not hidden)
      myCourses.forEach(course => {
        if (hiddenCourses[course.course_id]) return;
        if (!course.customSections || course.customSections.length === 0) return;

        course.customSections.forEach(customSection => {
          // Validate custom section has required data
          if (!customSection.startTime || !customSection.endTime) return;
          if (!customSection.days || !days.some(day => customSection.days[day])) return;

          allBlocks.push({
            course_id: `${course.course_id}-${customSection.id}`,
            parent_course_id: course.course_id,
            subject_catalog: course.subject_catalog,
            name: customSection.name || 'Section',
            start_time: customSection.startTime,
            end_time: customSection.endTime,
            dayMap: customSection.days,
            location: customSection.location,
            isCustomSection: true,
            customSectionId: customSection.id
          });
        });
      });

      // For each day, find groups of overlapping blocks
      days.forEach(day => {
        // Get blocks for this day
        const blocksForDay = allBlocks.filter(block => {
          if (block.isCustomSection) {
            return block.dayMap[day];
          }
          const section = block.selectedSection || {};
          const dayMap = section.dayMap || block.dayMap;
          return dayMap[day];
        });

        // Skip if no blocks for this day
        if (blocksForDay.length === 0) return;

        // Create conflict groups
        const conflictGroups = [];

        // Helper function to get start/end times for a block
        const getBlockTimes = (block) => {
          if (block.isCustomSection) {
            return { startTime: block.start_time, endTime: block.end_time };
          }
          const section = block.selectedSection || {};
          return {
            startTime: section.start_time || block.start_time,
            endTime: section.end_time || block.end_time
          };
        };

        // Helper function to check if a block overlaps with any block in a group
        const overlapsWithGroup = (block, group) => {
          const { startTime, endTime } = getBlockTimes(block);

          return group.some(groupBlock => {
            const { startTime: groupStartTime, endTime: groupEndTime } = getBlockTimes(groupBlock);
            return isOverlapping(startTime, endTime, groupStartTime, groupEndTime);
          });
        };

        // Process each block
        blocksForDay.forEach(block => {
          // Check if this block overlaps with any existing group
          let addedToGroup = false;

          // Try to add to existing groups first
          for (let i = 0; i < conflictGroups.length; i++) {
            if (overlapsWithGroup(block, conflictGroups[i])) {
              conflictGroups[i].push(block);
              addedToGroup = true;
              break;
            }
          }

          // If not added to any existing group, create a new group
          if (!addedToGroup) {
            conflictGroups.push([block]);
          }
        });

        // Merge groups that share overlapping blocks
        let merged = true;
        while (merged) {
          merged = false;

          for (let i = 0; i < conflictGroups.length; i++) {
            for (let j = i + 1; j < conflictGroups.length; j++) {
              // Check if these groups share any overlapping blocks
              const shouldMerge = conflictGroups[i].some(blockI => {
                const { startTime: startTimeI, endTime: endTimeI } = getBlockTimes(blockI);

                return conflictGroups[j].some(blockJ => {
                  const { startTime: startTimeJ, endTime: endTimeJ } = getBlockTimes(blockJ);
                  return isOverlapping(startTimeI, endTimeI, startTimeJ, endTimeJ);
                });
              });

              if (shouldMerge) {
                // Merge the groups
                conflictGroups[i] = [...conflictGroups[i], ...conflictGroups[j]];
                // Remove duplicate blocks by course_id
                conflictGroups[i] = Array.from(new Set(conflictGroups[i].map(b => b.course_id)))
                  .map(id => conflictGroups[i].find(b => b.course_id === id));
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
      <div className="rounded-lg shadow-sm w-full overflow-hidden border bg-white" style={{
        borderColor: '#e5e5e5'
      }}>
        {/* Calendar header with responsive day names */}
        <div className="grid grid-cols-11 text-center py-2.5 border-b bg-gray-50" style={{
          borderBottomColor: '#e5e5e5'
        }}>
          <div className="col-span-1 text-xs font-medium text-gray-500 hidden md:block">Eastern</div>
          <div className="col-span-1 text-xs font-medium md:hidden"></div>
          {dayNames.map(day => (
            <div key={day.full} className="col-span-2 text-sm md:text-sm font-semibold text-gray-700">
              <span className="hidden md:inline">{day.full}</span>
              <span className="md:hidden">{day.short}</span>
            </div>
          ))}
        </div>
        
        {/* Calendar time slots - fit to screen width on mobile */}
        <div className="relative">
          {timeSlots.map((slot) => (
            <div key={`${slot.hour}${slot.meridiem}`} className="grid grid-cols-11 border-b border-gray-100" style={{
              height: '42px'
            }}>
              <div className="col-span-1 text-xs text-right pr-1 text-gray-500">
                {slot.hour}{slot.meridiem}
              </div>
              {/* Day columns */}
              <div className="col-span-2 border-l border-gray-100"></div>
              <div className="col-span-2 border-l border-gray-100"></div>
              <div className="col-span-2 border-l border-gray-100"></div>
              <div className="col-span-2 border-l border-gray-100"></div>
              <div className="col-span-2 border-l border-gray-100"></div>
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
                    isCustomSection={course.isCustomSection}
                    parentCourseId={course.parent_course_id}
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