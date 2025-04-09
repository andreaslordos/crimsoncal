// Format time string for display
export const formatTime = (timeStr) => {
    if (!timeStr) return '';
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
}

return (hour - 8) * 42 + (minute / 60) * 42;
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
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-red-500',
    'bg-yellow-500',
    'bg-pink-500',
    'bg-indigo-500',
];

const hash = String(courseId).split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
}, 0);

return colors[Math.abs(hash) % colors.length];
};