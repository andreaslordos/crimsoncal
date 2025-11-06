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
        <label className="text-sm font-medium flex items-center" style={{color: 'var(--ink-black)'}}>
          <Calendar size={14} className="mr-1" style={{color: 'var(--leather-brown)'}} />
          Days of Week
        </label>
        {filters.days && filters.days.length > 0 && (
          <button
            onClick={() => setFilters({ ...filters, days: [] })}
            className="text-xs transition-colors"
            style={{color: 'var(--leather-brown)'}}
            onMouseEnter={(e) => e.target.style.color = 'var(--harvard-crimson)'}
            onMouseLeave={(e) => e.target.style.color = 'var(--leather-brown)'}
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
            className="flex-1 px-2 py-2 text-xs rounded transition-all duration-150 font-medium"
            style={filters.days?.includes(day.id)
              ? {
                  backgroundColor: 'var(--harvard-crimson)',
                  color: 'var(--parchment-50)'
                }
              : {
                  backgroundColor: 'var(--parchment-100)',
                  color: 'var(--leather-brown)'
                }}
            onMouseEnter={(e) => {
              if (!filters.days?.includes(day.id)) {
                e.target.style.backgroundColor = 'var(--parchment-200)';
              }
            }}
            onMouseLeave={(e) => {
              if (!filters.days?.includes(day.id)) {
                e.target.style.backgroundColor = 'var(--parchment-100)';
              }
            }}
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