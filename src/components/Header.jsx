import { useAppContext } from "../context/AppContext";

// ===== Header Component =====
const Header = () => {
    const { selectedSemester } = useAppContext();

    return (
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center">
                <h1 className="text-xl md:text-2xl font-semibold">
                    <span className="text-gray-800">Crimson</span>
                    <span className="text-pink-500">Cal</span>
                </h1>
            </div>
            <div className="flex flex-col md:flex-row md:space-x-4 items-end">
                <span className="text-sm md:text-base font-bold">
                    Fall 2025
                </span>
            </div>
        </header>
    );
};

export default Header;