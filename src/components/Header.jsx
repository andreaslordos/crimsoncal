import { useAppContext } from "../context/AppContext";

// ===== Header Component =====
const Header = () => {
    const { selectedSemester, setSelectedSemester } = useAppContext();

    return (
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center">
            <h1 className="text-2xl font-semibold">
            <span className="text-gray-800">place</span>
            <span className="text-pink-500">holder</span>
            </h1>
        </div>
        <div className="flex space-x-4">
        <button 
            className={`text-blue-600 hover:underline hover:text-blue-700 transition-colors duration-150 ${selectedSemester === 'Fall 2025' ? 'font-bold' : ''}`}
            onClick={() => setSelectedSemester('Fall 2025')}
            >
            Fall 2025
        </button>
        </div>
        </header>
    );
};
  
export default Header;