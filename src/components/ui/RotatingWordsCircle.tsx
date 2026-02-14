import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaVideo, FaPencilAlt, FaLayerGroup, FaMicrophone, FaGamepad, FaImage, FaRobot, FaBolt, FaFileAlt, FaHeadphones, FaClipboardCheck, FaProjectDiagram, FaCalendarAlt, FaComments, FaChartLine, FaSearch } from 'react-icons/fa';

// Typewriter Component
export const TypewriterText = ({ 
  words, 
  typingSpeed = 150, 
  deletingSpeed = 100, 
  pauseTime = 2000,
  onIndexChange
}: { 
  words: string[], 
  typingSpeed?: number, 
  deletingSpeed?: number, 
  pauseTime?: number,
  onIndexChange?: (index: number) => void
}) => {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [blink, setBlink] = useState(true);

  // Sync parent state when index changes
  useEffect(() => {
    if (onIndexChange) {
      onIndexChange(index);
    }
  }, [index, onIndexChange]);

  // Blinking cursor
  useEffect(() => {
    const timeout2 = setTimeout(() => {
      setBlink((prev) => !prev);
    }, 500);
    return () => clearTimeout(timeout2);
  }, [blink]);

  useEffect(() => {
    if (subIndex === words[index].length + 1 && !reverse) {
      const timeout = setTimeout(() => {
        setReverse(true);
      }, pauseTime);
      return () => clearTimeout(timeout);
    }

    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % words.length);
      return;
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, reverse ? deletingSpeed : typingSpeed);

    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse, words, typingSpeed, deletingSpeed, pauseTime]);

  return (
    <span className="inline-flex items-center">
      <span className="text-indigo-500 dark:text-indigo-400 font-bold">
        {words[index].substring(0, subIndex)}
      </span>
      <span className={`ml-1 text-indigo-500 dark:text-indigo-400 font-sans font-thin text-5xl md:text-7xl ${blink ? 'opacity-100' : 'opacity-0'}`}>|</span>
    </span>
  );
};

// Rotating Circle Component
export const RotatingCircle = ({ activeIndex = 0 }: { activeIndex?: number }) => {
  const totalItems = 10;
  const radius = 280; // Reduced Radius to reduce gaps between items

  // Items matched to: ['explainers', 'flashcards', 'quizzes', 'notes', 'summaries', 'mindmaps', 'schedule', 'chat', 'analytics', 'research']
  const items = [
    { id: 0, icon: FaVideo, color: "bg-blue-500", label: "Explainers" },
    { id: 1, icon: FaLayerGroup, color: "bg-green-500", label: "Flashcards" },
    { id: 2, icon: FaClipboardCheck, color: "bg-purple-500", label: "Quizzes" },
    { id: 3, icon: FaPencilAlt, color: "bg-orange-500", label: "Notes" },
    { id: 4, icon: FaFileAlt, color: "bg-yellow-500", label: "Summaries" },
    { id: 5, icon: FaProjectDiagram, color: "bg-red-500", label: "Mind Maps" },
    { id: 6, icon: FaCalendarAlt, color: "bg-teal-500", label: "Schedule" },
    { id: 7, icon: FaComments, color: "bg-pink-500", label: "Chat" },
    { id: 8, icon: FaChartLine, color: "bg-cyan-500", label: "Analytics" },
    { id: 9, icon: FaSearch, color: "bg-indigo-500", label: "Research" },
  ];

  // Calculate rotation to keep the active item at the RIGHT (0 degrees)
  // Each item is at index * (360/totalItems) degrees.
  // To bring item i to right (0 deg): rotation + i*(360/10) = 0 => rotation = -i*36
  
  const currentRotation = -activeIndex * 36; // 360 / 10 = 36 degrees per item

  return (
    // Left Side Background (30% showing)
    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[80%] w-[800px] h-[800px] md:w-[1000px] md:h-[1000px] flex items-center justify-center pointer-events-none opacity-40 md:opacity-100">
      
      {/* Central Mascot */}
      <div className="absolute z-10 w-48 h-48 md:w-64 md:h-64 bg-white dark:bg-[#1a1a1a] rounded-full shadow-2xl flex items-center justify-center border-4 border-gray-100 dark:border-gray-800">
         <FaRobot className="text-8xl text-indigo-600 dark:text-indigo-400" />
      </div>

      {/* Rotating Ring */}
      <motion.div 
        className="absolute w-full h-full rounded-full border border-dashed border-gray-300 dark:border-gray-700"
        animate={{ rotate: currentRotation }}
        transition={{ type: "spring", stiffness: 50, damping: 20 }}
        style={{ transformOrigin: "center" }}
      >
        {items.map((item, index) => {
             // 10 items, spaced 36 degrees apart.
             const angle = (index * 36) * (Math.PI / 180); // Start at 0 deg (Right)
             const x = Math.cos(angle) * (radius * 1.5); // Radius multiplier
             const y = Math.sin(angle) * (radius * 1.5);
             
             // Check if active
             const normalizedActiveIndex = ((activeIndex % totalItems) + totalItems) % totalItems;
             const isActive = normalizedActiveIndex === index;

             return (
                 <motion.div
                    key={`pos-${item.id}`}
                    className={`absolute w-16 h-16 md:w-24 md:h-24 rounded-full flex items-center justify-center shadow-lg text-white ${item.color}`}
                    style={{
                        left: "50%",
                        top: "50%",
                        x: x - 48, // Center the item (width/2) - approx 96px/2 = 48
                        y: y - 48,
                    }}
                    animate={{
                        scale: isActive ? 1.5 : 1,
                        zIndex: isActive ? 20 : 1,
                        boxShadow: isActive ? "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" : "none",
                        filter: isActive ? "blur(0px)" : "blur(4px)",
                        opacity: isActive ? 1 : 0.7
                    }}
                 >
                     <motion.div
                        animate={{ rotate: -currentRotation }} // Counter-rotate icon
                        transition={{ type: "spring", stiffness: 50, damping: 20 }}
                     >
                        <item.icon className="text-2xl md:text-4xl" />
                     </motion.div>
                 </motion.div>
             )
        })}
      </motion.div>
      
      {/* Current Active Label - Positioned near the active item (Right side) */}
      <div className="absolute right-20 top-1/2 -translate-y-1/2 translate-x-full pl-8 text-left w-64 hidden">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="text-2xl md:text-4xl font-bold text-gray-800 dark:text-white"
          >
             {items[((activeIndex % totalItems) + totalItems) % totalItems].label}
          </motion.div>
      </div>

    </div>
  );
};
