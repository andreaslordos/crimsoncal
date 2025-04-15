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
      : 'N/A';

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h2 className="text-lg font-semibold mb-2">
        {selectedCourse.subject_catalog}: {selectedCourse.course_title}
      </h2>

      <div className="text-sm">
        <div className="grid grid-cols-2 gap-2">
          {/* Consent / Instructor */}
          <div className="flex items-center text-gray-600 mb-1">
            <User size={14} className="mr-1" /> 
            <span className="font-medium mr-1">Instructor:</span> {selectedCourse.instructors || 'Instructor'}
          </div>

          {/* Capacity */}
          <div className="flex items-center text-gray-600 mb-1">
            <GraduationCap size={14} className="mr-1" /> 
            <span className="font-medium mr-1">Capacity:</span> {selectedCourse.capacity}
          </div>

          {/* Units */}
          <div className="flex items-center text-gray-600 mb-1">
            <Book size={14} className="mr-1" /> 
            <span className="font-medium mr-1">Units:</span> {selectedCourse.units || 'N/A'}
          </div>

          {/* Rating */}
          <div className="flex items-center text-gray-600 mb-1">
            <Star size={14} className="mr-1" /> 
            <span className="font-medium mr-1">Rating:</span>{" "}
            {selectedCourse.evalData?.course_score_mean
              ? Math.round(selectedCourse.evalData.course_score_mean * 10) / 10 + '/5'
              : 'N/A'}
          </div>

          {/* Hours */}
          <div className="flex items-center text-gray-600 mb-1">
            <Clock size={14} className="mr-1" /> 
            <span className="font-medium mr-1">Hours:</span>{" "}
            {selectedCourse.hours ? `${selectedCourse.hours} hrs` : 'N/A'}
          </div>

          {/* Meeting Time */}
          <div className="flex items-center text-gray-600 mb-1">
            <Calendar size={14} className="mr-1 mt-1 flex-shrink-0" /> 
            <span className="font-medium mr-1">Time:</span>{" "}
            {meetingDays} {timeRange}
          </div>
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
