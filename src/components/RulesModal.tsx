import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface RulesModalProps {
  open: boolean;
  onClose: () => void;
  rules: { title: string; content?: string; items?: string[] }[];
}

const RulesModal: React.FC<RulesModalProps> = ({ open, onClose, rules }) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="rules"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-ink/80 backdrop-blur-md z-[150] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="max-w-2xl w-full glass-panel rounded-[3rem] p-10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-4xl font-display italic text-ink">Official Rules</h2>
              <button onClick={onClose} className="p-2 hover:bg-ink/5 rounded-full">
                <X size={24} className="text-ink/40" />
              </button>
            </div>

            {/* Rules Content */}
            <div className="overflow-y-auto pr-4 scrollbar-thin space-y-8">
              {rules.map((rule, i) => (
                <div key={i} className="space-y-3">
                  <h3 className="text-xl font-display italic text-gold">{rule.title}</h3>
                  {rule.content && <p className="text-sm leading-relaxed opacity-80">{rule.content}</p>}
                  {rule.items && (
                    <ul className="space-y-2">
                      {rule.items.map((item, j) => (
                        <li key={j} className="text-sm leading-relaxed opacity-80 flex gap-3">
                          <span className="text-gold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="mt-8 w-full py-4 bg-ink text-paper rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-gold hover:text-ink transition-all"
            >
              Back
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RulesModal;
