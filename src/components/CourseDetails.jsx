import { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { Clock, Calendar, Book, BookOpen, Star, Plus, User, Minus, GraduationCap, ChevronDown, Users, ChevronUp, MapPin } from "lucide-react";
import { formatTime } from "../utils/timeUtils";

const CourseDetails = ({ onAddCourse }) => {
  const { selectedCourse, myCourses, addCourse, removeCourse, updateCourseSection } = useAppContext();
  const [selectedSection, setSelectedSection] = useState(null);
  const [showSectionDropdown, setShowSectionDropdown] = useState(false);
  const [showEvaluations, setShowEvaluations] = useState(false);

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
    <div
      className="mt-4 p-6 rounded-xl"
      style={{
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
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

          {/* Location */}
          {displaySection.location && (
            <div className="flex items-center text-gray-600">
              <MapPin size={14} className="mr-1 flex-shrink-0" />
              <span className="font-medium mr-1">Location:</span>{" "}
              <span className="truncate">{displaySection.location}</span>
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
            className="cursor-pointer w-full py-3 md:py-2 rounded-lg flex items-center justify-center transition-all duration-200 text-base font-medium"
            style={{
              background: 'var(--color-bg-secondary)',
              color: 'var(--color-primary)',
              border: '1px solid var(--color-primary)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#eff6ff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--color-bg-secondary)';
            }}
            onClick={() => {
              removeCourse(selectedCourse.course_id);
            }}
          >
            <Minus size={16} className="mr-2" /> Remove course
          </button>
        ) : (
          <button
            className="cursor-pointer w-full py-3 md:py-2 rounded-lg flex items-center justify-center transition-all duration-200 text-base font-medium text-white"
            style={{
              background: 'var(--color-primary)',
              boxShadow: 'var(--shadow-sm)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-primary-hover)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--color-primary)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
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
        {selectedCourse.historical_semesters && Object.keys(selectedCourse.historical_semesters).length > 0 ? (
          <button
            onClick={() => setShowEvaluations(!showEvaluations)}
            className="cursor-pointer hover:underline text-blue-600 hover:text-blue-700 transition-colors duration-150 flex items-center"
          >
            {showEvaluations ? (
              <>Hide evaluations <ChevronUp size={14} className="ml-1" /></>
            ) : (
              <>Show evaluations <ChevronDown size={14} className="ml-1" /></>
            )}
          </button>
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

      {/* Expanded Evaluations Section */}
      {showEvaluations && (
        <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200">
          <div className="text-sm">
            {selectedCourse.historical_semesters && Object.keys(selectedCourse.historical_semesters).length > 0 ? (
              <>
                <div className="mb-2">
                  <a 
                    href={`https://qreports.fas.harvard.edu/search/courses?school=FAS&term=&department=&subject=&instructor=&search=${selectedCourse.course_id}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-xs"
                  >
                    Go to QGuide →
                  </a>
                </div>
                <div className="space-y-2">
                  {Object.entries(selectedCourse.historical_semesters)
                    .sort(([a], [b]) => b.localeCompare(a)) // Sort by semester, newest first
                    .map(([semester, data]) => (
                      <div key={semester} className="border-b border-gray-200 pb-2 last:border-0">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <span className="font-medium">{semester.replace(/(\d{4})([A-Z])/, '$1 $2')}</span>
                            {data.avg_course_rating && (
                              <span className="ml-2 text-gray-600">
                                <Star size={12} className="inline mr-1" />
                                {data.avg_course_rating.toFixed(2)}/5.0
                              </span>
                            )}
                            {data.avg_hours_per_week && (
                              <span className="ml-2 text-gray-600">
                                <Clock size={12} className="inline mr-1" />
                                {data.avg_hours_per_week.toFixed(1)} hrs
                              </span>
                            )}
                            {data.avg_num_students && (
                              <span className="ml-2 text-gray-600">
                                <Users size={12} className="inline mr-1" />
                                {Math.round(data.avg_num_students)} students
                              </span>
                            )}
                          </div>
                        </div>
                        {data.professors && data.professors.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            Instructors: {data.professors.slice(0, 3).join(', ')}
                            {data.professors.length > 3 && ` +${data.professors.length - 3} more`}
                          </div>
                        )}
                        {data.num_sections && data.num_sections > 1 && (
                          <div className="text-xs text-gray-500">
                            {data.num_sections} sections
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </>
            ) : (
              <div className="text-gray-500 text-center py-2">
                No historical evaluation data available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetails;