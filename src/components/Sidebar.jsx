import { useAppContext } from "../context/AppContext";
import CategoryFilters from "./CategoryFilters";
import DayFilter from "./DayFilter";
import AdvancedFilters from "./AdvancedFilters";
import CourseList from "./CourseList";
import CourseDetails from "./CourseDetails";
import { Search } from "lucide-react";

const Sidebar = ({ onCloseMobile }) => {
  const { filters, setFilters, selectedCourse, totalHours, totalUnits } = useAppContext();
  
  return (
    <div className="w-full h-full border-l border-gray-200 bg-white flex flex-col">
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="text-center text-sm text-gray-600 mb-4 mt-6 md:mt-0">
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
            className="w-full p-2 border rounded text-sm"
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
          />
          <div className="absolute right-3 top-2 text-gray-400">
            <Search size={16} />
          </div>
        </div>
        
        {/* Course list */}
        <CourseList />
        
        {/* Selected course details */}
        {selectedCourse && <CourseDetails onAddCourse={onCloseMobile} />}
      </div>
    </div>
  );
};

export default Sidebar;