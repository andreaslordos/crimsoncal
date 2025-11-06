// CourseListItem.jsx
import React from "react";
import { useAppContext } from "../context/AppContext";
import { Plus, Minus } from "lucide-react";

// CourseListItem.jsx - Optimized with React.memo
const CourseListItem = React.memo(({ course }) => {
  const { selectedCourse, setSelectedCourse, myCourses, addCourse, removeCourse } = useAppContext();
  const isSelected = selectedCourse?.course_id === course.course_id;
  const isAdded = myCourses.some(c => c.course_id === course.course_id);
  
  return (
    <div
      className="grid grid-cols-8 md:grid-cols-16 py-3 px-3 text-sm cursor-pointer transition-all duration-150 rounded-lg"
      style={{
        background: isSelected ? '#eff6ff' : 'transparent'
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.background = '#f9fafb';
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.background = 'transparent';
      }}
      onClick={() => setSelectedCourse(course)}
    >
      <div className="col-span-1 flex items-center justify-center">
        {isAdded ? (
          <button
            className="w-8 h-8 flex items-center cursor-pointer justify-center text-white rounded-lg transition-all duration-150"
            style={{ background: '#ef4444' }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
            onClick={(e) => {
              e.stopPropagation();
              removeCourse(course.course_id);
            }}
          >
            <Minus size={16} />
          </button>
        ) : (
          <button
            className="w-8 h-8 flex items-center cursor-pointer justify-center rounded-lg transition-all duration-150"
            style={{
              color: 'var(--color-primary)',
              border: '1px solid var(--color-primary)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#eff6ff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            onClick={(e) => {
              e.stopPropagation();
              addCourse(course);
              setSelectedCourse(course);
            }}
          >
            <Plus size={16} />
          </button>
        )}
      </div>
      <div className="col-span-3 truncate font-semibold text-left" style={{ color: 'var(--color-text-primary)' }}>
        {course.subject_catalog}
      </div>
      <div className="col-span-2 text-center font-medium" style={{ color: 'var(--color-text-secondary)' }}>
        {course.rating ? Math.round(course.rating * 10) / 10 : 'n/a'}
      </div>
      <div className="col-span-2 text-center font-medium" style={{ color: 'var(--color-text-secondary)' }}>
        {course.hours ? course.hours : 'n/a'}
      </div>
      <div className="col-span-0 md:col-span-8 text-left truncate hidden md:block" style={{ color: 'var(--color-text-secondary)' }}>
        {course.course_title}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  return prevProps.course.course_id === nextProps.course.course_id &&
         prevProps.course.subject_catalog === nextProps.course.subject_catalog;
});

CourseListItem.displayName = 'CourseListItem';
  
export default CourseListItem;