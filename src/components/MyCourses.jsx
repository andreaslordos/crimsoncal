import { useAppContext } from "../context/AppContext";
import { formatTime } from "../utils/timeUtils";
import { Minus } from "lucide-react";

const MyCourses = () => {
    const { myCourses, removeCourse, setSelectedCourse } = useAppContext();
    
    return (
      <div className="bg-white rounded-lg shadow mt-4 p-4">
        <h2 className="text-lg font-semibold mb-2">My courses</h2>
        <div className="flex flex-wrap gap-2">
          {myCourses.length === 0 ? (
            <div className="text-sm text-gray-500">No courses selected</div>
          ) : (
            myCourses.map(course => (
              <div 
                key={course.course_id}
                className="flex items-center bg-blue-100 text-blue-800 rounded-lg px-3 py-2 text-sm cursor-pointer"
                onClick={() => setSelectedCourse(course)}
              >
                <div className="mr-2">
                  <div className="font-semibold">{course.subject_catalog}</div>
                </div>
                <button 
                  className="text-blue-800 hover:text-blue-900"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeCourse(course.course_id);
                  }}
                >
                  <Minus size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

export default MyCourses;