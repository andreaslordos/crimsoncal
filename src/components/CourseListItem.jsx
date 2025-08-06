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
      className={`grid grid-cols-8 md:grid-cols-16 py-3 px-2 text-sm hover:bg-gray-100 cursor-pointer transition-colors duration-150 ${isSelected ? 'bg-blue-50' : ''}`}
      onClick={() => setSelectedCourse(course)}
    >
      <div className="col-span-1 flex items-center justify-center">
        {isAdded ? (
          <button 
            className="w-7 h-7 flex items-center cursor-pointer justify-center text-white bg-red-500 rounded hover:bg-red-600 transition-colors duration-150"
            onClick={(e) => {
              e.stopPropagation();
              removeCourse(course.course_id);
            }}
          >
            <Minus size={14} />
          </button>
        ) : (
          <button 
            className="w-7 h-7 flex items-center cursor-pointer justify-center text-teal-500 border border-teal-500 rounded hover:bg-teal-50 hover:text-teal-600 transition-colors duration-150"
            onClick={(e) => {
              e.stopPropagation();
              addCourse(course);
              setSelectedCourse(course);
            }}
          >
            <Plus size={14} />
          </button>
        )}
      </div>
      <div className="col-span-3 truncate font-medium text-left">{course.subject_catalog}</div>
      <div className="col-span-2 text-center">{course.rating ? Math.round(course.rating * 10) / 10 : 'n/a'}</div>
      <div className="col-span-2 text-center">{course.hours ? course.hours : 'n/a'}</div>
      <div className="col-span-0 md:col-span-8 text-left truncate hidden md:block">{course.course_title}</div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  return prevProps.course.course_id === nextProps.course.course_id &&
         prevProps.course.subject_catalog === nextProps.course.subject_catalog;
});

CourseListItem.displayName = 'CourseListItem';
  
export default CourseListItem;