import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Phase1Page from './components/Phase1Page';
import HomePage from './components/HomePage';

// Placeholder components for phases
const Phase2 = () => <div className="p-10 text-center"><h1>Phase 2: AI Script</h1><p>Coming Soon...</p></div>;
const Phase3 = () => <div className="p-10 text-center"><h1>Phase 3: Frontend Showcase</h1><p>Coming Soon...</p></div>;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/phase1" element={<Phase1Page />} />
        <Route path="/phase2" element={<Phase2 />} />
        <Route path="/phase3" element={<Phase3 />} />
      </Routes>
    </Router>
  );
}

export default App;
