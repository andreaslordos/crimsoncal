import { useAppContext } from "../context/AppContext";
import CalendarDropdown from "./CalendarDropdown";

// ===== Header Component =====
const Header = () => {
    const { selectedSemester, changeSemester } = useAppContext();

    return (
        <header className="border-b px-4 md:px-6 py-4 flex items-center justify-between bg-white" style={{
            borderBottomColor: '#e5e5e5'
        }}>
            <div className="flex items-center">
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                    <span className="text-gray-900">Crimson</span>
                    <span style={{color: 'var(--harvard-crimson)'}}>Cal</span>
                </h1>
            </div>
            <div className="flex flex-col md:flex-row md:space-x-4 items-end">
                <div className="flex items-center space-x-3 text-base md:text-base">
                    <CalendarDropdown />
                    <button
                        onClick={() => changeSemester('Fall 2025')}
                        className={`px-3 py-1.5 rounded transition-all text-sm font-medium ${
                            selectedSemester === 'Fall 2025'
                                ? 'shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                        style={selectedSemester === 'Fall 2025'
                            ? {color: 'white', backgroundColor: 'var(--harvard-crimson)'}
                            : {}}
                    >
                        Fall 2025
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                        onClick={() => changeSemester('Spring 2026')}
                        className={`px-3 py-1.5 rounded transition-all text-sm font-medium ${
                            selectedSemester === 'Spring 2026'
                                ? 'shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                        style={selectedSemester === 'Spring 2026'
                            ? {color: 'white', backgroundColor: 'var(--harvard-crimson)'}
                            : {}}
                    >
                        Spring 2026
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
