import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import About from './pages/About';
import Courses from './pages/Courses';
import CoursePlayer from './pages/CoursePlayer';
import Database from './pages/Database';
import CaseStudies from './pages/CaseStudies';
import NotFound from './pages/NotFound';
import Resources from './pages/Resources';
import Blog from './pages/Blog';
import Scholarships from './pages/Scholarships';
import ApplicationTracker from './pages/ApplicationTracker';
import Signup from './pages/Signup';
import ChatBotPage from './pages/ChatBot';
import AiStudy from './pages/AiStudy';
import Profile from './pages/Profile';
import Subscription from './pages/Subscription';
import Dashboard from './pages/Dashboard';
import ThankYou from './pages/ThankYou';

// Components
import ChatBot from './components/ui/ChatBot';

import ScrollToTop from './components/ui/ScrollToTop';
import ProtectedRoute from './utils/ProtectedRoute';

// Utils
import { useSmoothScroll } from './utils/scrollUtils';
import { AuthProvider } from './utils/AuthContext';
import { LanguageProvider } from './utils/LanguageContext';
import { SubscriptionProvider } from './utils/SubscriptionContext';
import { ProStatusProvider } from './utils/proStatusUtils';
import { NotificationProvider } from './utils/NotificationContext';
import { AppDataProvider } from './utils/AppDataContext';
import CursorTrail from './components/ui/CursorTrail';

function App() {
  // Enable smooth scrolling across the app
  useSmoothScroll();

  return (
    <AuthProvider>
      <SubscriptionProvider>
        <ProStatusProvider>
          <LanguageProvider>
            <NotificationProvider>
              <AppDataProvider>
                <Router>
                  {/* Global Magnetic Cursor */}
                  <CursorTrail/>
                  
                  {/* Scroll to top on route change */}
                  <ScrollToTop />
                  
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/courses" element={<Courses />} />
                    <Route path="/courses/:id" element={<Courses />} />
                    <Route path="/course/:courseId" element={
                      <ProtectedRoute>
                        <CoursePlayer />
                      </ProtectedRoute>
                    } />
                    <Route path="/course/:courseId/lecture/:lectureId" element={
                      <ProtectedRoute>
                        <CoursePlayer />
                      </ProtectedRoute>
                    } />
                    <Route path="/learn/:courseId" element={
                      <ProtectedRoute>
                        <CoursePlayer />
                      </ProtectedRoute>
                    } />
                    <Route path="/learn/:courseId/:lectureId" element={
                      <ProtectedRoute>
                        <CoursePlayer />
                      </ProtectedRoute>
                    } />
                    <Route path="/database" element={<Database />} />
                    <Route path="/case-studies" element={<CaseStudies />} />
                    <Route path="/ai-courses" element={<Courses />} />
                    <Route path="/ai-study" element={<AiStudy />} />
                    <Route path="/resources" element={<Resources />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/blog/:id" element={<Blog />} />
                    <Route path="/scholarships" element={<Scholarships />} />
                    <Route path="/scholarship-finder" element={<Scholarships />} />
                    <Route path="/subscription" element={
                      <ProtectedRoute>
                        <Subscription />
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    } />
                    <Route path="/application-tracker" element={
                      <ProtectedRoute>
                        <ApplicationTracker />
                      </ProtectedRoute>
                    } />
                    <Route path="/chatbot" element={<ChatBotPage />} />
                    <Route path="/thank-you" element={<ThankYou />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  
                  {/* ChatBot component visible on all pages */}
                  <ChatBot />
                </Router>
              </AppDataProvider>
            </NotificationProvider>
          </LanguageProvider>
        </ProStatusProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
}

export default App;
