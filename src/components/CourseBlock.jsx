// src/components/CourseBlock.jsx
import { useAppContext } from "../context/AppContext";
import { getCourseColor, getTimePosition, getTimeHeight, formatTime } from "../utils/timeUtils";

const CourseBlock = ({ course, day, dayIndex, conflictIndex = 0, totalConflicts = 1, isCustomSection = false, parentCourseId = null }) => {
    const { setSelectedCourse, myCourses } = useAppContext();
    const colorClass = getCourseColor(isCustomSection ? parentCourseId : course.course_id);

    // For custom sections, find the parent course to select when clicked
    const handleClick = () => {
      if (isCustomSection && parentCourseId) {
        const parentCourse = myCourses.find(c => c.course_id === parentCourseId);
        if (parentCourse) {
          setSelectedCourse(parentCourse);
          return;
        }
      }
      setSelectedCourse(course);
    };

    // Use selected section data if available, otherwise use course defaults
    const section = course.selectedSection || {};
    const startTime = section.start_time || course.start_time;
    const endTime = section.end_time || course.end_time;

    const startPos = getTimePosition(startTime);
    const height = getTimeHeight(startTime, endTime);

    // Calculate font size based on block height
    // 12px (text-xs) at 42px height, scales down for shorter blocks
    const baseHeight = 42;
    const baseFontSize = 12;
    const fontSize = Math.max(8, Math.min(baseFontSize, (height / baseHeight) * baseFontSize));
    const isCompact = height < 30;

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
        className={`absolute ${colorClass} text-white rounded-md overflow-hidden cursor-pointer hover:brightness-110 hover:shadow-lg transition-all duration-150 border border-black/10 flex items-center`}
        style={{
          top: `${startPos}px`,
          left: leftPosition,
          width: widthPercentage,
          height: `${height}px`,
          zIndex: conflictIndex + 1,
          border: isCustomSection ? '2px dashed rgba(255,255,255,0.6)' : undefined,
        }}
        onClick={handleClick}
      >
        <div
          className="px-1 w-full min-w-0"
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: 1.2
          }}
        >
          <div className="font-bold truncate">
            {isCustomSection ? `${course.subject_catalog} ${course.name || 'Section'}` : course.subject_catalog}
          </div>
          {!isCompact && (
            <div className="truncate opacity-90 hidden md:block">
              {formatTime(startTime)}-{formatTime(endTime)}
            </div>
          )}
        </div>
      </div>
    );
};

export default CourseBlock;