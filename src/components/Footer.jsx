import React from 'react';
import { Code2, Server, Database } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="text-center py-12 text-slate-500 text-sm border-t border-slate-200 dark:border-white/5 relative z-10 bg-slate-50/50 dark:bg-black/20 backdrop-blur-sm">
            <div className="flex justify-center gap-6 mb-4">
                <FooterLink icon={<Code2 size={16} />} label="React" />
                <FooterLink icon={<Server size={16} />} label="Node.js" />
                <FooterLink icon={<Database size={16} />} label="Convex" />
            </div>
            <p className="font-medium">© 2024 Abhay Vyas. Internship Submission.</p>
        </footer>
    );
};

const FooterLink = ({ icon, label }) => (
    <div className="flex items-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity cursor-pointer text-slate-700 dark:text-slate-300">
        {icon} <span>{label}</span>
    </div>
);

export default Footer;
