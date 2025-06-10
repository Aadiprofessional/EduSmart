import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, OrbitControls, Cylinder, Cone, Box } from '@react-three/drei';
import * as THREE from 'three';
import { useModelPosition } from '../../utils/ModelPositionContext';

// Smooth interpolation function
const lerp = (start: number, end: number, factor: number) => {
  return start + (end - start) * factor;
};

// 3D Pencil Component
const AnimatedPencil: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const { getCurrentPositions, activeComponent } = useModelPosition();
  const [previousComponent, setPreviousComponent] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  useFrame((state) => {
    if (!groupRef.current) return;
    
    const positions = getCurrentPositions();
    const targetPos = positions.pencil;
    
    // Detect component transitions
    if (activeComponent !== previousComponent) {
      setIsTransitioning(true);
      setPreviousComponent(activeComponent);
      setTimeout(() => setIsTransitioning(false), 1000);
    }
    
    if (targetPos.visible) {
      const lerpFactor = isTransitioning ? 0.08 : 0.04;
      
      // Smooth position interpolation
      groupRef.current.position.x = lerp(groupRef.current.position.x, targetPos.x, lerpFactor);
      groupRef.current.position.y = lerp(groupRef.current.position.y, targetPos.y, lerpFactor);
      groupRef.current.position.z = lerp(groupRef.current.position.z, targetPos.z, lerpFactor);
      
      // Smooth scale interpolation
      const targetScale = targetPos.scale;
      groupRef.current.scale.x = lerp(groupRef.current.scale.x, targetScale, lerpFactor);
      groupRef.current.scale.y = lerp(groupRef.current.scale.y, targetScale, lerpFactor);
      groupRef.current.scale.z = lerp(groupRef.current.scale.z, targetScale, lerpFactor);
      
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

// 3D Eraser Component
const AnimatedEraser: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const { getCurrentPositions, activeComponent } = useModelPosition();
  const [previousComponent, setPreviousComponent] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  useFrame((state) => {
    if (!groupRef.current) return;
    
    const positions = getCurrentPositions();
    const targetPos = positions.eraser;
    
    // Detect component transitions
    if (activeComponent !== previousComponent) {
      setIsTransitioning(true);
      setPreviousComponent(activeComponent);
      setTimeout(() => setIsTransitioning(false), 1000);
    }
    
    if (targetPos.visible) {
      const lerpFactor = isTransitioning ? 0.08 : 0.04;
      
      // Smooth position interpolation
      groupRef.current.position.x = lerp(groupRef.current.position.x, targetPos.x, lerpFactor);
      groupRef.current.position.y = lerp(groupRef.current.position.y, targetPos.y, lerpFactor);
      groupRef.current.position.z = lerp(groupRef.current.position.z, targetPos.z, lerpFactor);
      
      // Smooth scale interpolation
      const targetScale = targetPos.scale;
      groupRef.current.scale.x = lerp(groupRef.current.scale.x, targetScale, lerpFactor);
      groupRef.current.scale.y = lerp(groupRef.current.scale.y, targetScale, lerpFactor);
      groupRef.current.scale.z = lerp(groupRef.current.scale.z, targetScale, lerpFactor);
      
      // Gentle continuous rotation
      groupRef.current.rotation.x = state.clock.elapsedTime * 0.2;
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      
      groupRef.current.visible = true;
    } else {
      groupRef.current.visible = false;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.3}>
      <group ref={groupRef}>
        {/* Main Eraser Body */}
        <Box args={[1.5, 0.8, 0.6]}>
          <meshStandardMaterial 
            color="#FF69B4"
            metalness={0.2}
            roughness={0.8}
          />
        </Box>
        
        {/* Metal Band */}
        <Cylinder args={[0.8, 0.8, 0.1, 16]} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial 
            color="#C0C0C0" 
            metalness={0.9} 
            roughness={0.1}
          />
        </Cylinder>
        
        {/* Brand Text Area */}
        <Box args={[1.2, 0.6, 0.1]} position={[0, 0, 0.35]}>
          <meshStandardMaterial 
            color="#FFFFFF"
          />
        </Box>
      </group>
    </Float>
  );
};

// 3D Sharpener Component
const AnimatedSharpener: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const { getCurrentPositions, activeComponent } = useModelPosition();
  const [previousComponent, setPreviousComponent] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  useFrame((state) => {
    if (!groupRef.current) return;
    
    const positions = getCurrentPositions();
    const targetPos = positions.sharpener;
    
    // Detect component transitions
    if (activeComponent !== previousComponent) {
      setIsTransitioning(true);
      setPreviousComponent(activeComponent);
      setTimeout(() => setIsTransitioning(false), 1000);
    }
    
    if (targetPos.visible) {
      const lerpFactor = isTransitioning ? 0.08 : 0.04;
      
      // Smooth position interpolation
      groupRef.current.position.x = lerp(groupRef.current.position.x, targetPos.x, lerpFactor);
      groupRef.current.position.y = lerp(groupRef.current.position.y, targetPos.y, lerpFactor);
      groupRef.current.position.z = lerp(groupRef.current.position.z, targetPos.z, lerpFactor);
      
      // Smooth scale interpolation
      const targetScale = targetPos.scale;
      groupRef.current.scale.x = lerp(groupRef.current.scale.x, targetScale, lerpFactor);
      groupRef.current.scale.y = lerp(groupRef.current.scale.y, targetScale, lerpFactor);
      groupRef.current.scale.z = lerp(groupRef.current.scale.z, targetScale, lerpFactor);
      
      // Gentle continuous rotation
      groupRef.current.rotation.x = state.clock.elapsedTime * 0.25;
      groupRef.current.rotation.z = state.clock.elapsedTime * 0.2;
      
      groupRef.current.visible = true;
    } else {
      groupRef.current.visible = false;
    }
  });

  return (
    <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.2}>
      <group ref={groupRef}>
        {/* Main Sharpener Body */}
        <Box args={[1.2, 1.2, 0.8]}>
          <meshStandardMaterial 
            color="#4F46E5"
            metalness={0.3}
            roughness={0.7}
          />
        </Box>
        
        {/* Sharpener Hole */}
        <Cylinder args={[0.3, 0.2, 0.9, 8]} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial 
            color="#2C2C2C" 
            metalness={0.8} 
            roughness={0.2}
          />
        </Cylinder>
        
        {/* Blade */}
        <Cone args={[0.25, 0.1, 8]} position={[0, 0, -0.3]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial 
            color="#C0C0C0" 
            metalness={0.9} 
            roughness={0.1}
          />
        </Cone>
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
  return (
    <div className="fixed inset-0 z-30 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 75 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Scene3D />
      </Canvas>
    </div>
  );
};

export default ScrollingBalls3D; 