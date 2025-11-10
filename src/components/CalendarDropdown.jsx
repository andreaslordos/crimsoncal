import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Edit2, Trash2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const CalendarDropdown = () => {
  const {
    userCalendars,
    activeCalendar,
    switchCalendar,
    createNewCalendar,
    deleteCalendar,
    renameCalendar
  } = useAppContext();

  const [showDropdown, setShowDropdown] = useState(false);
  const [editingCalendarId, setEditingCalendarId] = useState(null);
  const [editingCalendarName, setEditingCalendarName] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCreateNew = () => {
    // Auto-generate the next calendar name
    const nextNumber = userCalendars.length + 1;
    const newCalendarName = `Calendar ${nextNumber}`;
    createNewCalendar(newCalendarName);
    setShowDropdown(false);
  };

  const handleCalendarSelect = (calendarId) => {
    switchCalendar(calendarId);
    setShowDropdown(false);
  };

  const handleStartEdit = (e, calendar) => {
    e.stopPropagation(); // Prevent calendar selection
    setEditingCalendarId(calendar.id);
    setEditingCalendarName(calendar.name);
  };

  const handleConfirmEdit = (e) => {
    e.stopPropagation();
    if (editingCalendarName.trim()) {
      renameCalendar(editingCalendarId, editingCalendarName.trim());
    }
    setEditingCalendarId(null);
    setEditingCalendarName('');
  };

  const handleCancelEdit = (e) => {
    e.stopPropagation();
    setEditingCalendarId(null);
    setEditingCalendarName('');
  };

  const handleDelete = (e, calendarId) => {
    e.stopPropagation();
    if (userCalendars.length > 1 && window.confirm('Are you sure you want to delete this calendar? This action cannot be undone.')) {
      deleteCalendar(calendarId);
    }
  };

  // Only render on desktop
  return (
    <div className="hidden md:block relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center space-x-2 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <span>{activeCalendar?.name || 'Calendar 1'}</span>
          <ChevronDown
            size={16}
            className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`}
          />
        </button>

        {showDropdown && (
          <div className="absolute right-0 z-50 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg">
            <div className="py-1 max-h-96 overflow-y-auto">
              {userCalendars.map((calendar) => (
                <div
                  key={calendar.id}
                  className={`px-3 py-2 hover:bg-gray-50 cursor-pointer ${
                    calendar.id === activeCalendar?.id ? 'bg-gray-100' : ''
                  }`}
                  onClick={() => handleCalendarSelect(calendar.id)}
                >
                  {editingCalendarId === calendar.id ? (
                    <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editingCalendarName}
                        onChange={(e) => setEditingCalendarName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleConfirmEdit(e);
                          if (e.key === 'Escape') handleCancelEdit(e);
                        }}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                        autoFocus
                      />
                      <button
                        onClick={handleConfirmEdit}
                        className="text-green-600 hover:text-green-700"
                      >
                        ✓
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="text-red-600 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{calendar.name}</span>
                        {calendar.courses?.length > 0 && (
                          <span className="text-xs text-gray-500">
                            ({calendar.courses.length} courses)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => handleStartEdit(e, calendar)}
                          className="p-1 text-gray-500 hover:text-gray-700"
                        >
                          <Edit2 size={14} />
                        </button>
                        {userCalendars.length > 1 && (
                          <button
                            onClick={(e) => handleDelete(e, calendar.id)}
                            className="p-1 text-gray-500 hover:text-red-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {userCalendars.length < 10 && (
                <>
                  <div className="border-t border-gray-200 my-1" />
                  <button
                    onClick={handleCreateNew}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Plus size={16} />
                    <span>Add new...</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
    </div>
  );
};

export default CalendarDropdown;