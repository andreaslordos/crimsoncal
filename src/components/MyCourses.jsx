import { useAppContext } from "../context/AppContext";
import { formatTime } from "../utils/timeUtils";
import { Minus } from "lucide-react";

const MyCourses = () => {
    const { myCourses, removeCourse, setSelectedCourse } = useAppContext();
    
    return (
      <div className="bg-white border-t border-gray-200 p-4">
        <h2 className="text-lg font-semibold mb-2">My courses</h2>
        <div className="flex overflow-x-auto space-x-2 pb-2">
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
                  <div className="text-xs">{formatTime(course.start_time)}</div>
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
        
        <div className="mt-2 flex flex-wrap text-sm space-x-4 text-gray-500">
          <button className="hover:underline">Export to Google Calendar</button>
          <button className="hover:underline">Export to text</button>
          <button className="hover:underline">Share courses via URL</button>
          <button className="hover:underline">Clear all</button>
        </div>
      </div>
    );
  };

  export default MyCourses;