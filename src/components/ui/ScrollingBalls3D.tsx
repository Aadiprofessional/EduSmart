import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, OrbitControls, Cylinder, Cone, Box, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useModelPosition } from '../../utils/ModelPositionContext';

// Smooth interpolation function
const lerp = (start: number, end: number, factor: number) => {
  return start + (end - start) * factor;
};

// 3D Pencil Component
const AnimatedPencil: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const [previousComponent, setPreviousComponent] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Always call the hook at the top level
  const modelPositionContext = useModelPosition();
  
  // Check for mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  useFrame((state) => {
    if (!groupRef.current || !modelPositionContext?.getCurrentPositions) return;
    
    const positions = modelPositionContext.getCurrentPositions();
    const targetPos = positions.pencil;
    
    // Detect component transitions
    if (modelPositionContext.activeComponent !== previousComponent) {
      setIsTransitioning(true);
      setPreviousComponent(modelPositionContext.activeComponent);
      console.log('Pencil: Active component changed from', previousComponent, 'to', modelPositionContext.activeComponent);
      setTimeout(() => setIsTransitioning(false), 1000);
    }
    
    if (targetPos.visible) {
      const lerpFactor = isTransitioning ? 0.08 : 0.04;
      
      // Apply mobile positioning adjustments
      let adjustedX = targetPos.x;
      let adjustedY = targetPos.y;
      let adjustedScale = targetPos.scale;
      
      if (isMobile) {
        // Scale down and adjust positioning for mobile
        adjustedX = adjustedX * 0.3; // Bring closer to center
        adjustedY = adjustedY * 0.5; // Reduce vertical offset
        adjustedScale = adjustedScale * 0.6; // Make smaller
      }
      
      // Smooth position interpolation
      groupRef.current.position.x = lerp(groupRef.current.position.x, adjustedX, lerpFactor);
      groupRef.current.position.y = lerp(groupRef.current.position.y, adjustedY, lerpFactor);
      groupRef.current.position.z = lerp(groupRef.current.position.z, targetPos.z, lerpFactor);
      
      // Smooth scale interpolation
      groupRef.current.scale.x = lerp(groupRef.current.scale.x, adjustedScale, lerpFactor);
      groupRef.current.scale.y = lerp(groupRef.current.scale.y, adjustedScale, lerpFactor);
      groupRef.current.scale.z = lerp(groupRef.current.scale.z, adjustedScale, lerpFactor);
      
      // Apply rotation if specified
      if (targetPos.rotation) {
        groupRef.current.rotation.x = lerp(groupRef.current.rotation.x, targetPos.rotation.x, lerpFactor);
        groupRef.current.rotation.y = lerp(groupRef.current.rotation.y, targetPos.rotation.y, lerpFactor);
        groupRef.current.rotation.z = lerp(groupRef.current.rotation.z, targetPos.rotation.z, lerpFactor);
      } else {
        // Gentle continuous rotation when no specific rotation is set
        groupRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      }
      
      groupRef.current.visible = true;
    } else {
      groupRef.current.visible = false;
    }
  });

  // Don't render if context is not available
  if (!modelPositionContext?.getCurrentPositions) {
    return null;
  }

  return (
    <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.2}>
      <group ref={groupRef}>
        {/* Pencil Body */}
        <Cylinder args={[0.05, 0.05, 2, 8]} position={[0, 0, 0]}>
          <meshStandardMaterial 
            color="#FFD700" 
            metalness={0.3} 
            roughness={0.7}
          />
        </Cylinder>
        
        {/* Pencil Tip */}
        <Cone args={[0.05, 0.3, 8]} position={[0, 1.15, 0]}>
          <meshStandardMaterial 
            color="#8B4513" 
            metalness={0.2} 
            roughness={0.8}
          />
        </Cone>
        
        {/* Pencil Lead */}
        <Cone args={[0.02, 0.1, 6]} position={[0, 1.25, 0]}>
          <meshStandardMaterial 
            color="#2C2C2C" 
            metalness={0.1} 
            roughness={0.9}
          />
        </Cone>
        
        {/* Eraser */}
        <Cylinder args={[0.06, 0.06, 0.2, 8]} position={[0, -1.1, 0]}>
          <meshStandardMaterial 
            color="#FF69B4" 
            metalness={0.1} 
            roughness={0.8}
          />
        </Cylinder>
        
        {/* Metal Band */}
        <Cylinder args={[0.055, 0.055, 0.1, 8]} position={[0, -0.95, 0]}>
          <meshStandardMaterial 
            color="#C0C0C0" 
            metalness={0.9} 
            roughness={0.1}
          />
        </Cylinder>
      </group>
    </Float>
  );
};

