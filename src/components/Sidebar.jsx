import { useAppContext } from "../context/AppContext";
import CategoryFilters from "./CategoryFilters";
import CourseList from "./CourseList";
import CourseDetails from "./CourseDetails";

const Sidebar = () => {
    const { filters, setFilters, selectedCourse } = useAppContext();
    
    return (
      <div className="w-1/3 min-w-96 max-w-xl border-l border-gray-200 bg-white overflow-auto h-full">
        <div className="p-4">
          <div className="text-center text-sm text-gray-600 mb-4">
            <div>3 hours • 4 units</div>
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
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
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