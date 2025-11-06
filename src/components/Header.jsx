import { useAppContext } from "../context/AppContext";

// ===== Header Component =====
const Header = () => {
    const { selectedSemester, setSelectedSemester } = useAppContext();

    return (
        <header className="border-b-2 px-4 md:px-6 py-4 flex items-center justify-between" style={{
            backgroundColor: 'var(--parchment-100)',
            borderBottomColor: 'var(--harvard-crimson)'
        }}>
            <div className="flex items-center">
                <h1 className="text-2xl md:text-3xl font-bold tracking-wide" style={{fontFamily: "'EB Garamond', serif"}}>
                    <span style={{color: 'var(--ink-black)'}}>Crimson</span>
                    <span style={{color: 'var(--harvard-crimson)'}}>Cal</span>
                </h1>
            </div>
            <div className="flex flex-col md:flex-row md:space-x-4 items-end">
                <div className="flex space-x-3 text-base md:text-lg">
                    <button
                        onClick={() => setSelectedSemester('Fall 2025')}
                        className={`px-3 py-1 rounded transition-all ${
                            selectedSemester === 'Fall 2025'
                                ? 'font-bold'
                                : 'hover:opacity-80'
                        }`}
                        style={selectedSemester === 'Fall 2025'
                            ? {color: 'var(--parchment-50)', backgroundColor: 'var(--harvard-crimson)'}
                            : {color: 'var(--leather-brown)', backgroundColor: 'transparent'}}
                    >
                        Fall 2025
                    </button>
                    <span style={{color: 'var(--parchment-400)'}}>|</span>
                    <button
                        onClick={() => setSelectedSemester('Spring 2026')}
                        className={`px-3 py-1 rounded transition-all ${
                            selectedSemester === 'Spring 2026'
                                ? 'font-bold'
                                : 'hover:opacity-80'
                        }`}
                        style={selectedSemester === 'Spring 2026'
                            ? {color: 'var(--parchment-50)', backgroundColor: 'var(--harvard-crimson)'}
                            : {color: 'var(--leather-brown)', backgroundColor: 'transparent'}}
                    >
                        Spring 2026
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;