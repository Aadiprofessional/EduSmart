import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import About from './pages/About';
import Courses from './pages/Courses';
import Database from './pages/Database';
import CaseStudies from './pages/CaseStudies';
import NotFound from './pages/NotFound';
import AICourses from './pages/AICourses';
import Resources from './pages/Resources';
import Blog from './pages/Blog';
import Scholarships from './pages/Scholarships';
import ApplicationTracker from './pages/ApplicationTracker';
import Signup from './pages/Signup';
import ChatBotPage from './pages/ChatBot';
import AiStudy from './pages/AiStudy';

// Components
import ChatBot from './components/ui/ChatBot';
import ProtectedRoute from './utils/ProtectedRoute';

// Utils
import { useSmoothScroll } from './utils/scrollUtils';

function App() {
  // Enable smooth scrolling across the app
  useSmoothScroll();

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/about" element={<About />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/database" element={<Database />} />
        <Route path="/case-studies" element={<CaseStudies />} />
        <Route path="/ai-courses" element={<AICourses />} />
        <Route path="/ai-study" element={<AiStudy />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:id" element={<Blog />} />
        <Route path="/scholarships" element={<Scholarships />} />
        <Route path="/application-tracker" element={
          <ProtectedRoute>
            <ApplicationTracker />
          </ProtectedRoute>
        } />
        <Route path="/chatbot" element={<ChatBotPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {/* ChatBot component visible on all pages */}
      <ChatBot />
    </Router>
  );
}

export default App;
