import React from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface FairyProps {
  onClick: () => void;
  className?: string;
}

export const Fairy: React.FC<FairyProps> = ({ onClick, className = "" }) => {
  return (
    <motion.button
      onClick={onClick}
      initial={{ y: 0 }}
      animate={{ 
        y: [-10, 10, -10],
        scale: [1, 1.05, 1],
        filter: ['brightness(1)', 'brightness(1.2)', 'brightness(1)']
      }}
      transition={{ 
        duration: 4, 
        repeat: Infinity, 
        ease: "easeInOut" 
      }}
      className={`relative group cursor-pointer ${className}`}
      title="Replay Tutorial"
    >
      {/* Fairy Wings */}
      <motion.div 
        animate={{ rotateY: [0, 45, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-4 top-0 w-6 h-10 bg-gold/30 rounded-full blur-[2px] origin-right"
      />
      <motion.div 
        animate={{ rotateY: [0, -45, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -right-4 top-0 w-6 h-10 bg-gold/30 rounded-full blur-[2px] origin-left"
      />

      {/* Fairy Body */}
      <div className="relative z-10 w-6 h-6 bg-gold rounded-full shadow-[0_0_15px_rgba(212,175,55,0.8)] flex items-center justify-center overflow-hidden">
        <Sparkles size={14} className="text-white animate-pulse" />
      </div>

      {/* Fairy Trail */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-1 h-12 bg-gradient-to-b from-gold/50 to-transparent blur-[1px]" />

      {/* Hover Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-3 py-1.5 bg-ink text-paper text-[10px] uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-gold/30 shadow-xl">
        Summon Guide
      </div>
    </motion.button>
  );
};
