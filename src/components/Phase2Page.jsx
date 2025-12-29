import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bot, ExternalLink, Sparkles, Terminal, Sun, Moon, User, Database, Layout, Trash2, CheckCircle2, AlertCircle, Cpu, RefreshCw, Search, ThumbsUp, ThumbsDown, Sliders, Globe, Eye, FileDiff, History, RotateCcw, Download, FileText, Printer, Quote, Languages, BookOpen } from 'lucide-react';
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useTheme } from '../context/ThemeContext';
import Navbar from './Navbar';
import Footer from './Footer';

const Phase2Page = () => {
    // Convex Hooks
    const articles = useQuery(api.articles.list) || [];
    const searchContent = useAction(api.research.searchRelatedContent);
    const analyzeArticle = useAction(api.ai.transformArticle);

    const deleteArticle = useMutation(api.articles.deleteArticle);
    const updateCandidateStatus = useMutation(api.articles.updateCandidateStatus);
    const saveResearchConfig = useMutation(api.articles.saveResearchConfig);
    const restoreVersion = useMutation(api.articles.restoreVersion);

    // UI State
    const [selectedArticleId, setSelectedArticleId] = useState(null);
    const [viewMode, setViewMode] = useState('agent'); // 'agent' | 'diff'
    const { darkMode } = useTheme();
    const [isProcessing, setIsProcessing] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    // Agent Configuration State
    const [tone, setTone] = useState("Professional");
    const [keywords, setKeywords] = useState("");
    const [customPrompt, setCustomPrompt] = useState("");

    // Ext Set 2 State
    const [targetLanguage, setTargetLanguage] = useState("English (Default)");
    const [readabilityLevel, setReadabilityLevel] = useState(50);

    // Derived
    const selectedArticle = articles.find(a => a._id === selectedArticleId);

    // Auto-select
    useEffect(() => {
        if (!selectedArticleId && articles.length > 0) setSelectedArticleId(articles[0]._id);
    }, [articles, selectedArticleId]);

    // Apply saved config when article is selected
    useEffect(() => {
        if (selectedArticle) {
            if (selectedArticle.userTone) setTone(selectedArticle.userTone);
            if (selectedArticle.userKeywords) setKeywords(selectedArticle.userKeywords.join(", "));
            if (selectedArticle.customPrompt) setCustomPrompt(selectedArticle.customPrompt);
            // Ext Set 2
            if (selectedArticle.targetLanguage) setTargetLanguage(selectedArticle.targetLanguage);
            if (selectedArticle.readabilityLevel !== undefined) setReadabilityLevel(selectedArticle.readabilityLevel);
        }
    }, [selectedArticleId]);

    // Mouse Effects
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    useEffect(() => {
        const handleMouseMove = (e) => { mouseX.set(e.clientX); mouseY.set(e.clientY); };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [mouseX, mouseY]);


    // --- Actions ---

    // Step 1: Start Research
    const handleStartResearch = async () => {
        setIsProcessing(true);
        try {
            // Save config first
            await saveResearchConfig({
                id: selectedArticleId,
                tone,
                keywords: keywords.split(",").map(k => k.trim()).filter(k => k),
                // Ext Set 2
                targetLanguage,
                readabilityLevel
            });

            // Trigger Search
            await searchContent({ articleId: selectedArticleId });
        } catch (error) {
            alert("Research failed: " + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // Step 3: Generate Final Content
    const handleGenerate = async () => {
        setIsProcessing(true);
        try {
            await analyzeArticle({
                id: selectedArticleId,
                useResearch: true,
                tone,
                keywords: keywords.split(",").map(k => k.trim()).filter(k => k),
                customPrompt,
                // Ext Set 2
                targetLanguage,
                readabilityLevel
            });
        } catch (error) {
            alert("Generation failed: " + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (window.confirm("Delete this article?")) {
            await deleteArticle({ id });
            if (selectedArticleId === id) setSelectedArticleId(null);
        }
    };

    const handleRestore = async (timestamp) => {
        if (!window.confirm("Restore this version? Current draft will be overwritten.")) return;
        await restoreVersion({ id: selectedArticleId, timestamp });
        setShowHistory(false);
    };

    const handleDownloadMarkdown = () => {
        if (!selectedArticle?.updatedContent) return;
        const blob = new Blob([selectedArticle.updatedContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedArticle.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_optimized.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="min-h-screen relative bg-slate-50 dark:bg-[#0f172a] transition-colors duration-500 font-sans flex flex-col overflow-x-hidden">
            <AnimatedBackground mouseX={mouseX} mouseY={mouseY} darkMode={darkMode} />

            <Navbar>
                <div className="hidden md:block px-4 py-2 rounded-full bg-slate-200/50 dark:bg-white/5 text-sm font-semibold text-pink-500 border border-pink-500/20 shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                    Gemini 2.5 Research Agent
                </div>
            </Navbar>

            <main className="flex-grow pt-24 pb-20 px-4 container mx-auto flex flex-col gap-8 relative z-10">

                {/* Article List (Top Bar) */}
                <ArticleList
                    articles={articles}
                    selectedId={selectedArticleId}
                    onSelect={setSelectedArticleId}
                    onDelete={handleDelete}
                />

                {/* Main Workspace */}
                <section className="flex-grow flex gap-6">
                    <AnimatePresence mode="wait">
                        {selectedArticle ? (
                            <motion.div
                                key={selectedArticle._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
                            >
                                {/* LEFT: Agent Console (Configuration & Research) */}
                                <div className="lg:col-span-4 space-y-6">

                                    {/* 1. Configuration Panel */}
                                    <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-3xl p-6 backdrop-blur-xl">
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                            <Sliders size={18} className="text-pink-500" /> Agent Configuration
                                        </h3>

                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Tone & Style</label>
                                                    <select
                                                        value={tone}
                                                        onChange={(e) => setTone(e.target.value)}
                                                        className="w-full bg-red-500 text-white border border-red-600 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-red-500/50"
                                                    >
                                                        <option className="bg-white text-slate-800">Professional</option>
                                                        <option className="bg-white text-slate-800">Viral / Clickbait</option>
                                                        <option className="bg-white text-slate-800">Academic</option>
                                                        <option className="bg-white text-slate-800">Casual / Blog</option>
                                                        <option className="bg-white text-slate-800">Technical / Developer</option>
                                                    </select>
                                                </div>

                                                {/* Ext Set 2: Language */}
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block flex items-center gap-1"><Languages size={10} /> Language</label>
                                                    <select
                                                        value={targetLanguage}
                                                        onChange={(e) => setTargetLanguage(e.target.value)}
                                                        className="w-full bg-red-500 text-white border border-red-600 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-red-500/50"
                                                    >
                                                        <option className="bg-white text-slate-800">English (Default)</option>
                                                        <option className="bg-white text-slate-800">Spanish (LatAm)</option>
                                                        <option className="bg-white text-slate-800">French</option>
                                                        <option className="bg-white text-slate-800">German</option>
                                                        <option className="bg-white text-slate-800">Hindi</option>
                                                        <option className="bg-white text-slate-800">Japanese</option>
                                                        <option className="bg-white text-slate-800">Chinese (Simplified)</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Ext Set 2: Readability Slider */}
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block flex items-center gap-2">
                                                    <BookOpen size={12} /> Readability Level ({readabilityLevel}%)
                                                </label>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={readabilityLevel}
                                                    onChange={(e) => setReadabilityLevel(parseInt(e.target.value))}
                                                    className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-pink-500"
                                                />
                                                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-bold uppercase">
                                                    <span>Simple (EL5)</span>
                                                    <span>Standard</span>
                                                    <span>Academic</span>
                                                </div>
                                            </div>


                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Target Keywords</label>
                                                <input
                                                    type="text"
                                                    value={keywords}
                                                    onChange={(e) => setKeywords(e.target.value)}
                                                    placeholder="React, AI, Future (comma separated)"
                                                    className="w-full bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-pink-500/50"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block flex items-center gap-2">
                                                    <Terminal size={12} /> Custom Instructions
                                                </label>
                                                <textarea
                                                    value={customPrompt}
                                                    onChange={(e) => setCustomPrompt(e.target.value)}
                                                    placeholder="e.g. Write like a pirate, Make it super concise..."
                                                    className="w-full h-20 bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-pink-500/50 resize-none"
                                                />
                                            </div>

                                            <button
                                                onClick={handleStartResearch}
                                                disabled={isProcessing || selectedArticle.researchState === 'searching'}
                                                className="w-full py-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {selectedArticle.researchState === 'searching'
                                                    ? <><Search className="animate-spin" size={18} /> Searching Google...</>
                                                    : <><Globe size={18} /> Start Research</>
                                                }
                                            </button>
                                        </div>
                                    </div>

                                    {/* 2. Research Manager */}
                                    {selectedArticle.researchCandidates && (
                                        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-3xl p-6 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4">
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                                <Database size={18} className="text-blue-500" /> Research Sources
                                            </h3>

                                            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                                {selectedArticle.researchCandidates.map((candidate, idx) => (
                                                    <div key={idx} className={`p-3 rounded-xl border transition-all ${candidate.status === 'approved' ? 'bg-green-500/10 border-green-500/30' : candidate.status === 'rejected' ? 'opacity-50 bg-red-500/5 border-red-500/10' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/5'}`}>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <a href={candidate.url} target="_blank" rel="noreferrer" className="text-xs font-bold hover:underline line-clamp-1 flex-1 mr-2">
                                                                {candidate.title}
                                                            </a>
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => updateCandidateStatus({ id: selectedArticleId, candidateUrl: candidate.url, status: 'approved' })}
                                                                    className={`p-1 rounded ${candidate.status === 'approved' ? 'bg-green-500 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-400 hover:text-green-500'}`}
                                                                >
                                                                    <ThumbsUp size={12} />
                                                                </button>
                                                                <button
                                                                    onClick={() => updateCandidateStatus({ id: selectedArticleId, candidateUrl: candidate.url, status: 'rejected' })}
                                                                    className={`p-1 rounded ${candidate.status === 'rejected' ? 'bg-red-500 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-400 hover:text-red-500'}`}
                                                                >
                                                                    <ThumbsDown size={12} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <p className="text-[10px] text-slate-500 leading-tight line-clamp-2">{candidate.snippet}</p>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
                                                <button
                                                    onClick={handleGenerate}
                                                    disabled={isProcessing}
                                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-600 to-violet-600 text-white font-bold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                                >
                                                    {isProcessing
                                                        ? <><Sparkles className="animate-spin" size={18} /> Synthesizing...</>
                                                        : <><Sparkles size={18} /> Generate content</>
                                                    }
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* RIGHT: Content Workspace (Diff / Result) */}
                                <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-pink-500/20 shadow-2xl shadow-pink-500/5 rounded-3xl flex flex-col relative min-h-[600px]">

                                    {/* Toolbar */}
                                    <div className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5 p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 rounded-t-3xl">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-pink-500/10 rounded-lg">
                                                <Bot size={20} className="text-pink-500" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800 dark:text-white leading-tight">Output Preview</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
                                                    {selectedArticle.updatedContent ? "Optimized with Gemini 2.5" : "Draft Mode"}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 items-center w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                                            {selectedArticle.updatedContent && (
                                                <>
                                                    {/* Feature: Export */}
                                                    <div className="flex bg-slate-200 dark:bg-black/40 p-1.5 rounded-xl mr-3 gap-1">
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            title="Print to PDF"
                                                            onClick={() => window.print()}
                                                            className="p-2 text-red-500 hover:text-red-700 transition-colors"
                                                        >
                                                            <Printer size={20} />
                                                        </motion.button>
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            title="Download Markdown"
                                                            onClick={handleDownloadMarkdown}
                                                            className="p-2 text-red-500 hover:text-red-700 transition-colors"
                                                        >
                                                            <FileText size={20} />
                                                        </motion.button>
                                                    </div>

                                                    {/* Feature: History */}
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => setShowHistory(!showHistory)}
                                                        className={`p-2.5 rounded-xl transition-all mr-3 ${showHistory ? 'bg-red-500 text-white' : 'text-red-500 hover:bg-slate-200 dark:hover:bg-white/10'}`}
                                                    >
                                                        <History size={22} />
                                                    </motion.button>

                                                    <div className="flex bg-slate-200 dark:bg-black/40 p-1.5 rounded-xl gap-1">
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => setViewMode('agent')}
                                                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'agent' ? 'bg-white dark:bg-white/10 shadow-sm text-red-500' : 'text-slate-500 hover:text-red-400'}`}
                                                        >
                                                            Final View
                                                        </motion.button>
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => setViewMode('diff')}
                                                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'diff' ? 'bg-white dark:bg-white/10 shadow-sm text-red-500' : 'text-slate-500 hover:text-red-400'}`}
                                                        >
                                                            <FileDiff size={16} /> Diff
                                                        </motion.button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-8 relative">

                                        {/* Feature: History Modal */}
                                        <AnimatePresence>
                                            {showHistory && selectedArticle.versionHistory && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                    className="absolute top-16 right-4 z-50 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-2xl rounded-2xl p-4"
                                                >
                                                    <h4 className="text-sm font-bold mb-3 flex items-center gap-2 uppercase tracking-wider text-slate-500"><History size={14} /> Version History</h4>
                                                    <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                                                        {selectedArticle.versionHistory.length === 0 && <span className="text-xs text-slate-400">No history available</span>}
                                                        {selectedArticle.versionHistory.slice().reverse().map((ver, i) => (
                                                            <div key={i} className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl flex justify-between items-center group">
                                                                <div>
                                                                    <div className="text-xs font-bold">{new Date(ver.timestamp).toLocaleTimeString()}</div>
                                                                    <div className="text-[10px] text-slate-400">{new Date(ver.timestamp).toLocaleDateString()}</div>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleRestore(ver.timestamp)}
                                                                    className="p-1.5 bg-slate-200 dark:bg-white/10 hover:bg-pink-500 hover:text-white rounded-lg transition-colors"
                                                                    title="Restore this version"
                                                                >
                                                                    <RotateCcw size={14} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {!selectedArticle.updatedContent ? (
                                            <div className="py-20 flex flex-col items-center justify-center text-center opacity-50">
                                                <Terminal size={40} className="text-slate-400 mb-6" />
                                                <h3 className="text-xl font-bold mb-2">Ready to Search & Write</h3>
                                                <p className="max-w-md">Configure the agent on the left and click "Start Research" to begin the workflow.</p>
                                            </div>
                                        ) : (
                                            <>
                                                {viewMode === 'agent' ? (
                                                    <div className="prose dark:prose-invert prose-pink max-w-none animate-in fade-in">

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                                            <div className="p-4 bg-pink-50 dark:bg-pink-500/10 border border-pink-500/20 rounded-xl">
                                                                <div className="text-xs font-bold text-pink-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Sparkles size={12} /> Agent Summary</div>
                                                                <p className="italic text-sm">{selectedArticle.aiSummary}</p>
                                                            </div>

                                                            {/* Feature: SEO Gap Analysis */}
                                                            {selectedArticle.seoAnalysis?.competitorGapAnalysis && (
                                                                <div className="p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-500/20 rounded-xl">
                                                                    <div className="text-xs font-bold text-purple-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Eye size={12} /> Competitor Gaps</div>
                                                                    <ul className="text-sm list-disc pl-4 space-y-1">
                                                                        {selectedArticle.seoAnalysis.competitorGapAnalysis.slice(0, 3).map((gap, i) => (
                                                                            <li key={i}>{gap}</li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Feature: Smart Interlinking Msg */}
                                                        {selectedArticle.updatedContent.includes('](/') && ( // Crude check for internal links
                                                            <div className="mb-4 text-[10px] text-blue-400 flex items-center gap-2 bg-blue-50 dark:bg-blue-900/10 p-2 rounded">
                                                                <BookOpen size={12} /> Smart Interlinks detected! Check for links to existing articles.
                                                            </div>
                                                        )}

                                                        {/* Feature: Citations Reminder */}
                                                        {selectedArticle.citations && (
                                                            <div className="mb-4 text-[10px] text-slate-400 flex items-center gap-2 bg-slate-100 dark:bg-black/20 p-2 rounded">
                                                                <Quote size={12} /> Research Citations are enabled. Look for [1], [2] in the text.
                                                            </div>
                                                        )}

                                                        <div className="whitespace-pre-wrap">{selectedArticle.updatedContent}</div>
                                                    </div>
                                                ) : (
                                                    <DiffView original={selectedArticle.originalContent} updated={selectedArticle.updatedContent} />
                                                )}
                                            </>
                                        )}
                                    </div>

                                </div>
                            </motion.div>
                        ) : (
                            <div className="w-full py-40 flex items-center justify-center text-slate-400 bg-white/5 border border-dashed border-white/10 rounded-3xl">
                                Select an article from the list above to begin.
                            </div>
                        )}
                    </AnimatePresence>
                </section>
            </main>
            <Footer />
        </div>
    );
};

// --- Sub Components ---

const ArticleList = ({ articles, selectedId, onSelect, onDelete }) => (
    <section className="shrink-0">
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
            {articles.map(article => {
                const isSelected = selectedId === article._id;
                return (
                    <motion.div
                        key={article._id}
                        onClick={() => onSelect(article._id)}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: isSelected ? 1.05 : 1 }}
                        className={`snap-start min-w-[260px] p-4 rounded-2xl border cursor-pointer transition-all duration-300 group ${isSelected ? 'bg-white dark:bg-slate-800 border-pink-500 shadow-lg' : 'bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10'}`}
                    >
                        <h3 className={`font-bold text-sm line-clamp-1 mb-2 ${isSelected ? 'text-pink-500' : 'text-slate-700 dark:text-slate-300'}`}>{article.title}</h3>
                        <div className="flex justify-between items-center text-[10px] text-slate-400">
                            <span>{article.researchState || 'idle'}</span>
                            <button onClick={(e) => onDelete(e, article._id)} className="opacity-0 group-hover:opacity-100 hover:text-red-500"><Trash2 size={12} /></button>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    </section>
);

const DiffView = ({ original, updated }) => {
    // Simple mock diff for visual demonstration ensuring clean rendering
    return (
        <div className="grid grid-cols-2 gap-4 h-[600px] overflow-y-auto custom-scrollbar">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-xs sm:text-sm">
                <h4 className="font-bold text-red-500 mb-2 sticky top-0 bg-red-50 dark:bg-[#1f1212] py-2">ORIGINAL</h4>
                <div className="whitespace-pre-wrap opacity-70">{original}</div>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl text-xs sm:text-sm">
                <h4 className="font-bold text-green-500 mb-2 sticky top-0 bg-green-50 dark:bg-[#0f1f15] py-2">UPDATED (Agent)</h4>
                <div className="whitespace-pre-wrap">{updated}</div>
            </div>
        </div>
    );
};

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

            {/* 2. Static Center Glow (Similar to the reference image) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-primary/20 rounded-full blur-[150px] opacity-40 mix-blend-multiply dark:mix-blend-screen" />

            {/* 3. The Grid - Layer 1 (Faint static) */}
            <div className={`absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] ${darkMode ? 'opacity-10' : 'opacity-[0.05]'}`}></div>

            {/* 4. The Grid - Layer 2 (Spotlight Reveal) */}
            {/* This layer has a BRIGHTER grid but is masked by the spotlight radial gradient */}
            <motion.div
                className="absolute inset-0 bg-[linear-gradient(to_right,#8b5cf6_1px,transparent_1px),linear-gradient(to_bottom,#8b5cf6_1px,transparent_1px)] bg-[size:24px_24px] opacity-20"
                style={{ maskImage, WebkitMaskImage: maskImage }}
            />

            {/* 5. Spotlight Glow itself (Color) */}
            <motion.div
                className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/30 rounded-full blur-[100px] mix-blend-screen opacity-50"
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
