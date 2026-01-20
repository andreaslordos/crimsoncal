import CalendarDropdown from "./CalendarDropdown";

// ===== Header Component =====
const Header = () => {

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
                    <span
                        className="px-3 py-1.5 rounded text-sm font-medium shadow-sm"
                        style={{color: 'white', backgroundColor: 'var(--harvard-crimson)'}}
                    >
                        Spring 2026
                    </span>
                </div>
            </div>
        </header>
    );
};

export default Header;
