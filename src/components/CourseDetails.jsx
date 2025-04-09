import { useAppContext } from "../context/AppContext";
import { Clock, Calendar, Book, BookOpen, Star, Plus, User, Minus } from "lucide-react";

const CourseDetails = () => {
    const { selectedCourse, myCourses, addCourse, removeCourse } = useAppContext();
    
    if (!selectedCourse) return null;
    
    const isAdded = myCourses.some(c => c.course_id === selectedCourse.course_id);
    
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">
          {selectedCourse.subject_catalog}: {selectedCourse.course_title}
        </h2>
        
        <div className="text-sm">
          <div className="flex items-center text-gray-600 mb-1">
            <Clock size={14} className="mr-1" />
            {selectedCourse.start_time && selectedCourse.end_time ? 
              `${selectedCourse.start_time} - ${selectedCourse.end_time}` : 'Time not specified'}
          </div>
          
          <div className="flex text-gray-600 mb-1">
            <Calendar size={14} className="mr-1 mt-1 flex-shrink-0" />
            <div>
              {selectedCourse.dayMap.monday && <div>Monday</div>}
              {selectedCourse.dayMap.tuesday && <div>Tuesday</div>}
              {selectedCourse.dayMap.wednesday && <div>Wednesday</div>}
              {selectedCourse.dayMap.thursday && <div>Thursday</div>}
              {selectedCourse.dayMap.friday && <div>Friday</div>}
              {!Object.values(selectedCourse.dayMap).some(Boolean) && <div>Days not specified</div>}
            </div>
          </div>
          
          {selectedCourse.instructors && (
            <div className="flex items-center text-gray-600 mb-1">
              <User size={14} className="mr-1" /> {selectedCourse.instructors}
            </div>
          )}
          
          {selectedCourse.units && (
            <div className="flex items-center text-gray-600 mb-1">
              <Book size={14} className="mr-1" /> {selectedCourse.units} units
            </div>
          )}
          
          {selectedCourse.evalData && selectedCourse.evalData.course_score_mean && (
            <div className="flex items-center text-gray-600 mb-1">
              <Star size={14} className="mr-1" /> Rating: {Math.round(selectedCourse.evalData.course_score_mean * 100) / 100}/5.0
            </div>
          )}
          
          {selectedCourse.course_component && (
            <div className="flex items-center text-gray-600 mb-1">
              <BookOpen size={14} className="mr-1" /> {selectedCourse.course_component}
            </div>
          )}
        </div>
        
        {selectedCourse.description && (
          <div className="mt-3 text-sm">
            <div className="font-medium mb-1">Description:</div>
            <p className="text-gray-700">{selectedCourse.description}</p>
          </div>
        )}
        
        {selectedCourse.notes && (
          <div className="mt-3 text-sm">
            <div className="font-medium mb-1">Notes:</div>
            <p className="text-gray-700">{selectedCourse.notes}</p>
          </div>
        )}
        
        {selectedCourse.evalData && selectedCourse.evalData.best_comment && (
          <div className="mt-3 text-sm">
            <div className="font-medium mb-1">Student Comment:</div>
            <p className="text-gray-700 italic">"{selectedCourse.evalData.best_comment}"</p>
          </div>
        )}
        
        <div className="mt-4">
          {isAdded ? (
            <button 
              className="w-full py-2 bg-red-600 text-white rounded-lg flex items-center justify-center"
              onClick={() => removeCourse(selectedCourse.course_id)}
            >
              <Minus size={16} className="mr-2" /> Remove course
            </button>
          ) : (
            <button 
              className="w-full py-2 bg-blue-600 text-white rounded-lg flex items-center justify-center"
              onClick={() => addCourse(selectedCourse)}
            >
              <Plus size={16} className="mr-2" /> Add course
            </button>
          )}
        </div>
      </div>
    );
  };
  
  export default CourseDetails;