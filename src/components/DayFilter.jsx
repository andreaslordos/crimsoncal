import { Calendar } from "lucide-react";
import { useAppContext } from "../context/AppContext";

const DayFilter = () => {
  const { filters, setFilters } = useAppContext();

  const days = [
    { id: 'monday', label: 'Mon', shortLabel: 'M' },
    { id: 'tuesday', label: 'Tue', shortLabel: 'T' },
    { id: 'wednesday', label: 'Wed', shortLabel: 'W' },
    { id: 'thursday', label: 'Thu', shortLabel: 'R' },
    { id: 'friday', label: 'Fri', shortLabel: 'F' }
  ];

  const toggleDay = (dayId) => {
    const currentDays = filters.days || [];
    if (currentDays.includes(dayId)) {
      setFilters({
        ...filters,
        days: currentDays.filter(d => d !== dayId)
      });
    } else {
      setFilters({
        ...filters,
        days: [...currentDays, dayId]
      });
    }
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700 flex items-center">
          <Calendar size={14} className="mr-1" />
          Days of Week
        </label>
        {filters.days && filters.days.length > 0 && (
          <button
            onClick={() => setFilters({ ...filters, days: [] })}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        )}
      </div>
      <div className="flex gap-1">
        {days.map(day => (
          <button
            key={day.id}
            onClick={() => toggleDay(day.id)}
            className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors duration-150 font-medium ${
              filters.days?.includes(day.id)
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title={day.label}
          >
            <span className="md:hidden">{day.shortLabel}</span>
            <span className="hidden md:inline">{day.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DayFilter;