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
        <label className="text-sm font-semibold flex items-center" style={{ color: 'var(--color-text-primary)' }}>
          <Calendar size={14} className="mr-1" />
          Days of Week
        </label>
        {filters.days && filters.days.length > 0 && (
          <button
            onClick={() => setFilters({ ...filters, days: [] })}
            className="text-xs transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-secondary)'}
          >
            Clear
          </button>
        )}
      </div>
      <div className="flex gap-2">
        {days.map(day => (
          <button
            key={day.id}
            onClick={() => toggleDay(day.id)}
            className={`flex-1 px-3 py-2 text-xs rounded-lg transition-all duration-150 font-medium ${
              filters.days?.includes(day.id) ? 'text-white' : ''
            }`}
            style={
              filters.days?.includes(day.id)
                ? {
                    background: 'var(--color-primary)',
                    boxShadow: 'var(--shadow-sm)'
                  }
                : {
                    background: '#f3f4f6',
                    color: 'var(--color-text-secondary)'
                  }
            }
            onMouseEnter={(e) => {
              if (!filters.days?.includes(day.id)) {
                e.currentTarget.style.background = '#e5e7eb';
              }
            }}
            onMouseLeave={(e) => {
              if (!filters.days?.includes(day.id)) {
                e.currentTarget.style.background = '#f3f4f6';
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