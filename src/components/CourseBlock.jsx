// src/components/CourseBlock.jsx
import { useAppContext } from "../context/AppContext";
import { getCourseColor, getTimePosition, getTimeHeight, formatTime } from "../utils/timeUtils";

const CourseBlock = ({ course, day, dayIndex, conflictIndex = 0, totalConflicts = 1 }) => {
    const { setSelectedCourse } = useAppContext();
    const colorClass = getCourseColor(course.course_id);
    const startPos = getTimePosition(course.start_time);
    const height = getTimeHeight(course.start_time, course.end_time);
    
    // Calculate width based on number of conflicts
    // With 12-col grid: 1 col for time + 2 cols per day
    const dayColWidth = 2; // Each day takes 2 columns in the 12-col grid
    const blockWidth = dayColWidth / totalConflicts; // Divide day column width by number of conflicts
    
    // Calculate left position based on day index and conflict index
    // dayIndex * 2 + 1 accounts for the time column (col-span-1) and positions in the correct day
    const colOffset = dayIndex * dayColWidth + 1; // +1 to skip the time column
    const columnWidth = 100 / 12; // Width percentage of each column in a 12-col grid
    
    // Calculate the actual percentage for left position
    const conflictOffset = (conflictIndex * blockWidth) * columnWidth;
    const leftPosition = `${colOffset * columnWidth + conflictOffset}%`;
    
    // Calculate the width as a percentage
    const widthPercentage = `${(blockWidth * columnWidth)}%`;
    
    return (
      <div 
        className={`absolute ${colorClass} text-white rounded p-1 overflow-hidden`}
        style={{ 
          top: `${startPos}px`, 
          left: leftPosition, 
          width: widthPercentage,
          height: `${height}px`,
          zIndex: conflictIndex + 1, // Stack conflicts with higher z-index
        }}
        onClick={() => setSelectedCourse(course)}
      >
        <div className="text-xs font-bold truncate">
          {course.subject_catalog}
        </div>
        <div className="text-xs truncate">
          {formatTime(course.start_time)}-{formatTime(course.end_time)}
        </div>
      </div>
    );
};

export default CourseBlock;