import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Point {
  x: number;
  y: number;
  id: number;
}

const CursorTrail: React.FC = () => {
  const [points, setPoints] = useState<Point[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let pointId = 0;
    
    const handleMouseMove = (e: MouseEvent) => {
      setIsVisible(true);
      
      setPoints(prevPoints => {
        const newPoint = {
          x: e.clientX,
          y: e.clientY,
          id: pointId++
        };
        
        const newPoints = [newPoint, ...prevPoints].slice(0, 15);
        return newPoints;
      });
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
      setPoints([]);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {points.map((point, index) => (
        <motion.div
          key={point.id}
          className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"
          style={{
            left: point.x - 4,
            top: point.y - 4,
          }}
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ 
            scale: 0,
            opacity: 0,
          }}
          transition={{ 
            duration: 0.8,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  );
};

export default CursorTrail; 