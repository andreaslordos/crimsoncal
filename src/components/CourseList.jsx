import { useAppContext } from "../context/AppContext";
import CourseListItem from "./CourseListItem";

const CourseList = () => {
    const { filteredCourses } = useAppContext();
    
    return (
      <div className="mb-4">
        <div className="grid grid-cols-4 font-semibold text-sm mb-2 px-2">
          <div className="col-span-1">Course</div>
          <div className="text-center">Rating ▼</div>
          <div className="text-center">Hours</div>
          <div className="text-right">Name</div>
        </div>
        <div className="divide-y max-h-50 overflow-y-auto border rounded bg-white">
          {filteredCourses.length === 0 ? (
            <div className="py-4 text-center text-gray-500">No courses match your filter criteria</div>
          ) : (
            filteredCourses.map((course, index) => (
              <CourseListItem 
                key={`${course.course_id}-${course.subject_catalog}-${index}`} 
                course={course} 
              />
            ))
          )}
        </div>
      </div>
    );
  };

export default CourseList;