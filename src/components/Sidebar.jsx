import { useAppContext } from "../context/AppContext";
import CategoryFilters from "./CategoryFilters";
import DayFilter from "./DayFilter";
import AdvancedFilters from "./AdvancedFilters";
import CourseList from "./CourseList";
import CourseDetails from "./CourseDetails";
import { Search } from "lucide-react";

const Sidebar = ({ onCloseMobile, isMobile }) => {
  const { filters, setFilters, selectedCourse, totalHours, totalUnits } = useAppContext();

  const handleSearchKeyDown = (e) => {
    // Handle Tab key to activate course code prefix filter
    if (e.key === 'Tab' && filters.search && !filters.courseCodePrefix) {
      const searchTrimmed = filters.search.trim();
      // Check if the search term is all letters (potential course code prefix)
      if (/^[a-zA-Z]+$/.test(searchTrimmed)) {
        e.preventDefault();
        // Set the course code prefix filter (keep the search text as-is)
        setFilters({
          ...filters,
          courseCodePrefix: searchTrimmed.toUpperCase()
        });
      }
    }
    // Handle Backspace key to deactivate course code prefix filter
    else if (e.key === 'Backspace' && filters.courseCodePrefix && filters.search === '') {
      e.preventDefault();
      // Clear the course code prefix filter
      setFilters({
        ...filters,
        courseCodePrefix: null
      });
    }
  };

  const removePrefixFilter = () => {
    setFilters({
      ...filters,
      courseCodePrefix: null
    });
  };

  return (
    <div className="w-full h-full flex flex-col bg-white" style={{
      borderLeft: isMobile ? 'none' : '1px solid #e5e5e5'
    }}>
      <div className={`${isMobile ? 'p-0' : 'p-4'} flex-1 overflow-y-auto`}>
        <div className="text-center text-sm font-medium text-gray-600 mb-4 mt-6 md:mt-0">
          <div>{totalHours} hours • {totalUnits} units</div>
        </div>

        {/* Category filters */}
        <CategoryFilters />

        {/* Day filter */}
        <DayFilter />

        {/* Advanced filters */}
        <AdvancedFilters />

        {/* Search box */}
        <div className="mb-4 relative">
          <div className="relative flex items-center">
            {filters.courseCodePrefix && (
              <div className="absolute left-2.5 flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                <span>{filters.courseCodePrefix}</span>
                <button
                  onClick={removePrefixFilter}
                  className="hover:bg-blue-200 rounded-full w-4 h-4 flex items-center justify-center transition-colors"
                  aria-label="Remove filter"
                >
                  ×
                </button>
              </div>
            )}
            <input
              type="text"
              placeholder={filters.courseCodePrefix ? "Search within prefix..." : "Code, course name or instructor.."}
              className="w-full p-2.5 rounded border border-gray-300 text-sm transition-colors focus:outline-none focus:border-gray-400 bg-white"
              style={filters.courseCodePrefix ? { paddingLeft: `${filters.courseCodePrefix.length * 8 + 50}px` } : {}}
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              onKeyDown={handleSearchKeyDown}
            />
            <div className="absolute right-3 top-2.5 text-gray-400">
              <Search size={16} />
            </div>
          </div>
        </div>

        {/* Course list */}
        <CourseList />

        {/* Selected course details - shown only on desktop */}
        {!isMobile && selectedCourse && (
          <CourseDetails onAddCourse={onCloseMobile} />
        )}
      </div>
    </div>
  );
};

export default Sidebar;