import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaExpand, FaCompress } from 'react-icons/fa';
import IconWrapper from '../IconWrapper';

interface DraggableModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  initialWidth?: number;
  initialHeight?: number;
  initialX?: number;
  initialY?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

const DraggableModal: React.FC<DraggableModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  initialWidth = 400,
  initialHeight = 600,
  initialX = 100,
  initialY = 100,
  minWidth = 300,
  minHeight = 400,
  maxWidth = window.innerWidth - 100,
  maxHeight = window.innerHeight - 100,
  className = '',
  headerClassName = '',
  contentClassName = ''
}) => {
  const [position, setPosition] = useState<Position>({ x: initialX, y: initialY });
  const [size, setSize] = useState<Size>({ width: initialWidth, height: initialHeight });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; width: number; height: number }>({ x: 0, y: 0, width: 0, height: 0 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [previousState, setPreviousState] = useState<{ position: Position; size: Size } | null>(null);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMaximized) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  // Handle resizing
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    if (isMaximized) return;
    
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    });
  };

  // Handle mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && !isMaximized) {
        const newX = Math.max(0, Math.min(window.innerWidth - size.width, e.clientX - dragStart.x));
        const newY = Math.max(0, Math.min(window.innerHeight - size.height, e.clientY - dragStart.y));
        setPosition({ x: newX, y: newY });
      }
      
      if (isResizing && !isMaximized) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        
        const newWidth = Math.max(minWidth, Math.min(maxWidth, resizeStart.width + deltaX));
        const newHeight = Math.max(minHeight, Math.min(maxHeight, resizeStart.height + deltaY));
        
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, resizeStart, size, minWidth, minHeight, maxWidth, maxHeight, isMaximized]);

  // Handle double-click to maximize/restore
  const handleDoubleClick = () => {
    if (isMaximized) {
      // Restore
      if (previousState) {
        setPosition(previousState.position);
        setSize(previousState.size);
        setIsMaximized(false);
        setPreviousState(null);
      }
    } else {
      // Maximize
      setPreviousState({ position, size });
      setPosition({ x: 0, y: 0 });
      setSize({ width: window.innerWidth, height: window.innerHeight });
      setIsMaximized(true);
    }
  };

  // Reset position when modal opens
  useEffect(() => {
    if (isOpen) {
      setPosition({ x: initialX, y: initialY });
      setSize({ width: initialWidth, height: initialHeight });
      setIsMaximized(false);
      setPreviousState(null);
    }
  }, [isOpen, initialX, initialY, initialWidth, initialHeight]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className={`fixed bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl border border-gray-700/50 shadow-2xl z-50 overflow-hidden rounded-xl ${className}`}
          style={{
            left: position.x,
            top: position.y,
            width: size.width,
            height: size.height,
            cursor: isDragging ? 'grabbing' : 'default'
          }}
        >
          {/* Header */}
          <div
            ref={headerRef}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
            className={`p-4 border-b border-gray-700/50 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-blue-600/20 backdrop-blur-sm cursor-grab active:cursor-grabbing select-none ${headerClassName}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-white bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {/* Maximize/Restore button */}
                <motion.button
                  onClick={handleDoubleClick}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
                >
                  <IconWrapper icon={isMaximized ? FaCompress : FaExpand} size={14} />
                </motion.button>
                
                {/* Close button */}
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 text-gray-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-all duration-300"
                >
                  <IconWrapper icon={FaTimes} size={14} />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className={`flex-1 overflow-hidden ${contentClassName}`} style={{ height: size.height - 72 }}>
            <div className="h-full overflow-y-auto">
              {children}
            </div>
          </div>

          {/* Resize handle */}
          {!isMaximized && (
            <div
              ref={resizeRef}
              onMouseDown={handleResizeMouseDown}
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-50 hover:opacity-100 transition-opacity"
              style={{
                background: 'linear-gradient(-45deg, transparent 30%, rgba(255,255,255,0.3) 40%, rgba(255,255,255,0.3) 60%, transparent 70%)'
              }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DraggableModal; 