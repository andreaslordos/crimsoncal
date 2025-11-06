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
      customEndTime: null
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
                          filters.customEndTime;

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

  return (
    <div className="mb-4">
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors duration-150 text-sm border-2"
        style={{
          backgroundColor: 'var(--parchment-100)',
          borderColor: 'var(--parchment-300)',
          color: 'var(--ink-black)'
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--parchment-200)'}
        onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--parchment-100)'}
      >
        <span className="font-medium flex items-center flex-wrap gap-1">
          <span>Advanced Filters</span>
          {activeFilterPills.map((pill, index) => (
            <span key={index} className="ml-1 px-2 py-0.5 text-xs rounded-full" style={{
              backgroundColor: 'var(--harvard-crimson)',
              color: 'var(--parchment-50)'
            }}>
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
                    className="px-3 py-1.5 text-xs rounded-full transition-colors duration-150 font-medium"
                    style={isSelected
                      ? {
                          backgroundColor: 'var(--harvard-crimson)',
                          color: 'var(--parchment-50)'
                        }
                      : {
                          backgroundColor: 'var(--parchment-100)',
                          color: 'var(--leather-brown)'
                        }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.target.style.backgroundColor = 'var(--parchment-200)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.target.style.backgroundColor = 'var(--parchment-100)';
                      }
                    }}
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
                    className="px-2 py-1 text-[10px] rounded-full transition-colors duration-150 font-medium"
                    style={isSelected
                      ? {
                          backgroundColor: 'var(--harvard-crimson)',
                          color: 'var(--parchment-50)'
                        }
                      : {
                          backgroundColor: 'var(--parchment-100)',
                          color: 'var(--leather-brown)'
                        }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.target.style.backgroundColor = 'var(--parchment-200)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.target.style.backgroundColor = 'var(--parchment-100)';
                      }
                    }}
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