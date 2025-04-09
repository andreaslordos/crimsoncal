import { useAppContext } from "../context/AppContext";
import CategoryFilters from "./CategoryFilters";
import CourseList from "./CourseList";
import CourseDetails from "./CourseDetails";

const Sidebar = () => {
    const { filters, setFilters, selectedCourse } = useAppContext();
    
    return (
      <div className="w-96 border-l border-gray-200 bg-white overflow-auto">
        <div className="p-4">
          <div className="text-center text-sm text-gray-600 mb-4">
            <div>3 hours • 4 units</div>
          </div>
          
          {/* Category filters */}
          <CategoryFilters />
          
          {/* Search box */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Code or name"
              className="w-full p-2 border rounded"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
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
  