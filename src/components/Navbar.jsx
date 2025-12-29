import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, Database, Bot, Layout, Home, ArrowLeft } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Navbar = ({ children }) => {
    const { darkMode, toggleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = (path) => location.pathname === path;

    const NavLink = ({ to, icon, label }) => (
        <Link
            to={to}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm font-medium ${isActive(to) ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/30' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'}`}
        >
            {icon}
            <span className="hidden md:inline">{label}</span>
        </Link>
    );

    return (
        <nav className={`fixed top-0 w-full z-50 backdrop-blur-md border-b transition-all duration-300 ${darkMode ? 'bg-[#0f172a]/80 border-white/5' : 'bg-white/80 border-slate-200'} px-4 md:px-6 py-3 flex justify-between items-center`}>
            <div className="flex items-center gap-4">
                {location.pathname !== '/' && (
                    <button
                        onClick={() => navigate(-1)}
                        className={`p-2 rounded-full transition-all ${darkMode ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}
                        aria-label="Go Back"
                    >
                        <ArrowLeft size={20} />
                    </button>
                )}

                {/* Logo */}
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg border-2 border-white/10 group-hover:scale-110 transition-transform overflow-hidden relative">
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        <span className="font-serif font-black text-white italic z-10 text-xs">AV</span>
                    </div>
                    <div className="flex flex-col">
                        <span className={`text-lg font-bold tracking-tight leading-none ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            Abhay <span className="text-cyan-500">Vyas</span>
                        </span>
                        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest hidden sm:block">
                            Full Stack and Agentic A.I developer
                        </span>
                    </div>
                </Link>
            </div>

            {/* Navigation Links (Center) */}
            <div className="flex items-center gap-1 md:gap-2">
                <NavLink to="/" icon={<Home size={16} />} label="Home" />
                <NavLink to="/phase1" icon={<Database size={16} />} label="Phase 1" />
                <NavLink to="/phase2" icon={<Bot size={16} />} label="Phase 2" />
                <NavLink to="/phase3" icon={<Layout size={16} />} label="Phase 3" />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
                {/* Page Specific Children */}
                {children}

                {/* Dark Mode Toggle */}
                <button
                    onClick={toggleTheme}
                    className={`p-2 rounded-full transition-all ${darkMode ? 'bg-white/5 hover:bg-white/10 text-yellow-400' : 'bg-slate-200/50 hover:bg-slate-300 text-slate-600'}`}
                >
                    {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
