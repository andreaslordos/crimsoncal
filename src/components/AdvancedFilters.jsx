import { useState, useMemo } from "react";
import { useAppContext } from "../context/AppContext";
import { ChevronDown, ChevronUp, Building, Clock } from "lucide-react";

const AdvancedFilters = () => {
  const { filters, setFilters, processedCourses } = useAppContext();
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Map of school names to acronyms
  const schoolAcronyms = {
    'Business School MBA': 'HBS',
    'Business School Doctoral': 'HBS',
    'Faculty of Arts & Sciences': 'FAS',
    'Harvard Law School': 'HLS',
    'Harvard Divinity School': 'HDS',
    'Graduate School of Design': 'GSD',
    'Graduate School of Education': 'GSE',
    'Harvard Kennedy School': 'HKS',
    'Harvard Chan School': 'HSPH',
    'Harvard T.H. Chan School of Public Health': 'HSPH',
    'Harvard Medical School': 'HMS',
    'School of Dental Medicine': 'HSDM',
    'Non-Harvard': 'NONH'
  };

  // Extract unique schools from courses and group by acronym
  const schoolGroups = useMemo(() => {
    const schoolSet = new Set();
    const groups = {};

    processedCourses.forEach(course => {
      if (course.school && course.school !== '') {
        schoolSet.add(course.school);
      }
    });

    // Group schools by acronym
    Array.from(schoolSet).forEach(school => {
      const acronym = schoolAcronyms[school] || school;
      if (!groups[acronym]) {
        groups[acronym] = [];
      }
      groups[acronym].push(school);
    });

    // Sort acronyms alphabetically
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([acronym, schools]) => ({
        acronym,
        schools,
        displayName: schools[0] // Use first school name for tooltip
      }));
  }, [processedCourses]);

  // Extract unique formats and consents
  const formatOptions = useMemo(() => {
    const formats = new Set();
    processedCourses.forEach(course => {
      if (course.course_component && course.course_component !== '') {
        formats.add(course.course_component);
      }
    });
    return Array.from(formats).sort();
  }, [processedCourses]);

  const consentOptions = useMemo(() => {
    const consents = new Set();
    processedCourses.forEach(course => {
      if (course.consent && course.consent !== '') {
        consents.add(course.consent);
      }
    });
    return Array.from(consents).sort();
  }, [processedCourses]);

  const toggleSchool = (schoolGroup) => {
    const currentSchools = filters.schools || [];
    let newSchools = [...currentSchools];
    
    // Check if any school from this group is selected
    const anySelected = schoolGroup.schools.some(school => currentSchools.includes(school));
    
    if (anySelected) {
      // Remove all schools from this group
      newSchools = currentSchools.filter(s => !schoolGroup.schools.includes(s));
    } else {
      // Add all schools from this group
      schoolGroup.schools.forEach(school => {
        if (!newSchools.includes(school)) {
          newSchools.push(school);
        }
      });
    }
    
    setFilters({
      ...filters,
      schools: newSchools
    });
  };

  const clearAdvancedFilters = () => {
    setFilters({
      ...filters,
      schools: [],
      timePresets: [],
      customStartTime: null,
      customEndTime: null,
      formats: [],
      consents: [],
      meetsOnceAWeek: false
    });
  };

  const selectAllSchools = () => {
    // Collect all schools from all groups
    const allSchools = schoolGroups.flatMap(group => group.schools);
    setFilters({
      ...filters,
      schools: allSchools
    });
  };

  // Time preset options
  const timePresets = [
    { id: 'morning', label: 'Morning', description: '9am-12pm' },
    { id: 'afternoon', label: 'Afternoon', description: '12pm-5pm' },
    { id: 'evening', label: 'Evening', description: '5pm-9pm' }
  ];

  // Generate time options for dropdowns
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 8; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 20 && minute > 0) break; // Stop at 8:00pm
        
        const hour12 = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
        const period = hour >= 12 ? 'pm' : 'am';
        const timeStr = `${hour12}:${minute.toString().padStart(2, '0')}${period}`;
        options.push(timeStr);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  const hasActiveFilters = (filters.schools && filters.schools.length > 0) ||
                          (filters.timePresets && filters.timePresets.length > 0) ||
                          filters.customStartTime ||
                          filters.customEndTime ||
                          (filters.formats && filters.formats.length > 0) ||
                          (filters.consents && filters.consents.length > 0) ||
                          filters.meetsOnceAWeek;

  // Build array of active filter descriptions
  const activeFilterPills = [];
  
  // Add time filter pills
  if (filters.timePresets && filters.timePresets.length > 0) {
    filters.timePresets.forEach(presetId => {
      const preset = timePresets.find(p => p.id === presetId);
      if (preset) {
        activeFilterPills.push(preset.label);
      }
    });
  } 
  
  if (filters.customStartTime) {
    activeFilterPills.push(`After ${filters.customStartTime}`);
  }
  if (filters.customEndTime) {
    activeFilterPills.push(`Before ${filters.customEndTime}`);
  }
  
  // Add school filter pills (show acronyms)
  if (filters.schools && filters.schools.length > 0) {
    const activeSchoolAcronyms = schoolGroups
      .filter(group => group.schools.some(s => filters.schools.includes(s)))
      .map(group => group.acronym);
    activeFilterPills.push(...activeSchoolAcronyms);
  }

  // Add format filter pill (single selection)
  if (filters.formats && filters.formats.length > 0 && filters.formats[0]) {
    activeFilterPills.push(filters.formats[0]);
  }

  // Add consent filter pills
  if (filters.consents && filters.consents.length > 0) {
    filters.consents.forEach(consent => {
      activeFilterPills.push(consent);
    });
  }

  // Add "meets once a week" filter pill
  if (filters.meetsOnceAWeek) {
    activeFilterPills.push('Once a week');
  }

  return (
    <div className="mb-4">
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors duration-150 text-sm border border-gray-300"
      >
        <span className="font-medium flex items-center flex-wrap gap-1 text-gray-700">
          <span>Advanced Filters</span>
          {activeFilterPills.map((pill, index) => (
            <span key={index} className="ml-1 px-2 py-0.5 bg-gray-900 text-white text-xs rounded-full">
              {pill}
            </span>
          ))}
        </span>
        {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {showAdvanced && (
        <div className="p-3 bg-white border border-gray-200 rounded-md space-y-4">
          {/* Time Filter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Clock size={14} className="mr-1" />
                Time of Day
              </label>
              {((filters.timePresets && filters.timePresets.length > 0) || filters.customStartTime || filters.customEndTime) && (
                <button
                  onClick={() => setFilters({ 
                    ...filters, 
                    timePresets: [],
                    customStartTime: null,
                    customEndTime: null
                  })}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              )}
            </div>
            
            {/* Time Preset Pills */}
            <div className="flex gap-2 mb-2">
              {timePresets.map(preset => {
                const isSelected = filters.timePresets && filters.timePresets.includes(preset.id);
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      const currentPresets = filters.timePresets || [];
                      const newPresets = isSelected
                        ? currentPresets.filter(p => p !== preset.id)
                        : [...currentPresets, preset.id];
                      setFilters({ 
                        ...filters, 
                        timePresets: newPresets,
                        customStartTime: null,
                        customEndTime: null
                      });
                    }}
                    className={`px-3 py-1.5 text-xs rounded-full transition-colors duration-150 font-medium ${
                      isSelected
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    title={preset.description}
                  >
                    {preset.label}
                    <span className="ml-1 text-xs opacity-75">({preset.description})</span>
                  </button>
                );
              })}
            </div>

            {/* OR divider */}
            <div className="flex items-center my-2">
              <div className="flex-1 border-t border-gray-200"></div>
              <span className="px-3 text-xs text-gray-400 font-light">OR</span>
              <div className="flex-1 border-t border-gray-200"></div>
            </div>

            {/* Custom Time Range */}
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <label className="text-xs text-gray-600 block mb-1">Start after</label>
                <select
                  value={filters.customStartTime || ''}
                  onChange={(e) => setFilters({ 
                    ...filters, 
                    customStartTime: e.target.value || null,
                    timePresets: []
                  })}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="">Any time</option>
                  {timeOptions.slice(0, -4).map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-600 block mb-1">End before</label>
                <select
                  value={filters.customEndTime || ''}
                  onChange={(e) => setFilters({ 
                    ...filters, 
                    customEndTime: e.target.value || null,
                    timePresets: []
                  })}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="">Any time</option>
                  {timeOptions.slice(4).map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* School Filter with Pills */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Building size={14} className="mr-1" />
                School
              </label>
              <div className="flex gap-2">
                <button
                  onClick={selectAllSchools}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Select All
                </button>
                <button
                  onClick={() => setFilters({ ...filters, schools: [] })}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {schoolGroups.map(group => {
                const isSelected = group.schools.some(school => filters.schools?.includes(school));
                return (
                  <button
                    key={group.acronym}
                    onClick={() => toggleSchool(group)}
                    className={`px-2 py-1 text-[10px] rounded-full transition-colors duration-150 font-medium ${
                      isSelected
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    title={group.displayName}
                  >
                    {group.acronym}
                  </button>
                );
              })}
            </div>
            {filters.schools && filters.schools.length > 0 && (
              <p className="text-xs text-gray-600 mt-2">
                {schoolGroups.filter(g => g.schools.some(s => filters.schools.includes(s))).length} school{schoolGroups.filter(g => g.schools.some(s => filters.schools.includes(s))).length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          {/* Format Filter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Format</label>
              {filters.formats && filters.formats.length > 0 && (
                <button
                  onClick={() => setFilters({ ...filters, formats: [] })}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              )}
            </div>
            <select
              value={filters.formats?.[0] || ''}
              onChange={(e) => {
                const value = e.target.value;
                setFilters({ ...filters, formats: value ? [value] : [] });
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 bg-white"
            >
              <option value="">All formats</option>
              {formatOptions.map(format => (
                <option key={format} value={format}>{format}</option>
              ))}
            </select>
          </div>

          {/* Consent Filter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Consent</label>
              {filters.consents && filters.consents.length > 0 && (
                <button
                  onClick={() => setFilters({ ...filters, consents: [] })}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {consentOptions.map(consent => {
                const isSelected = filters.consents?.includes(consent);
                return (
                  <button
                    key={consent}
                    onClick={() => {
                      const currentConsents = filters.consents || [];
                      const newConsents = isSelected
                        ? currentConsents.filter(c => c !== consent)
                        : [...currentConsents, consent];
                      setFilters({ ...filters, consents: newConsents });
                    }}
                    className={`px-2 py-1 text-[10px] rounded-full transition-colors duration-150 font-medium ${
                      isSelected
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {consent}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Meets Once a Week Filter */}
          <div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={filters.meetsOnceAWeek || false}
                onChange={(e) => setFilters({ ...filters, meetsOnceAWeek: e.target.checked })}
                className="mr-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Meets once a week
              </span>
            </label>
          </div>

          {/* Clear All Button */}
          {hasActiveFilters && (
            <button
              onClick={clearAdvancedFilters}
              className="w-full mt-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50 transition-colors duration-150"
            >
              Clear All Advanced Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedFilters;