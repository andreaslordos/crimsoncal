// src/utils/timeUtils.jsx

// Parse and format a time string with smart AM/PM defaults
// Returns { formatted: string, isValid: boolean }
// Default rules: 9-11 → AM, 12-8 → PM (when not specified)
export const parseAndFormatTime = (input) => {
  if (!input || typeof input !== 'string') {
    return { formatted: '', isValid: false };
  }

  const trimmed = input.trim().toLowerCase();
  if (!trimmed) {
    return { formatted: '', isValid: false };
  }

  // Extract explicit am/pm if present
  let explicitPeriod = null;
  let timeWithoutPeriod = trimmed;

  if (trimmed.includes('am') || trimmed.includes('a')) {
    explicitPeriod = 'am';
    timeWithoutPeriod = trimmed.replace(/\s*(am|a\.?m\.?)\s*/gi, '');
  } else if (trimmed.includes('pm') || trimmed.includes('p')) {
    explicitPeriod = 'pm';
    timeWithoutPeriod = trimmed.replace(/\s*(pm|p\.?m\.?)\s*/gi, '');
  }

  let hour = null;
  let minute = 0;

  // Try different patterns
  // Pattern: H:MM or HH:MM
  const colonMatch = timeWithoutPeriod.match(/^(\d{1,2}):(\d{2})$/);
  if (colonMatch) {
    hour = parseInt(colonMatch[1], 10);
    minute = parseInt(colonMatch[2], 10);
  }

  // Pattern: HMM or HHMM (e.g., 900 or 0900)
  if (hour === null) {
    const noColonMatch = timeWithoutPeriod.match(/^(\d{3,4})$/);
    if (noColonMatch) {
      const digits = noColonMatch[1];
      if (digits.length === 3) {
        hour = parseInt(digits[0], 10);
        minute = parseInt(digits.slice(1), 10);
      } else if (digits.length === 4) {
        hour = parseInt(digits.slice(0, 2), 10);
        minute = parseInt(digits.slice(2), 10);
      }
    }
  }

  // Pattern: Just H or HH (e.g., 9 or 10)
  if (hour === null) {
    const justHourMatch = timeWithoutPeriod.match(/^(\d{1,2})$/);
    if (justHourMatch) {
      hour = parseInt(justHourMatch[1], 10);
      minute = 0;
    }
  }

  // Validate parsed values
  if (hour === null || minute < 0 || minute > 59) {
    return { formatted: input, isValid: false };
  }

  // Handle 24-hour format input (13-23)
  if (hour >= 13 && hour <= 23) {
    explicitPeriod = 'pm';
    hour = hour - 12;
  } else if (hour === 0) {
    hour = 12;
    explicitPeriod = explicitPeriod || 'am';
  } else if (hour === 12) {
    explicitPeriod = explicitPeriod || 'pm';
  } else if (hour > 23) {
    return { formatted: input, isValid: false };
  }

  // Hour must be 1-12 at this point
  if (hour < 1 || hour > 12) {
    return { formatted: input, isValid: false };
  }

  // Apply smart AM/PM defaults if not explicitly specified
  let period = explicitPeriod;
  if (!period) {
    // 9-11 defaults to AM, 12 and 1-8 defaults to PM
    if (hour >= 9 && hour <= 11) {
      period = 'am';
    } else {
      period = 'pm';
    }
  }

  const formatted = `${hour}:${minute.toString().padStart(2, '0')}${period}`;
  return { formatted, isValid: true };
};

