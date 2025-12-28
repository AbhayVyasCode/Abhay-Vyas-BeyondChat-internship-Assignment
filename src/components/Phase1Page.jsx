import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Database, ExternalLink, CheckCircle, Clock, Search, Trash2, FileText, ChevronRight, BarChart3, PieChart, Sun, Moon, Globe, Mail, User, Code2, Server, Bot, Sparkles } from 'lucide-react';
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import Navbar from './Navbar';

const Phase1Page = () => {
    // Convex Hooks
    const articles = useQuery(api.articles.list) || [];
    const deleteArticle = useMutation(api.articles.deleteArticle);
    const fetchNewArticle = useAction(api.actions.fetchNewArticle);
    const analyzeArticle = useAction(api.ai.transformArticle);

    // UI Hooks (Background & Theme)
    const [darkMode, setDarkMode] = useState(true);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Dashboard State
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedArticleId, setSelectedArticleId] = useState(null);
    const [isFetching, setIsFetching] = useState(false);
    const [analyzingIds, setAnalyzingIds] = useState(new Set()); // Track loading states separately

    // Theme Effect
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    // Mouse Effect
    useEffect(() => {
        const handleMouseMove = (e) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [mouseX, mouseY]);

    // Filter Logic
    const filteredArticles = articles.filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.originalContent?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedArticle = articles.find(a => a._id === selectedArticleId);

    // Auto-select first article
    useEffect(() => {
        if (!selectedArticleId && articles.length > 0) {
            setSelectedArticleId(articles[0]._id);
        }
    }, [articles, selectedArticleId]);

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this article?")) {
            await deleteArticle({ id });
            if (selectedArticleId === id) {
                setSelectedArticleId(null);
            }
        }
    };

    const handleFetch = async () => {
        setIsFetching(true);
        try {
            await fetchNewArticle();
        } catch (error) {
            alert("Error fetching: " + error.message);
        } finally {
            setIsFetching(false);
        }
    };

    const handleAnalyze = async (id) => {
        setAnalyzingIds(prev => new Set(prev).add(id));
        try {
            await analyzeArticle({ id });
        } catch (error) {
            alert("Analysis failed: " + error.message);
        } finally {
            setAnalyzingIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-[#0f172a] transition-colors duration-500 font-sans flex flex-col">
            <AnimatedBackground mouseX={mouseX} mouseY={mouseY} darkMode={darkMode} />

            <Navbar darkMode={darkMode} setDarkMode={setDarkMode}>
                <div className="hidden sm:flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-200/50 dark:bg-white/5 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        <Database size={16} className="text-secondary" /> Phase 01: Ingestion
                    </div>
                </div>
            </Navbar>

            {/* Main Dashboard Area */}
            <main className="flex-1 pt-28 pb-8 px-4 md:px-8 flex flex-col relative z-10 h-screen box-border">

                {/* Dashboard Container */}
                <div className="flex-1 flex overflow-hidden bg-white/50 dark:bg-[#0f172a]/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl">

                    {/* LEFT PANEL: LIST (35%) */}
                    <div className="w-full md:w-[380px] border-r border-slate-200 dark:border-white/10 flex flex-col bg-slate-50/50 dark:bg-black/20 md:flex-shrink-0">
                        {/* Search Bar */}
                        <div className="p-4 border-b border-slate-200 dark:border-white/10 bg-white/50 dark:bg-transparent space-y-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search articles..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl outline-none pl-9 pr-4 py-3 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-secondary/50 transition-all"
                                />
                            </div>

                            <button
                                onClick={handleFetch}
                                disabled={isFetching}
                                className={`w-full py-3 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl hover:shadow-secondary/20 transition-all flex items-center justify-center gap-2 ${isFetching ? 'opacity-70 cursor-wait' : 'hover:scale-[1.02] active:scale-[0.98]'
                                    }`}
                            >
                                {isFetching ? (
                                    <>
                                        <Clock size={16} className="animate-spin" /> Crawling...
                                    </>
                                ) : (
                                    <>
                                        <Database size={16} /> Fetch New Article
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Scrollable List */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                            {filteredArticles.length === 0 ? (
                                <div className="text-center py-10 opacity-50 flex flex-col items-center">
                                    <Database size={32} className="mb-2 opacity-30" />
                                    <p className="text-sm">No articles found.</p>
                                </div>
                            ) : (
                                filteredArticles.map((article) => (
                                    <div
                                        key={article._id}
                                        onClick={() => setSelectedArticleId(article._id)}
                                        className={`group p-4 rounded-xl cursor-pointer border transition-all duration-300 ${selectedArticleId === article._id
                                            ? 'bg-white dark:bg-white/10 border-secondary/50 shadow-lg ring-1 ring-secondary/20'
                                            : 'bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-white/5 hover:border-slate-200 dark:hover:border-white/5'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className={`text-sm font-bold line-clamp-1 ${selectedArticleId === article._id ? 'text-secondary' : 'text-slate-700 dark:text-slate-200'}`}>
                                                {article.title}
                                            </h3>
                                            {article.status === 'processed' ? (
                                                <CheckCircle size={14} className="text-green-500 shrink-0" />
                                            ) : (
                                                <Clock size={14} className="text-yellow-500 shrink-0" />
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-[10px] font-mono text-slate-400 bg-slate-200/50 dark:bg-black/30 px-1.5 py-0.5 rounded">
                                                ID: {article._id.slice(-6)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* RIGHT PANEL: DETAILS (65%) */}
                    <div className="flex-1 overflow-y-auto bg-white/80 dark:bg-[#0f172a]/80 custom-scrollbar p-6 md:p-10 relative">
                        {/* Watermark */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none scale-150">
                            <Database size={400} />
                        </div>

                        {selectedArticle ? (
                            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
                                {/* Header Info */}
                                <div className="flex flex-col gap-6">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-4 flex-1">
                                            <div className="flex items-center gap-3">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${selectedArticle.status === 'processed' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300'
                                                    }`}>
                                                    {selectedArticle.status || 'Pending'}
                                                </span>
                                                <span className="text-xs font-mono text-slate-400">{selectedArticle.publishedDate || "Recently Scraped"}</span>
                                            </div>

                                            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight">
                                                {selectedArticle.title}
                                            </h2>

                                            <a href={selectedArticle.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-slate-500 hover:text-secondary transition-colors text-sm font-medium">
                                                <ExternalLink size={16} />
                                                <span className="truncate max-w-[400px] underline decoration-slate-300 dark:decoration-slate-700 underline-offset-4">{selectedArticle.url}</span>
                                            </a>
                                        </div>

                                        <button
                                            onClick={(e) => handleDelete(e, selectedArticle._id)}
                                            className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                            title="Delete Article"
                                        >
                                            <Trash2 size={24} />
                                        </button>
                                    </div>

                                    {/* Metrics Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <MetricCard label="Word Count" value={selectedArticle.originalContent?.split(' ').length || 0} icon={<BarChart3 size={18} className="text-purple-500" />} />
                                        <MetricCard label="Total Chars" value={selectedArticle.originalContent?.length || 0} icon={<PieChart size={18} className="text-blue-500" />} />
                                        <MetricCard label="Crawl Type" value="L1 Direct" icon={<Code2 size={18} className="text-emerald-500" />} />
                                    </div>
                                </div>

                                {/* Content Viewer */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4 mt-8">
                                        <FileText size={20} className="text-secondary" />
                                        <h3 className="text-lg font-bold">Raw Extracted Content</h3>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-black/40 rounded-2xl p-6 border border-slate-200 dark:border-white/5 font-mono text-sm leading-relaxed text-slate-600 dark:text-slate-300 min-h-[400px] shadow-inner whitespace-pre-wrap selection:bg-secondary/30">
                                        {selectedArticle.originalContent || "No content available."}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50 relative z-10">
                                <Database size={64} className="mb-4 animate-bounce" />
                                <p className="text-lg font-medium">Select an article to view details</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="text-center py-6 text-slate-500 text-xs border-t border-slate-200 dark:border-white/5 relative z-10 bg-slate-50/50 dark:bg-black/20 backdrop-blur-sm">
                <div className="flex justify-center gap-6 mb-2">
                    <FooterLink icon={<Code2 size={14} />} label="React" />
                    <FooterLink icon={<Server size={14} />} label="Node.js" />
                    <FooterLink icon={<Database size={14} />} label="Convex" />
                </div>
                <p className="font-medium opacity-70">© 2024 Abhay Vyas. Phase 1 Assessment.</p>
            </footer>
        </div>
    );
};

// --- Helper Components ---

const AnimatedBackground = ({ mouseX, mouseY, darkMode }) => {
    const maskImage = useTransform(
        [mouseX, mouseY],
        ([x, y]) => `radial-gradient(400px circle at ${x}px ${y}px, black, transparent)`
    );

    return (
        <div className="fixed inset-0 z-0 pointer-events-none">
            <div className="absolute inset-0 bg-slate-50 dark:bg-[#0f172a] transition-colors duration-500 opacity-100" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 dark:opacity-15 mix-blend-overlay" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-secondary/20 rounded-full blur-[150px] opacity-40 mix-blend-multiply dark:mix-blend-screen" />
            <div className={`absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] ${darkMode ? 'opacity-10' : 'opacity-[0.05]'}`}></div>
            <motion.div
                className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d4_1px,transparent_1px),linear-gradient(to_bottom,#06b6d4_1px,transparent_1px)] bg-[size:24px_24px] opacity-20"
                style={{ maskImage, WebkitMaskImage: maskImage }}
            />
            <motion.div
                className="absolute top-0 left-0 w-[500px] h-[500px] bg-secondary/30 rounded-full blur-[100px] mix-blend-screen opacity-50"
                style={{ x: mouseX, y: mouseY, translateX: '-50%', translateY: '-50%' }}
            />
        </div>
    );
};

const MetricCard = ({ label, value, icon }) => (
    <div className="bg-white dark:bg-white/5 p-5 rounded-2xl border border-slate-100 dark:border-white/5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/10 transition-colors cursor-default">
        <div>
            <div className="text-[10px] font-bold uppercase text-slate-400 mb-1 tracking-wider">{label}</div>
            <div className="text-xl font-bold font-mono">{typeof value === 'number' ? value.toLocaleString() : value}</div>
        </div>
        <div className="p-2 bg-slate-100 dark:bg-white/5 rounded-lg opacity-80">
            {icon}
        </div>
    </div>
);

const FooterLink = ({ icon, label }) => (
    <div className="flex items-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
        {icon} <span>{label}</span>
    </div>
);

export default Phase1Page;
