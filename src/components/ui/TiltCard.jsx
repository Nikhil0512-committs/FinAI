import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '../../utils/cn';

export const TiltCard = ({ children, className, tiltMax = 3 }) => {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [isInteractive, setIsInteractive] = useState(false);

  useEffect(() => {
    const checkInteractivity = () => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
      setIsInteractive(!prefersReducedMotion && !isTouch);
    };
    checkInteractivity();
    
    // Listen for changes just in case
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const listener = () => checkInteractivity();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener);
    }
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', listener);
      }
    };
  }, []);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [tiltMax, -tiltMax]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-tiltMax, tiltMax]);

  const handleMouseMove = (e) => {
    if (!ref.current || !isInteractive) return;

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: isInteractive ? rotateX : 0,
        rotateY: isInteractive ? rotateY : 0,
        transformStyle: 'preserve-3d',
      }}
      className={cn(
        'relative overflow-hidden rounded-xl bg-[#0f172a] border border-gray-800 transition-colors',
        className
      )}
    >
      <div style={{ transform: isInteractive ? 'translateZ(10px)' : 'none' }}>
        {children}
      </div>
    </motion.div>
  );
};
