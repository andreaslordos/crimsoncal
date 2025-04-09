import { useAppContext } from "../context/AppContext";
import { getCourseColor, getTimePosition, getTimeHeight, formatTime } from "../utils/timeUtils";

const CourseBlock = ({ course, day, dayIndex }) => {
    const { setSelectedCourse } = useAppContext();
    const colorClass = getCourseColor(course.course_id);
    const startPos = getTimePosition(course.start_time);
    const height = getTimeHeight(course.start_time, course.end_time);
    
    // Calculate left position based on day index (1-5 for Mon-Fri)
    const leftPosition = `calc(${16.67 * (dayIndex + 1)}% + 2px)`;
    
    return (
      <div 
        className={`absolute ${colorClass} text-white rounded p-1 overflow-hidden`}
        style={{ 
          top: `${startPos}px`, 
          left: leftPosition, 
          width: 'calc(16.67% - 4px)',
          height: `${height}px`,
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