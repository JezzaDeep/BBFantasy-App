import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, ChevronRight, ChevronLeft } from 'lucide-react';

export interface TutorialStep {
  targetId: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface TutorialProps {
  steps: TutorialStep[];
  onComplete: () => void;
  isOpen: boolean;
}

export const Tutorial: React.FC<TutorialProps> = ({ steps, onComplete, isOpen }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });

  const updateCoords = useCallback(() => {
    const step = steps[currentStep];
    if (!step) return;

    const element = document.getElementById(step.targetId);
    if (element) {
      const rect = element.getBoundingClientRect();
      setCoords(prev => {
        if (prev.top === rect.top && prev.left === rect.left && prev.width === rect.width && prev.height === rect.height) {
          return prev;
        }
        return {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        };
      });
      
      // Add highlight class
      if (!element.classList.contains('tutorial-highlight')) {
        document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
        element.classList.add('tutorial-highlight');
      }
    }
  }, [currentStep, steps]);

  useEffect(() => {
    if (isOpen) {
      // Initial scroll
      const step = steps[currentStep];
      const element = document.getElementById(step?.targetId || '');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      let rafId: number;
      const loop = () => {
        updateCoords();
        rafId = requestAnimationFrame(loop);
      };
      rafId = requestAnimationFrame(loop);
      
      window.addEventListener('resize', updateCoords);
      return () => {
        cancelAnimationFrame(rafId);
        window.removeEventListener('resize', updateCoords);
        document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
      };
    }
  }, [isOpen, currentStep, updateCoords, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (!isOpen || steps.length === 0) return null;

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[1000] pointer-events-none overflow-hidden">
      {/* Overlay with hole */}
      <div 
        className="absolute inset-0 bg-black/60 transition-opacity duration-500"
        style={{
          clipPath: `polygon(
            0px 0px, 
            0px 100%, 
            ${coords.left}px 100%, 
            ${coords.left}px ${coords.top}px, 
            ${coords.left + coords.width}px ${coords.top}px, 
            ${coords.left + coords.width}px ${coords.top + coords.height}px, 
            ${coords.left}px ${coords.top + coords.height}px, 
            ${coords.left}px 100%, 
            100% 100%, 
            100% 0px
          )`
        }}
      />

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="absolute pointer-events-auto bg-paper border-2 border-gold/50 rounded-2xl shadow-2xl p-6 max-w-xs w-full z-[1001]"
          style={{
            top: Math.min(window.innerHeight - 250, Math.max(20, coords.top + coords.height + 20)),
            left: Math.max(20, Math.min(window.innerWidth - 340, coords.left + coords.width / 2 - 160)),
          }}
        >
          <div className="flex items-center gap-2 mb-2 text-gold">
            <Sparkles size={18} className="animate-pulse" />
            <h3 className="font-fantasy text-lg italic">{step.title}</h3>
          </div>
          
          <p className="text-ink/80 text-sm font-serif leading-relaxed mb-6">
            {step.content}
          </p>

          <div className="flex items-center justify-between">
            <button 
              onClick={onComplete}
              className="text-[10px] text-ink/40 hover:text-ink/60 transition-colors font-bold uppercase tracking-widest"
            >
              Skip
            </button>

            <div className="flex gap-1">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1 h-1 rounded-full transition-colors ${i === currentStep ? 'bg-gold' : 'bg-gold/20'}`} 
                />
              ))}
            </div>
            
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button 
                  onClick={handlePrev}
                  className="p-2 hover:bg-gold/10 rounded-full transition-colors text-gold"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              <button 
                onClick={handleNext}
                className="flex items-center gap-2 px-4 py-2 bg-gold text-ink rounded-lg font-bold text-sm hover:bg-gold/80 transition-colors shadow-md"
              >
                {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <button 
            onClick={onComplete}
            className="absolute top-4 right-4 text-ink/30 hover:text-ink/60 transition-colors"
          >
            <X size={18} />
          </button>
        </motion.div>
      </AnimatePresence>

      {/* Highlight border */}
      <motion.div
        initial={false}
        animate={{
          top: coords.top - 4,
          left: coords.left - 4,
          width: coords.width + 8,
          height: coords.height + 8,
        }}
        className="absolute border-2 border-gold rounded-xl pointer-events-none shadow-[0_0_15px_rgba(212,175,55,0.5)]"
      />
    </div>
  );
};
