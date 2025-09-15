import { useAppContext } from "../context/AppContext";

// ===== Header Component =====
const Header = () => {
    const { selectedSemester, setSelectedSemester } = useAppContext();

    return (
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center">
                <h1 className="text-xl md:text-2xl font-semibold">
                    <span className="text-gray-800">Crimson</span>
                    <span className="text-pink-500">Cal</span>
                </h1>
            </div>
            <div className="flex flex-col md:flex-row md:space-x-4 items-end">
                <div className="flex space-x-3 text-sm md:text-base">
                    <button
                        onClick={() => setSelectedSemester('Fall 2025')}
                        className={`px-2 py-1 rounded transition-colors ${
                            selectedSemester === 'Fall 2025'
                                ? 'font-bold text-pink-500 bg-pink-50'
                                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                        }`}
                    >
                        Fall 2025
                    </button>
                    <span className="text-gray-400">|</span>
                    <button
                        onClick={() => setSelectedSemester('Spring 2026')}
                        className={`px-2 py-1 rounded transition-colors ${
                            selectedSemester === 'Spring 2026'
                                ? 'font-bold text-pink-500 bg-pink-50'
                                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                        }`}
                    >
                        Spring 2026
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;