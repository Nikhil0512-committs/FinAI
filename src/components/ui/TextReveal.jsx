import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export const TextReveal = ({ children, className, delay = 0 }) => {
  const [shouldAnimate, setShouldAnimate] = useState(true);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setShouldAnimate(false);
    }
  }, []);

  if (!shouldAnimate || typeof children !== 'string') {
    return <span className={className}>{children}</span>;
  }

  // Split by words to avoid too many DOM nodes, but give a nice stagger effect
  const words = children.split(' ');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
        delayChildren: delay,
      },
    },
  };

  const wordVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.2, 0.65, 0.3, 0.9] },
    },
  };

  return (
    <motion.span
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn('inline-block', className)}
    >
      {words.map((word, index) => (
        <React.Fragment key={index}>
          <motion.span variants={wordVariants} className="inline-block">
            {word}
          </motion.span>
          {index < words.length - 1 && <span>&nbsp;</span>}
        </React.Fragment>
      ))}
    </motion.span>
  );
};