// Format time string for display
export const formatTime = (timeStr) => {
    if (!timeStr) return '';
    
    // If already properly formatted, return as is
    if (timeStr.includes('am') || timeStr.includes('pm')) {
      return timeStr;
    }
    
    // Try to parse HH:MM format
    const timeParts = timeStr.match(/(\d+):(\d+)/);
    if (timeParts) {
      let hour = parseInt(timeParts[1]);
      const minute = parseInt(timeParts[2]);
      const period = hour >= 12 ? 'pm' : 'am';
      
      // Convert to 12-hour format
      if (hour > 12) hour -= 12;
      if (hour === 0) hour = 12;
      
      return `${hour}:${minute.toString().padStart(2, '0')}${period}`;
    }
    
    return timeStr;
  };
  
  // Get vertical position for time slot
  export const getTimePosition = (timeStr) => {
    if (!timeStr) return 0;
  
    let hour = 8; // Default to 8am
    let minute = 0;
  
    if (timeStr.includes('am') || timeStr.includes('pm')) {
      const timeParts = timeStr.match(/(\d+):?(\d+)?([ap]m)/);
      if (timeParts) {
        hour = parseInt(timeParts[1]);
        minute = timeParts[2] ? parseInt(timeParts[2]) : 0;
        if (timeParts[3] === 'pm' && hour < 12) hour += 12;
      }
    } else {
      // Try to parse HH:MM format
      const timeParts = timeStr.match(/(\d+):(\d+)/);
      if (timeParts) {
        hour = parseInt(timeParts[1]);
        minute = parseInt(timeParts[2]);
      }
    }
  
    // Convert to position - 9am is the start of our grid (first hour shown)
    return (hour - 9) * 42 + (minute / 60) * 42;
  };
  
  // Calculate height for time duration
  export const getTimeHeight = (startTime, endTime) => {
    if (!startTime || !endTime) return 42; // Default height

    const startPosition = getTimePosition(startTime);
    const endPosition = getTimePosition(endTime);

    // Allow blocks to be as short as the time dictates (minimum 14px for visibility)
    return Math.max(14, endPosition - startPosition);
  };
  
  // Generate consistent color for course
  export const getCourseColor = (courseId) => {
    // Expanded professional color palette with visually distinct colors
    // Colors are ordered to maximize visual distinction between adjacent assignments
    const colors = [
      'bg-blue-600',      // Cool blue
      'bg-orange-600',    // Warm orange
      'bg-emerald-600',   // Green
      'bg-purple-600',    // Purple
      'bg-amber-600',     // Yellow-orange
      'bg-teal-600',      // Teal
      'bg-rose-600',      // Pink-red
      'bg-slate-600',     // Gray
      'bg-indigo-600',    // Deep blue
      'bg-lime-600',      // Yellow-green
      'bg-pink-600',      // Pink
      'bg-cyan-600',      // Light blue
      'bg-red-600',       // Red
      'bg-violet-600',    // Violet
      'bg-green-600',     // True green
      'bg-fuchsia-600',   // Magenta
      'bg-sky-600',       // Sky blue
      'bg-yellow-600',    // Yellow
      'bg-blue-700',      // Dark blue
      'bg-orange-700',    // Dark orange
    ];

    // Use a static map to track assigned colors for each course ID
    if (!window.courseColorMap) {
      window.courseColorMap = new Map();
      window.usedColorIndices = new Set();
    }

    // If we've already assigned a color to this course, return it
    if (window.courseColorMap.has(courseId)) {
      return window.courseColorMap.get(courseId);
    }

    // Find the next unused color, or wrap around if all are used
    let colorIndex;
    if (window.usedColorIndices.size < colors.length) {
      // Still have unused colors - find the first one
      for (let i = 0; i < colors.length; i++) {
        if (!window.usedColorIndices.has(i)) {
          colorIndex = i;
          break;
        }
      }
    } else {
      // All colors used, use hash-based assignment for better distribution
      let hash = 0;
      for (let i = 0; i < courseId.length; i++) {
        hash = ((hash << 5) - hash) + courseId.charCodeAt(i);
        hash = hash & hash; // Convert to 32-bit integer
      }
      colorIndex = Math.abs(hash) % colors.length;
    }

    const color = colors[colorIndex];
    window.courseColorMap.set(courseId, color);
    window.usedColorIndices.add(colorIndex);

    return color;
  };