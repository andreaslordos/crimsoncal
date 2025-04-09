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
      <div className="mb-4">
        <div className="flex flex-col gap-2">
          {categories.map(category => (
            <button 
              key={category.id}
              className={`px-3 py-2 text-sm rounded text-left ${
                filters.category === category.id 
                  ? 'bg-blue-100 text-blue-800 font-medium' 
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setFilters({...filters, category: category.id === filters.category ? 'all' : category.id})}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
    );
  };

export default CategoryFilters;