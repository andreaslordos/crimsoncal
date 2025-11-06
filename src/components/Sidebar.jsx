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
    <div className="w-full h-full flex flex-col" style={{
      backgroundColor: isMobile ? 'var(--parchment-100)' : 'var(--parchment-50)',
      borderLeft: isMobile ? 'none' : '2px solid var(--parchment-400)'
    }}>
      <div className={`${isMobile ? 'p-0' : 'p-4'} flex-1 overflow-y-auto`}>
        <div className="text-center text-base font-medium mb-4 mt-6 md:mt-0" style={{color: 'var(--leather-brown)'}}>
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
            className="w-full p-3 rounded text-base border-2 transition-all focus:outline-none"
            style={{
              backgroundColor: 'var(--parchment-100)',
              borderColor: 'var(--parchment-300)',
              color: 'var(--ink-black)'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--harvard-crimson)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--parchment-300)'}
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
          />
          <div className="absolute right-3 top-3" style={{color: 'var(--leather-brown)'}}>
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