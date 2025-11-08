// src/utils/timeUtils.jsx
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
  
    return Math.max(42, endPosition - startPosition); // Minimum height of 42px
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