import { useAppContext } from "../context/AppContext";
import { Clock, Calendar, Book, BookOpen, Star, Plus, User, Minus, GraduationCap } from "lucide-react";
import { formatTime } from "../utils/timeUtils";

const CourseDetails = () => {
  const { selectedCourse, myCourses, addCourse, removeCourse } = useAppContext();

  if (!selectedCourse) return null;

  const isAdded = myCourses.some(c => c.course_id === selectedCourse.course_id);

  // Define abbreviations for days
  const dayAbbrev = {
    monday: 'M',
    tuesday: 'Tu',
    wednesday: 'W',
    thursday: 'Th',
    friday: 'F',
    saturday: 'Sa',
    sunday: 'Su'
  };

  // Build a string from dayMap using abbreviations (e.g., "MW" for Monday and Wednesday)
  const meetingDays = selectedCourse.dayMap
    ? Object.entries(selectedCourse.dayMap)
        .filter(([_, active]) => active)
        .map(([day]) => dayAbbrev[day])
        .join('')
    : 'Not specified';

  // Format the meeting time range using your existing formatTime function
  const timeRange =
    selectedCourse.start_time && selectedCourse.end_time
      ? `${formatTime(selectedCourse.start_time)}-${formatTime(selectedCourse.end_time)}`
      : 'n/a';

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h2 className="text-lg font-semibold mb-2">
        {selectedCourse.subject_catalog}: {selectedCourse.course_title}
      </h2>

      <div className="text-sm">
      <div className="grid grid-cols-2 gap-2">
        {/* Instructor - always show */}
        <div className="flex items-center text-gray-600 mb-1 col-span-2">
          <User size={14} className="mr-1" /> 
          <span className="font-medium mr-1">Instructor:</span> {selectedCourse.instructors || 'TBA'}
        </div>

        {/* Capacity - only show if not n/a */}
        {selectedCourse.capacity && selectedCourse.capacity !== 'n/a' && (
          <div className="flex items-center text-gray-600 mb-1">
            <GraduationCap size={14} className="mr-1" /> 
            <span className="font-medium mr-1">Capacity:</span> {selectedCourse.capacity}
          </div>
        )}

        {/* Units - only show if not null or N/A */}
        {selectedCourse.units && selectedCourse.units !== 'n/a' && (
          <div className="flex items-center text-gray-600 mb-1">
            <Book size={14} className="mr-1" /> 
            <span className="font-medium mr-1">Units:</span> {selectedCourse.units}
          </div>
        )}

        {/* Rating - only show if exists */}
        {selectedCourse.evalData?.course_score_mean && (
          <div className="flex items-center text-gray-600 mb-1">
            <Star size={14} className="mr-1" /> 
            <span className="font-medium mr-1">Rating:</span>{" "}
            {Math.round(selectedCourse.evalData.course_score_mean * 10) / 10 + '/5'}
          </div>
        )}

        {/* Hours - only show if exists */}
        {selectedCourse.hours && (
          <div className="flex items-center text-gray-600 mb-1">
            <Clock size={14} className="mr-1" /> 
            <span className="font-medium mr-1">Hours:</span>{" "}
            {`${selectedCourse.hours} hrs`}
          </div>
        )}

        {/* Meeting Time - only show if we have meeting days */}
        {meetingDays && meetingDays !== 'Not specified' && (
          <div className="flex items-center text-gray-600 mb-1">
            <Calendar size={14} className="mr-1 mt-1 flex-shrink-0" /> 
            <span className="font-medium mr-1">Time:</span>{" "}
            {meetingDays} {timeRange}
          </div>
        )}
      </div>

      {selectedCourse.course_component && (
        <div className="flex items-center text-gray-600 mb-1">
          <BookOpen size={14} className="mr-1" /> 
          <span className="font-medium mr-1">Format:</span> {selectedCourse.course_component}
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
            className="cursor-pointer w-full py-3 md:py-2 bg-white text-teal-600 border border-teal-500 rounded-md flex items-center justify-center hover:bg-teal-50 hover:text-teal-700 transition-colors duration-200 text-base"
            onClick={() => {
              removeCourse(selectedCourse.course_id);
            }}
          >
            <Minus size={16} className="mr-2" /> Remove course
          </button>
        ) : (
          <button 
            className="cursor-pointer w-full py-3 md:py-2 bg-teal-600 text-white rounded-md flex items-center justify-center hover:bg-teal-700 transition-colors duration-200 text-base"
            onClick={() => {
              addCourse(selectedCourse);
              if (onAddCourse) onAddCourse(); // Close mobile sidebar after adding
            }}
          >
            <Plus size={16} className="mr-2" /> Add course
          </button>
        )}
      </div>

      <div className="mt-3 flex justify-between text-sm">
        {selectedCourse.evalData?.link ? (
          <a 
            href={selectedCourse.evalData.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="cursor-pointer hover:underline text-blue-600 hover:text-blue-700 transition-colors duration-150"
          >
            Show evaluations
          </a>
        ) : (
          <span className="text-gray-400 cursor-not-allowed">No evaluations available</span>
        )}
        
        <a 
          href={`https://portal.my.harvard.edu/psp/hrvihprd/EMPLOYEE/EMPL/h/?tab=HU_CLASS_SEARCH&SearchReqJSON=%7B%22ExcludeBracketed%22:true,%22SaveRecent%22:true,%22Facets%22:%5B%5D,%22PageNumber%22:1,%22SortOrder%22:%5B%22SCORE%22%5D,%22TopN%22:%22%22,%22PageSize%22:%22%22,%22SearchText%22:%22${selectedCourse.course_id}%22%7D`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="cursor-pointer hover:underline text-blue-600 hover:text-blue-700 transition-colors duration-150"
        >
          View in my.harvard
        </a>
      </div>
    </div>
  );
};

export default CourseDetails;
