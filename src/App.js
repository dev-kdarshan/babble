import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginRegisterPage from './components/LoginRegisterPage';
import ChatPage from './components/ChatPage';

function App() {
  const user = JSON.parse(localStorage.getItem('user'));

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginRegisterPage />} />
        <Route path="/chat" element={user ? <ChatPage /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
