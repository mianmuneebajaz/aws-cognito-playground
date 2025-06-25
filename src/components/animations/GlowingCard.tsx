import React from 'react';
import { motion } from 'framer-motion';

interface GlowingCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  glowColor?: string;
}

export const GlowingCard: React.FC<GlowingCardProps> = ({ 
  children, 
  className = '', 
  delay = 0,
  glowColor = 'blue'
}) => {
  const glowColors = {
    blue: 'shadow-blue-500/20 hover:shadow-blue-500/40',
    purple: 'shadow-purple-500/20 hover:shadow-purple-500/40',
    green: 'shadow-green-500/20 hover:shadow-green-500/40',
    pink: 'shadow-pink-500/20 hover:shadow-pink-500/40'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.6, 
        delay,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{ 
        scale: 1.05,
        transition: { duration: 0.2 }
      }}
      className={`
        relative overflow-hidden rounded-2xl border border-white/10 
        bg-white/5 backdrop-blur-xl shadow-2xl
        ${glowColors[glowColor as keyof typeof glowColors]}
        transition-all duration-300 hover:border-white/20
        ${className}
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};