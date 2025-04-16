// Updated CategoryFilters.jsx
import { useAppContext } from "../context/AppContext";

const CategoryFilters = () => {
  const { filters, setFilters } = useAppContext();
  
  // Group the categories
  const filterGroups = [
    [
      { id: 'aesthetics', name: 'Aesthetics & Culture', shortName: 'Aesthetics' },
      { id: 'ethics', name: 'Ethics & Civics', shortName: 'Ethics' },
      { id: 'histories', name: 'Hist/Sci/Ind', shortName: 'Hist/Sci' },
      { id: 'science-society', name: 'STS in Society', shortName: 'STS' }
    ],
    [
      { id: 'arts', name: 'Arts & Humanities', shortName: 'Arts' },
      { id: 'social', name: 'Social Sciences', shortName: 'Social' },
      { id: 'science-engineering', name: 'SEAS', shortName: 'SEAS' }
    ]
  ];
  
  // Function to toggle a category
  const toggleCategory = (categoryId) => {
    // If we already have this category selected
    if (filters.categories && filters.categories.includes(categoryId)) {
      // Remove it from the array
      setFilters({
        ...filters,
        categories: filters.categories.filter(id => id !== categoryId)
      });
    } else {
      // Add it to the array (creating the array if it doesn't exist)
      setFilters({
        ...filters,
        categories: [...(filters.categories || []), categoryId]
      });
    }
  };
  
  // Check if a category is selected
  const isCategorySelected = (categoryId) => {
    return filters.categories && filters.categories.includes(categoryId);
  };
  
  return (
    <div className="mb-4">
      {filterGroups.map((group, groupIndex) => (
        <div key={`group-${groupIndex}`} className="flex mb-2 w-full space-x-1">
          {group.map(category => (
            <button 
              key={category.id}
              className={`px-1 py-1 rounded-md border flex-1 text-center mx-1 overflow-hidden transition-all duration-200 ${
                isCategorySelected(category.id) 
                  ? 'bg-teal-600 border-teal-600 text-white font-medium shadow-sm' 
                  : 'bg-white border-gray-300 text-gray-700 hover:border-teal-500 hover:text-teal-600'
              }`}
              onClick={() => toggleCategory(category.id)}
            >
              <span className="text-xs md:hidden">{category.shortName}</span>
              <span className="text-xs hidden md:inline">{category.name}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};

export default CategoryFilters;