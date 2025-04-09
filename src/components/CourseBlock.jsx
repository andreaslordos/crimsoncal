import { useAppContext } from "../context/AppContext";
import { getCourseColor, getTimePosition, getTimeHeight, formatTime } from "../utils/timeUtils";

const CourseBlock = ({ course, day, dayIndex, conflictIndex = 0, totalConflicts = 1 }) => {
    const { setSelectedCourse } = useAppContext();
    const colorClass = getCourseColor(course.course_id);
    const startPos = getTimePosition(course.start_time);
    const height = getTimeHeight(course.start_time, course.end_time);
    
    // Calculate width based on number of conflicts
    const blockWidth = 16.67 / totalConflicts; // Divide day column width by number of conflicts
    
    // Calculate left position based on day index and conflict index
    // Each conflict is positioned to the right of the previous one
    const blockOffset = conflictIndex * blockWidth;
    const leftPosition = `calc(${16.67 * dayIndex + blockOffset}% + 2px)`;
    
    return (
      <div 
        className={`absolute ${colorClass} text-white rounded p-1 overflow-hidden`}
        style={{ 
          top: `${startPos}px`, 
          left: leftPosition, 
          width: `calc(${blockWidth}% - 4px)`,
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