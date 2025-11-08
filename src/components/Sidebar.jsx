import { useState } from "react";
import { useAppContext } from "../context/AppContext";
import CategoryFilters from "./CategoryFilters";
import DayFilter from "./DayFilter";
import AdvancedFilters from "./AdvancedFilters";
import CourseList from "./CourseList";
import CourseDetails from "./CourseDetails";
import { Search } from "lucide-react";

const Sidebar = ({ onCloseMobile, isMobile }) => {
  const { filters, setFilters, selectedCourse, totalHours, totalUnits } = useAppContext();
  const [selectedPillIndex, setSelectedPillIndex] = useState(null);

  const handleSearchKeyDown = (e) => {
    // Handle Tab key to add course code prefix filter
    if (e.key === 'Tab' && filters.search) {
      const searchTrimmed = filters.search.trim();
      // Check if the search term is all letters (potential course code prefix)
      if (/^[a-zA-Z]+$/.test(searchTrimmed)) {
        e.preventDefault();
        const prefixUpper = searchTrimmed.toUpperCase();

        // Only add if not already in the array
        if (!filters.courseCodePrefixes.includes(prefixUpper)) {
          setFilters({
            ...filters,
            courseCodePrefixes: [...filters.courseCodePrefixes, prefixUpper],
            search: ''
          });
          setSelectedPillIndex(null); // Reset selection when adding new pill
        } else {
          // If already exists, just clear the search
          setFilters({
            ...filters,
            search: ''
          });
        }
      }
    }
    // Handle Arrow keys for pill navigation
    else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && filters.courseCodePrefixes.length > 0) {
      e.preventDefault();

      if (e.key === 'ArrowLeft') {
        // Move selection left
        if (selectedPillIndex === null) {
          // Select the last pill
          setSelectedPillIndex(filters.courseCodePrefixes.length - 1);
        } else if (selectedPillIndex > 0) {
          // Move to previous pill
          setSelectedPillIndex(selectedPillIndex - 1);
        }
      } else if (e.key === 'ArrowRight') {
        // Move selection right
        if (selectedPillIndex === null) {
          // Select the first pill
          setSelectedPillIndex(0);
        } else if (selectedPillIndex < filters.courseCodePrefixes.length - 1) {
          // Move to next pill
          setSelectedPillIndex(selectedPillIndex + 1);
        } else {
          // Deselect if at the end
          setSelectedPillIndex(null);
        }
      }
    }
    // Handle Backspace key
    else if (e.key === 'Backspace') {
      if (selectedPillIndex !== null) {
        // Remove the selected pill
        e.preventDefault();
        const newPrefixes = filters.courseCodePrefixes.filter((_, index) => index !== selectedPillIndex);
        setFilters({
          ...filters,
          courseCodePrefixes: newPrefixes
        });

        // Adjust selection after deletion
        if (newPrefixes.length === 0) {
          setSelectedPillIndex(null);
        } else if (selectedPillIndex >= newPrefixes.length) {
          setSelectedPillIndex(newPrefixes.length - 1);
        }
      } else if (filters.search === '' && filters.courseCodePrefixes.length > 0) {
        // Select the last pill if search is empty
        e.preventDefault();
        setSelectedPillIndex(filters.courseCodePrefixes.length - 1);
      }
    }
    // Handle Escape key to clear selection
    else if (e.key === 'Escape' && selectedPillIndex !== null) {
      e.preventDefault();
      setSelectedPillIndex(null);
    }
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
            {filters.courseCodePrefixes && filters.courseCodePrefixes.length > 0 && (
              <div className="absolute left-2.5 flex items-center gap-1.5">
                {filters.courseCodePrefixes.map((prefix, index) => (
                  <div
                    key={prefix}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      selectedPillIndex === index
                        ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    <span>{prefix}</span>
                  </div>
                ))}
              </div>
            )}
            <input
              type="text"
              placeholder={filters.courseCodePrefixes.length > 0 ? "Search within prefixes..." : "Code, course name or instructor.."}
              className="w-full p-2.5 rounded border border-gray-300 text-sm transition-colors focus:outline-none focus:border-gray-400 bg-white"
              style={filters.courseCodePrefixes.length > 0 ? {
                paddingLeft: `${filters.courseCodePrefixes.reduce((total, prefix) =>
                  total + prefix.length * 8 + 30, 15
                )}px`
              } : {}}
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              onKeyDown={handleSearchKeyDown}
              onClick={() => setSelectedPillIndex(null)}
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