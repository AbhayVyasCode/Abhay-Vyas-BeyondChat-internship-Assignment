import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Lazy Load Pages for Performance
const Phase1Page = lazy(() => import('./components/Phase1Page'));
const HomePage = lazy(() => import('./components/HomePage'));
const Phase2Page = lazy(() => import('./components/Phase2Page'));
const Phase3Page = lazy(() => import('./components/Phase3Page'));

// Loading Fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-[#0f172a] transition-colors">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-white/10"></div>
      <div className="absolute inset-0 rounded-full border-4 border-t-pink-500 animate-spin"></div>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/phase1" element={<Phase1Page />} />
          <Route path="/phase2" element={<Phase2Page />} />
          <Route path="/phase3" element={<Phase3Page />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
