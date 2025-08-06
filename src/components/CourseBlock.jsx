// src/components/CourseBlock.jsx
import { useAppContext } from "../context/AppContext";
import { getCourseColor, getTimePosition, getTimeHeight, formatTime } from "../utils/timeUtils";

const CourseBlock = ({ course, day, dayIndex, conflictIndex = 0, totalConflicts = 1 }) => {
    const { setSelectedCourse } = useAppContext();
    const colorClass = getCourseColor(course.course_id);
    
    // Use selected section data if available, otherwise use course defaults
    const section = course.selectedSection || {};
    const startTime = section.start_time || course.start_time;
    const endTime = section.end_time || course.end_time;
    
    const startPos = getTimePosition(startTime);
    const height = getTimeHeight(startTime, endTime);
    
    // Calculate width based on number of conflicts
    // With 11-col grid: 1 col for time + 2 cols per day
    const dayColWidth = 2; // Each day takes 2 columns in the 11-col grid
    const blockWidth = dayColWidth / totalConflicts; // Divide day column width by number of conflicts
    
    // Calculate left position based on day index and conflict index
    // dayIndex * 2 + 1 accounts for the time column (col-span-1) and positions in the correct day
    const colOffset = dayIndex * dayColWidth + 1; // +1 to skip the time column
    const columnWidth = 100 / 11; // Width percentage of each column in a 11-col grid
    
    // Calculate the actual percentage for left position
    const conflictOffset = (conflictIndex * blockWidth) * columnWidth;
    const leftPosition = `${colOffset * columnWidth + conflictOffset}%`;
    
    // Calculate the width as a percentage - use almost full width 
    // (leaving just a tiny gap between blocks for visual separation)
    const widthPercentage = `calc(${(blockWidth * columnWidth)}%)`;
    
    return (
      <div 
        className={`absolute ${colorClass} text-white rounded p-1 overflow-hidden cursor-pointer hover:brightness-110 hover:shadow-md transition-all duration-150`}
        style={{ 
          top: `${startPos}px`, 
          left: leftPosition, 
          width: widthPercentage,
          height: `${height}px`,
          zIndex: conflictIndex + 1,
        }}
        onClick={() => setSelectedCourse(course)}
      >
        <div className="text-xs font-bold truncate">
          {course.subject_catalog}
        </div>
        <div className="text-xs truncate">
          {formatTime(startTime)}-{formatTime(endTime)}
        </div>
      </div>
    );
};

export default CourseBlock;