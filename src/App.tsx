import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import About from './pages/About';
import Courses from './pages/Courses';
import CoursePlayer from './pages/CoursePlayer';
import Database from './pages/Database';
import CaseStudies from './pages/CaseStudies';
import NotFound from './pages/NotFound';
import Resources from './pages/Resources';
import Blog from './pages/Blog';
import Scholarships from './pages/Scholarships';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ChatBotPage from './pages/ChatBot';
import AiStudy from './pages/AiStudy';
import AiTutorPage from './pages/AiTutorPage';
import Profile from './pages/Profile';
import PricingPage from './pages/PricingPage';
import BuySubscriptionPage from './pages/BuySubscriptionPage';
import TransactionHistoryPage from './pages/TransactionHistoryPage';
import Dashboard from './pages/Dashboard';
import MatrixEduDashboard from './pages/MatrixEduDashboard';
import StudyPlannerPage from './pages/StudyPlannerPage';
import SolvePage from './pages/SolvePage';
import MistakeCheckerPage from './pages/MistakeCheckerPage';
import ContentWriter from './pages/ContentWriter';
import Humanizer from './pages/Humanizer';
import GradePage from './pages/GradePage';
import StudyMaterialPage from './pages/StudyMaterialPage';
import MethodSelectionPage from './pages/MethodSelectionPage';
import ThankYou from './pages/ThankYou';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import FAQ from './pages/FAQ';
import CookiesPolicy from './pages/CookiesPolicy';
import MathTestPage from './pages/MathTestPage';
import TimerPage from './pages/TimerPage';
import FeedbackPage from './pages/FeedbackPage';
import SettingsPage from './pages/SettingsPage';

// Components
import ErrorNotification from './components/ErrorNotification';

import ScrollToTop from './components/ui/ScrollToTop';
import ProtectedRoute from './utils/ProtectedRoute';


// Utils
import { useSmoothScroll } from './utils/scrollUtils';
import { AuthProvider } from './utils/AuthContext';
import { LanguageProvider } from './utils/LanguageContext';
import { ThemeProvider } from './utils/ThemeContext';
import { SubscriptionProvider } from './utils/SubscriptionContext';
import { ProStatusProvider } from './utils/proStatusUtils';
import { NotificationProvider } from './utils/NotificationContext';
import { AppDataProvider } from './utils/AppDataContext';
import { UserProvider } from './contexts/UserContext';
import { ErrorProvider } from './contexts/ErrorContext';
import CursorTrail from './components/ui/CursorTrail';
import { AdRewardProvider } from './utils/AdRewardContext';
import AdPromptToast from './components/ads/AdPromptToast';

function App() {
  // Enable smooth scrolling across the app
  useSmoothScroll();

  return (
    <ErrorProvider>
      <AuthProvider>
        <UserProvider>
          <SubscriptionProvider>
            <ProStatusProvider>
              <LanguageProvider>
                <ThemeProvider>
                  <NotificationProvider>
                    <AppDataProvider>
                      <Router
                        future={{
                          v7_startTransition: true,
                          v7_relativeSplatPath: true,
                        }}
                      >
                        <AdRewardProvider>
                        <div className="App dark:bg-[#111111] bg-gray-50 min-h-screen text-gray-900 dark:text-white transition-colors duration-200">
                          {/* Global Error Notification */}
                          <ErrorNotification />

                          {/* Lite Mode ad prompt toast */}
                          <AdPromptToast />
                          
                          {/* Global Magnetic Cursor - Commented out for cleaner UI like matrixedu.ai */}
                          {/* <CursorTrail/> */}
                          
                          {/* Scroll to top on route change */}
                            <ScrollToTop />
                        
                        <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/signup" element={<Signup />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      <Route path="/auth/callback" element={<AuthCallback />} />
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
                      <Route path="/ai-tutor" element={<AiTutorPage />} />
                      <Route path="/resources" element={<Resources />} />
                      <Route path="/blog" element={<Blog />} />
                      <Route path="/blog/:id" element={<Blog />} />
                      <Route path="/scholarships" element={<Scholarships />} />
                      <Route path="/scholarship-finder" element={<Scholarships />} />
                      <Route path="/pricing" element={<PricingPage />} />
                      <Route path="/subscription" element={<PricingPage />} />
                      <Route path="/subscription/buy/:planId" element={
                        <ProtectedRoute>
                          <BuySubscriptionPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/transaction-history" element={
                        <ProtectedRoute>
                          <TransactionHistoryPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/dashboard" element={
                        <ProtectedRoute>
                          <MatrixEduDashboard />
                        </ProtectedRoute>
                      } />
                      <Route path="/study-planner" element={
                        <ProtectedRoute>
                          <StudyPlannerPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/solve" element={
                        <ProtectedRoute>
                          <SolvePage />
                        </ProtectedRoute>
                      } />
                      <Route path="/mistake-checker" element={
                        <ProtectedRoute>
                          <MistakeCheckerPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/content-writer" element={
                        <ProtectedRoute>
                          <ContentWriter />
                        </ProtectedRoute>
                      } />
                      <Route path="/humanizer" element={
                        <ProtectedRoute>
                          <Humanizer />
                        </ProtectedRoute>
                      } />
                      <Route path="/paper-grader" element={
                        <ProtectedRoute>
                          <GradePage />
                        </ProtectedRoute>
                      } />
                      <Route path="/study-set/:id" element={
                        <ProtectedRoute>
                          <StudyMaterialPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/study-set/:id/selection" element={
                        <ProtectedRoute>
                          <MethodSelectionPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/profile" element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      } />
                      <Route path="/chatbot" element={<ChatBotPage />} />
                      <Route path="/chatbot/:chatId" element={<ChatBotPage />} />
                      <Route path="/thank-you" element={<ThankYou />} />
                      <Route path="/terms" element={<TermsOfService />} />
                      <Route path="/privacy" element={<PrivacyPolicy />} />
                      <Route path="/faq" element={<FAQ />} />
                      <Route path="/cookies" element={<CookiesPolicy />} />
                      <Route path="/math-test" element={<MathTestPage />} />
                      <Route path="/timer" element={<TimerPage />} />
                      <Route path="/feedback" element={
                        <ProtectedRoute>
                          <FeedbackPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/settings" element={
                        <ProtectedRoute>
                          <SettingsPage />
                        </ProtectedRoute>
                      } />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                        </div>
                        </AdRewardProvider>
                      </Router>
                    </AppDataProvider>
                  </NotificationProvider>
                </ThemeProvider>
              </LanguageProvider>
            </ProStatusProvider>
        </SubscriptionProvider>
      </UserProvider>
    </AuthProvider>
    </ErrorProvider>
  );
}

export default App;
