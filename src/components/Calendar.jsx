import { useAppContext } from "../context/AppContext";
import CourseBlock from "./CourseBlock";
import React from "react";

const Calendar = () => {
    const { myCourses } = useAppContext();
    
    // Time slots
    const timeSlots = [8, 9, 10, 11, 12, 1, 2, 3, 4, 5];
    
    // Days of the week
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    
    return (
      <div className="bg-white rounded-lg shadow">
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
              <div className="col-span-5"></div>
            </div>
          ))}
          
          {/* Course blocks */}
          {myCourses
            .filter(course => course.start_time && days.some(day => course.dayMap[day]))
            .map(course => (
              <React.Fragment key={course.course_id}>
                {days.map((day, index) => (
                  course.dayMap[day] && (
                    <CourseBlock 
                      key={`${course.course_id}-${day}`} 
                      course={course} 
                      day={day} 
                      dayIndex={index} 
                    />
                  )
                ))}
              </React.Fragment>
            ))}
        </div>
      </div>
    );
  };
  
export default Calendar;