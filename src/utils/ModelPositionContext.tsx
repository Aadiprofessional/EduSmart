import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

interface ModelPosition {
  x: number;
  y: number;
  z: number;
  scale: number;
  rotation?: { x: number; y: number; z: number };
  visible: boolean;
}

interface ComponentPositions {
  pencil: ModelPosition;
  eraser: ModelPosition;
  sharpener: ModelPosition;
}

interface ModelPositionContextType {
  registerComponent: (id: string, element: HTMLElement, positions: ComponentPositions) => void;
  unregisterComponent: (id: string) => void;
  getCurrentPositions: () => ComponentPositions;
  activeComponent: string | null;
}

const ModelPositionContext = createContext<ModelPositionContextType | undefined>(undefined);

export const useModelPosition = () => {
  const context = useContext(ModelPositionContext);
  if (!context) {
    throw new Error('useModelPosition must be used within a ModelPositionProvider');
  }
  return context;
};

interface ComponentConfig {
  id: string;
  element: HTMLElement;
  positions: ComponentPositions;
}

export const ModelPositionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [components, setComponents] = useState<ComponentConfig[]>([]);
  const [activeComponent, setActiveComponent] = useState<string | null>(null);
  const animationFrameRef = useRef<number>();

  const registerComponent = useCallback((id: string, element: HTMLElement, positions: ComponentPositions) => {
    setComponents(prev => {
      const filtered = prev.filter(c => c.id !== id);
      return [...filtered, { id, element, positions }];
    });
  }, []);

  const unregisterComponent = useCallback((id: string) => {
    setComponents(prev => prev.filter(c => c.id !== id));
  }, []);

  // Convert component-relative coordinates to 3D world coordinates
  const componentToWorld = (componentElement: HTMLElement, relativeX: number, relativeY: number, z: number) => {
    const rect = componentElement.getBoundingClientRect();
    const componentCenterX = rect.left + rect.width / 2;
    const componentCenterY = rect.top + rect.height / 2;
    
    // Calculate world position relative to component center
    const worldX = componentCenterX + relativeX;
    const worldY = componentCenterY + relativeY;
    
    // Convert screen coordinates to 3D world coordinates
    const normalizedX = (worldX / window.innerWidth) * 2 - 1;
    const normalizedY = -(worldY / window.innerHeight) * 2 + 1;
    
    return {
      x: normalizedX * 8, // Scale to 3D scene bounds
      y: normalizedY * 6,
      z: z
    };
  };

  // Determine active component based on viewport center
  useEffect(() => {
    const updateActiveComponent = () => {
      // Use more reliable scroll position detection
      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      const viewportCenter = scrollY + window.innerHeight / 2;
      let closestComponent: string | null = null;
      let minDistance = Infinity;

      components.forEach(component => {
        const rect = component.element.getBoundingClientRect();
        const elementCenter = rect.top + scrollY + rect.height / 2;
        const distance = Math.abs(elementCenter - viewportCenter);
        
        // More lenient visibility check - component should be at least partially visible
        const isVisible = rect.bottom > 0 && rect.top < window.innerHeight;
        
        // Additional check: component should be significantly in view (at least 20% visible)
        const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
        const visibilityRatio = visibleHeight / rect.height;
        const isSignificantlyVisible = visibilityRatio > 0.2;
        
        if (isVisible && isSignificantlyVisible && distance < minDistance) {
          minDistance = distance;
          closestComponent = component.id;
        }
      });

      // If no component is significantly visible, find the closest one that's at least partially visible
      if (!closestComponent) {
        components.forEach(component => {
          const rect = component.element.getBoundingClientRect();
          const elementCenter = rect.top + scrollY + rect.height / 2;
          const distance = Math.abs(elementCenter - viewportCenter);
          
          const isVisible = rect.bottom > 0 && rect.top < window.innerHeight;
          
          if (isVisible && distance < minDistance) {
            minDistance = distance;
            closestComponent = component.id;
          }
        });
      }

      if (closestComponent !== activeComponent) {
        console.log('Active component changed from', activeComponent, 'to', closestComponent);
        setActiveComponent(closestComponent);
      }
    };

    const handleScroll = () => {
      // Use requestAnimationFrame for smooth updates while maintaining responsiveness
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(updateActiveComponent);
    };

    // Initial update
    updateActiveComponent();
    
    // Use direct scroll event without throttling for better responsiveness
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateActiveComponent, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateActiveComponent);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [components, activeComponent]);

  const getCurrentPositions = useCallback((): ComponentPositions => {
    const activeConfig = components.find(c => c.id === activeComponent);
    
    if (!activeConfig) {
      // Default hidden positions
      return {
        pencil: { x: 0, y: 0, z: 0, scale: 1, visible: false },
        eraser: { x: 0, y: 0, z: 0, scale: 1, visible: false },
        sharpener: { x: 0, y: 0, z: 0, scale: 1, visible: false }
      };
    }

    // Convert component-relative positions to world coordinates
    const pencilWorld = componentToWorld(
      activeConfig.element,
      activeConfig.positions.pencil.x,
      activeConfig.positions.pencil.y,
      activeConfig.positions.pencil.z
    );
    
    const eraserWorld = componentToWorld(
      activeConfig.element,
      activeConfig.positions.eraser.x,
      activeConfig.positions.eraser.y,
      activeConfig.positions.eraser.z
    );
    
    const sharpenerWorld = componentToWorld(
      activeConfig.element,
      activeConfig.positions.sharpener.x,
      activeConfig.positions.sharpener.y,
      activeConfig.positions.sharpener.z
    );

    return {
      pencil: {
        ...activeConfig.positions.pencil,
        x: pencilWorld.x,
        y: pencilWorld.y,
        z: pencilWorld.z
      },
      eraser: {
        ...activeConfig.positions.eraser,
        x: eraserWorld.x,
        y: eraserWorld.y,
        z: eraserWorld.z
      },
      sharpener: {
        ...activeConfig.positions.sharpener,
        x: sharpenerWorld.x,
        y: sharpenerWorld.y,
        z: sharpenerWorld.z
      }
    };
  }, [components, activeComponent]);

  return (
    <ModelPositionContext.Provider value={{
      registerComponent,
      unregisterComponent,
      getCurrentPositions,
      activeComponent
    }}>
      {children}
    </ModelPositionContext.Provider>
  );
}; 