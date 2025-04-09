import { useAppContext } from "../context/AppContext";

const CategoryFilters = () => {
    const { filters, setFilters } = useAppContext();
    
    const categories = [
      { id: 'all', name: 'All Categories' },
      { id: 'arts and humanities', name: 'Arts and Humanities' },
      { id: 'science and technology in society', name: 'Science and Technology in Society' },
      { id: 'social sciences', name: 'Social Sciences' }
    ];
    
    return (
      <div className="flex flex-wrap gap-1 mb-4">
        {categories.map(category => (
          <button 
            key={category.id}
            className={`px-2 py-1 text-xs rounded ${filters.category === category.id ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
            onClick={() => setFilters({...filters, category: category.id})}
          >
            {category.name}
          </button>
        ))}
      </div>
    );
  };

  export default CategoryFilters;