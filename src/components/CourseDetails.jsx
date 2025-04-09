import { useAppContext } from "../context/AppContext";
import { Clock, Calendar, Book, BookOpen, Star, Plus, User, Minus, Map, GraduationCap } from "lucide-react";

const CourseDetails = () => {
    const { selectedCourse, myCourses, addCourse, removeCourse } = useAppContext();
    
    if (!selectedCourse) return null;
    
    const isAdded = myCourses.some(c => c.course_id === selectedCourse.course_id);
    
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold mb-2">
          {selectedCourse.subject_catalog}: {selectedCourse.course_title}
        </h2>
        
        {selectedCourse.evalData && (
          <div className="mb-2 text-sm bg-blue-50 p-2 rounded border border-blue-100">
            {selectedCourse.evalData.best_comment && (
              <p className="text-gray-700 italic mb-1">"{selectedCourse.evalData.best_comment}"</p>
            )}
            <div className="text-blue-600 flex items-center">
              <Map size={14} className="mr-1" /> Cambridge Campus
            </div>
          </div>
        )}
        
        <div className="text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center text-gray-600 mb-1">
              <User size={14} className="mr-1" /> 
              <span className="font-medium mr-1">Consent:</span> 
              {selectedCourse.instructors ? selectedCourse.instructors : 'Instructor'}
            </div>
            
            <div className="flex items-center text-gray-600 mb-1">
              <GraduationCap size={14} className="mr-1" /> 
              <span className="font-medium mr-1">Capacity:</span> 18
            </div>
            
            <div className="flex items-center text-gray-600 mb-1">
              <Book size={14} className="mr-1" /> 
              <span className="font-medium mr-1">Units:</span> 
              {selectedCourse.units || 4}
            </div>
            
            <div className="flex items-center text-gray-600 mb-1">
              <Star size={14} className="mr-1" /> 
              <span className="font-medium mr-1">Rating:</span> 
              {selectedCourse.evalData?.course_score_mean 
                ? Math.round(selectedCourse.evalData.course_score_mean * 10) / 10 + '/5' 
                : 'N/A'}
            </div>
            
            <div className="flex items-center text-gray-600 mb-1">
              <Clock size={14} className="mr-1" /> 
              <span className="font-medium mr-1">Hours:</span> 
              {selectedCourse.start_time && selectedCourse.end_time 
                ? `${selectedCourse.start_time} - ${selectedCourse.end_time}` 
                : '3'}
            </div>
            
            <div className="flex text-gray-600 mb-1">
              <Calendar size={14} className="mr-1 mt-1 flex-shrink-0" /> 
              <div>
                <span className="font-medium mr-1">T:</span>
                {selectedCourse.dayMap && Object.entries(selectedCourse.dayMap)
                  .filter(([_, isActive]) => isActive)
                  .map(([day]) => day.charAt(0).toUpperCase() + day.slice(1))
                  .join(', ')}
                {!selectedCourse.dayMap || !Object.values(selectedCourse.dayMap).some(Boolean) 
                  ? 'Not specified' 
                  : ''}
              </div>
            </div>
          </div>
          
          {selectedCourse.course_component && (
            <div className="flex items-center text-gray-600 mb-1">
              <BookOpen size={14} className="mr-1" /> 
              <span className="font-medium mr-1">Format:</span> 
              {selectedCourse.course_component}
            </div>
          )}
          
          {selectedCourse.evalData?.evalURL && (
            <div className="text-blue-600 text-xs mt-2">
              <a href={selectedCourse.evalData.evalURL} target="_blank" rel="noopener noreferrer">
                View Evaluations
              </a>
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
        
        <div className="mt-4 flex gap-2">
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
        
        <div className="mt-3 flex justify-between text-sm text-blue-600">
          <button className="hover:underline">Show course notes</button>
          <button className="hover:underline">Show evaluation history</button>
        </div>
      </div>
    );
  };
  
  export default CourseDetails;