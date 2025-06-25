import React from 'react';
import { motion } from 'framer-motion';
import { Database, Shield, Zap, Lock, Eye, Settings } from 'lucide-react';

const FloatingIcon: React.FC<{ 
  icon: React.ElementType; 
  delay: number; 
  x: string; 
  y: string;
  color: string;
}> = ({ icon: Icon, delay, x, y, color }) => {
  return (
    <motion.div
      className={`absolute ${x} ${y} w-12 h-12 ${color} rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20`}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: [0, 1, 0.7, 1],
        scale: [0, 1.2, 0.8, 1],
        y: [0, -20, 0, -10, 0]
      }}
      transition={{
        duration: 4,
        delay,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut"
      }}
    >
      <Icon className="w-6 h-6 text-white" />
    </motion.div>
  );
};

export const FloatingElements: React.FC = () => {
  const elements = [
    { icon: Database, delay: 0, x: 'left-10', y: 'top-20', color: 'bg-blue-500/20' },
    { icon: Shield, delay: 1, x: 'right-16', y: 'top-32', color: 'bg-purple-500/20' },
    { icon: Zap, delay: 2, x: 'left-20', y: 'bottom-40', color: 'bg-yellow-500/20' },
    { icon: Lock, delay: 0.5, x: 'right-10', y: 'bottom-32', color: 'bg-green-500/20' },
    { icon: Eye, delay: 1.5, x: 'left-1/4', y: 'top-40', color: 'bg-pink-500/20' },
    { icon: Settings, delay: 2.5, x: 'right-1/4', y: 'bottom-20', color: 'bg-indigo-500/20' },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {elements.map((element, index) => (
        <FloatingIcon key={index} {...element} />
      ))}
    </div>
  );
};