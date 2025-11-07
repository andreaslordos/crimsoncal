import { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { Clock, Star, Plus, Minus, ChevronDown, Users, ChevronUp } from "lucide-react";
import { formatTime } from "../utils/timeUtils";

const CourseDetails = ({ onAddCourse }) => {
  const { selectedCourse, myCourses, addCourse, removeCourse, updateCourseSection, filters, setFilters } = useAppContext();
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

  // Determine if we have a real schedule (days and times) and a real location
  const hasSchedule = (() => {
    const section = displaySection || {};
    const hasTime = Boolean(section.start_time && section.end_time);
    const hasDays = Boolean(section.dayMap && Object.values(section.dayMap).some(Boolean));
    return hasTime && hasDays;
  })();
  const hasLocation = (() => {
    const loc = displaySection && displaySection.location;
    if (!loc) return false;
    const trimmed = String(loc).trim();
    return !/^(to\s*be\s*announced|tba)$/i.test(trimmed);
  })();

  return (
    <div className="mt-4 p-4 rounded-lg border bg-gray-50 text-left" style={{
      borderColor: '#e5e5e5'
    }}>
      <h2 className="text-lg font-semibold mb-2 text-gray-900">
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

      <div className="text-sm text-gray-700">
        {/* Line 1: Consent, Enrollment, Units, Format, Gen Ed, Divisional Distribution, Quantitative Reasoning */}
        <div className="mb-1">
          {selectedCourse.consent && (
            <>
              <em>Consent</em>: {selectedCourse.consent}
              <span className="mx-2" />
            </>
          )}
          {(() => {
            const capRaw = displaySection && displaySection.capacity;
            const enrollRaw = (displaySection && displaySection.enrollment) || selectedCourse.enrollment;
            const capStr = (capRaw !== undefined && capRaw !== null) ? String(capRaw).trim() : '';
            const enrollStr = (enrollRaw !== undefined && enrollRaw !== null) ? String(enrollRaw).trim() : '';
            const capNum = Number(capRaw);
            const enrollNum = Number(enrollRaw);
            let value = null;
            // Case 1: enrollment already provided as "x/y"
            if (enrollStr && enrollStr.includes('/')) {
              value = enrollStr;
            // Case 2: explicit "No Limit" capacity
            } else if (capStr && /no\s*limit/i.test(capStr)) {
              value = 'No Limit';
            // Case 3: numeric capacity, compose x/y
            } else if (!Number.isNaN(capNum) && capNum > 0) {
              const enrolledCount = !Number.isNaN(enrollNum)
                ? enrollNum
                : (enrollStr && /^\d+$/.test(enrollStr) ? Number(enrollStr) : 0);
              value = `${enrolledCount}/${capNum}`;
            }
            return value ? (
              <>
                <em>Enrollment</em>: {value}
                <span className="mx-2" />
              </>
            ) : null;
          })()}
          {selectedCourse.units && selectedCourse.units !== 'n/a' && (
            <>
              <em>Units</em>: {selectedCourse.units}
              <span className="mx-2" />
            </>
          )}
          {selectedCourse.course_component && (
            <>
              <em>Format</em>: {selectedCourse.course_component}
              <span className="mx-2" />
            </>
          )}
          {selectedCourse.general_education && selectedCourse.general_education !== 'N/A' && (
            <>
              <em>Gen Ed</em>: {selectedCourse.general_education}
              <span className="mx-2" />
            </>
          )}
          {selectedCourse.quantitative_reasoning && selectedCourse.quantitative_reasoning !== 'N/A' && (
            <>
              <em>QRD</em>: {selectedCourse.quantitative_reasoning}
            </>
          )}
        </div>

        {/* Line 2: QGuide metrics (only if present) */}
        {(selectedCourse.rating ||
          selectedCourse.hours ||
          (selectedCourse.latest_num_students && selectedCourse.latest_num_students > 0) ||
          (selectedCourse.historical_semesters && Object.keys(selectedCourse.historical_semesters).length > 0)) && (
          <div className="mb-1 text-gray-700">
            {selectedCourse.rating && (
              <>
                <em>Rating</em>: {(Math.round(selectedCourse.rating * 10) / 10).toFixed(1)}
                <span className="mx-2" />
              </>
            )}
            {selectedCourse.hours && (
              <>
                <em>Hours</em>: {selectedCourse.hours}
                <span className="mx-2" />
              </>
            )}
            {selectedCourse.latest_num_students && selectedCourse.latest_num_students > 0 && (
              <>
                <em>Avg Students</em>: {Math.round(selectedCourse.latest_num_students)}
                <span className="mx-2" />
              </>
            )}
            <a 
              href={`https://qreports.fas.harvard.edu/search/courses?school=FAS&term=&department=&subject=&instructor=&search=${selectedCourse.course_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              <u>QGuide</u>
            </a>
          </div>
        )}

        {/* Line 3: Instructor(s) with clickable names to search */}
        <div className="mb-1">
          {(() => {
            const raw = (displaySection.instructors || selectedCourse.instructors || '').trim();
            const names = raw
              .split(',')
              .map(n => n.trim())
              .filter(n => n.length > 0 && !/^(tba|to be announced)$/i.test(n));
            const label = names.length === 1 ? 'Instructor' : 'Instructors';
            if (names.length === 0) {
              return <><em>Instructor</em>: TBA</>;
            }
            return (
              <>
                <em>{label}</em>:{" "}
                {names.map((name, idx) => (
                  <span key={`${name}-${idx}`}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setFilters({ ...filters, search: name });
                      }}
                      className="text-blue-600 underline hover:underline"
                    >
                      {name}
                    </a>
                    {idx < names.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </>
            );
          })()}
        </div>

        {/* Line 4: Bold schedule and optional location */}
        {(hasSchedule || hasLocation) && (
          <div className="mb-2">
            {hasSchedule && (
              <strong>
                {getMeetingDays(displaySection)} {getTimeRange(displaySection)}
              </strong>
            )}
            {hasSchedule && hasLocation && ' '}
            {hasLocation && <em>({displaySection.location})</em>}
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2 justify-start">
        <button
          className={`cursor-pointer w-full md:w-auto py-3 md:py-2 px-4 md:px-5 rounded-md inline-flex items-center justify-center transition-colors duration-200 text-sm font-medium shadow-sm border ${
            isAdded
              ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              : 'text-white border-transparent'
          }`}
          style={!isAdded ? { backgroundColor: 'var(--harvard-crimson)' } : undefined}
          onMouseEnter={!isAdded ? (e) => (e.target.style.backgroundColor = 'var(--harvard-crimson-dark)') : undefined}
          onMouseLeave={!isAdded ? (e) => (e.target.style.backgroundColor = 'var(--harvard-crimson)') : undefined}
          onClick={() => {
            if (isAdded) {
              removeCourse(selectedCourse.course_id);
            } else {
              addCourse(selectedCourse, selectedSection);
              if (onAddCourse) onAddCourse(); // Close mobile sidebar after adding
            }
          }}
        >
          {isAdded ? <Minus size={16} className="mr-2" /> : <Plus size={16} className="mr-2" />}
          {isAdded ? 'Remove course' : 'Add course'}
        </button>
      </div>

      {selectedCourse.description && (
        <div className="mt-3 text-sm">
          <p className="text-gray-700">{selectedCourse.description}</p>
        </div>
      )}

      {selectedCourse.notes && (
        <div className="mt-3 text-sm">
          <div className="font-medium mb-1">Notes:</div>
          <p className="text-gray-700">{selectedCourse.notes}</p>
        </div>
      )}

      <div className="mt-3 flex justify-between items-center text-sm">
        {selectedCourse.historical_semesters && Object.keys(selectedCourse.historical_semesters).length > 0 ? (
          <button
            onClick={() => setShowEvaluations(!showEvaluations)}
            className="cursor-pointer text-gray-600 hover:text-gray-900 hover:underline transition-colors duration-150 flex items-center"
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

        <div className="flex gap-3">
          {selectedCourse.course_website && (
            <a
              href={selectedCourse.course_website}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer text-gray-600 hover:text-gray-900 underline transition-colors duration-150"
            >
              Canvas
            </a>
          )}
          <a
            href={`https://portal.my.harvard.edu/psp/hrvihprd/EMPLOYEE/EMPL/h/?tab=HU_CLASS_SEARCH&SearchReqJSON=%7B%22ExcludeBracketed%22:true,%22SaveRecent%22:true,%22Facets%22:%5B%5D,%22PageNumber%22:1,%22SortOrder%22:%5B%22SCORE%22%5D,%22TopN%22:%22%22,%22PageSize%22:%22%22,%22SearchText%22:%22${selectedCourse.course_id}%22%7D`}
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer text-gray-600 hover:text-gray-900 underline transition-colors duration-150"
          >
            my.harvard
          </a>
        </div>
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