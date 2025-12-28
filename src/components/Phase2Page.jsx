import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bot, ExternalLink, Sparkles, Terminal, Sun, Moon, User, Database, Layout, Trash2, CheckCircle2, AlertCircle, Cpu, RefreshCw } from 'lucide-react';
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import Navbar from './Navbar';

const Phase2Page = () => {
    const articles = useQuery(api.articles.list) || [];
    const analyzeArticle = useAction(api.ai.transformArticle);
    const deleteArticle = useMutation(api.articles.deleteArticle);

    const [selectedArticleId, setSelectedArticleId] = useState(null);
    const [analyzingIds, setAnalyzingIds] = useState(new Set());
    const [darkMode, setDarkMode] = useState(true);

    // Derived state
    const selectedArticle = articles.find(a => a._id === selectedArticleId);

    // Auto-select first article if none selected
    useEffect(() => {
        if (!selectedArticleId && articles.length > 0) {
            setSelectedArticleId(articles[0]._id);
        }
    }, [articles, selectedArticleId]);

    // Theme & Mouse Effects
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    useEffect(() => {
        if (darkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [darkMode]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [mouseX, mouseY]);

    // Handlers
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

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (window.confirm("Delete this article?")) {
            await deleteArticle({ id });
            if (selectedArticleId === id) setSelectedArticleId(null);
        }
    };

    return (
        <div className="min-h-screen relative bg-slate-50 dark:bg-[#0f172a] transition-colors duration-500 font-sans flex flex-col overflow-x-hidden">
            <AnimatedBackground mouseX={mouseX} mouseY={mouseY} darkMode={darkMode} />

            <Navbar darkMode={darkMode} setDarkMode={setDarkMode}>
                <div className="px-4 py-2 rounded-full bg-slate-200/50 dark:bg-white/5 text-sm font-semibold text-pink-500 border border-pink-500/20 shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                    Gemini 2.5 Agent Active
                </div>
            </Navbar>

            <main className="flex-grow pt-24 pb-20 px-4 container mx-auto flex flex-col gap-8 relative z-10">

                {/* TOP SECTION: Article Store List */}
                <section className="shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <Database size={20} className="text-pink-500" /> Our Store Articles
                        </h2>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{articles.length} Items</span>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                        {articles.length === 0 && (
                            <div className="text-slate-500 text-sm italic w-full text-center py-4 bg-slate-100 dark:bg-white/5 rounded-xl border border-dashed border-slate-300 dark:border-white/10">
                                No articles found. Go to Phase 1 to fetch some.
                            </div>
                        )}
                        {articles.map(article => {
                            const isProcessed = article.aiSummary || article.aiTags;
                            const isSelected = selectedArticleId === article._id;

                            return (
                                <motion.div
                                    key={article._id}
                                    onClick={() => setSelectedArticleId(article._id)}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: isSelected ? 1.05 : 1 }}
                                    className={`
                                        snap-start min-w-[280px] w-[280px] p-4 rounded-2xl border cursor-pointer transition-all duration-300 group
                                        ${isSelected
                                            ? 'bg-white dark:bg-slate-800 border-pink-500 shadow-lg shadow-pink-500/20'
                                            : 'bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10'}
                                    `}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className={`p-1.5 rounded-lg ${isProcessed ? 'bg-green-500/10 text-green-500' : 'bg-slate-200 dark:bg-white/10 text-slate-400'}`}>
                                            {isProcessed ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                        </div>
                                        <button
                                            onClick={(e) => handleDelete(e, article._id)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded-lg text-slate-400 transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <h3 className={`font-bold text-sm line-clamp-2 mb-2 ${isSelected ? 'text-pink-500' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {article.title}
                                    </h3>
                                    <div className="text-[10px] font-mono text-slate-400 truncate">
                                        ID: {article._id}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>

                {/* BOTTOM SECTION: Workspace */}
                <section className="flex-grow flex gap-6">
                    <AnimatePresence mode="wait">
                        {selectedArticle ? (
                            <motion.div
                                key={selectedArticle._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 items-start"
                            >
                                {/* LEFT: Original Context */}
                                <div className="bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-3xl p-8 flex flex-col relative min-h-[500px]">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-500 to-transparent opacity-20" />
                                    <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-6">Original Source</h3>
                                    <div className="prose dark:prose-invert prose-sm max-w-none">
                                        <h1 className="text-xl font-bold mb-4">{selectedArticle.title}</h1>
                                        <p className="whitespace-pre-wrap text-slate-600 dark:text-slate-400 leading-relaxed">
                                            {selectedArticle.originalContent}
                                        </p>
                                    </div>
                                    <div className="mt-8 pt-4 border-t border-slate-200 dark:border-white/5 flex justify-between items-center text-xs text-slate-400 font-mono">
                                        <span>Original Source Data</span>
                                        <span>{selectedArticle.originalContent?.length || 0} chars</span>
                                    </div>
                                </div>

                                {/* RIGHT: AI Workspace */}
                                <div className="bg-white dark:bg-slate-900 border border-pink-500/20 shadow-2xl shadow-pink-500/5 rounded-3xl p-0 flex flex-col relative min-h-[500px]">
                                    {/* Glass Header */}
                                    <div className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5 p-4 flex justify-between items-center rounded-t-3xl">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-pink-500/10 rounded-lg">
                                                <Bot size={20} className="text-pink-500" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800 dark:text-white leading-tight">AI Workspace</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Powered by Gemini 2.5</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {selectedArticle.updatedContent && (
                                                <span className="hidden md:flex bg-green-500/10 text-green-500 text-[10px] font-bold px-2 py-1 rounded border border-green-500/20 items-center gap-1 uppercase tracking-wider">
                                                    <CheckCircle2 size={12} /> Optimization Complete
                                                </span>
                                            )}

                                            {(selectedArticle.aiSummary || selectedArticle.updatedContent) && (
                                                <button
                                                    onClick={() => handleAnalyze(selectedArticleId)}
                                                    disabled={analyzingIds.has(selectedArticleId)}
                                                    className="group flex items-center gap-2 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:border-pink-500 dark:hover:border-pink-500 px-3 py-1.5 rounded-lg transition-all shadow-sm hover:shadow-pink-500/20"
                                                >
                                                    <RefreshCw size={14} className={`text-slate-500 dark:text-slate-300 group-hover:text-pink-500 transition-colors ${analyzingIds.has(selectedArticleId) ? "animate-spin text-pink-500" : ""}`} />
                                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-pink-500 transition-colors">Re-Process</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-8 relative">
                                        {/* Background Logo */}
                                        <Bot className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-900/5 dark:text-white/5 w-64 h-64 pointer-events-none" />

                                        {(selectedArticle.aiSummary || selectedArticle.updatedContent) ? (
                                            <div className="space-y-8 relative z-10">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="bg-pink-50 dark:bg-pink-500/10 border border-pink-500/20 p-6 rounded-xl">
                                                        <div className="text-xs font-bold text-pink-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                            <Sparkles size={12} /> Executive Summary
                                                        </div>
                                                        <p className="text-slate-700 dark:text-slate-200 font-medium italic leading-relaxed text-sm">
                                                            "{selectedArticle.aiSummary}"
                                                        </p>
                                                    </div>

                                                    {/* SEO Scorecard */}
                                                    {selectedArticle.seoAnalysis && (
                                                        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 p-6 rounded-xl flex flex-col gap-4">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div> SEO Audit
                                                                </div>
                                                                <div className={`text-2xl font-black ${selectedArticle.seoScore >= 80 ? 'text-green-500' : selectedArticle.seoScore >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                                                                    {selectedArticle.seoScore}<span className="text-xs text-slate-400 font-medium">/100</span>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                {selectedArticle.seoAnalysis.critique?.slice(0, 3).map((item, i) => (
                                                                    <div key={i} className="flex gap-2 items-start text-xs text-slate-600 dark:text-slate-300">
                                                                        <span className="text-blue-500 mt-0.5">•</span> {item}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    {selectedArticle.aiTags?.map((tag, i) => (
                                                        <span key={i} className="px-3 py-1 bg-slate-100 dark:bg-white/10 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/5">
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>

                                                <div className="prose dark:prose-invert prose-pink max-w-none">
                                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-200 dark:border-white/10 pb-2">
                                                        Enhanced Content
                                                    </div>
                                                    <div className="whitespace-pre-wrap">
                                                        {selectedArticle.updatedContent || "Content rewritten but not displayed in summary mode."}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="py-20 flex flex-col items-center justify-center text-center">
                                                <div className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                                    <Terminal size={40} className="text-slate-400" />
                                                </div>
                                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Ready to Optimize</h3>
                                                <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">
                                                    This article is pending analysis. Run the Gemini Agent to extract insights, generate tags, and rewrite the content.
                                                </p>
                                                <button
                                                    onClick={() => handleAnalyze(selectedArticleId)}
                                                    disabled={analyzingIds.has(selectedArticleId)}
                                                    className="group relative bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 text-white px-10 py-5 rounded-2xl font-bold text-lg shadow-xl shadow-pink-500/20 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                                                >
                                                    {analyzingIds.has(selectedArticleId) ? (
                                                        <span className="flex items-center gap-2">
                                                            <Sparkles className="animate-spin" /> Processing...
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-2">
                                                            <Sparkles /> Run Agent
                                                        </span>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="w-full py-40 flex items-center justify-center text-slate-400 bg-white/5 border border-dashed border-white/10 rounded-3xl">
                                Select an article from the store above to begin.
                            </div>
                        )}
                    </AnimatePresence>
                </section>
            </main>
        </div>
    );
};

// Reused Component from HomePage
const AnimatedBackground = ({ mouseX, mouseY, darkMode }) => {
    const backgroundX = useTransform(mouseX, [0, 5000], [0, 5000]);
    const backgroundY = useTransform(mouseY, [0, 5000], [0, 5000]);

    const maskImage = useTransform(
        [mouseX, mouseY],
        ([x, y]) => `radial-gradient(400px circle at ${x}px ${y}px, black, transparent)`
    );

    return (
        <div className="fixed inset-0 z-0 pointer-events-none">
            <div className="absolute inset-0 bg-slate-50 dark:bg-[#0f172a] transition-colors duration-500 opacity-100" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 dark:opacity-15 mix-blend-overlay" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-pink-500/10 rounded-full blur-[150px] opacity-40 mix-blend-multiply dark:mix-blend-screen" />
            <div className={`absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] ${darkMode ? 'opacity-10' : 'opacity-[0.05]'}`}></div>
            <motion.div
                className="absolute inset-0 bg-[linear-gradient(to_right,#db2777_1px,transparent_1px),linear-gradient(to_bottom,#db2777_1px,transparent_1px)] bg-[size:24px_24px] opacity-20"
                style={{ maskImage, WebkitMaskImage: maskImage }}
            />
            <motion.div
                className="absolute top-0 left-0 w-[500px] h-[500px] bg-pink-500/30 rounded-full blur-[100px] mix-blend-screen opacity-50"
                style={{
                    x: mouseX,
                    y: mouseY,
                    translateX: '-50%',
                    translateY: '-50%'
                }}
            />
        </div>
    );
};

export default Phase2Page;