// 3D Eraser Component using GLTF model
const AnimatedEraser: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const [previousComponent, setPreviousComponent] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Load the GLTF model
  const { scene } = useGLTF('/models/testing/scene.gltf');
  
  // Always call the hook at the top level
  const modelPositionContext = useModelPosition();
  
  // Check for mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  useFrame((state) => {
    if (!groupRef.current || !modelPositionContext?.getCurrentPositions) return;
    
    const positions = modelPositionContext.getCurrentPositions();
    const targetPos = positions.eraser;
    
    // Detect component transitions
    if (modelPositionContext.activeComponent !== previousComponent) {
      setIsTransitioning(true);
      setPreviousComponent(modelPositionContext.activeComponent);
      console.log('Eraser: Active component changed from', previousComponent, 'to', modelPositionContext.activeComponent);
      setTimeout(() => setIsTransitioning(false), 1000);
    }
    
    if (targetPos.visible) {
      const lerpFactor = isTransitioning ? 0.04 : 0.04;
      
      // Apply mobile positioning adjustments
      let adjustedX = targetPos.x;
      let adjustedY = targetPos.y;
      let adjustedScale = targetPos.scale;
      
      if (isMobile) {
        // Scale down and adjust positioning for mobile
        adjustedX = adjustedX * 0.3; // Bring closer to center
        adjustedY = adjustedY * 0.5; // Reduce vertical offset
        adjustedScale = adjustedScale * 0.6; // Make smaller
      }
      
      // Smooth position interpolation
      groupRef.current.position.x = lerp(groupRef.current.position.x, adjustedX, lerpFactor);
      groupRef.current.position.y = lerp(groupRef.current.position.y, adjustedY, lerpFactor);
      groupRef.current.position.z = lerp(groupRef.current.position.z, targetPos.z, lerpFactor);
      
      // Smooth scale interpolation
      groupRef.current.scale.x = lerp(groupRef.current.scale.x, adjustedScale, lerpFactor);
      groupRef.current.scale.y = lerp(groupRef.current.scale.y, adjustedScale, lerpFactor);
      groupRef.current.scale.z = lerp(groupRef.current.scale.z, adjustedScale, lerpFactor);
      
      groupRef.current.visible = true;
    } else {
      groupRef.current.visible = false;
    }
  });

  // Don't render if context is not available
  if (!modelPositionContext?.getCurrentPositions) {
    return null;
  }

  return (
    <Float speed={3} rotationIntensity={0.1} floatIntensity={0.05}>
      <group ref={groupRef}>
        <primitive object={scene.clone()} scale={[2, 2, 2]} />
      </group>
    </Float>
  );
};

