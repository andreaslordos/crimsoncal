import { useAppContext } from "../context/AppContext";
import { formatTime, getCourseColor } from "../utils/timeUtils";
import { Minus } from "lucide-react";

const MyCourses = () => {
    const { myCourses, removeCourse, setSelectedCourse, hiddenCourses, toggleCourseVisibility } = useAppContext();
    
    return (
      <div className="bg-white rounded-lg shadow mt-4 p-4">
        <h2 className="text-lg font-semibold mb-2">My courses</h2>
        <div className="flex flex-wrap gap-2">
          {myCourses.length === 0 ? (
            <div className="text-sm text-gray-500">No courses selected</div>
          ) : (
            myCourses.map(course => {
              const colorClass = getCourseColor(course.course_id);
              const isHidden = hiddenCourses[course.course_id];
              
              return (
                <div 
                  key={course.course_id}
                  className={`flex items-center ${colorClass} text-white rounded-lg px-3 py-2 text-sm cursor-pointer`}
                  onClick={() => setSelectedCourse(course)}
                >
                  <div className="mr-2">
                    <div className="font-semibold">{course.subject_catalog}</div>
                  </div>
                  <div className="flex items-center">
                  <button 
                      className="w-5 h-5 rounded-full border-2 cursor-pointer border-white mr-2 flex items-center justify-center overflow-hidden hover:bg-white/20 transition-colors duration-150"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCourseVisibility(course.course_id);
                      }}
                    >
                      <div className={`w-2 h-2 rounded-full bg-white ${isHidden ? 'opacity-0' : 'opacity-100'}`}></div>
                    </button>
                    <button 
                      className="text-white hover:text-gray-200 transition-colors cursor-pointer duration-150"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCourse(course.course_id);
                      }}
                    >
                      <Minus size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

export default MyCourses;