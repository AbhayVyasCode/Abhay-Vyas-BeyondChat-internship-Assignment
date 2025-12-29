import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useTheme } from '../context/ThemeContext';
import Navbar from './Navbar';
import Footer from './Footer';
import { ArrowRight, ArrowLeft, BookOpen, User, Calendar, Tag, Share2, X, ExternalLink, Sparkles, Volume2, Play, Pause, Square, FastForward, Sun, Moon, Bot, MessageSquare, Send, Network, LayoutGrid, Trash2, Search, Filter, Info, ZoomIn, ZoomOut } from 'lucide-react';

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
    const [viewMode, setViewMode] = useState('blog'); // 'blog' | 'widget'
    const [layoutMode, setLayoutMode] = useState('grid'); // 'grid' | 'graph'
    const { darkMode, toggleTheme } = useTheme();

    const askQuestion = useAction(api.ai.askQuestion); // Feature: RAG Chat
    const deleteArticle = useMutation(api.articles.deleteArticle);

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

    // Audio State
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const synth = useRef(window.speechSynthesis);
    const utterance = useRef(null);

    // Chat State
    const [showChat, setShowChat] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);
    const [chatInput, setChatInput] = useState("");
    const [isChatLoading, setIsChatLoading] = useState(false);
    const chatEndRef = useRef(null);

    // Cleanup audio on unmount or article close
    useEffect(() => {
        return () => {
            synth.current.cancel();
        };
    }, []);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, showChat]);

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
        setShowChat(false);
        setChatHistory([]); // Reset chat on close
    };

    // --- Feature: Ask This Article ---
    const handleSendMessage = async () => {
        if (!chatInput.trim() || !activeArticle) return;

        const userMsg = { role: 'user', content: chatInput };
        setChatHistory(prev => [...prev, userMsg]);
        setChatInput("");
        setIsChatLoading(true);

        try {
            const answer = await askQuestion({
                articleId: activeArticle._id,
                question: userMsg.content,
                history: chatHistory
            });

            setChatHistory(prev => [...prev, { role: 'assistant', content: answer }]);
        } catch (error) {
            setChatHistory(prev => [...prev, { role: 'assistant', content: "Sorry, I couldn't process that request." }]);
        } finally {
            setIsChatLoading(false);
        }
    };


    return (
        <div className={`min-h-screen relative font-sans transition-colors duration-500 overflow-x-hidden ${darkMode ? 'bg-[#0f172a] text-white' : 'bg-slate-50 text-slate-900'} ${viewMode === 'widget' ? 'flex items-center justify-center p-10 bg-slate-200 dark:bg-slate-900' : ''}`}>

            {viewMode !== 'widget' && <AnimatedBackground mouseX={mouseX} mouseY={mouseY} darkMode={darkMode} />}

            {/* Navbar - Matching Home Page Design */}
            {viewMode !== 'widget' && (
                <Navbar>
                    <button
                        onClick={() => setViewMode('widget')}
                        className={`hidden md:block px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all border ${darkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-100 border-slate-200 hover:bg-slate-200'}`}
                    >
                        Try Widget View
                    </button>
                </Navbar>
            )}

            {/* Floating Exit Button for Widget Mode */}
            {viewMode === 'widget' && (
                <button
                    onClick={() => setViewMode('blog')}
                    className="fixed left-10 top-1/2 -translate-y-1/2 z-50 flex flex-col items-start gap-2 group"
                >
                    <div className="text-4xl hover:-translate-x-2 transition-transform duration-300">
                        <ArrowLeft size={40} className={darkMode ? 'text-white' : 'text-slate-900'} />
                    </div>
                    <div className={`text-5xl font-black uppercase leading-none tracking-tighter ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        Exit<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-600 group-hover:pl-2 transition-all">Widget</span><br />
                        View
                    </div>
                </button>
            )}

            {/* Widget Mode Container (if active) */}
            <div className={`transition-all duration-500 relative z-10 ${viewMode === 'widget' ? 'w-full max-w-[400px] h-[700px] max-h-[85vh] bg-white dark:bg-black rounded-[40px] shadow-2xl overflow-hidden border-[8px] border-slate-800 relative' : 'w-full pt-28'}`}>

                {/* Widget Header */}
                {viewMode === 'widget' && (
                    <div className="bg-slate-50 dark:bg-white/5 p-4 border-b border-slate-200 dark:border-white/5 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg border-2 border-white/10 overflow-hidden relative">
                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                <span className="font-serif font-black text-white italic z-10 text-[10px]">AV</span>
                            </div>
                            <div className="flex flex-col">
                                <span className={`text-sm font-bold tracking-tight leading-none ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    Abhay <span className="text-cyan-500">Vyas</span>
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {/* External Link Removed from Header */}
                            <button onClick={toggleTheme}>{darkMode ? <Sun size={14} /> : <Moon size={14} />}</button>
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
                            <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed mb-8">
                                Curated insights powered by AI. Explore our latest articles on technology, marketing, and the future of business.
                            </p>

                            {/* Feature: Graph Toggle */}
                            <div className="inline-flex bg-slate-200 dark:bg-white/10 p-1 rounded-full">
                                <button
                                    onClick={() => setLayoutMode('grid')}
                                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${layoutMode === 'grid' ? 'bg-white dark:bg-black text-pink-500 shadow-lg' : 'text-slate-500'}`}
                                >
                                    <LayoutGrid size={14} /> Grid View
                                </button>
                                <button
                                    onClick={() => setLayoutMode('graph')}
                                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${layoutMode === 'graph' ? 'bg-white dark:bg-black text-pink-500 shadow-lg' : 'text-slate-500'}`}
                                >
                                    <Network size={14} /> Knowledge Graph
                                </button>
                            </div>
                        </div>
                    )}

                    {viewMode === 'widget' && (
                        <h2 className="text-2xl font-bold mb-4">Latest Articles</h2>
                    )}

                    {/* Content Area: Grid vs Graph */}
                    {layoutMode === 'grid' || viewMode === 'widget' ? (
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

                                        {/* Delete Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm("Delete this article?")) deleteArticle({ id: article._id });
                                            }}
                                            className="absolute top-4 left-4 p-3 bg-red-500 text-white rounded-full shadow-lg z-50 hover:bg-red-600 hover:scale-110 transition-all"
                                            title="Delete Article"
                                        >
                                            <Trash2 size={16} />
                                        </button>

                                        {/* Feature: Quick Actions (Voice & Chat) */}
                                        <div className="absolute top-4 right-4 flex gap-2 z-50">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handlePlay(article.updatedContent || article.originalContent);
                                                    setActiveArticle(article); // Open modal to show player
                                                }}
                                                className={`p-3 rounded-full shadow-lg transition-all hover:scale-110 ${darkMode ? 'bg-black/60 text-white hover:bg-pink-500' : 'bg-white/90 text-slate-800 hover:bg-pink-500 hover:text-white'}`}
                                                title="Listen to Article"
                                            >
                                                <Volume2 size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveArticle(article);
                                                    setTimeout(() => setShowChat(true), 100); // Open chat slightly after modal
                                                }}
                                                className={`p-3 rounded-full shadow-lg transition-all hover:scale-110 ${darkMode ? 'bg-black/60 text-white hover:bg-blue-500' : 'bg-white/90 text-slate-800 hover:bg-blue-500 hover:text-white'}`}
                                                title="Ask about Article"
                                            >
                                                <MessageSquare size={16} />
                                            </button>
                                        </div>

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
                    ) : (
                        // Feature: Knowledge Graph View
                        <KnowledgeGraph articles={articles} onSelect={setActiveArticle} darkMode={darkMode} />
                    )}

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
                                className={`w-full max-w-4xl h-[85vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col relative border ${darkMode ? 'bg-[#0f172a] border-white/10' : 'bg-white border-white'}`}
                            >
                                <button
                                    onClick={(e) => { e.stopPropagation(); closeArticle(); }}
                                    className={`absolute top-6 right-6 p-3 rounded-full transition-colors z-20 ${darkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                                >
                                    <X size={20} />
                                </button>

                                {/* Feature: Chat Toggle Button */}
                                <button
                                    onClick={() => setShowChat(!showChat)}
                                    className={`absolute bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl hover:scale-110 transition-transform ${showChat ? 'bg-pink-500 text-white' : darkMode ? 'bg-white text-black' : 'bg-black text-white'}`}
                                >
                                    {showChat ? <X size={24} /> : <MessageSquare size={24} />}
                                </button>


                                <div className="flex flex-1 min-h-0">
                                    {/* Article Content */}
                                    <div className="flex-1 overflow-y-auto custom-scrollbar pb-32">
                                        {/* Hero Header */}
                                        <div className={`p-6 md:p-16 text-center border-b ${darkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                                            <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
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

                                    {/* Feature: Chat Pane (Side-by-side) */}
                                    <AnimatePresence>
                                        {showChat && (
                                            <motion.div
                                                initial={{ width: 0, opacity: 0 }}
                                                animate={{ width: 350, opacity: 1 }}
                                                exit={{ width: 0, opacity: 0 }}
                                                className={`border-l flex flex-col ${darkMode ? 'bg-[#0f172a] border-white/10' : 'bg-slate-50 border-slate-200'}`}
                                            >
                                                <div className={`p-4 font-bold text-xs uppercase tracking-widest border-b ${darkMode ? 'border-white/10 text-white' : 'border-slate-200 text-slate-800'}`}>
                                                    Ask This Article
                                                </div>
                                                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                                                    {chatHistory.length === 0 && (
                                                        <div className="text-center text-slate-500 text-sm mt-10 p-4">
                                                            <Bot className="mx-auto mb-2 opacity-50" />
                                                            Ask me anything about this article!
                                                        </div>
                                                    )}
                                                    {chatHistory.map((msg, i) => (
                                                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-pink-500 text-white rounded-tr-none' : (darkMode ? 'bg-white/10 text-slate-200 rounded-tl-none' : 'bg-white text-slate-800 shadow rounded-tl-none')}`}>
                                                                {msg.content}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {isChatLoading && (
                                                        <div className="flex justify-start"><div className={`p-3 rounded-2xl text-sm ${darkMode ? 'bg-white/10' : 'bg-white'} animate-pulse`}>Thinking...</div></div>
                                                    )}
                                                    <div ref={chatEndRef} />
                                                </div>
                                                <div className="p-4">
                                                    <form
                                                        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                                                        className="relative"
                                                    >
                                                        <input
                                                            type="text"
                                                            value={chatInput}
                                                            onChange={(e) => setChatInput(e.target.value)}
                                                            placeholder="Type a question..."
                                                            className={`w-full p-3 pr-10 rounded-xl text-sm outline-none border focus:border-pink-500 ${darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200'}`}
                                                        />
                                                        <button
                                                            type="submit"
                                                            disabled={!chatInput.trim() || isChatLoading}
                                                            className="absolute right-2 top-2 p-1.5 rounded-lg text-pink-500 hover:bg-pink-500/10 disabled:opacity-50"
                                                        >
                                                            <Send size={16} />
                                                        </button>
                                                    </form>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>


                                {/* Floating Audio Player (Only shows if Playing and Chat is closed for space, or just stacked) */}
                                {(isPlaying || isPaused) && !showChat && (
                                    <motion.div
                                        initial={{ y: 200 }}
                                        animate={{ y: 0 }}
                                        exit={{ y: 200 }}
                                        className={`absolute bottom-8 left-1/2 -translate-x-1/2 border shadow-2xl rounded-full px-8 py-4 flex items-center gap-8 z-[55] backdrop-blur-xl ${darkMode ? 'bg-black/80 border-white/10' : 'bg-white/90 border-slate-200'}`}
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
            {viewMode !== 'widget' && <Footer />}
        </div>
    );
};

// --- Knowledge Graph Component (Galaxy Redesign) ---
const KnowledgeGraph = ({ articles, onSelect, darkMode }) => {
    // 1. Simulation & State
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [hoveredNode, setHoveredNode] = useState(null);
    const [hoveredLine, setHoveredLine] = useState(null);
    const [zoom, setZoom] = useState(1);

    // New Feature State
    const [allTags, setAllTags] = useState([]);
    const [activeTags, setActiveTags] = useState(new Set());
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [layoutMode, setLayoutMode] = useState('galaxy'); // 'galaxy' | 'grid' | 'ring'

    const containerRef = useRef(null);
    const animationRef = useRef(null);

    // Initialize Graph Data (Nodes & Connections)
    useEffect(() => {
        // A. Extract all unique tags
        const tags = new Set();
        articles.forEach(a => a.aiTags?.forEach(t => tags.add(t)));
        const tagArray = Array.from(tags).sort();
        setAllTags(tagArray);
        setActiveTags(new Set(tagArray)); // All active by default

        // B. Create Nodes with random starting positions
        const initialNodes = articles.map(art => ({
            ...art,
            x: Math.random() * 800 - 400, // Center around 0
            y: Math.random() * 600 - 300,
            vx: 0,
            vy: 0,
            radius: 40 + (art.seoScore ? art.seoScore / 5 : 0) // Size based on score
        }));

        // C. Create Smart Connections based on shared tags
        const initialEdges = [];
        for (let i = 0; i < initialNodes.length; i++) {
            for (let j = i + 1; j < initialNodes.length; j++) {
                const nodeA = initialNodes[i];
                const nodeB = initialNodes[j];

                // Find shared tags
                const sharedTags = nodeA.aiTags?.filter(tag => nodeB.aiTags?.includes(tag)) || [];

                if (sharedTags.length > 0) {
                    initialEdges.push({
                        source: nodeA._id,
                        target: nodeB._id,
                        sharedTags: sharedTags,
                        strength: sharedTags.length // More shared tags = strong connection
                    });
                }
            }
        }

        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [articles]);

    // Physics Loop ("Galaxy" Gravity)
    useEffect(() => {
        const updatePhysics = () => {
            setNodes(prevNodes => {
                const newNodes = prevNodes.map(n => ({ ...n })); // Shallow copy for mutation

                // Constants
                const REPULSION = 3000; // Reduced for gentler movement
                const ATTRACTION = 0.001; // Weaker springs
                const CENTER_GRAVITY = 0.0001;
                const DAMPING = 0.92; // Friction
                const MAX_SPEED = 0.5; // Speed Limit

                // Screen Boundaries (Responsive)
                const isMobile = window.innerWidth < 768;
                const BOUND_X = isMobile ? 180 : 500;
                const BOUND_Y = isMobile ? 250 : 350;

                const GRID_SIZE = 150;
                const RING_RADIUS = isMobile ? 160 : 300;

                // 1. Calculate Forces based on Mode
                if (layoutMode === 'galaxy') {
                    // --- GALAXY MODE ---
                    for (let i = 0; i < newNodes.length; i++) {
                        for (let j = i + 1; j < newNodes.length; j++) {
                            const a = newNodes[i];
                            const b = newNodes[j];
                            const dx = a.x - b.x;
                            const dy = a.y - b.y;
                            const distSq = dx * dx + dy * dy || 1;
                            const force = REPULSION / distSq;
                            const fx = (dx / Math.sqrt(distSq)) * force;
                            const fy = (dy / Math.sqrt(distSq)) * force;
                            a.vx += fx; a.vy += fy;
                            b.vx -= fx; b.vy -= fy;
                        }
                    }
                    edges.forEach(edge => {
                        const source = newNodes.find(n => n._id === edge.source);
                        const target = newNodes.find(n => n._id === edge.target);
                        if (source && target) {
                            const dx = target.x - source.x;
                            const dy = target.y - source.y;
                            source.vx += dx * ATTRACTION * edge.strength;
                            source.vy += dy * ATTRACTION * edge.strength;
                            target.vx -= dx * ATTRACTION * edge.strength;
                            target.vy -= dy * ATTRACTION * edge.strength;
                        }
                    });
                    newNodes.forEach(node => {
                        node.vx -= node.x * CENTER_GRAVITY;
                        node.vy -= node.y * CENTER_GRAVITY;
                    });

                } else if (layoutMode === 'grid') {
                    // --- GRID MODE ---
                    const cols = Math.ceil(Math.sqrt(newNodes.length));
                    const mobileCols = Math.ceil(Math.sqrt(newNodes.length) / 1.5);
                    const activeCols = isMobile ? mobileCols : cols;
                    newNodes.forEach((node, i) => {
                        const col = i % activeCols;
                        const row = Math.floor(i / activeCols);
                        const targetX = (col - activeCols / 2) * (isMobile ? 100 : GRID_SIZE) + (isMobile ? 50 : 75);
                        const targetY = (row - activeCols / 2) * (isMobile ? 100 : GRID_SIZE) + (isMobile ? 50 : 75);
                        node.vx += (targetX - node.x) * 0.05;
                        node.vy += (targetY - node.y) * 0.05;
                    });

                } else if (layoutMode === 'ring') {
                    // --- RING MODE ---
                    newNodes.forEach((node, i) => {
                        const angle = (i / newNodes.length) * Math.PI * 2;
                        const targetX = Math.cos(angle) * RING_RADIUS;
                        const targetY = Math.sin(angle) * RING_RADIUS;
                        node.vx += (targetX - node.x) * 0.05;
                        node.vy += (targetY - node.y) * 0.05;
                    });
                }

                // 2. Integration & Constraints
                newNodes.forEach(node => {
                    node.x += node.vx;
                    node.y += node.vy;

                    // Wall Bouncing
                    if (node.x > BOUND_X) { node.x = BOUND_X; node.vx *= -0.5; }
                    if (node.x < -BOUND_X) { node.x = -BOUND_X; node.vx *= -0.5; }
                    if (node.y > BOUND_Y) { node.y = BOUND_Y; node.vy *= -0.5; }
                    if (node.y < -BOUND_Y) { node.y = -BOUND_Y; node.vy *= -0.5; }

                    // Speed Limit
                    const speed = Math.sqrt(node.vx ** 2 + node.vy ** 2);
                    if (speed > MAX_SPEED) {
                        node.vx = (node.vx / speed) * MAX_SPEED;
                        node.vy = (node.vy / speed) * MAX_SPEED;
                    }

                    node.vx *= DAMPING;
                    node.vy *= DAMPING;
                });

                return newNodes;
            });

            animationRef.current = requestAnimationFrame(updatePhysics);
        };

        if (articles.length > 0) {
            animationRef.current = requestAnimationFrame(updatePhysics);
        }

        return () => cancelAnimationFrame(animationRef.current);
    }, [articles.length, edges, layoutMode]);

    // Filter Logic
    const toggleTag = (tag) => {
        const newTags = new Set(activeTags);
        if (newTags.has(tag)) newTags.delete(tag);
        else newTags.add(tag);
        setActiveTags(newTags);
    };

    // Big Bang Interaction
    const handleBigBang = () => {
        setNodes(prev => prev.map(n => ({
            ...n,
            vx: (Math.random() - 0.5) * 50,
            vy: (Math.random() - 0.5) * 50
        })));
    };

    // Filter Logic for "Search & Zoom"
    const matchedNodeId = nodes.find(n => searchQuery && n.title.toLowerCase().includes(searchQuery.toLowerCase()))?._id;

    // Camera Pan (Mouse Move Parallax)
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const handleMouseMove = (e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left - rect.width / 2);
        mouseY.set(e.clientY - rect.top - rect.height / 2);
    };

    const parallaxX = useTransform(mouseX, x => x * -0.05); // Move opposite to mouse slightly
    const parallaxY = useTransform(mouseY, y => y * -0.05);

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            className="w-full h-[600px] md:h-[800px] relative flex items-center justify-center group/graph"
        >
            {/* Background Wrapper (Clipped) */}
            <div className={`absolute inset-0 rounded-[2rem] md:rounded-[3rem] overflow-hidden border transition-colors duration-500 z-0 ${darkMode ? 'bg-black/40 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                {/* Background Grid (Parallax) */}
                <motion.div
                    style={{ x: parallaxX, y: parallaxY }}
                    className="absolute inset-0 pointer-events-none opacity-20"
                >
                    <div className={`absolute inset-0 bg-[size:50px_50px] ${darkMode ? 'bg-grid-white/[0.1]' : 'bg-grid-slate-900/[0.1]'}`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                </motion.div>
            </div>

            {/* --- TOP CONTROLS --- */}
            <div className="absolute top-4 left-4 right-4 md:top-6 md:left-6 md:right-auto md:w-auto z-40 flex flex-col gap-2">
                {/* Row 1: Search + Filter (Mobile) */}
                <div className="flex gap-2 w-full md:w-auto">
                    <div className={`flex-1 md:flex-none flex items-center gap-2 p-2 rounded-2xl border backdrop-blur-xl shadow-xl ${darkMode ? 'bg-black/60 border-white/10' : 'bg-white/80 border-slate-200'}`}>
                        <Search size={18} className="text-slate-400 ml-2" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent outline-none text-sm w-full md:w-48 font-bold placeholder:text-slate-500"
                        />
                    </div>
                    {/* Filter Button (Mobile: Visible next to search, Desktop: Hidden here, shown on side) */}
                    <button
                        onClick={() => setShowFilterPanel(!showFilterPanel)}
                        className={`md:hidden p-3 rounded-2xl shadow-xl border backdrop-blur-md transition-colors ${showFilterPanel ? 'bg-pink-500 text-white border-pink-500' : (darkMode ? 'bg-black/60 border-slate-700 text-white' : 'bg-white/80 border-slate-200 text-slate-800')}`}
                    >
                        <Filter size={20} />
                    </button>
                </div>

                {/* Row 2: Zoom Controls */}
                <div className={`self-start p-1.5 rounded-2xl border backdrop-blur-xl shadow-xl flex items-center gap-1 ${darkMode ? 'bg-black/60 border-white/10' : 'bg-white/80 border-slate-200'}`}>
                    <button onClick={() => setZoom(z => Math.min(z + 0.2, 2))} className="p-2 hover:bg-pink-500 hover:text-white rounded-lg transition-colors"><ZoomIn size={16} /></button>
                    <button onClick={() => { setZoom(1); setSearchQuery(""); }} className="px-2 py-1 hover:bg-pink-500 hover:text-white rounded-lg transition-colors text-[10px] font-bold">RESET</button>
                    <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))} className="p-2 hover:bg-pink-500 hover:text-white rounded-lg transition-colors"><ZoomOut size={16} /></button>
                </div>
            </div>

            {/* --- LAYOUT CONTROLS --- */}
            <div className="absolute bottom-4 left-4 right-4 md:top-6 md:right-6 md:bottom-auto md:left-auto z-40 flex justify-between md:justify-end gap-2">
                <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                    <div className={`p-1.5 rounded-2xl border backdrop-blur-xl shadow-xl flex gap-1 ${darkMode ? 'bg-black/60 border-white/10' : 'bg-white/80 border-slate-200'}`}>
                        {['galaxy', 'grid', 'ring'].map(mode => (
                            <button
                                key={mode}
                                onClick={() => setLayoutMode(mode)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-bold uppercase transition-all ${layoutMode === mode ? 'bg-pink-500 text-white shadow-lg' : 'hover:bg-slate-500/10 text-slate-500'}`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleBigBang}
                        className="p-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all font-bold text-[10px] md:text-xs uppercase whitespace-nowrap"
                    >
                        💥 Bang
                    </button>
                </div>
            </div>

            {/* --- FILTER TOGGLE (Desktop Only - Left Center) --- */}
            <div className={`hidden md:block absolute left-6 top-1/2 -translate-y-1/2 z-40 transition-all duration-300 ${showFilterPanel ? 'translate-x-[260px]' : ''}`}>
                <button
                    onClick={() => setShowFilterPanel(!showFilterPanel)}
                    className={`p-3 rounded-full shadow-xl border backdrop-blur-md transition-colors ${showFilterPanel ? 'bg-pink-500 text-white border-pink-500' : (darkMode ? 'bg-black/60 border-slate-700 text-white' : 'bg-white/80 border-slate-200 text-slate-800')}`}
                >
                    <Filter size={20} />
                </button>
            </div>

            {/* Filter Panel (Slide-in) */}
            <div className={`absolute top-4 md:top-6 bottom-20 md:bottom-6 left-4 md:left-6 w-64 md:w-64 rounded-3xl border backdrop-blur-2xl shadow-2xl z-40 flex flex-col overflow-hidden transition-transform duration-300 origin-left ${showFilterPanel ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'} ${darkMode ? 'bg-black/95 md:bg-black/90 border-white/10' : 'bg-white/95 md:bg-white/90 border-slate-200'}`}>
                <div className="p-4 border-b border-slate-200 dark:border-white/10 font-bold flex justify-between items-center">
                    <span>Filter Universe</span>
                    <span className="text-xs px-2 py-0.5 bg-pink-500 rounded text-white">{activeTags.size}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2">
                    {allTags.map(tag => (
                        <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${activeTags.has(tag) ? 'bg-pink-500/10 text-pink-500 border border-pink-500/20' : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500'}`}
                        >
                            #{tag}
                            <div className={`w-2 h-2 rounded-full ${activeTags.has(tag) ? 'bg-pink-500' : 'bg-slate-300'}`} />
                        </button>
                    ))}
                </div>
                <div className="p-4 border-t border-slate-200 dark:border-white/10">
                    <button onClick={() => setActiveTags(new Set(allTags))} className="text-xs text-slate-500 hover:text-white underline w-full text-center">Reset Filters</button>
                </div>
            </div>

            {/* Hint / Instructions (Hidden on Mobile to save space) */}
            <div className="hidden md:block absolute bottom-6 right-6 z-10 pointer-events-none opacity-50 text-xs font-bold uppercase tracking-widest text-right">
                <div className="flex items-center gap-2 justify-end mb-1"><Info size={14} /> Interactive Galaxy</div>
                <p>Hover nodes to focus • Drag to pan</p>
            </div>

            {/* THE GRAPH UNIVERSE */}
            <motion.div
                animate={{ scale: zoom }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="relative w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
            >
                {/* SVG Connections Layer */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                    <defs>
                        <linearGradient id="link-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#ec4899" stopOpacity="0" />
                            <stop offset="50%" stopColor="#ec4899" stopOpacity="0.5" />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    {edges.map((edge, i) => {
                        const source = nodes.find(n => n._id === edge.source);
                        const target = nodes.find(n => n._id === edge.target);
                        if (!source || !target) return null;

                        // Check visibility based on tags
                        const isSourceVisible = source.aiTags?.some(t => activeTags.has(t));
                        const isTargetVisible = target.aiTags?.some(t => activeTags.has(t));
                        if (!isSourceVisible || !isTargetVisible) return null;

                        // Focus Mode Logic
                        const isDimmed = hoveredNode && (hoveredNode !== edge.source && hoveredNode !== edge.target);
                        const isHovered = hoveredLine === i;
                        const isConnectedToHover = hoveredNode === edge.source || hoveredNode === edge.target;

                        return (
                            <g key={i}>
                                <motion.line
                                    x1={`calc(50% + ${source.x}px)`}
                                    y1={`calc(50% + ${source.y}px)`}
                                    x2={`calc(50% + ${target.x}px)`}
                                    y2={`calc(50% + ${target.y}px)`}
                                    stroke={isConnectedToHover || isHovered ? "url(#link-gradient)" : (darkMode ? "#ffffff20" : "#00000010")}
                                    strokeWidth={isHovered ? 4 : (isConnectedToHover ? 2 : 1)}
                                    className="transition-all duration-300"
                                    onMouseEnter={() => setHoveredLine(i)}
                                    onMouseLeave={() => setHoveredLine(null)}
                                    style={{ opacity: isDimmed && !isConnectedToHover ? 0.1 : 1 }}
                                />
                                {isHovered && (
                                    <foreignObject x={`calc(50% + ${(source.x + target.x) / 2}px)`} y={`calc(50% + ${(source.y + target.y) / 2}px)`} width="200" height="50">
                                        <div className={`text-[10px] px-2 py-1 rounded-full shadow-lg text-center backdrop-blur-md border ${darkMode ? 'bg-black/80 border-pink-500 text-white' : 'bg-white/80 border-pink-500 text-black'}`}>
                                            Linked by: {edge.sharedTags.join(", ")}
                                        </div>
                                    </foreignObject>
                                )}
                            </g>
                        );
                    })}
                </svg>

                {/* DOM Nodes Layer */}
                <div className="absolute inset-0 pointer-events-none">
                    {nodes.map(node => {
                        // Check Visibility
                        const isVisible = node.aiTags?.some(t => activeTags.has(t));
                        if (!isVisible) return null; // Or animate opacity to 0

                        const isHovered = hoveredNode === node._id;
                        const isDimmed = hoveredNode && hoveredNode !== node._id && !edges.some(e => (e.source === hoveredNode && e.target === node._id) || (e.target === hoveredNode && e.source === node._id));
                        const isMatched = searchQuery && matchedNodeId === node._id;

                        // Calculate center offset
                        const left = `calc(50% + ${node.x}px)`;
                        const top = `calc(50% + ${node.y}px)`;

                        return (
                            <div
                                key={node._id}
                                style={{ left, top }}
                                className={`absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto transition-all duration-500 ease-out`}
                            >
                                <motion.div
                                    onMouseEnter={() => setHoveredNode(node._id)}
                                    onMouseLeave={() => setHoveredNode(null)}
                                    onClick={() => onSelect(node)}
                                    animate={{
                                        scale: isHovered || isMatched ? 1.2 : 1,
                                        opacity: isDimmed ? 0.2 : 1,
                                        boxShadow: isHovered || isMatched ? "0 0 40px rgba(236, 72, 153, 0.6)" : "0 0 0 rgba(0,0,0,0)"
                                    }}
                                    className={`relative group cursor-pointer rounded-full flex items-center justify-center border-4 backdrop-blur-md transition-colors ${darkMode ? 'bg-black/60 border-slate-700 hover:border-pink-500 hover:bg-pink-900/20' : 'bg-white/60 border-white hover:border-pink-500'}`}
                                    style={{
                                        width: node.radius * 2,
                                        height: node.radius * 2
                                    }}
                                >
                                    {/* Icon */}
                                    <Bot size={node.radius} className={`transition-colors ${isHovered || isMatched ? 'text-pink-500' : (darkMode ? 'text-slate-400' : 'text-slate-600')}`} />

                                    {/* Pulse Ring */}
                                    {(isHovered || isMatched) && (
                                        <div className="absolute inset-0 rounded-full border-2 border-pink-500 animate-ping opacity-50" />
                                    )}

                                    {/* Hover Tooltip Card (Premium Orb Expansion) */}
                                    <AnimatePresence>
                                        {(isHovered || isMatched) && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.5, y: 10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.5, y: 10 }}
                                                className={`absolute bottom-full mb-4 w-64 p-4 rounded-2xl shadow-2xl border backdrop-blur-xl z-50 ${darkMode ? 'bg-black/90 border-pink-500/50 text-white' : 'bg-white/90 border-pink-500/50 text-slate-900'}`}
                                            >
                                                <div className="text-xs font-bold text-pink-500 uppercase tracking-widest mb-1">{new Date(node._creationTime || Date.now()).toLocaleDateString()}</div>
                                                <h3 className="font-bold text-lg leading-tight mb-2">{node.title}</h3>
                                                <div className="flex flex-wrap gap-1">
                                                    {node.aiTags && node.aiTags.slice(0, 3).map(t => (
                                                        <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-pink-500/20 text-pink-500 font-bold">#{t}</span>
                                                    ))}
                                                </div>
                                                <div className="mt-3 text-xs opacity-70 flex items-center gap-1">
                                                    Click to open <ArrowRight size={10} />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            </div>
                        );
                    })}
                </div>
            </motion.div>
        </div>
    );
};

export default Phase3Page;
