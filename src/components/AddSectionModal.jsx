import { useState } from "react";
import { X } from "lucide-react";

const AddSectionModal = ({ isOpen, onClose, onAdd, courseName }) => {
  const [days, setDays] = useState({
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false
  });
  const [startTime, setStartTime] = useState("9:00am");
  const [endTime, setEndTime] = useState("10:00am");
  const [location, setLocation] = useState("");

  if (!isOpen) return null;

  const dayButtons = [
    { key: "monday", label: "M" },
    { key: "tuesday", label: "Tu" },
    { key: "wednesday", label: "W" },
    { key: "thursday", label: "Th" },
    { key: "friday", label: "F" },
    { key: "saturday", label: "Sa" },
    { key: "sunday", label: "Su" }
  ];

  const timeOptions = [];
  for (let h = 7; h <= 22; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
      const meridiem = h >= 12 ? "pm" : "am";
      const minute = m === 0 ? "00" : m;
      timeOptions.push(`${hour}:${minute}${meridiem}`);
    }
  }

  const toggleDay = (day) => {
    setDays(prev => ({ ...prev, [day]: !prev[day] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate at least one day is selected
    if (!Object.values(days).some(Boolean)) {
      return;
    }

    onAdd({
      days,
      startTime,
      endTime,
      location: location.trim() || null
    });

    // Reset form
    setDays({
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false
    });
    setStartTime("9:00am");
    setEndTime("10:00am");
    setLocation("");
    onClose();
  };

  const hasSelectedDay = Object.values(days).some(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Add Section
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Course name */}
        <p className="text-sm text-gray-600 mb-4">
          Adding section for <span className="font-medium">{courseName}</span>
        </p>

        <form onSubmit={handleSubmit}>
          {/* Days selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Days
            </label>
            <div className="flex gap-1">
              {dayButtons.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleDay(key)}
                  className={`w-10 h-10 rounded-md text-sm font-medium transition-colors ${
                    days[key]
                      ? "bg-teal-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Time selectors */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                {timeOptions.map(time => (
                  <option key={`start-${time}`} value={time}>{time}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                {timeOptions.map(time => (
                  <option key={`end-${time}`} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Location input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Maxwell Dworkin 119"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!hasSelectedDay}
              className="px-4 py-2 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: hasSelectedDay ? 'var(--harvard-crimson)' : undefined }}
              onMouseEnter={(e) => hasSelectedDay && (e.target.style.backgroundColor = 'var(--harvard-crimson-dark)')}
              onMouseLeave={(e) => hasSelectedDay && (e.target.style.backgroundColor = 'var(--harvard-crimson)')}
            >
              Add Section
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSectionModal;
