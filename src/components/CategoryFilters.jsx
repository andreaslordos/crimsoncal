import { useAppContext } from "../context/AppContext";

const CategoryFilters = () => {
    const { filters, setFilters } = useAppContext();
    
    const categories = [
      { id: 'aesthetics', name: 'Aesthetics and Culture' },
      { id: 'ethics', name: 'Ethics and Civics' },
      { id: 'histories', name: 'Histories, Societies, Individuals' },
      { id: 'science-society', name: 'Science and Technology in Society' },
      { id: 'arts', name: 'Arts and Humanities' },
      { id: 'social', name: 'Social Sciences' },
      { id: 'science-engineering', name: 'Science & Engineering & Applied Science' }
    ];
    
    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map(category => (
          <button 
            key={category.id}
            className={`px-3 py-1 text-xs rounded-full border ${filters.category === category.id ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-white text-gray-700 border-gray-300'}`}
            onClick={() => setFilters({...filters, category: category.id === filters.category ? 'all' : category.id})}
          >
            {category.name}
          </button>
        ))}
      </div>
    );
  };

  export default CategoryFilters;