// 3D Sharpener Component using GLTF model
const AnimatedSharpener: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const [previousComponent, setPreviousComponent] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Load the GLTF model
  const gltf = useGLTF('/models/scene.gltf');
  const scene = gltf?.scene;
  
  // Always call the hook at the top level
  const modelPositionContext = useModelPosition();
  
  useEffect(() => {
    if (scene) {
      console.log('Sharpener model loaded successfully:', scene);
      console.log('Sharpener scene children count:', scene.children.length);
      // Traverse scene to find meshes
      scene.traverse((child) => {
        if (child.type === 'Mesh') {
          console.log('Found sharpener mesh:', child);
        }
      });
    } else {
      console.warn('Sharpener model not loaded');
    }
  }, [scene]);
  
  // Check for mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  useFrame((state) => {
    if (!groupRef.current || !modelPositionContext?.getCurrentPositions) return;
    
    const positions = modelPositionContext.getCurrentPositions();
    const targetPos = positions.sharpener;
    
    // Debug: Log when sharpener should be visible
    if (targetPos.visible && modelPositionContext.activeComponent === 'sharpener') {
      console.log('Sharpener should be visible at:', targetPos);
    }
    
    // Detect component transitions
    if (modelPositionContext.activeComponent !== previousComponent) {
      setIsTransitioning(true);
      setPreviousComponent(modelPositionContext.activeComponent);
      console.log('Sharpener: Active component changed from', previousComponent, 'to', modelPositionContext.activeComponent);
      setTimeout(() => setIsTransitioning(false), 1000);
    }
    
    if (targetPos.visible) {
      const lerpFactor = isTransitioning ? 0.08 : 0.04;
      
      // Apply mobile positioning adjustments
      let adjustedX = targetPos.x;
      let adjustedY = targetPos.y;
      let adjustedScale = targetPos.scale;
      
      if (isMobile) {
        // Scale down and adjust positioning for mobile
        adjustedX = adjustedX * 0.3; // Bring closer to center
        adjustedY = adjustedY * 0.5; // Reduce vertical offset
        adjustedScale = adjustedScale * 0.6; // Make smaller
      }
      
      // Smooth position interpolation
      groupRef.current.position.x = lerp(groupRef.current.position.x, adjustedX, lerpFactor);
      groupRef.current.position.y = lerp(groupRef.current.position.y, adjustedY, lerpFactor);
      groupRef.current.position.z = lerp(groupRef.current.position.z, targetPos.z, lerpFactor);
      
      // Smooth scale interpolation
      groupRef.current.scale.x = lerp(groupRef.current.scale.x, adjustedScale, lerpFactor);
      groupRef.current.scale.y = lerp(groupRef.current.scale.y, adjustedScale, lerpFactor);
      groupRef.current.scale.z = lerp(groupRef.current.scale.z, adjustedScale, lerpFactor);
      
      groupRef.current.visible = true;
    } else {
      groupRef.current.visible = false;
    }
  });

  // Don't render if context is not available
  if (!modelPositionContext?.getCurrentPositions) {
    return null;
  }

  return (
    <Float speed={3} rotationIntensity={0.1} floatIntensity={0.05}>
      <group ref={groupRef}>
        {scene ? (
          <primitive object={scene.clone()} scale={[50, 50, 50]} />
        ) : (
          // Fallback to primitive shapes if model doesn't load
          <Box args={[1.2, 1.2, 0.8]}>
            <meshStandardMaterial 
              color="#4F46E5"
              metalness={0.3}
              roughness={0.7}
            />
          </Box>
        )}
      </group>
    </Float>
  );
};

// Background Particle System
const ParticleField: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 300;
  
  const positions = React.useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 25;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 25;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 25;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.x = state.clock.elapsedTime * 0.002;
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.005;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.01} color="#60A5FA" transparent opacity={0.15} />
    </points>
  );
};

// Main 3D Scene
const Scene3D: React.FC = () => {
  const { camera } = useThree();
  
  useEffect(() => {
    if (camera) {
      camera.position.set(0, 0, 8);
    }
  }, [camera]);

  // Subtle camera movement
  useFrame((state) => {
    if (camera) {
      camera.position.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.1;
      camera.position.y = Math.cos(state.clock.elapsedTime * 0.05) * 0.05;
      camera.lookAt(0, 0, 0);
    }
  });

  return (
    <>
      {/* Lighting Setup */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -10]} color="#4F46E5" intensity={0.6} />
      <pointLight position={[10, -10, 10]} color="#EC4899" intensity={0.6} />
      
      <ParticleField />
      
      {/* 3D Models */}
      <AnimatedPencil />
      <AnimatedEraser />
      <AnimatedSharpener />
      
      <OrbitControls 
        enableZoom={false} 
        enablePan={false} 
        enableRotate={false}
      />
    </>
  );
};

const ScrollingBalls3D: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 1024 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Don't render on mobile devices
  if (isMobile) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 39 }}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 75 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent', pointerEvents: 'none' }}
      >
        <Scene3D />
      </Canvas>
    </div>
  );
};

// Preload GLTF models for better performance
useGLTF.preload('/models/scene.gltf');
useGLTF.preload('/models/testing/scene.gltf');

export default ScrollingBalls3D; 