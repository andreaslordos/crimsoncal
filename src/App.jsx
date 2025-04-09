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
        {/* Sidebar toggle button (for mobile) */}
        <button 
          className="md:hidden absolute top-2 right-2 z-10 bg-white p-2 rounded-full shadow"
          onClick={() => setSidebarVisible(!sidebarVisible)}
        >
          <Menu size={20} />
        </button>
        
        {/* Calendar view */}
        <div className={`flex-1 overflow-auto transition-all ${sidebarVisible ? 'md:pr-0' : 'pr-0'}`}>
          <div className="p-4">
            <Calendar />
          </div>
        </div>
        
        {/* Sidebar */}
        <div className={`transition-all duration-300 ease-in-out ${sidebarVisible ? 'translate-x-0' : 'translate-x-full md:translate-x-0'} absolute md:relative right-0 top-0 h-full z-20 md:z-0`}>
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