import React, { useState } from 'react';
import { AppProvider } from './context/AppContext.jsx';
import Header from './components/Header.jsx';
import Calendar from './components/Calendar.jsx';
import Sidebar from './components/Sidebar.jsx';
import MyCourses from './components/MyCourses.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';
import { useAppContext } from './context/AppContext.jsx';
import { Menu } from 'lucide-react';
import './App.css';

// App Content Component (wrapped by the AppProvider)
const AppContent = () => {
  const { isLoading } = useAppContext();
  const [sidebarVisible, setSidebarVisible] = useState(true);
  
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50">
      <Header />
      
      <div className="flex flex-1 overflow-hidden w-full relative">
        {/* Mobile sidebar toggle button */}
        <button 
          className="md:hidden absolute top-2 right-2 z-10 bg-white p-2 rounded-full shadow"
          onClick={() => setSidebarVisible(!sidebarVisible)}
        >
          <Menu size={20} />
        </button>
        
        {/* Main content area with calendar */}
        <div className="flex-1 overflow-auto p-4">
          <Calendar />
        </div>
        
        {/* Sidebar */}
        <div 
          className={`transition-all duration-300 ease-in-out fixed md:relative md:translate-x-0 right-0 top-0 h-full z-30 md:z-0 md:w-2/5 lg:w-2/5 xl:w-21/50 ${
            sidebarVisible ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <Sidebar />
        </div>
      </div>

      {/* My Courses footer */}
      <MyCourses />
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