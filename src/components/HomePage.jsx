import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import JarvisChat from './JarvisChat';
import { ArrowRight, Database, Bot, Layout, Mail, Globe, Moon, Sun, Sparkles, Code2, Server, User } from 'lucide-react';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15
        }
    }
};

const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 15
        }
    }
};

const phrases = [
    "Phase 1: Automated Data Ingestion",
    "Phase 2: Intelligent AI Refinement",
    "Phase 3: Premium Frontend Interaction"
];

const TypewriterText = () => {
    const [index, setIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const currentPhrase = phrases[index];
        const timeout = setTimeout(() => {
            if (!isDeleting) {
                if (displayedText.length < currentPhrase.length) {
                    setDisplayedText(currentPhrase.slice(0, displayedText.length + 1));
                } else {
                    setTimeout(() => setIsDeleting(true), 1500);
                }
            } else {
                if (displayedText.length > 0) {
                    setDisplayedText(currentPhrase.slice(0, displayedText.length - 1));
                } else {
                    setIsDeleting(false);
                    setIndex((prev) => (prev + 1) % phrases.length);
                }
            }
        }, isDeleting ? 50 : 100);

        return () => clearTimeout(timeout);
    }, [displayedText, isDeleting, index]);

    return (
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary animate-gradient-x min-h-[1.2em] inline-block">
            {displayedText}
            <span className="animate-pulse text-primary">|</span>
        </span>
    );
};


