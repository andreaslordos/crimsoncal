import React, { useState } from 'react';
import { AppProvider } from './context/AppContext.jsx';
import Header from './components/Header.jsx';
import Calendar from './components/Calendar.jsx';
import Sidebar from './components/Sidebar.jsx';
import MyCourses from './components/MyCourses.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';
import { useAppContext } from './context/AppContext.jsx';
import { Menu, X } from 'lucide-react';
import './App.css';

// App Content Component (wrapped by the AppProvider)
const AppContent = () => {
  const { isLoading } = useAppContext();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  
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
        <div className="flex-1 overflow-auto p-4">
          <Calendar />
          <MyCourses />
        </div>
        
        {/* Mobile overlay */}
        {sidebarVisible && (
          <div 
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setSidebarVisible(false)}
          ></div>
        )}
        
        {/* Sidebar - full height on mobile */}
        <div 
          className={`transition-all duration-300 ease-in-out fixed md:relative md:translate-x-0 inset-y-0 right-0 h-full z-40 md:z-0 w-[90%] md:w-2/5 lg:w-2/5 xl:w-2/5 ${
            sidebarVisible ? 'translate-x-0' : 'translate-x-full'
          }`}
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