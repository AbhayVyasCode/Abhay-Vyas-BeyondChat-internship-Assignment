import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Navbar from './Navbar';
import { ArrowRight, BookOpen, User, Calendar, Tag, Share2, X, ExternalLink, Sparkles, Volume2, Play, Pause, Square, FastForward, Sun, Moon, Bot } from 'lucide-react';

const AnimatedBackground = ({ mouseX, mouseY, darkMode }) => {
    // Spotlight follows mouse - using transform for performance
    const backgroundX = useTransform(mouseX, [0, 5000], [0, 5000]);
    const backgroundY = useTransform(mouseY, [0, 5000], [0, 5000]);

    // Create a radial gradient string that will move with the mouse
    const maskImage = useTransform(
        [mouseX, mouseY],
        ([x, y]) => `radial-gradient(400px circle at ${x}px ${y}px, black, transparent)`
    );

    return (
        <div className="fixed inset-0 z-0 pointer-events-none">
            {/* 1. Base Gradient - Deep background noise/texture */}
            <div className="absolute inset-0 bg-slate-50 dark:bg-[#0f172a] transition-colors duration-500 opacity-100" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 dark:opacity-15 mix-blend-overlay" />

            {/* 2. Static Center Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-violet-500/20 rounded-full blur-[150px] opacity-40 mix-blend-multiply dark:mix-blend-screen" />

            {/* 3. The Grid - Layer 1 (Faint static) */}
            <div className={`absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] ${darkMode ? 'opacity-10' : 'opacity-[0.05]'}`}></div>

            {/* 4. The Grid - Layer 2 (Spotlight Reveal) */}
            <motion.div
                className="absolute inset-0 bg-[linear-gradient(to_right,#8b5cf6_1px,transparent_1px),linear-gradient(to_bottom,#8b5cf6_1px,transparent_1px)] bg-[size:24px_24px] opacity-20"
                style={{ maskImage, WebkitMaskImage: maskImage }}
            />

            {/* 5. Spotlight Glow itself (Color) */}
            <motion.div
                className="absolute top-0 left-0 w-[500px] h-[500px] bg-violet-500/30 rounded-full blur-[100px] mix-blend-screen opacity-50"
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

const Phase3Page = () => {
    const articles = useQuery(api.articles.getPublic) || [];
    const [activeArticle, setActiveArticle] = useState(null);
    const [viewMode, setViewMode] = useState('blog'); // 'blog' or 'widget'
    const [darkMode, setDarkMode] = useState(true);

    // Mouse Movement for Background
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    useEffect(() => {
        const handleMouseMove = (e) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [mouseX, mouseY]);

    // Handle Dark Mode
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    // Audio State
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const synth = useRef(window.speechSynthesis);
    const utterance = useRef(null);

    // Cleanup audio on unmount or article close
    useEffect(() => {
        return () => {
            synth.current.cancel();
        };
    }, []);

    const handlePlay = (text) => {
        if (isPaused) {
            synth.current.resume();
            setIsPaused(false);
            setIsPlaying(true);
            return;
        }

        synth.current.cancel();

        const newUtterance = new SpeechSynthesisUtterance(text);
        newUtterance.rate = playbackRate;
        newUtterance.onend = () => {
            setIsPlaying(false);
            setIsPaused(false);
        };

        utterance.current = newUtterance;
        synth.current.speak(newUtterance);
        setIsPlaying(true);
        setIsPaused(false);
    };

    const handlePause = () => {
        synth.current.pause();
        setIsPaused(true);
        setIsPlaying(false);
    };

    const handleStop = () => {
        synth.current.cancel();
        setIsPlaying(false);
        setIsPaused(false);
    };

    const toggleSpeed = () => {
        const newRate = playbackRate === 1 ? 1.5 : (playbackRate === 1.5 ? 2 : 1);
        setPlaybackRate(newRate);
    };

    const closeArticle = () => {
        setActiveArticle(null);
        handleStop();
    };

    return (
        <div className={`min-h-screen relative font-sans transition-colors duration-500 overflow-x-hidden ${darkMode ? 'bg-[#0f172a] text-white' : 'bg-slate-50 text-slate-900'} ${viewMode === 'widget' ? 'flex items-center justify-center p-10 bg-slate-200 dark:bg-slate-900' : ''}`}>

            {viewMode !== 'widget' && <AnimatedBackground mouseX={mouseX} mouseY={mouseY} darkMode={darkMode} />}

            {/* Navbar - Matching Home Page Design */}
            {viewMode !== 'widget' && (
                <Navbar darkMode={darkMode} setDarkMode={setDarkMode}>
                    <button
                        onClick={() => setViewMode('widget')}
                        className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all border ${darkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-100 border-slate-200 hover:bg-slate-200'}`}
                    >
                        Try Widget View
                    </button>
                </Navbar>
            )}

            {/* Widget Mode Container (if active) */}
            <div className={`transition-all duration-500 relative z-10 ${viewMode === 'widget' ? 'w-[400px] h-[700px] bg-white dark:bg-black rounded-[40px] shadow-2xl overflow-hidden border-[8px] border-slate-800 relative' : 'w-full pt-28'}`}>

                {/* Widget Header */}
                {viewMode === 'widget' && (
                    <div className="bg-slate-50 dark:bg-white/5 p-4 border-b border-slate-200 dark:border-white/5 flex justify-between items-center">
                        <span className="font-bold">BeyondInsights</span>
                        <div className="flex gap-2">
                            <button onClick={() => setViewMode('blog')} className="text-slate-400 hover:text-black dark:hover:text-white"><ExternalLink size={16} /></button>
                            <button onClick={() => setDarkMode(!darkMode)}>{darkMode ? <Sun size={14} /> : <Moon size={14} />}</button>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <main className={`relative ${viewMode === 'blog' ? 'max-w-7xl mx-auto px-6 py-8' : 'p-4 h-full overflow-y-auto custom-scrollbar pb-20'}`}>

                    {/* Header Section */}
                    {viewMode === 'blog' && (
                        <div className="mb-16 text-center">
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`text-5xl md:text-7xl font-black mb-6 tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}
                            >
                                Latest <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-violet-600">Intelligence.</span>
                            </motion.h1>
                            <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
                                Curated insights powered by AI. Explore our latest articles on technology, marketing, and the future of business.
                            </p>
                        </div>
                    )}

                    {viewMode === 'widget' && (
                        <h2 className="text-2xl font-bold mb-4">Latest Articles</h2>
                    )}

                    {/* Grid */}
                    <div className={`grid gap-8 ${viewMode === 'blog' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                        {articles.length === 0 && (
                            <div className="col-span-full py-20 text-center text-slate-400 border-2 border-dashed border-slate-700/50 rounded-3xl bg-white/5">
                                No published articles yet. Process some in Phase 2!
                            </div>
                        )}

                        {articles.map((article, i) => (
                            <motion.article
                                key={article._id}
                                layoutId={`card-${article._id}`}
                                onClick={() => setActiveArticle(article)}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className={`group cursor-pointer rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-pink-500/10 transition-all duration-500 hover:-translate-y-2 border ${darkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 hover:border-pink-200 shadow-xl shadow-slate-200/50'}`}
                            >
                                <div className={`h-48 relative overflow-hidden ${darkMode ? 'bg-black/20' : 'bg-slate-100'}`}>
                                    {/* Gradient Overlay */}
                                    <div className={`absolute inset-0 opacity-20 ${darkMode ? 'bg-gradient-to-br from-pink-500/40 via-purple-500/40 to-transparent' : 'bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-transparent'}`}></div>
                                    <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                                        {article.aiTags?.slice(0, 2).map((tag, t) => (
                                            <span key={t} className={`px-2 py-1 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider rounded-md ${darkMode ? 'bg-black/60 text-white' : 'bg-white/80 text-slate-800'}`}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                    <Bot className={`absolute top-4 right-4 w-24 h-24 rotate-12 opacity-5 ${darkMode ? 'text-white' : 'text-slate-900'}`} />
                                </div>

                                <div className="p-8">
                                    <div className="flex items-center gap-2 mb-4 text-xs font-bold text-pink-500 uppercase tracking-widest">
                                        <Sparkles size={12} />
                                        AI Optimized
                                        {article.seoScore && (
                                            <span className={`ml-auto ${article.seoScore >= 80 ? 'text-green-500' : 'text-yellow-500'}`}>Score: {article.seoScore}</span>
                                        )}
                                    </div>
                                    <h3 className={`text-xl font-bold leading-tight mb-4 group-hover:text-pink-500 transition-colors ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                        {article.title}
                                    </h3>
                                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 mb-6">
                                        {article.aiSummary || article.originalContent?.slice(0, 150)}...
                                    </p>
                                    <div className={`flex items-center justify-between border-t pt-6 ${darkMode ? 'border-white/10' : 'border-slate-100'}`}>
                                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                            <Calendar size={14} />
                                            <span>Oct 24, 2025</span>
                                        </div>
                                        <span className="flex items-center gap-1 text-xs font-bold text-pink-500 group-hover:translate-x-1 transition-transform">
                                            Read Article <ArrowRight size={14} />
                                        </span>
                                    </div>
                                </div>
                            </motion.article>
                        ))}
                    </div>
                </main>

                {/* Article Modal */}
                <AnimatePresence>
                    {activeArticle && (
                        <motion.div
                            layoutId={`card-${activeArticle._id}`}
                            className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-10 bg-black/80 backdrop-blur-xl"
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`w-full max-w-4xl max-h-full rounded-[3rem] shadow-2xl overflow-hidden flex flex-col relative border ${darkMode ? 'bg-[#0f172a] border-white/10' : 'bg-white border-white'}`}
                            >
                                <button
                                    onClick={(e) => { e.stopPropagation(); closeArticle(); }}
                                    className={`absolute top-6 right-6 p-3 rounded-full transition-colors z-20 ${darkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                                >
                                    <X size={20} />
                                </button>

                                <div className="overflow-y-auto custom-scrollbar pb-32">
                                    {/* Hero Header */}
                                    <div className={`p-10 md:p-16 text-center border-b ${darkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                                        <div className="flex items-center justify-center gap-2 mb-8">
                                            {activeArticle.aiTags?.map((tag, t) => (
                                                <span key={t} className={`px-4 py-1.5 border rounded-full text-xs font-bold uppercase tracking-widest ${darkMode ? 'bg-black border-white/10 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}>
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                        <h1 className={`text-4xl md:text-6xl font-black leading-tight mb-8 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                            {activeArticle.title}
                                        </h1>

                                        <div className="flex justify-center mb-8">
                                            <button
                                                onClick={() => handlePlay(activeArticle.updatedContent || activeArticle.originalContent)}
                                                className={`flex items-center gap-3 px-8 py-4 rounded-full font-bold shadow-xl hover:scale-105 transition-transform ${darkMode ? 'bg-white text-black hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                                            >
                                                {isPlaying ? <span className="flex items-center gap-2"><Volume2 className="animate-pulse" size={20} /> Listening...</span> : <span className="flex items-center gap-2"><Play size={20} /> Listen to Article</span>}
                                            </button>
                                        </div>

                                        <p className="text-xl md:text-2xl max-w-3xl mx-auto italic font-serif leading-relaxed opacity-70">
                                            "{activeArticle.aiSummary}"
                                        </p>
                                    </div>

                                    {/* Content Body */}
                                    <div className="p-10 md:p-20 max-w-3xl mx-auto">
                                        <div className={`prose prose-lg max-w-none first-letter:text-6xl first-letter:font-bold first-letter:float-left first-letter:mr-4 first-letter:mt-[-10px] ${darkMode ? 'prose-invert prose-p:text-slate-300 prose-headings:text-white' : 'prose-slate prose-headings:text-slate-900'}`}>
                                            <div className="whitespace-pre-wrap">
                                                {activeArticle.updatedContent || activeArticle.originalContent}
                                            </div>
                                        </div>

                                        {/* Citations / Footer */}
                                        <div className={`mt-20 pt-10 border-t ${darkMode ? 'border-white/10' : 'border-slate-200'}`}>
                                            <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Sources & References</h4>
                                            <ul className="space-y-3">
                                                {activeArticle.citations?.map((cite, i) => (
                                                    <li key={i} className="text-sm text-slate-500 truncate flex items-center gap-3 group">
                                                        <ExternalLink size={14} className="group-hover:text-pink-500 transition-colors" />
                                                        <a href={cite} target="_blank" rel="noopener noreferrer" className="hover:text-pink-500 underline decoration-pink-500/30 transition-colors">
                                                            {cite}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Audio Player */}
                                {(isPlaying || isPaused) && (
                                    <motion.div
                                        initial={{ y: 200 }}
                                        animate={{ y: 0 }}
                                        exit={{ y: 200 }}
                                        className={`absolute bottom-8 left-1/2 -translate-x-1/2 border shadow-2xl rounded-full px-8 py-4 flex items-center gap-8 z-50 backdrop-blur-xl ${darkMode ? 'bg-black/80 border-white/10' : 'bg-white/90 border-slate-200'}`}
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-pink-500 uppercase tracking-widest">Now Playing</span>
                                            <span className={`text-sm font-bold max-w-[200px] truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>{activeArticle.title}</span>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <button onClick={handleStop} className="p-2 rounded-full hover:bg-white/10 text-slate-500 transition-colors">
                                                <Square size={20} fill="currentColor" />
                                            </button>

                                            <button
                                                onClick={() => isPlaying ? handlePause() : handlePlay(activeArticle.updatedContent || activeArticle.originalContent)}
                                                className={`w-12 h-12 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg ${darkMode ? 'bg-white text-black' : 'bg-black text-white'}`}
                                            >
                                                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                                            </button>

                                            <button
                                                onClick={toggleSpeed}
                                                className="p-2 rounded-full hover:bg-white/10 text-slate-500 text-xs font-bold w-12 flex items-center justify-center transition-colors"
                                            >
                                                {playbackRate}x
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Phase3Page;
