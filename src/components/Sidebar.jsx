import { useAppContext } from "../context/AppContext";
import CategoryFilters from "./CategoryFilters";
import CourseList from "./CourseList";
import CourseDetails from "./CourseDetails";
import { Search } from "lucide-react";

const Sidebar = () => {
    const { filters, setFilters, selectedCourse, totalHours, totalUnits } = useAppContext();
    
    return (
      <div className="w-auto border-l border-gray-200 bg-white overflow-auto h-full flex-shrink-0">
        <div className="p-4">
          <div className="text-center text-sm text-gray-600 mb-4">
            <div>{totalHours} hours • {totalUnits} units</div>
          </div>
          
          {/* Category filters */}
          <CategoryFilters />
          
          {/* Search box */}
          <div className="mb-4 relative">
            <input
              type="text"
              placeholder="Code or name"
              className="w-full p-2 border rounded"
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
          {selectedCourse && <CourseDetails />}
        </div>
      </div>
    );
  };

export default Sidebar;