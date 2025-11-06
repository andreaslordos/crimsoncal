import { useAppContext } from "../context/AppContext";
import CategoryFilters from "./CategoryFilters";
import DayFilter from "./DayFilter";
import AdvancedFilters from "./AdvancedFilters";
import CourseList from "./CourseList";
import CourseDetails from "./CourseDetails";
import { Search } from "lucide-react";

const Sidebar = ({ onCloseMobile, isMobile }) => {
  const { filters, setFilters, selectedCourse, totalHours, totalUnits } = useAppContext();

  return (
    <div
      className={`w-full h-full flex flex-col`}
      style={{
        background: isMobile ? 'var(--color-bg-primary)' : 'var(--color-bg-secondary)',
        borderLeft: isMobile ? 'none' : '1px solid var(--color-border)'
      }}
    >
      <div className={`${isMobile ? 'p-0' : 'p-6'} flex-1 overflow-y-auto`}>
        <div className="text-center text-sm font-medium mb-6 mt-6 md:mt-0" style={{ color: 'var(--color-text-secondary)' }}>
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
          <input
            type="text"
            placeholder="Code, course name or instructor.."
            className="w-full p-3 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all"
            style={{
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)'
            }}
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
          />
          <div className="absolute right-3 top-3" style={{ color: 'var(--color-text-secondary)' }}>
            <Search size={18} />
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