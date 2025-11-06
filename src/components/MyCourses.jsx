import { useAppContext } from "../context/AppContext";
import { formatTime, getCourseColor } from "../utils/timeUtils";
import { Minus } from "lucide-react";

const MyCourses = () => {
    const { myCourses, removeCourse, setSelectedCourse, hiddenCourses, toggleCourseVisibility } = useAppContext();
    
    return (
      <div
        className="rounded-xl mt-6 p-6"
        style={{
          background: 'var(--color-bg-secondary)',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--color-border)'
        }}
      >
        <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          My courses
        </h2>
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
                  className={`flex items-center justify-between ${colorClass} text-white rounded-lg px-3 py-2 text-sm cursor-pointer w-full md:w-auto`}
                  onClick={() => setSelectedCourse(course)}
                >
                  <div className="font-semibold truncate max-w-[70%]">{course.subject_catalog}</div>
                  <div className="flex items-center ml-2">
                    <button 
                      className="w-6 h-6 rounded-full border-2 cursor-pointer border-white mr-2 flex items-center justify-center overflow-hidden hover:bg-white/20 transition-colors duration-150"
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