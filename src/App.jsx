import React from 'react';
import { AppProvider } from './context/AppContext.jsx';
import Header from './components/Header.jsx';
import Calendar from './components/Calendar.jsx';
import Sidebar from './components/Sidebar.jsx';
import MyCourses from './components/MyCourses.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';
import { useAppContext } from './context/AppContext.jsx';

// App Content Component (wrapped by the AppProvider)
const AppContent = () => {
  const { isLoading } = useAppContext();
  
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Calendar view */}
        <div className="flex-1 overflow-auto">
          <div className="p-4">
            <Calendar />
          </div>
        </div>
        
        {/* Sidebar */}
        <Sidebar />
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