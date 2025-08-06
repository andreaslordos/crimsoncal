import { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { Clock, Calendar, Book, BookOpen, Star, Plus, User, Minus, GraduationCap, ChevronDown, Users } from "lucide-react";
import { formatTime } from "../utils/timeUtils";

const CourseDetails = ({ onAddCourse }) => {
  const { selectedCourse, myCourses, addCourse, removeCourse, updateCourseSection } = useAppContext();
  const [selectedSection, setSelectedSection] = useState(null);
  const [showSectionDropdown, setShowSectionDropdown] = useState(false);

  // Reset selected section when course changes
  useEffect(() => {
    if (selectedCourse && selectedCourse.sections && selectedCourse.sections.length > 0) {
      // Check if this course is already in myCourses and has a selected section
      const existingCourse = myCourses.find(c => c.course_id === selectedCourse.course_id);
      if (existingCourse && existingCourse.selectedSection) {
        setSelectedSection(existingCourse.selectedSection);
      } else {
        // Default to first section
        setSelectedSection(selectedCourse.sections[0]);
      }
    } else {
      setSelectedSection(null);
    }
    setShowSectionDropdown(false);
  }, [selectedCourse, myCourses]);

  if (!selectedCourse) return null;

  const isAdded = myCourses.some(c => c.course_id === selectedCourse.course_id);
  const hasMultipleSections = selectedCourse.sections && selectedCourse.sections.length > 1;
  
  // Use selected section data if available, otherwise use course defaults
  const displaySection = selectedSection || (selectedCourse.sections && selectedCourse.sections[0]) || {};

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

  // Build a string from dayMap using abbreviations
  const getMeetingDays = (section) => {
    if (section.dayMap) {
      const days = Object.entries(section.dayMap)
        .filter(([_, active]) => active)
        .map(([day]) => dayAbbrev[day])
        .join('');
      return days || 'TBA';
    }
    return 'TBA';
  };

  // Format the meeting time range
  const getTimeRange = (section) => {
    if (section.start_time && section.end_time) {
      return `${formatTime(section.start_time)}-${formatTime(section.end_time)}`;
    }
    return 'TBA';
  };

  const handleSectionChange = (section) => {
    setSelectedSection(section);
    setShowSectionDropdown(false);
    
    // If course is already added, update its section in myCourses
    if (isAdded) {
      updateCourseSection(selectedCourse.course_id, section);
    }
  };

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h2 className="text-lg font-semibold mb-2">
        {selectedCourse.subject_catalog}: {selectedCourse.course_title}
      </h2>

      {/* Section Selector - show if multiple sections exist */}
      {hasMultipleSections && (
        <div className="mb-3 p-3 bg-white rounded-md border border-gray-200">
          <div className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <Users size={14} className="mr-1" />
            Section Selection
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowSectionDropdown(!showSectionDropdown)}
              className="w-full px-3 py-2 text-left bg-gray-50 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors duration-150 flex items-center justify-between text-sm"
            >
              <div>
                <span className="font-medium">Section {displaySection.section}</span>
                {displaySection.instructors && (
                  <span className="text-gray-600 ml-2">• {displaySection.instructors}</span>
                )}
                {displaySection.start_time && (
                  <span className="text-gray-600 ml-2">
                    • {getMeetingDays(displaySection)} {getTimeRange(displaySection)}
                  </span>
                )}
              </div>
              <ChevronDown 
                size={16} 
                className={`transition-transform duration-200 ${showSectionDropdown ? 'rotate-180' : ''}`}
              />
            </button>
            
            {showSectionDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {selectedCourse.sections.map((section) => (
                  <button
                    key={section.section}
                    onClick={() => handleSectionChange(section)}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-50 text-sm border-b border-gray-100 last:border-b-0 
                      ${selectedSection && selectedSection.section === section.section ? 'bg-teal-50' : ''}`}
                  >
                    <div className="font-medium">Section {section.section}</div>
                    <div className="text-gray-600 text-xs mt-1">
                      {section.instructors && <div>Instructor: {section.instructors}</div>}
                      {section.start_time && (
                        <div>Time: {getMeetingDays(section)} {getTimeRange(section)}</div>
                      )}
                      {section.enrollment && <div>Enrollment: {section.enrollment}</div>}
                      {section.instruction_mode && <div>Mode: {section.instruction_mode}</div>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Show selected section details */}
          {selectedSection && (
            <div className="mt-2 text-xs text-gray-600">
              {selectedSection.enrollment && (
                <div>Enrollment: {selectedSection.enrollment}</div>
              )}
              {selectedSection.instruction_mode && (
                <div>Mode: {selectedSection.instruction_mode}</div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="text-sm">
        {/* Instructor - full width */}
        <div className="flex items-center text-gray-600 mb-3">
          <User size={14} className="mr-1" /> 
          <span className="font-medium mr-1">Instructor:</span> 
          {displaySection.instructors || selectedCourse.instructors || 'TBA'}
        </div>

        {/* Two column grid for details */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {/* Left Column */}
          
          {/* Meeting Time */}
          {displaySection.start_time && (
            <div className="flex items-center text-gray-600">
              <Calendar size={14} className="mr-1 flex-shrink-0" /> 
              <span className="font-medium mr-1">Time:</span>{" "}
              <span className="truncate">{getMeetingDays(displaySection)} {getTimeRange(displaySection)}</span>
            </div>
          )}

          {/* Units */}
          {selectedCourse.units && selectedCourse.units !== 'n/a' && (
            <div className="flex items-center text-gray-600">
              <Book size={14} className="mr-1" /> 
              <span className="font-medium mr-1">Units:</span> {selectedCourse.units}
            </div>
          )}

          {/* Rating */}
          {selectedCourse.rating && (
            <div className="flex items-center text-gray-600">
              <Star size={14} className="mr-1" /> 
              <span className="font-medium mr-1">Rating:</span>{" "}
              {Math.round(selectedCourse.rating * 10) / 10}/5
            </div>
          )}

          {/* Capacity */}
          {displaySection.capacity && displaySection.capacity !== 'n/a' && (
            <div className="flex items-center text-gray-600">
              <GraduationCap size={14} className="mr-1" /> 
              <span className="font-medium mr-1">Capacity:</span> {displaySection.capacity}
            </div>
          )}

          {/* Hours per week */}
          {selectedCourse.hours && (
            <div className="flex items-center text-gray-600">
              <Clock size={14} className="mr-1" /> 
              <span className="font-medium mr-1">Hours/week:</span>{" "}
              {selectedCourse.hours}
            </div>
          )}

          {/* Average Students */}
          {selectedCourse.latest_num_students && selectedCourse.latest_num_students > 0 && (
            <div className="flex items-center text-gray-600">
              <Users size={14} className="mr-1" /> 
              <span className="font-medium mr-1">Avg Students:</span>{" "}
              {Math.round(selectedCourse.latest_num_students)}
            </div>
          )}

          {/* Format */}
          {selectedCourse.course_component && (
            <div className="flex items-center text-gray-600">
              <BookOpen size={14} className="mr-1" /> 
              <span className="font-medium mr-1">Format:</span> {selectedCourse.course_component}
            </div>
          )}

          {/* Final Exam */}
          {selectedCourse.exam && selectedCourse.exam !== 'N/A' && selectedCourse.exam !== '' && (
            <div className="flex items-center text-gray-600">
              <Calendar size={14} className="mr-1" /> 
              <span className="font-medium mr-1">Final Exam:</span> {selectedCourse.exam}
            </div>
          )}
        </div>
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
              addCourse(selectedCourse, selectedSection);
              if (onAddCourse) onAddCourse(); // Close mobile sidebar after adding
            }}
          >
            <Plus size={16} className="mr-2" /> Add course
          </button>
        )}
      </div>

      <div className="mt-3 flex justify-between text-sm">
        <a 
          href={`https://qreports.fas.harvard.edu/search/courses?school=FAS&term=&department=&subject=&instructor=&search=${selectedCourse.course_id}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="cursor-pointer hover:underline text-blue-600 hover:text-blue-700 transition-colors duration-150"
        >
          Show evaluations
        </a>
        
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