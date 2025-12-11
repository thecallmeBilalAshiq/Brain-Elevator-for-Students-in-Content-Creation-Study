import React, { useState } from 'react';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'app'>('landing');

  return (
    <>
      {view === 'landing' ? (
        <LandingPage onStart={() => setView('app')} />
      ) : (
        <Dashboard onLogout={() => setView('landing')} />
      )}
    </>
  );
};

export default App;
