import { useAppContext } from "../context/AppContext";

const CategoryFilters = () => {
  const { filters, setFilters } = useAppContext();
  
  // Group the categories
  const filterGroups = [
    [
      { id: 'aesthetics', name: 'Aesthetics & Culture' },
      { id: 'ethics', name: 'Ethics & Civics' },
      { id: 'histories', name: 'Hist/Sci/Ind' },
      { id: 'science-society', name: 'STS in Society' }
    ],
    [
      { id: 'arts', name: 'Arts & Humanities' },
      { id: 'social', name: 'Social Sciences' },
      { id: 'science-engineering', name: 'SEAS' }
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
        <div key={`group-${groupIndex}`} className="flex mb-3 w-full space-x-1">
          {group.map(category => (
            <button 
              key={category.id}
              className={`px-2 py-px rounded border flex-1 text-center mx-1 h-6 overflow-hidden ${
                isCategorySelected(category.id) 
                  ? 'bg-teal-500 border-teal-500 text-white font-medium' 
                  : 'bg-white border-teal-500 text-teal-500 hover:bg-gray-50'
              }`}
              style={{ fontSize: '0.65rem' }}
              onClick={() => toggleCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};

export default CategoryFilters;