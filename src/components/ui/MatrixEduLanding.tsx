import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaPlay, FaUpload, FaBolt, FaCheckCircle, FaSearch, FaFileAlt, FaMobileAlt, FaLaptop, FaCheck, FaChevronDown, FaChevronUp, FaBook, FaTimes } from 'react-icons/fa';
import HowItWorksScroll from './HowItWorksScroll';
import VideoDemoScroll from './VideoDemoScroll';
import { ModelPositionProvider, useModelPosition } from '../../utils/ModelPositionContext';
import ReflectHero from './ReflectHero';

const MatrixEduLandingContent: React.FC = () => {
  const navigate = useNavigate();
  const { registerComponent, unregisterComponent } = useModelPosition();
  // heroRef removed as it is now inside ReflectHero
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const whatYouCanDoRef = useRef<HTMLElement>(null);
  const accessAnywhereRef = useRef<HTMLElement>(null);
  const comparisonRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // landing-hero registration removed

    // how-it-works registration moved to HowItWorksScroll.tsx for per-step positioning

    if (whatYouCanDoRef.current) {
      registerComponent('what-you-can-do', whatYouCanDoRef.current, {
        pencil: { x: 650, y: -200, z: 1, scale: 2.8, rotation: { x: 0, y: -0.5, z: 0.2 }, visible: true },
        eraser: { x: -650, y: 150, z: 0, scale: 1.6, visible: true },
        sharpener: { x: 0, y: 350, z: 1, scale: 0.035, visible: true }
      });
    }

    if (accessAnywhereRef.current) {
      registerComponent('access-anywhere', accessAnywhereRef.current, {
        pencil: { x: -600, y: -100, z: 0, scale: 2.4, visible: true },
        eraser: { x: 600, y: 100, z: 1, scale: 1.4, visible: true },
        sharpener: { x: -500, y: 300, z: -1, scale: 0.03, visible: true }
      });
    }

    if (comparisonRef.current) {
      registerComponent('comparison', comparisonRef.current, {
        pencil: { x: 700, y: 0, z: 1, scale: 3.0, rotation: { x: 0.1, y: 0.1, z: 0.1 }, visible: true },
        eraser: { x: -700, y: -200, z: 0, scale: 1.7, visible: true },
        sharpener: { x: 0, y: -350, z: 1, scale: 0.04, visible: true }
      });
    }

    return () => {
        // unregisterComponent('landing-hero');
        unregisterComponent('how-it-works');
        unregisterComponent('what-you-can-do');
        unregisterComponent('access-anywhere');
        unregisterComponent('comparison');
    };
  }, [registerComponent, unregisterComponent]);

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  // Styles for scrolling logos
  const starStyles = `
    @keyframes scroll {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    .animate-scroll {
      animation: scroll 30s linear infinite;
    }
    .animate-scroll:hover {
      animation-play-state: paused;
    }
  `;

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-gray-900 dark:text-white font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      <style>{starStyles}</style>
      
      <ReflectHero />

      {/* Trusted By Section */}
      <section className="py-10 border-y border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] overflow-hidden">
        <div className="container mx-auto px-4 text-center mb-8">
          <p className="text-lg text-gray-500 dark:text-gray-400">Students at leading universities trust our powerful AI study tool</p>
        </div>
        
        <div className="relative w-full overflow-hidden">
            {/* Mask gradients for smooth fade in/out on sides */}
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-gray-50 dark:from-[#050505] to-transparent z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-gray-50 dark:from-[#050505] to-transparent z-10"></div>

            <div className="flex w-max animate-scroll hover:pause gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500 items-center">
                {/* First Set */}
                <div className="flex gap-16 items-center shrink-0 px-8">
                    <span className="text-3xl font-serif font-bold text-gray-800 dark:text-white">HARVARD</span>
                    <span className="text-3xl font-sans font-bold text-gray-800 dark:text-white">Georgia Tech</span>
                    <span className="text-3xl font-serif font-bold text-gray-800 dark:text-white">Yale</span>
                    <span className="text-3xl font-serif font-bold text-gray-800 dark:text-white">NYU</span>
                    <span className="text-3xl font-serif font-bold text-gray-800 dark:text-white">Penn</span>
                </div>
                {/* Second Set (Duplicate for seamless scroll) */}
                <div className="flex gap-16 items-center shrink-0 px-8">
                    <span className="text-3xl font-serif font-bold text-gray-800 dark:text-white">HARVARD</span>
                    <span className="text-3xl font-sans font-bold text-gray-800 dark:text-white">Georgia Tech</span>
                    <span className="text-3xl font-serif font-bold text-gray-800 dark:text-white">Yale</span>
                    <span className="text-3xl font-serif font-bold text-gray-800 dark:text-white">NYU</span>
                    <span className="text-3xl font-serif font-bold text-gray-800 dark:text-white">Penn</span>
                </div>
                {/* Third Set (Extra buffer for wide screens) */}
                <div className="flex gap-16 items-center shrink-0 px-8">
                    <span className="text-3xl font-serif font-bold text-gray-800 dark:text-white">HARVARD</span>
                    <span className="text-3xl font-sans font-bold text-gray-800 dark:text-white">Georgia Tech</span>
                    <span className="text-3xl font-serif font-bold text-gray-800 dark:text-white">Yale</span>
                    <span className="text-3xl font-serif font-bold text-gray-800 dark:text-white">NYU</span>
                    <span className="text-3xl font-serif font-bold text-gray-800 dark:text-white">Penn</span>
                </div>
                {/* Fourth Set (Extra buffer for ultra wide screens) */}
                <div className="flex gap-16 items-center shrink-0 px-8">
                     <span className="text-3xl font-serif font-bold text-gray-800 dark:text-white">HARVARD</span>
                     <span className="text-3xl font-sans font-bold text-gray-800 dark:text-white">Georgia Tech</span>
                     <span className="text-3xl font-serif font-bold text-gray-800 dark:text-white">Yale</span>
                     <span className="text-3xl font-serif font-bold text-gray-800 dark:text-white">NYU</span>
                     <span className="text-3xl font-serif font-bold text-gray-800 dark:text-white">Penn</span>
                </div>
            </div>
        </div>
      </section>

      {/* How it Works Section */}
      <div ref={howItWorksRef}>
        <HowItWorksScroll />
      </div>

      {/* Video Demo Section */}
      <VideoDemoScroll />

      {/* What you can do with MatrixEdu Section */}
      <section ref={whatYouCanDoRef} className="py-20 md:py-32 bg-gray-50 dark:bg-black relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
             <div className="text-center mb-16 md:mb-24">
                 <h2 className="text-4xl md:text-6xl font-permanent-marker mb-6 text-gray-900 dark:text-white">Unlock Your Potential</h2>
                 <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">One platform, endless possibilities. Everything you need to excel in your studies.</p>
             </div>

             <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                 {/* Card 1 */}
                 <div className="group relative bg-white dark:bg-[#0f0f0f] rounded-[2rem] p-8 hover:-translate-y-2 transition-all duration-500 border border-gray-100 dark:border-white/5 shadow-xl hover:shadow-2xl hover:shadow-green-500/10">
                     <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                     <div className="relative z-10">
                         <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-500/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                             <FaCheckCircle className="text-green-600 dark:text-green-500 text-3xl" />
                         </div>
                         <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Exam Prep Master</h3>
                         <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">Convert any study material into active recall tools. Generate flashcards and quizzes instantly to retain information longer.</p>
                         <div className="flex items-center text-green-600 dark:text-green-500 font-bold text-sm">
                             <span>Start Practicing</span>
                             <FaPlay className="ml-2 text-xs group-hover:translate-x-1 transition-transform" />
                         </div>
                     </div>
                 </div>

                 {/* Card 2 */}
                 <div className="group relative bg-white dark:bg-[#0f0f0f] rounded-[2rem] p-8 hover:-translate-y-2 transition-all duration-500 border border-gray-100 dark:border-white/5 shadow-xl hover:shadow-2xl hover:shadow-purple-500/10">
                     <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                     <div className="relative z-10">
                         <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                             <FaFileAlt className="text-purple-600 dark:text-purple-500 text-3xl" />
                         </div>
                         <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Homework Assistant</h3>
                         <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">Stuck on an assignment? Get instant explanations, summaries, and step-by-step breakdowns for complex topics.</p>
                         <div className="flex items-center text-purple-600 dark:text-purple-500 font-bold text-sm">
                             <span>Get Help Now</span>
                             <FaPlay className="ml-2 text-xs group-hover:translate-x-1 transition-transform" />
                         </div>
                     </div>
                 </div>

                 {/* Card 3 */}
                 <div className="group relative bg-white dark:bg-[#0f0f0f] rounded-[2rem] p-8 hover:-translate-y-2 transition-all duration-500 border border-gray-100 dark:border-white/5 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10">
                     <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                     <div className="relative z-10">
                         <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                             <FaSearch className="text-blue-600 dark:text-blue-500 text-3xl" />
                         </div>
                         <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Research Companion</h3>
                         <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">Digest long papers and videos in seconds. Extract key insights and organize your research effortlessly.</p>
                         <div className="flex items-center text-blue-600 dark:text-blue-500 font-bold text-sm">
                             <span>Start Researching</span>
                             <FaPlay className="ml-2 text-xs group-hover:translate-x-1 transition-transform" />
                         </div>
                     </div>
                 </div>
             </div>

             <div className="text-center mt-16">
                 <button 
                   onClick={() => navigate('/signup')}
                   className="px-8 py-4 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold text-lg hover:scale-105 transition-transform duration-300 shadow-xl"
                 >
                   Try MatrixEdu Free
                 </button>
             </div>
        </div>
      </section>

      {/* Access Anywhere Section */}
      <section ref={accessAnywhereRef} className="py-20 md:py-32 bg-white dark:bg-[#050505] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent opacity-50"></div>
          
          <div className="container mx-auto px-4 relative z-10">
              <div className="flex flex-col lg:flex-row items-center gap-16">
                  {/* Text Side */}
                  <div className="lg:w-1/2 text-left">
                      <div className="inline-block px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-full text-indigo-600 dark:text-indigo-400 font-bold text-sm mb-6 border border-indigo-100 dark:border-indigo-500/20">
                          <FaMobileAlt className="inline mr-2" /> Cross-Platform Sync
                      </div>
                      <h2 className="text-4xl md:text-6xl font-permanent-marker mb-6 text-gray-900 dark:text-white leading-tight">
                          Study Anywhere.<br/>
                          <span className="text-indigo-600 dark:text-indigo-500">Anytime.</span>
                      </h2>
                      <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                          Your study materials follow you. Start on your laptop during class, review on your phone during commute, and polish on your tablet at home.
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-4">
                          <button 
                            onClick={() => navigate('/signup')}
                            className="px-8 py-4 bg-indigo-600 text-white rounded-full font-bold text-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
                          >
                            <FaLaptop /> Get Started
                          </button>
                          <button className="px-8 py-4 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white rounded-full font-bold text-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                             <FaMobileAlt /> Download App
                          </button>
                      </div>
                  </div>

                  {/* Visual Side */}
                  <div className="lg:w-1/2 w-full relative">
                      <div className="absolute -inset-4 bg-gradient-to-r from-pink-500 to-violet-500 rounded-[2.5rem] opacity-20 blur-2xl"></div>
                      <div className="relative bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-[2rem] p-8 shadow-2xl overflow-hidden">
                          {/* Floating Elements */}
                          <motion.div 
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute top-8 right-8 bg-white dark:bg-[#1a1a1a] p-4 rounded-2xl shadow-lg border border-gray-100 dark:border-white/5 z-20"
                          >
                              <FaCheckCircle className="text-green-500 text-2xl" />
                          </motion.div>

                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-4 mt-8">
                                  <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-white/5 flex flex-col items-center justify-center aspect-square hover:scale-105 transition-transform duration-300">
                                      <FaLaptop size={40} className="text-indigo-500 mb-4" />
                                      <span className="font-bold text-gray-900 dark:text-white">Web</span>
                                  </div>
                                  <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-white/5 flex flex-col items-center justify-center aspect-square hover:scale-105 transition-transform duration-300">
                                      <FaMobileAlt size={40} className="text-pink-500 mb-4" />
                                      <span className="font-bold text-gray-900 dark:text-white">Mobile</span>
                                  </div>
                              </div>
                              <div className="space-y-4">
                                  <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-white/5 flex flex-col items-center justify-center aspect-square hover:scale-105 transition-transform duration-300">
                                      <div className="w-12 h-12 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                                          <FaCheck size={20} className="text-green-600 dark:text-green-400" />
                                      </div>
                                      <span className="font-bold text-gray-900 dark:text-white">Synced</span>
                                  </div>
                                  <div className="bg-indigo-600 p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center aspect-square text-white hover:scale-105 transition-transform duration-300">
                                      <span className="text-4xl font-bold mb-2">10x</span>
                                      <span className="text-indigo-200 text-sm">Faster</span>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* Comparison Section */}
      <section ref={comparisonRef} className="py-20 md:py-32 bg-gray-50 dark:bg-black relative">
          <div className="container mx-auto px-4">
              <div className="text-center mb-16 md:mb-24">
                  <h2 className="text-4xl md:text-6xl font-permanent-marker mb-6 text-gray-900 dark:text-white">Why MatrixEdu Wins</h2>
                  <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Stop studying harder. Start studying smarter with the power of AI.</p>
              </div>

              <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 relative">
                  {/* VS Badge */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center w-16 h-16 bg-white dark:bg-[#111] rounded-full border-4 border-gray-100 dark:border-[#222] shadow-xl font-black text-xl italic text-gray-900 dark:text-white">
                      VS
                  </div>

                  {/* Traditional Way */}
                  <div className="bg-white dark:bg-[#0f0f0f] rounded-[2rem] p-8 md:p-12 border border-gray-200 dark:border-white/5 opacity-80 hover:opacity-100 transition-opacity duration-300">
                      <div className="flex items-center gap-4 mb-8">
                          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center">
                              <FaTimes className="text-red-500 text-xl" />
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">The Old Way</h3>
                      </div>
                      <ul className="space-y-6">
                          <li className="flex items-start gap-4">
                              <FaTimes className="text-red-500 mt-1 shrink-0" />
                              <span className="text-gray-600 dark:text-gray-400 text-lg">Hours of passive reading and highlighting</span>
                          </li>
                          <li className="flex items-start gap-4">
                              <FaTimes className="text-red-500 mt-1 shrink-0" />
                              <span className="text-gray-600 dark:text-gray-400 text-lg">Manually creating flashcards (boring!)</span>
                          </li>
                          <li className="flex items-start gap-4">
                              <FaTimes className="text-red-500 mt-1 shrink-0" />
                              <span className="text-gray-600 dark:text-gray-400 text-lg">No feedback on written answers</span>
                          </li>
                          <li className="flex items-start gap-4">
                              <FaTimes className="text-red-500 mt-1 shrink-0" />
                              <span className="text-gray-600 dark:text-gray-400 text-lg">Scattered notes across notebooks</span>
                          </li>
                      </ul>
                  </div>

                  {/* MatrixEdu Way */}
                  <div className="bg-white dark:bg-[#0f0f0f] rounded-[2rem] p-8 md:p-12 border-2 border-indigo-500 shadow-2xl shadow-indigo-500/20 relative overflow-hidden transform hover:-translate-y-2 transition-transform duration-300">
                      <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">RECOMMENDED</div>
                      <div className="flex items-center gap-4 mb-8">
                          <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                              <FaCheck className="text-indigo-600 dark:text-indigo-400 text-xl" />
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">The MatrixEdu Way</h3>
                      </div>
                      <ul className="space-y-6">
                          <li className="flex items-start gap-4">
                              <FaCheckCircle className="text-indigo-500 mt-1 shrink-0" />
                              <span className="text-gray-600 dark:text-gray-400 text-lg">Instant active recall materials</span>
                          </li>
                          <li className="flex items-start gap-4">
                              <FaCheckCircle className="text-indigo-500 mt-1 shrink-0" />
                              <span className="text-gray-600 dark:text-gray-400 text-lg">AI-generated flashcards in seconds</span>
                          </li>
                          <li className="flex items-start gap-4">
                              <FaCheckCircle className="text-indigo-500 mt-1 shrink-0" />
                              <span className="text-gray-600 dark:text-gray-400 text-lg">Real-time grading & explanations</span>
                          </li>
                          <li className="flex items-start gap-4">
                              <FaCheckCircle className="text-indigo-500 mt-1 shrink-0" />
                              <span className="text-gray-600 dark:text-gray-400 text-lg">All materials synced & organized</span>
                          </li>
                      </ul>
                  </div>
              </div>

              <div className="text-center mt-16">
                 <button 
                   onClick={() => navigate('/signup')}
                   className="px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-bold text-xl hover:shadow-lg hover:shadow-indigo-500/40 hover:scale-105 transition-all duration-300"
                 >
                   Join 1,000,000+ Students Today
                 </button>
                 <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">No credit card required • Free plan available</p>
             </div>
          </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 md:py-24 bg-white dark:bg-[#050505]">
          <div className="container mx-auto px-4">
              <div className="text-center mb-10 md:mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">FAQ's</h2>
              </div>

              <div className="max-w-3xl mx-auto space-y-4">
                  {[
                    { q: "What is MatrixEdu AI?", a: "MatrixEdu AI is an advanced AI-powered study assistant designed to help students learn faster and more effectively. It creates personalized study materials like flashcards, quizzes, and summaries from your notes, slides, or textbooks." },
                    { q: "What is the difference between the free and unlimited?", a: "The free version gives you access to basic features with daily limits. The unlimited plan unlocks all premium features, unlimited content generation, priority support, and advanced study modes." },
                    { q: "Why was MatrixEdu AI founded?", a: "MatrixEdu AI was founded by students who wanted to make learning more efficient. We believe that with the right tools, anyone can master any subject in less time." },
                    { q: "Can MatrixEdu AI be used to replace human tutoring?", a: "While MatrixEdu AI is a powerful tool for self-study and clarifying concepts, it is best used as a supplement to human tutoring for complex subjects requiring deep, nuanced understanding." },
                    { q: "Can I make money promoting MatrixEdu AI?", a: "Yes! We have an affiliate program that allows you to earn commissions by referring new users to MatrixEdu AI. Check out our 'Careers' or 'Affiliate' page for more details." },
                    { q: "What Makes MatrixEdu AI's AI Study Tool Unique?", a: "Unlike generic AI tools, MatrixEdu AI is specifically fine-tuned for education. It understands academic context, creates active recall materials, and adapts to your learning style over time." },
                    { q: "How Does the AI Study Tool Personalize My Learning?", a: "Our AI analyzes your performance on quizzes and flashcards to identify your weak areas. It then adjusts future study sessions to focus more on topics you need to improve, ensuring efficient learning." }
                  ].map((item, index) => (
                      <div key={index} className="border-b border-gray-200 dark:border-white/10 last:border-0">
                          <button 
                             className="w-full py-4 md:py-6 flex items-center justify-between text-left focus:outline-none group"
                             onClick={() => toggleFaq(index)}
                          >
                              <span className="text-base md:text-lg font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-500 transition-colors pr-4">{item.q}</span>
                              {openFaqIndex === index ? <FaChevronUp className="text-indigo-600 dark:text-indigo-500 shrink-0" /> : <FaChevronDown className="text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-500 transition-colors shrink-0" />}
                          </button>
                          <AnimatePresence>
                              {openFaqIndex === index && (
                                  <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden"
                                  >
                                      <p className="pb-6 text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                                          {item.a}
                                      </p>
                                  </motion.div>
                              )}
                          </AnimatePresence>
                      </div>
                  ))}
              </div>
          </div>
      </section>
    </div>
  );
};

const MatrixEduLanding: React.FC = () => {
  return (
    <ModelPositionProvider>
      <MatrixEduLandingContent />
    </ModelPositionProvider>
  );
};

export default MatrixEduLanding;
