import { useAppContext } from "../context/AppContext";

// ===== Header Component =====
const Header = () => {
    const { selectedSemester, setSelectedSemester } = useAppContext();

    return (
        <header
            className="px-4 md:px-8 py-4 flex items-center justify-between backdrop-blur-sm sticky top-0 z-50"
            style={{
                background: 'rgba(255, 255, 255, 0.8)',
                borderBottom: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-sm)'
            }}
        >
            <div className="flex items-center">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                    <span style={{ color: 'var(--color-text-primary)' }}>Crimson</span>
                    <span style={{ color: 'var(--color-primary)' }}>Cal</span>
                </h1>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setSelectedSemester('Fall 2025')}
                    className={`px-4 py-2 rounded-lg text-sm md:text-base font-medium ${
                        selectedSemester === 'Fall 2025'
                            ? 'shadow-sm'
                            : 'hover:bg-gray-50'
                    }`}
                    style={
                        selectedSemester === 'Fall 2025'
                            ? {
                                background: 'var(--color-primary)',
                                color: 'white',
                                fontWeight: 600
                              }
                            : {
                                color: 'var(--color-text-secondary)'
                              }
                    }
                >
                    Fall 2025
                </button>
                <button
                    onClick={() => setSelectedSemester('Spring 2026')}
                    className={`px-4 py-2 rounded-lg text-sm md:text-base font-medium ${
                        selectedSemester === 'Spring 2026'
                            ? 'shadow-sm'
                            : 'hover:bg-gray-50'
                    }`}
                    style={
                        selectedSemester === 'Spring 2026'
                            ? {
                                background: 'var(--color-primary)',
                                color: 'white',
                                fontWeight: 600
                              }
                            : {
                                color: 'var(--color-text-secondary)'
                              }
                    }
                >
                    Spring 2026
                </button>
            </div>
        </header>
    );
};

export default Header;