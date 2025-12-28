import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Phase1Page from './components/Phase1Page';
import HomePage from './components/HomePage';

import Phase2Page from './components/Phase2Page';
import Phase3Page from './components/Phase3Page';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/phase1" element={<Phase1Page />} />
        <Route path="/phase2" element={<Phase2Page />} />
        <Route path="/phase3" element={<Phase3Page />} />
      </Routes>
    </Router>
  );
}

export default App;
