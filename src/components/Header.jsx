import CalendarDropdown from "./CalendarDropdown";
import { useAppContext } from "../context/AppContext";

// ===== Header Component =====
const Header = () => {
    const { selectedSemester, supportedSemesters, changeSemester } = useAppContext();

    return (
        <header className="border-b px-4 md:px-6 py-4 flex items-center justify-between bg-white relative z-50 overflow-visible" style={{
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
                    <div className="flex items-center gap-1.5">
                        {[...supportedSemesters].reverse().map(sem => (
                            <button
                                key={sem}
                                onClick={() => changeSemester(sem)}
                                className="px-3 py-1.5 rounded text-sm font-medium transition-colors cursor-pointer"
                                style={sem === selectedSemester
                                    ? { color: 'white', backgroundColor: 'var(--harvard-crimson)' }
                                    : { color: 'var(--harvard-crimson)', backgroundColor: 'transparent' }
                                }
                            >
                                {sem}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
