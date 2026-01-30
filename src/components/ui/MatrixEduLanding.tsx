import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { FaPlay, FaUpload, FaBolt, FaPenAlt, FaChalkboardTeacher, FaHeadphones, FaCheckCircle, FaChartBar, FaUniversity, FaSearch, FaFileAlt, FaBars, FaTimes, FaMobileAlt, FaLaptop, FaCheck, FaChevronDown, FaChevronUp, FaBook } from 'react-icons/fa';
import { useAuth } from '../../utils/AuthContext';

const MatrixEduLanding: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Star styles including twinkling static stars and shooting stars
  const starStyles = `
    @keyframes twinkle {
        0%, 100% { opacity: 0.2; transform: scale(0.8); }
        50% { opacity: 1; transform: scale(1.2); }
    }
    .static-star {
        position: absolute;
        background: white;
        border-radius: 50%;
        animation: twinkle 3s ease-in-out infinite;
    }
    @keyframes shooting {
      0% {
        transform: translateX(0) translateY(0);
        opacity: 1;
      }
      70% {
        opacity: 1;
      }
      100% {
        transform: translateX(400px) translateY(400px);
        opacity: 0;
      }
    }
    .shooting-star {
      position: absolute;
      top: 50%;
      left: 50%;
      height: 4px;
      width: 4px;
      background: #fff;
      border-radius: 50%;
      box-shadow: 0 0 10px #fff, 0 0 20px #fff;
      animation: shooting 4s ease-in-out infinite;
      opacity: 0;
    }
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };
  
  const scrollToFeatures = () => {
    const element = document.getElementById('features-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      <style>{starStyles}</style>
      
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-[#050505]/80 backdrop-blur-md border-b border-white/5' : 'bg-transparent border-transparent'}`}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
               <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">MatrixEdu</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
                <Link to="/about" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Careers <span className="text-[10px] bg-green-500/20 text-green-500 px-1.5 py-0.5 rounded ml-1">Hiring</span></Link>
                <Link to="/blog" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Blog</Link>
                <Link to="/resources" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Explore</Link>
                <button onClick={scrollToFeatures} className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Features</button>
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-4">
                {user ? (
                   <button 
                     onClick={() => navigate('/dashboard')}
                     className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium text-sm transition-colors"
                   >
                     Dashboard
                   </button>
                ) : (
                  <>
                    <button onClick={() => navigate('/login')} className="text-sm font-medium text-white hover:text-gray-300 transition-colors">Login</button>
                    {/* Only show Dashboard if logged in, otherwise regular signup logic or hidden */}
                  </>
                )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-gray-400 hover:text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
            {isMobileMenuOpen && (
                <motion.div
                   initial={{ opacity: 0, height: 0 }}
                   animate={{ opacity: 1, height: 'auto' }}
                   exit={{ opacity: 0, height: 0 }}
                   className="md:hidden bg-[#0a0a0a] border-b border-white/5 overflow-hidden"
                >
                    <div className="px-4 py-6 space-y-4 flex flex-col">
                        <Link to="/about" className="text-gray-400 hover:text-white">Careers</Link>
                        <Link to="/blog" className="text-gray-400 hover:text-white">Blog</Link>
                        <Link to="/resources" className="text-gray-400 hover:text-white">Explore</Link>
                        <button onClick={() => { scrollToFeatures(); setIsMobileMenuOpen(false); }} className="text-left text-gray-400 hover:text-white">Features</button>
                        <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
                             {user ? (
                                <button 
                                  onClick={() => navigate('/dashboard')}
                                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
                                >
                                  Dashboard
                                </button>
                             ) : (
                                <button onClick={() => navigate('/login')} className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold">Login</button>
                             )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden min-h-[90vh] flex flex-col items-center justify-center">
        {/* Background Glows - Sun Indigo & Stars */}
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-[#050505]"></div>
            
            {/* Sun Indigo Glow - Intense bottom center like a rising sun */}
            <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[140%] h-[70%] bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-[#6366f1] via-[#6366f1]/40 to-transparent blur-[60px] opacity-80"></div>
            <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[80%] h-[40%] bg-indigo-600 blur-[100px] opacity-50"></div>
            
            {/* Static Stars - Randomly distributed */}
            <div className="absolute inset-0">
               {[...Array(20)].map((_, i) => (
                  <div 
                    key={i}
                    className="static-star"
                    style={{
                       top: `${Math.random() * 70}%`, // Keep stars mostly in upper 70%
                       left: `${Math.random() * 100}%`,
                       width: `${Math.random() * 2 + 1}px`,
                       height: `${Math.random() * 2 + 1}px`,
                       animationDelay: `${Math.random() * 3}s`,
                       opacity: Math.random() * 0.7 + 0.3
                    }}
                  />
               ))}
            </div>

            {/* Shooting Stars */}
            <div className="absolute inset-0 overflow-hidden">
                <span className="shooting-star" style={{ top: '0%', left: '10%', animationDelay: '0s' }}></span>
                <span className="shooting-star" style={{ top: '10%', left: '0%', animationDelay: '2s' }}></span>
                <span className="shooting-star" style={{ top: '20%', left: '20%', animationDelay: '5s' }}></span>
                <span className="shooting-star" style={{ top: '5%', left: '30%', animationDelay: '8s' }}></span>
            </div>
        </div>

        {/* Floating Top Banner */}
        <motion.div 
           initial={{ opacity: 0, y: -20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.5 }}
           className="absolute top-24 left-0 right-0 z-20 flex justify-center px-4"
        >
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-full py-2 px-6 flex items-center gap-2 max-w-full overflow-hidden">
            <span className="bg-indigo-500 rounded-full p-1"><FaBolt size={10} className="text-white" /></span>
            <span className="text-xs md:text-sm font-medium text-gray-200 truncate">MatrixEdu AI Study Tool – Ace Your Exams & Crush Your Homework</span>
          </div>
        </motion.div>

        <div className="container mx-auto px-4 relative z-10 mt-12">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            
            {/* Left Content */}
            <motion.div 
              className="lg:w-1/2 text-left"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={itemVariants} className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-sm font-medium text-gray-300">We help you study. Not cheat.</span>
              </motion.div>

              <motion.h1 variants={itemVariants} className="text-5xl lg:text-7xl font-bold leading-tight mb-6 tracking-tight">
                Learn Faster...<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-600">
                  Like, a Lot Faster
                </span>
              </motion.h1>

              <motion.p variants={itemVariants} className="text-xl text-gray-400 mb-10 max-w-lg leading-relaxed">
                EduSmart AI is the #1 AI study tool that helps you ace your exams & crush your homework 10x faster.
              </motion.p>

              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => navigate('/signup')}
                  className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 transform hover:-translate-y-1"
                >
                  Start Learning Faster - it's free
                </button>
                <button 
                  onClick={() => navigate('/signup')} // Assuming demo leads to signup or a demo page
                  className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl font-bold text-lg hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <FaPlay size={14} /> Demo
                </button>
              </motion.div>
              
              <motion.div variants={itemVariants} className="mt-8 flex items-center gap-2 text-sm text-gray-500">
                 <div className="flex -space-x-2">
                    {[1,2,3,4,5].map(i => (
                        <div key={i} className={`w-8 h-8 rounded-full border-2 border-black bg-gradient-to-br from-indigo-${i}00 to-purple-${i}00 flex items-center justify-center text-xs text-black font-bold`}>
                            {String.fromCharCode(64+i)}
                        </div>
                    ))}
                 </div>
                 <span>Loved by 1,000,000+ students</span>
              </motion.div>
            </motion.div>

            {/* Right Image (Mockup) */}
            <motion.div 
              className="lg:w-1/2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative rounded-2xl border border-white/10 bg-[#111] p-2 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 rounded-2xl pointer-events-none" />
                <div className="bg-[#0a0a0a] rounded-xl overflow-hidden aspect-video relative group">
                    {/* Fake UI for Dashboard */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <h3 className="text-2xl font-bold mb-4">Hey handsome, what do you wanna master?</h3>
                            <div className="flex gap-4 justify-center">
                                <div className="bg-[#1a1a1a] p-4 rounded-lg w-32 h-24 flex flex-col items-center justify-center gap-2 border border-white/5">
                                    <FaUpload className="text-gray-400" />
                                    <span className="text-xs text-gray-400">Upload</span>
                                </div>
                                <div className="bg-[#1a1a1a] p-4 rounded-lg w-32 h-24 flex flex-col items-center justify-center gap-2 border border-white/5">
                                    <FaFileAlt className="text-gray-400" />
                                    <span className="text-xs text-gray-400">Paste</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-10 border-y border-white/5 bg-white/[0.02] overflow-hidden">
        <div className="container mx-auto px-4 text-center mb-8">
          <p className="text-lg text-gray-400">Students at leading universities trust our powerful AI study tool</p>
        </div>
        
        <div className="relative w-full overflow-hidden">
            {/* Mask gradients for smooth fade in/out on sides */}
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#050505] to-transparent z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#050505] to-transparent z-10"></div>

            <div className="flex w-max animate-scroll hover:pause gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500 items-center">
                {/* First Set */}
                <div className="flex gap-16 items-center shrink-0 px-8">
                    <span className="text-3xl font-serif font-bold text-white">HARVARD</span>
                    <span className="text-3xl font-sans font-bold text-white">Georgia Tech</span>
                    <span className="text-3xl font-serif font-bold text-white">Yale</span>
                    <span className="text-3xl font-serif font-bold text-white">NYU</span>
                    <span className="text-3xl font-serif font-bold text-white">Penn</span>
                </div>
                {/* Second Set (Duplicate for seamless scroll) */}
                <div className="flex gap-16 items-center shrink-0 px-8">
                    <span className="text-3xl font-serif font-bold text-white">HARVARD</span>
                    <span className="text-3xl font-sans font-bold text-white">Georgia Tech</span>
                    <span className="text-3xl font-serif font-bold text-white">Yale</span>
                    <span className="text-3xl font-serif font-bold text-white">NYU</span>
                    <span className="text-3xl font-serif font-bold text-white">Penn</span>
                </div>
                {/* Third Set (Extra buffer for wide screens) */}
                <div className="flex gap-16 items-center shrink-0 px-8">
                    <span className="text-3xl font-serif font-bold text-white">HARVARD</span>
                    <span className="text-3xl font-sans font-bold text-white">Georgia Tech</span>
                    <span className="text-3xl font-serif font-bold text-white">Yale</span>
                    <span className="text-3xl font-serif font-bold text-white">NYU</span>
                    <span className="text-3xl font-serif font-bold text-white">Penn</span>
                </div>
                {/* Fourth Set (Extra buffer for ultra wide screens) */}
                <div className="flex gap-16 items-center shrink-0 px-8">
                     <span className="text-3xl font-serif font-bold text-white">HARVARD</span>
                     <span className="text-3xl font-sans font-bold text-white">Georgia Tech</span>
                     <span className="text-3xl font-serif font-bold text-white">Yale</span>
                     <span className="text-3xl font-serif font-bold text-white">NYU</span>
                     <span className="text-3xl font-serif font-bold text-white">Penn</span>
                </div>
            </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="features-section" className="py-24 relative">
        <div className="container mx-auto px-4">
            <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold mb-4">How it works</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* Card 1 */}
                <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl p-1 overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
                    <div className="bg-[#151515] rounded-[20px] h-64 md:h-80 relative overflow-hidden flex items-center justify-center">
                        <div className="text-center p-8">
                            <h3 className="text-2xl font-bold mb-2">Hey Chloe, what do you wanna master?</h3>
                            <div className="flex gap-4 justify-center mt-8">
                                <div className="bg-[#222] p-4 rounded-lg w-24 h-24 flex flex-col items-center justify-center gap-2">
                                    <FaUpload className="text-white" size={24} />
                                    <span className="text-xs text-gray-400">Upload</span>
                                </div>
                                <div className="bg-[#222] p-4 rounded-lg w-24 h-24 flex flex-col items-center justify-center gap-2">
                                    <FaFileAlt className="text-white" size={24} />
                                    <span className="text-xs text-gray-400">Paste</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-8">
                        <h3 className="text-xl font-bold text-indigo-500 mb-2">Upload or Paste Content:</h3>
                        <p className="text-gray-400">Whether it is your class notes, a YouTube video, or a webpage.</p>
                    </div>
                </div>

                {/* Card 2 */}
                <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl p-1 overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
                    <div className="bg-[#151515] rounded-[20px] h-64 md:h-80 relative overflow-hidden flex items-center justify-center">
                         {/* Flashcard Mockup */}
                         <div className="bg-[#1a1a1a] border border-white/5 rounded-xl p-6 w-3/4 max-w-sm">
                            <div className="text-xs text-gray-500 mb-4 flex justify-between">
                                <span>Unfamiliar</span>
                                <span>Familiar</span>
                            </div>
                            <div className="text-center py-8">
                                <p className="text-sm text-gray-300">Cell membrane, cytoplasm, and DNA.</p>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button onClick={() => navigate('/signup')} className="flex-1 bg-red-500/20 text-red-500 text-xs py-2 rounded hover:bg-red-500/30 transition-colors">I don't know it</button>
                                <button onClick={() => navigate('/signup')} className="flex-1 bg-green-500/20 text-green-500 text-xs py-2 rounded hover:bg-green-500/30 transition-colors">I know it</button>
                            </div>
                         </div>
                    </div>
                    <div className="p-8 cursor-pointer" onClick={() => navigate('/signup')}>
                        <h3 className="text-xl font-bold text-indigo-500 mb-2">Instant Flashcards:</h3>
                        <p className="text-gray-400">Turn hours of study into minutes with AI generated flashcards.</p>
                    </div>
                </div>
            </div>

            {/* Row 2 */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* Card 3 - Quiz */}
                <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl p-1 overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
                    <div className="bg-gradient-to-br from-blue-900/20 to-blue-600/5 rounded-[20px] h-64 md:h-80 relative overflow-hidden p-8 flex items-center justify-center">
                        <div className="w-full max-w-sm space-y-3">
                             <div className="bg-green-500/20 border border-green-500/30 p-3 rounded-lg flex items-center gap-3">
                                <FaCheckCircle className="text-green-500" />
                                <span className="text-xs text-green-100">A tail that helps a cell move or propel itself.</span>
                             </div>
                             <div className="bg-[#222] p-3 rounded-lg flex items-center gap-3 opacity-50">
                                <span className="w-4 h-4 rounded border border-gray-500"></span>
                                <span className="text-xs text-gray-400">A hair-like projection...</span>
                             </div>
                        </div>
                    </div>
                    <div className="p-8 cursor-pointer" onClick={() => navigate('/signup')}>
                        <h3 className="text-xl font-bold text-indigo-500 mb-2">Smart Quizzes:</h3>
                        <p className="text-gray-400">Learn from every mistake with AI explanations for incorrect answers.</p>
                    </div>
                </div>

                {/* Card 4 - Written Tests */}
                <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl p-1 overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
                    <div className="bg-gradient-to-br from-purple-900/20 to-purple-600/5 rounded-[20px] h-64 md:h-80 relative overflow-hidden p-8 flex items-center justify-center">
                        <div className="w-full max-w-sm bg-[#1a1a1a] rounded-xl p-4 border border-white/5">
                             <p className="text-sm font-medium mb-4">What is the endoplasmic reticulum?</p>
                             <div className="bg-[#252525] rounded-lg p-3 h-20 mb-3 text-xs text-gray-400">I don't know 😅</div>
                             <div className="flex justify-end"><button onClick={() => navigate('/signup')} className="bg-blue-600 text-xs px-4 py-1.5 rounded-full hover:bg-blue-700 transition-colors">Submit</button></div>
                        </div>
                    </div>
                    <div className="p-8 cursor-pointer" onClick={() => navigate('/signup')}>
                        <h3 className="text-xl font-bold text-indigo-500 mb-2">Written Tests:</h3>
                        <p className="text-gray-400">Practice written answers and get detailed explanations for wrong answers.</p>
                    </div>
                </div>
            </div>

            {/* Row 3 */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* Card 5 - Virtual Tutor */}
                <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl p-1 overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
                    <div className="bg-gradient-to-br from-pink-900/20 to-pink-600/5 rounded-[20px] h-64 md:h-80 relative overflow-hidden p-8 flex items-center justify-center">
                        <div className="w-full max-w-sm bg-[#1a1a1a] rounded-xl p-4 border border-white/5 font-mono text-xs relative shadow-2xl">
                             {/* Physics calculations mockup */}
                             <div className="flex justify-between mb-4 gap-4">
                                 <div className="bg-[#222] p-2 rounded w-1/2">
                                     <div className="grid grid-cols-3 gap-1 text-[10px] text-gray-400 border-b border-gray-700 pb-1 mb-1 text-center">
                                         <span>t</span><span>v</span><span>Sp</span>
                                     </div>
                                     <div className="space-y-1 text-[10px] text-center">
                                         <div className="grid grid-cols-3 gap-1"><span>0</span><span>+24</span><span>+24</span></div>
                                         <div className="grid grid-cols-3 gap-1"><span>1</span><span>+18</span><span>+18</span></div>
                                         <div className="grid grid-cols-3 gap-1 border border-red-500 bg-red-500/10 rounded px-0.5 relative">
                                            <span>4</span><span>0</span><span>0</span>
                                            {/* Arrow pointer */}
                                            <div className="absolute -left-3 top-1 text-red-500">➤</div>
                                         </div>
                                         <div className="grid grid-cols-3 gap-1"><span>6</span><span>-12</span><span>+12</span></div>
                                     </div>
                                 </div>
                                 <div className="w-1/2 space-y-2 flex flex-col justify-center">
                                     <div className="bg-[#222] p-2 rounded text-center border border-red-500/30">
                                         <span className="text-red-400 font-bold">a = -6m/s²</span>
                                     </div>
                                     <div className="bg-[#222] p-2 rounded text-center">
                                         <span>Speed = |v|</span>
                                     </div>
                                     <div className="text-[8px] text-gray-500 text-center mt-2">
                                         Introduction to Basic Physics Concepts
                                     </div>
                                 </div>
                             </div>
                             <div className="bg-[#222] p-3 rounded-lg text-[10px] text-gray-300 border border-white/5 flex gap-2 items-center">
                                 <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                 "What is the acceleration of the balloon at its maximum height?"
                             </div>
                        </div>
                    </div>
                    <div className="p-8 cursor-pointer" onClick={() => navigate('/signup')}>
                        <h3 className="text-xl font-bold text-indigo-500 mb-2">24/7 Virtual Tutor: <span className="text-white font-normal">Simplify complex topics and gain clarity anytime.</span></h3>
                    </div>
                </div>

                {/* Card 6 - Audio */}
                <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl p-1 overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
                    <div className="bg-gradient-to-br from-indigo-900/20 to-indigo-600/5 rounded-[20px] h-64 md:h-80 relative overflow-hidden p-8 flex items-center justify-center">
                        <div className="w-full max-w-sm bg-[#1a1a1a] rounded-xl overflow-hidden border border-white/5 shadow-2xl flex flex-col h-full max-h-[220px]">
                             {/* Podcast Player Mockup */}
                             <div className="p-4 border-b border-white/5 flex-1 overflow-hidden relative">
                                 <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#1a1a1a] pointer-events-none z-10"></div>
                                 <div className="flex gap-3 items-start mb-4">
                                     <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0 overflow-hidden border border-white/10">
                                        <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800"></div>
                                     </div>
                                     <div className="bg-[#222] p-3 rounded-2xl rounded-tl-none text-[10px] text-gray-400 leading-relaxed border border-white/5">
                                        <p className="mb-2">"Alright, let's dive into something truly electrifying today: the meteoric rise of MatrixEdu AI..."</p>
                                        <p>It's fascinating how it adapts to your learning style in real-time.</p>
                                    </div>
                                 </div>
                             </div>
                             <div className="bg-[#111] p-4 flex items-center gap-4 border-t border-white/5">
                                 <button className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/20 group-hover:scale-105">
                                     <FaPlay size={14} className="ml-1" />
                                 </button>
                                 <div className="flex-1 space-y-1.5">
                                     <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                         <div className="h-full w-1/3 bg-indigo-500 rounded-full"></div>
                                     </div>
                                     <div className="flex justify-between text-[10px] text-gray-500 font-medium">
                                         <span>04:20</span>
                                         <span>12:45</span>
                                     </div>
                                 </div>
                             </div>
                        </div>
                    </div>
                    <div className="p-8 cursor-pointer" onClick={() => navigate('/signup')}>
                        <h3 className="text-xl font-bold text-indigo-500 mb-2">Audio Podcasts: <span className="text-white font-normal">Make studying fun with engaging audio lessons.</span></h3>
                    </div>
                </div>
            </div>

             {/* Row 4 - Grading & Progress */}
             <div className="grid md:grid-cols-2 gap-8 mb-12">
                {/* Card 7 - Grading */}
                <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl p-1 overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
                    <div className="bg-gradient-to-br from-blue-900/30 to-black rounded-[20px] h-64 md:h-80 relative overflow-hidden flex items-center justify-center p-8">
                         <div className="bg-[#111] border border-white/10 rounded-xl p-4 w-full max-w-sm shadow-2xl">
                             <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                                 <span className="text-xs font-bold text-blue-400">Essay Analysis</span>
                                 <span className="text-xs text-gray-500">Just now</span>
                             </div>
                             <div className="space-y-3">
                                 <div className="flex justify-between text-xs">
                                     <span className="text-gray-400">Structure</span>
                                     <span className="text-green-500">Good</span>
                                 </div>
                                 <div className="h-1.5 bg-gray-800 rounded-full w-full">
                                     <div className="h-full bg-green-500 w-[85%] rounded-full"></div>
                                 </div>
                                 <div className="flex justify-between text-xs mt-2">
                                     <span className="text-gray-400">Clarity</span>
                                     <span className="text-yellow-500">Average</span>
                                 </div>
                                 <div className="h-1.5 bg-gray-800 rounded-full w-full">
                                     <div className="h-full bg-yellow-500 w-[60%] rounded-full"></div>
                                 </div>
                                 <div className="mt-4 p-2 bg-blue-500/10 rounded border border-blue-500/20">
                                     <p className="text-[10px] text-blue-300 leading-relaxed">"Consider strengthening your thesis statement to better guide the reader..."</p>
                                 </div>
                             </div>
                         </div>
                    </div>
                    <div className="p-8">
                        <h3 className="text-xl font-bold text-indigo-500 mb-2">Smart Paper Grading:</h3>
                        <p className="text-gray-400">Get detailed feedback based on your rubric.</p>
                    </div>
                </div>

                {/* Card 8 - Progress */}
                <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl p-1 overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
                    <div className="bg-gradient-to-br from-green-900/30 to-black rounded-[20px] h-64 md:h-80 relative overflow-hidden flex items-center justify-center p-8">
                         <div className="bg-[#111] border border-white/10 rounded-xl p-6 w-full max-w-sm shadow-2xl">
                             <div className="flex items-center gap-4 mb-6">
                                 <div className="w-12 h-12 rounded-full border-4 border-green-500 flex items-center justify-center text-xs font-bold text-white">
                                     78%
                                 </div>
                                 <div>
                                     <div className="text-sm font-bold text-white">Biology 101</div>
                                     <div className="text-xs text-green-500">Improving</div>
                                 </div>
                             </div>
                             <div className="space-y-4">
                                 <div className="bg-[#1a1a1a] p-3 rounded-lg border border-white/5 flex justify-between items-center">
                                     <span className="text-xs text-gray-400">Flashcards</span>
                                     <span className="text-xs font-bold text-white">124/150</span>
                                 </div>
                                 <div className="bg-[#1a1a1a] p-3 rounded-lg border border-white/5 flex justify-between items-center">
                                     <span className="text-xs text-gray-400">Quizzes</span>
                                     <span className="text-xs font-bold text-white">8/10</span>
                                 </div>
                             </div>
                         </div>
                    </div>
                    <div className="p-8">
                        <h3 className="text-xl font-bold text-indigo-500 mb-2">Track Your Progress:</h3>
                        <p className="text-gray-400">Monitor your growth and master subjects faster.</p>
                    </div>
                </div>
            </div>

            <div className="text-center mb-16">
                 <button 
                   onClick={() => navigate('/dashboard')}
                   className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300"
                 >
                   Go to Dashboard
                 </button>
            </div>
        </div>
      </section>

      {/* What you can do with MatrixEdu Section */}
      <section className="py-24 bg-black">
        <div className="container mx-auto px-4">
             <div className="text-center mb-16">
                 <h2 className="text-4xl md:text-5xl font-bold mb-4">What you can do with MatrixEdu</h2>
                 <p className="text-gray-400 text-lg">From exam prep to homework help—everything you need to learn faster and smarter</p>
             </div>

             <div className="max-w-4xl mx-auto space-y-6">
                 <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-8 flex flex-col md:flex-row items-start gap-6 hover:border-green-500/30 transition-colors group">
                     <div className="bg-green-500/10 p-4 rounded-xl group-hover:bg-green-500/20 transition-colors">
                         <FaCheckCircle className="text-green-500" size={28} />
                     </div>
                     <div>
                         <h3 className="text-xl font-bold mb-2">Exam Preparation & Review</h3>
                         <p className="text-gray-400 leading-relaxed">Transform lecture slides and notes into flashcards, quizzes, and fill-in-the-blank questions instantly. Active recall techniques help you ace exams with less study time.</p>
                     </div>
                 </div>

                 <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-8 flex flex-col md:flex-row items-start gap-6 hover:border-purple-500/30 transition-colors group">
                     <div className="bg-purple-500/10 p-4 rounded-xl group-hover:bg-purple-500/20 transition-colors">
                         <FaFileAlt className="text-purple-500" size={28} />
                     </div>
                     <div>
                         <h3 className="text-xl font-bold mb-2">Homework Help & Assignment Support</h3>
                         <p className="text-gray-400 leading-relaxed">Generate summaries and interactive study materials to simplify complex assignments. Clarify difficult subjects and make your study sessions more productive.</p>
                     </div>
                 </div>

                 <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-8 flex flex-col md:flex-row items-start gap-6 hover:border-blue-500/30 transition-colors group">
                     <div className="bg-blue-500/10 p-4 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                         <FaSearch className="text-blue-500" size={28} />
                     </div>
                     <div>
                         <h3 className="text-xl font-bold mb-2">Research and Study Content Creation</h3>
                         <p className="text-gray-400 leading-relaxed">Turn sprawling articles and video lectures into clear, digestible content. Streamline note-taking and enhance comprehension to focus on developing insightful ideas.</p>
                     </div>
                 </div>
             </div>

             <div className="text-center mt-12">
                 <button 
                   onClick={() => navigate('/signup')}
                   className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300"
                 >
                   Try MatrixEdu AI for free &rarr;
                 </button>
             </div>
        </div>
      </section>

      {/* Access Anywhere Section */}
      <section className="py-24 bg-[#050505] relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
              <div className="text-center mb-16">
                  <h2 className="text-4xl md:text-5xl font-bold mb-4">Access the MatrixEdu AI Study Tool Anywhere, Anytime</h2>
                  <p className="text-gray-400 text-lg">Study seamlessly across all your devices with our responsive platform.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                  {/* Multi-Device Card */}
                  <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl overflow-hidden group hover:border-pink-500/30 transition-all duration-300">
                      <div className="bg-gradient-to-r from-pink-900/40 to-purple-900/40 p-8 h-48 flex items-center justify-center">
                          <FaLaptop size={60} className="text-white/80 drop-shadow-lg" />
                      </div>
                      <div className="p-8">
                          <h3 className="text-xl font-bold text-pink-500 mb-3">Multi-Device Compatibility for the AI Study Tool</h3>
                          <p className="text-gray-400 leading-relaxed">Study effectively on any device - laptop, tablet, or smartphone. Consistent, intuitive experience that adapts to your screen and fits your lifestyle.</p>
                      </div>
                  </div>

                  {/* Mobile App Card */}
                  <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
                      <div className="bg-gradient-to-r from-blue-900/40 to-teal-900/40 p-8 h-48 flex items-center justify-center">
                          <FaMobileAlt size={60} className="text-white/80 drop-shadow-lg" />
                      </div>
                      <div className="p-8">
                          <h3 className="text-xl font-bold text-blue-400 mb-3">Mobile app and seamless website integration</h3>
                          <p className="text-gray-400 leading-relaxed">Full-powered studying on any platform. Reliable performance at home or on the go, transforming your study routine across all devices.</p>
                      </div>
                  </div>
              </div>

              <div className="text-center mt-12">
                 <button 
                   onClick={() => navigate('/signup')}
                   className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300"
                 >
                   Start acing my exams
                 </button>
              </div>
          </div>
      </section>

      {/* Comparison Section */}
      <section className="py-24 bg-black relative">
          <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                  <h2 className="text-4xl md:text-5xl font-bold mb-4">Why Our AI Study Tool Outperforms Traditional Methods</h2>
                  <p className="text-gray-400 text-lg max-w-2xl mx-auto">Experience the advantages of AI-powered studying compared to conventional methods. Our approach is designed to save you time, boost retention, and make learning more effective.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                  {/* Card 1 - Evidence Based */}
                  <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl overflow-hidden hover:border-green-500/30 transition-all duration-300">
                      <div className="bg-green-900/20 p-6 flex items-center gap-4 border-b border-white/5">
                          <div className="bg-green-500/20 p-2 rounded-lg">
                              <FaBook className="text-green-500" size={20} />
                          </div>
                          <h3 className="font-bold text-lg">Evidence-Based Techniques vs. Conventional Learning</h3>
                      </div>
                      <div className="p-6 space-y-6">
                          <div>
                              <p className="text-xs font-bold text-gray-500 mb-3 tracking-wider">TRADITIONAL METHODS</p>
                              <ul className="space-y-2">
                                  <li className="flex items-start gap-2 text-sm text-gray-400">
                                      <div className="mt-1 min-w-[16px]"><div className="w-4 h-4 rounded-full bg-red-500/10 flex items-center justify-center"><FaTimes size={10} className="text-red-500" /></div></div>
                                      <span>Passive reading and highlighting</span>
                                  </li>
                                  <li className="flex items-start gap-2 text-sm text-gray-400">
                                      <div className="mt-1 min-w-[16px]"><div className="w-4 h-4 rounded-full bg-red-500/10 flex items-center justify-center"><FaTimes size={10} className="text-red-500" /></div></div>
                                      <span>Repetitive reviewing without feedback</span>
                                  </li>
                                  <li className="flex items-start gap-2 text-sm text-gray-400">
                                      <div className="mt-1 min-w-[16px]"><div className="w-4 h-4 rounded-full bg-red-500/10 flex items-center justify-center"><FaTimes size={10} className="text-red-500" /></div></div>
                                      <span>Inefficient time allocation</span>
                                  </li>
                              </ul>
                          </div>
                          <div className="h-px bg-white/5 relative">
                              <FaChevronDown className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-500 bg-[#0f0f0f] p-1" size={24} />
                          </div>
                          <div>
                              <p className="text-xs font-bold text-indigo-500 mb-3 tracking-wider">STUDLEY AI</p>
                              <ul className="space-y-2">
                                  <li className="flex items-start gap-2 text-sm text-white">
                                      <div className="mt-1 min-w-[16px]"><div className="w-4 h-4 rounded-full bg-green-500/10 flex items-center justify-center"><FaCheck size={10} className="text-green-500" /></div></div>
                                      <span>Active recall techniques built-in</span>
                                  </li>
                                  <li className="flex items-start gap-2 text-sm text-white">
                                      <div className="mt-1 min-w-[16px]"><div className="w-4 h-4 rounded-full bg-green-500/10 flex items-center justify-center"><FaCheck size={10} className="text-green-500" /></div></div>
                                      <span>Spaced repetition algorithms</span>
                                  </li>
                                  <li className="flex items-start gap-2 text-sm text-white">
                                      <div className="mt-1 min-w-[16px]"><div className="w-4 h-4 rounded-full bg-green-500/10 flex items-center justify-center"><FaCheck size={10} className="text-green-500" /></div></div>
                                      <span>Real-time feedback and insights</span>
                                  </li>
                              </ul>
                          </div>
                      </div>
                  </div>

                  {/* Card 2 - Speed */}
                  <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/30 transition-all duration-300">
                      <div className="bg-indigo-900/20 p-6 flex items-center gap-4 border-b border-white/5">
                          <div className="bg-indigo-500/20 p-2 rounded-lg">
                              <FaBolt className="text-indigo-500" size={20} />
                          </div>
                          <h3 className="font-bold text-lg">Speed and Personalization at Your Fingertips</h3>
                      </div>
                      <div className="p-6 space-y-6">
                          <div>
                              <p className="text-xs font-bold text-gray-500 mb-3 tracking-wider">TRADITIONAL METHODS</p>
                              <ul className="space-y-2">
                                  <li className="flex items-start gap-2 text-sm text-gray-400">
                                      <div className="mt-1 min-w-[16px]"><div className="w-4 h-4 rounded-full bg-red-500/10 flex items-center justify-center"><FaTimes size={10} className="text-red-500" /></div></div>
                                      <span>Hours spent creating manual study materials</span>
                                  </li>
                                  <li className="flex items-start gap-2 text-sm text-gray-400">
                                      <div className="mt-1 min-w-[16px]"><div className="w-4 h-4 rounded-full bg-red-500/10 flex items-center justify-center"><FaTimes size={10} className="text-red-500" /></div></div>
                                      <span>One-size-fits-all approach</span>
                                  </li>
                                  <li className="flex items-start gap-2 text-sm text-gray-400">
                                      <div className="mt-1 min-w-[16px]"><div className="w-4 h-4 rounded-full bg-red-500/10 flex items-center justify-center"><FaTimes size={10} className="text-red-500" /></div></div>
                                      <span>Limited ability to adapt to your needs</span>
                                  </li>
                              </ul>
                          </div>
                          <div className="h-px bg-white/5 relative">
                              <FaChevronDown className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-500 bg-[#0f0f0f] p-1" size={24} />
                          </div>
                          <div>
                              <p className="text-xs font-bold text-indigo-500 mb-3 tracking-wider">STUDLEY AI</p>
                              <ul className="space-y-2">
                                  <li className="flex items-start gap-2 text-sm text-white">
                                      <div className="mt-1 min-w-[16px]"><div className="w-4 h-4 rounded-full bg-green-500/10 flex items-center justify-center"><FaCheck size={10} className="text-green-500" /></div></div>
                                      <span>Instant AI-generated study materials</span>
                                  </li>
                                  <li className="flex items-start gap-2 text-sm text-white">
                                      <div className="mt-1 min-w-[16px]"><div className="w-4 h-4 rounded-full bg-green-500/10 flex items-center justify-center"><FaCheck size={10} className="text-green-500" /></div></div>
                                      <span>Personalized learning experience</span>
                                  </li>
                                  <li className="flex items-start gap-2 text-sm text-white">
                                      <div className="mt-1 min-w-[16px]"><div className="w-4 h-4 rounded-full bg-green-500/10 flex items-center justify-center"><FaCheck size={10} className="text-green-500" /></div></div>
                                      <span>Adaptive content based on your progress</span>
                                  </li>
                              </ul>
                          </div>
                      </div>
                  </div>

                  {/* Card 3 - Cost */}
                  <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/30 transition-all duration-300">
                      <div className="bg-purple-900/20 p-6 flex items-center gap-4 border-b border-white/5">
                          <div className="bg-purple-500/20 p-2 rounded-lg">
                              <span className="text-purple-500 font-bold text-lg">$</span>
                          </div>
                          <h3 className="font-bold text-lg">Cost-Effectiveness and Convenience</h3>
                      </div>
                      <div className="p-6 space-y-6">
                          <div>
                              <p className="text-xs font-bold text-gray-500 mb-3 tracking-wider">TRADITIONAL METHODS</p>
                              <ul className="space-y-2">
                                  <li className="flex items-start gap-2 text-sm text-gray-400">
                                      <div className="mt-1 min-w-[16px]"><div className="w-4 h-4 rounded-full bg-red-500/10 flex items-center justify-center"><FaTimes size={10} className="text-red-500" /></div></div>
                                      <span>Expensive private tutors ($50-100/hr)</span>
                                  </li>
                                  <li className="flex items-start gap-2 text-sm text-gray-400">
                                      <div className="mt-1 min-w-[16px]"><div className="w-4 h-4 rounded-full bg-red-500/10 flex items-center justify-center"><FaTimes size={10} className="text-red-500" /></div></div>
                                      <span>Multiple tools and subscriptions</span>
                                  </li>
                                  <li className="flex items-start gap-2 text-sm text-gray-400">
                                      <div className="mt-1 min-w-[16px]"><div className="w-4 h-4 rounded-full bg-red-500/10 flex items-center justify-center"><FaTimes size={10} className="text-red-500" /></div></div>
                                      <span>Limited availability and scheduling issues</span>
                                  </li>
                              </ul>
                          </div>
                          <div className="h-px bg-white/5 relative">
                              <FaChevronDown className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-500 bg-[#0f0f0f] p-1" size={24} />
                          </div>
                          <div>
                              <p className="text-xs font-bold text-indigo-500 mb-3 tracking-wider">STUDLEY AI</p>
                              <ul className="space-y-2">
                                  <li className="flex items-start gap-2 text-sm text-white">
                                      <div className="mt-1 min-w-[16px]"><div className="w-4 h-4 rounded-full bg-green-500/10 flex items-center justify-center"><FaCheck size={10} className="text-green-500" /></div></div>
                                      <span>Affordable subscription with all features</span>
                                  </li>
                                  <li className="flex items-start gap-2 text-sm text-white">
                                      <div className="mt-1 min-w-[16px]"><div className="w-4 h-4 rounded-full bg-green-500/10 flex items-center justify-center"><FaCheck size={10} className="text-green-500" /></div></div>
                                      <span>All-in-one study platform</span>
                                  </li>
                                  <li className="flex items-start gap-2 text-sm text-white">
                                      <div className="mt-1 min-w-[16px]"><div className="w-4 h-4 rounded-full bg-green-500/10 flex items-center justify-center"><FaCheck size={10} className="text-green-500" /></div></div>
                                      <span>Available 24/7, study anytime anywhere</span>
                                  </li>
                              </ul>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-[#050505]">
          <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                  <h2 className="text-4xl font-bold mb-4">FAQ's</h2>
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
                      <div key={index} className="border-b border-white/10 last:border-0">
                          <button 
                             className="w-full py-6 flex items-center justify-between text-left focus:outline-none group"
                             onClick={() => toggleFaq(index)}
                          >
                              <span className="text-lg font-medium text-white group-hover:text-indigo-500 transition-colors">{item.q}</span>
                              {openFaqIndex === index ? <FaChevronUp className="text-indigo-500" /> : <FaChevronDown className="text-gray-500 group-hover:text-indigo-500 transition-colors" />}
                          </button>
                          <AnimatePresence>
                              {openFaqIndex === index && (
                                  <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden"
                                  >
                                      <p className="pb-6 text-gray-400 leading-relaxed">
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

export default MatrixEduLanding;