const HomePage = () => {
    const [darkMode, setDarkMode] = useState(true);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [mouseX, mouseY]);

    return (
        <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-[#0f172a] selection:bg-primary/30 transition-colors duration-500 font-sans">
            <AnimatedBackground mouseX={mouseX} mouseY={mouseY} darkMode={darkMode} />
            <JarvisChat />

            <Navbar darkMode={darkMode} setDarkMode={setDarkMode}>
                <div className="hidden sm:flex items-center gap-3">
                    <SocialLink href="https://deploy-self-portifolio.vercel.app/" icon={<Globe size={18} />} label="Portfolio" />
                    <SocialLink href="mailto:vyasabhay202@gmail.com" icon={<Mail size={18} />} label="Contact" />
                </div>
            </Navbar>

            <main className="container mx-auto px-4 pt-32 pb-32 relative z-10">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="max-w-6xl mx-auto"
                >
                    {/* Hero Section */}
                    <motion.div variants={itemVariants} className="text-center mb-28 relative">
                        {/* Decorative Elements */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-primary/30 via-secondary/30 to-accent/30 blur-[100px] rounded-full -z-10 opacity-50 pointer-events-none" />

                        <h1 className="text-5xl md:text-7xl font-extrabold mb-8 tracking-tight leading-tight text-slate-900 dark:text-white min-h-[160px] md:min-h-[200px] flex flex-col justify-center items-center">
                            <span>BeyondChats Internship Assessment</span>
                            <TypewriterText />
                        </h1>

                        <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
                            Orchestrating <span className="text-slate-900 dark:text-white font-medium">Web Scraping</span>, <span className="text-slate-900 dark:text-white font-medium">AI Agents</span>, and <span className="text-slate-900 dark:text-white font-medium">React UI</span> into a seamless experience.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-5 justify-center">
                            <motion.a
                                href="https://deploy-self-portifolio.vercel.app/"
                                target="_blank"
                                rel="noopener noreferrer"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="group inline-flex items-center justify-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-5 rounded-full text-lg font-bold shadow-2xl hover:shadow-primary/50 transition-all relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                <span>Check Portfolio</span>
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </motion.a>
                        </div>
                    </motion.div>

                    {/* Detailed Phases */}
                    <div className="relative">
                        <div className="absolute -top-20 left-1/2 -translate-x-1/2 text-sm font-bold tracking-[0.2em] text-slate-400 dark:text-slate-600 uppercase">
                            Check Implementation
                        </div>

                        <div className="grid lg:grid-cols-3 gap-8 perspective-1000">
                            <PhaseCard
                                phase="01"
                                difficulty="Moderate"
                                title="Data Ingestion"
                                description="Automated scraper fetching 5 oldest articles from BeyondChats blogs."
                                tasks={["Generic Scraper", "Convex DB Schema", "CRUD API Design"]}
                                icon={<Database className="text-white" size={28} />}
                                link="/phase1"
                                accentColor="from-secondary to-cyan-600"
                                shadowColor="shadow-secondary"
                            />
                            <PhaseCard
                                phase="02"
                                difficulty="Difficult"
                                title="AI Refinement"
                                description="Research agent that enriches content via Google Search & LLM rewriting."
                                tasks={["Google Search Bot", "Content Analysis", "LLM Synthesis"]}
                                icon={<Bot className="text-white" size={28} />}
                                link="/phase2"
                                accentColor="from-accent to-pink-600"
                                shadowColor="shadow-accent"
                            />
                            <PhaseCard
                                phase="03"
                                difficulty="Easy"
                                title="Frontend UI"
                                description="Polished React interface displaying the transformation of data."
                                tasks={["Responsive Grid", "Article Feed", "Real-time Updates"]}
                                icon={<Layout className="text-white" size={28} />}
                                link="/phase3"
                                accentColor="from-primary to-violet-600"
                                shadowColor="shadow-primary"
                            />
                        </div>
                    </div>

                </motion.div>
            </main>

            <footer className="text-center py-12 text-slate-500 text-sm border-t border-slate-200 dark:border-white/5 relative z-10 bg-slate-50/50 dark:bg-black/20 backdrop-blur-sm">
                <div className="flex justify-center gap-6 mb-4">
                    <FooterLink href="#" icon={<Code2 size={16} />} label="React" />
                    <FooterLink href="#" icon={<Server size={16} />} label="Node.js" />
                    <FooterLink href="#" icon={<Database size={16} />} label="Convex" />
                </div>
                <p className="font-medium">© 2024 Abhay Vyas. Internship Submission.</p>
            </footer>
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

const SocialLink = ({ href, icon, label }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-200/50 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 transition-all text-sm font-semibold text-slate-700 dark:text-slate-200">
        {icon} <span>{label}</span>
    </a>
);

const FooterLink = ({ icon, label }) => (
    <div className="flex items-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity">
        {icon} <span>{label}</span>
    </div>
);

const PhaseCard = ({ phase, difficulty, title, description, tasks, icon, link, accentColor, shadowColor }) => {
    return (
        <Link to={link} className="block group">
            <motion.div
                whileHover={{ y: -15, rotateX: 5, rotateY: 5 }}
                className="relative h-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-1 rounded-3xl transition-all duration-300 hover:shadow-2xl hover:shadow-black/20"
            >
                {/* Inner Card */}
                <div className="relative h-full bg-white dark:bg-[#0f172a] rounded-[22px] p-8 overflow-hidden z-10 flex flex-col">

                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${accentColor} flex items-center justify-center shadow-lg ${shadowColor}/30 group-hover:scale-110 transition-transform`}>
                            {icon}
                        </div>
                        <div className="text-right">
                            <div className="text-4xl font-black text-slate-100 dark:text-white/5 font-mono leading-none tracking-tighter">{phase}</div>
                            <div className={`text-[10px] font-bold uppercase tracking-widest mt-1 bg-gradient-to-r ${accentColor} bg-clip-text text-transparent`}>{difficulty}</div>
                        </div>
                    </div>

                    <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white group-hover:text-primary transition-colors">{title}</h3>

                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-8 flex-grow">
                        {description}
                    </p>

                    {/* Tasks List */}
                    <div className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-6">
                        {tasks.map((task, i) => (
                            <div key={i} className="flex items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                                <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${accentColor}`}></div>
                                {task}
                            </div>
                        ))}
                    </div>

                    {/* Hover Effect Light */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/5 dark:to-white/5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Glow Border */}
                <div className={`absolute -inset-0.5 bg-gradient-to-br ${accentColor} rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`} />
            </motion.div>
        </Link>
    );
};

export default HomePage;
