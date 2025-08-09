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
    'Faculty of Arts and Sciences': 'FAS',
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
      timePreset: null,
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

  const hasActiveFilters = filters.schools && filters.schools.length > 0;

  return (
    <div className="mb-4">
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-150 text-sm border border-gray-300"
      >
        <span className="font-medium flex items-center">
          Advanced Filters
          {hasActiveFilters && (
            <span className="ml-2 px-2 py-0.5 bg-teal-600 text-white text-xs rounded-full">
              Active
            </span>
          )}
        </span>
        {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {showAdvanced && (
        <div className="mt-3 p-3 bg-white border border-gray-200 rounded-md">
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
                    className={`px-3 py-1.5 text-xs rounded-full transition-colors duration-150 font-medium ${
                      isSelected
                        ? 'bg-teal-600 text-white'
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