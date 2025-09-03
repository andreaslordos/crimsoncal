import React, { useState, useEffect } from 'react';

const ResizableDivider = ({ onResize, minLeftWidth = 30, minRightWidth = 25 }) => {
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      const windowWidth = window.innerWidth;
      const newLeftWidth = (e.clientX / windowWidth) * 100;
      
      if (newLeftWidth >= minLeftWidth && newLeftWidth <= (100 - minRightWidth)) {
        onResize(newLeftWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, onResize, minLeftWidth, minRightWidth]);

  return (
    <div
      className={`hidden md:block absolute top-0 bottom-0 w-1 cursor-col-resize z-50 group hover:bg-blue-400 transition-colors ${
        isDragging ? 'bg-blue-500' : 'bg-gray-300'
      }`}
      onMouseDown={() => setIsDragging(true)}
      style={{ right: 0, transform: 'translateX(50%)' }}
    >
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-12 flex items-center justify-center">
        <div className="flex flex-col space-y-1">
          <div className={`w-1 h-1 rounded-full ${isDragging ? 'bg-blue-600' : 'bg-gray-400'} group-hover:bg-blue-600`}></div>
          <div className={`w-1 h-1 rounded-full ${isDragging ? 'bg-blue-600' : 'bg-gray-400'} group-hover:bg-blue-600`}></div>
          <div className={`w-1 h-1 rounded-full ${isDragging ? 'bg-blue-600' : 'bg-gray-400'} group-hover:bg-blue-600`}></div>
        </div>
      </div>
    </div>
  );
};

export default ResizableDivider;