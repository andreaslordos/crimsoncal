import React, { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext.jsx';
import Header from './components/Header.jsx';
import Calendar from './components/Calendar.jsx';
import Sidebar from './components/Sidebar.jsx';
import MyCourses from './components/MyCourses.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';
import ResizableDivider from './components/ResizableDivider.jsx';
import { useAppContext } from './context/AppContext.jsx';
import { Menu, X } from 'lucide-react';
import './App.css';

// App.jsx - Make sidebar take full width on mobile
const AppContent = () => {
  const { isLoading } = useAppContext();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const [leftColumnWidth, setLeftColumnWidth] = useState(60);
  
  // Fetch the last updated timestamp
  useEffect(() => {
    fetch('/data/last_updated.json')
      .then(res => res.json())
      .then(data => {
        setLastUpdated(data.formatted || 'Aug 24, 2025');
      })
      .catch(() => {
        // Fallback if file doesn't exist
        setLastUpdated('Aug 24, 2025');
      });
  }, []);
  
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50">
      <Header />
      
      <div className="flex flex-1 overflow-hidden w-full relative">
        {/* Mobile sidebar toggle button */}
        <button 
          className="md:hidden fixed bottom-4 right-4 z-40 bg-teal-600 text-white p-3 rounded-full shadow-lg hover:bg-teal-700 transition-colors duration-150"
          onClick={() => setSidebarVisible(!sidebarVisible)}
          aria-label="Toggle sidebar"
        >
          <Menu size={24} />
        </button>
        
        {/* Main content area with calendar and MyCourses */}
        <div 
          className="overflow-auto p-4 relative"
          style={{ width: `${leftColumnWidth}%` }}
        >
          <Calendar />
          <MyCourses />
          
          {/* Report Bug button - centered below calendar */}
          <div className="flex justify-center mt-4">
            <a 
              href="https://docs.google.com/forms/d/e/1FAIpQLSdPks0Z_z6oamuEs4bMHJznTadvBFjVHmZK4l7vwdERCHWgBg/viewform?usp=header" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline hover:text-blue-700 transition-colors duration-150"
            >
              Report Bug
            </a>
          </div>
          
          {/* Last updated timestamp - bottom left */}
          <div className="fixed bottom-4 left-4 text-xs text-gray-400">
            Last updated: {lastUpdated}
          </div>
        </div>
        
        {/* Mobile overlay */}
        {sidebarVisible && (
          <div 
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setSidebarVisible(false)}
          ></div>
        )}
        
        {/* Resizable divider */}
        <div className="relative">
          <ResizableDivider 
            onResize={setLeftColumnWidth}
            minLeftWidth={30}
            minRightWidth={25}
          />
        </div>
        
        {/* Sidebar - full height and width on mobile */}
        <div 
          className={`transition-all duration-300 ease-in-out fixed md:relative md:translate-x-0 inset-y-0 right-0 h-full z-40 md:z-0 w-full md:w-auto ${
            sidebarVisible ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ width: window.innerWidth >= 768 ? `${100 - leftColumnWidth}%` : '100%' }}
        >
          {/* Mobile close button */}
          <button 
            className="md:hidden absolute top-4 left-4 z-50 bg-white p-2 rounded-full shadow hover:bg-gray-100 transition-colors duration-150"
            onClick={() => setSidebarVisible(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
          <Sidebar onCloseMobile={() => setSidebarVisible(false)} />
        </div>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;