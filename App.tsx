import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import WalletPage from './pages/Wallet';
import ActivityPage from './pages/Activity';
import MenuPage from './pages/Menu';
import QrPage from './pages/Qr';
import AdminPage from './pages/Admin';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/wallet" replace />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/qr" element={<QrPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Router>
  );
};

export default App;