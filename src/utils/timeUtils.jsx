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
    const colors = [
      'bg-slate-600',
      'bg-teal-500',
      'bg-indigo-500',
      'bg-rose-500',
      'bg-emerald-500',
      'bg-purple-500',
      'bg-blue-500',
      'bg-amber-500',
      'bg-cyan-500',
      'bg-pink-500',
      'bg-green-500',
      'bg-violet-500',
      'bg-orange-500',
      'bg-sky-500',
      'bg-red-500',
      'bg-yellow-500',
    ];

    // Use a static map to track assigned colors for each course ID
    if (!window.courseColorMap) {
      window.courseColorMap = new Map();
      window.nextColorIndex = 0;
    }

    // If we've already assigned a color to this course, return it
    if (window.courseColorMap.has(courseId)) {
      return window.courseColorMap.get(courseId);
    }

    // Otherwise, assign the next color in the sequence
    const colorIndex = window.nextColorIndex % colors.length;
    const color = colors[colorIndex];
    
    window.courseColorMap.set(courseId, color);
    window.nextColorIndex++;
    
    return color;
  };