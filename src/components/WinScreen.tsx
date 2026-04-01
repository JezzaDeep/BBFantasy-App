import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDevice, useResponsiveFont } from '../MegaOptimization';
import {
  Trophy,
  Book,
  Wand2,
  Scroll,
  Zap,
  Key,
  Sword,
  Sparkles,
  Scroll as AncientScroll,
  Flame as Dragon,
  Wand2 as WizardStaff,
  Key as RunedKey,
  Crown,
  Shield,
  User,
} from 'lucide-react';
import './WinScreen.css';

const TOKENS = [
  { name: 'Sword', icon: Sword },
  { name: 'Crystal Orb', icon: Sparkles },
  { name: 'Ancient Scroll', icon: AncientScroll },
  { name: 'Dragon', icon: Dragon },
  { name: 'Wizard Staff', icon: WizardStaff },
  { name: 'Runed Key', icon: RunedKey },
  { name: 'Crown', icon: Crown },
  { name: 'Shield', icon: Shield },
];

type PlayerResources = {
  books: number;
  arcane: number;
  fate: number;
  ink: number;
};

type Relic = {
  id: string;
  name: string;
  description: string;
};

type WinPlayer = {
  id: number;
  name: string;
  color: string;
  token: string;
  characterClass: string;
  resources: PlayerResources;
  inventory: {
    fateCards: unknown[];
    arcaneCards: unknown[];
    questCards: unknown[];
    relics: Relic[];
  };
  stats: {
    arcaneSpacesVisited: number;
    fateCardsDrawn: number;
    lapsCompleted: number;
  };
  completedSpaces: number[];
};

interface WinScreenProps {
  winner: WinPlayer;
  players: WinPlayer[];
  logs: string[];
  device: 'mobile' | 'tablet' | 'desktop';
  audioEnabled: boolean;
  audioVolume: number;
  onPlayAgain: () => void;
}

const FLYING_EMOJIS = ['📖', '✨', '🏆', '💎', '🔮', '⚔️', '🗝️', '👑', '🛡️', '🌟'];

const WinScreen: React.FC<WinScreenProps> = ({
  winner,
  players,
  logs,
  device: deviceProp,
  audioEnabled,
  audioVolume,
  onPlayAgain,
}) => {
  const { device } = useDevice();
  const responsiveFont = useResponsiveFont(18);
  const [soundPlayed, setSoundPlayed] = useState(false);
  const [showContent, setShowContent] = useState(false);

  // Generate stable star positions
  const stars = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => ({
        left: `${(i * 37 + 13) % 100}%`,
        top: `${(i * 53 + 7) % 100}%`,
        delay: `${(i * 0.3) % 4}s`,
        size: i % 3 === 0 ? 3 : 2,
      })),
    []
  );

  // Generate stable particle positions
  const particles = useMemo(
    () =>
      Array.from({ length: 25 }, (_, i) => ({
        left: `${(i * 29 + 11) % 90 + 5}%`,
        bottom: `${(i * 17 + 3) % 30}%`,
        delay: `${(i * 0.4) % 6}s`,
        type: i % 3 === 0 ? 'gold' : i % 3 === 1 ? 'spark' : 'ember',
      })),
    []
  );

  // Generate flying reward positions
  const flyingItems = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        emoji: FLYING_EMOJIS[i % FLYING_EMOJIS.length],
        left: `${(i * 23 + 8) % 80 + 10}%`,
        top: `${(i * 31 + 15) % 60 + 20}%`,
        delay: `${i * 0.25}s`,
      })),
    []
  );

  // Play victory sound
  useEffect(() => {
    if (soundPlayed || !audioEnabled) return;
    setSoundPlayed(true);
    const fanfare = new Audio('/sounds/milestone.mp3');
    fanfare.volume = Math.min(audioVolume, 0.5);
    fanfare.play().catch(() => {});
  }, [soundPlayed, audioEnabled, audioVolume]);

  // Delay content reveal for dramatic effect
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const sorted = useMemo(
    () => [...players].sort((a, b) => b.resources.books - a.resources.books),
    [players]
  );

  const score = (p: WinPlayer) =>
    p.resources.books * 100 + p.resources.arcane * 20 + p.resources.fate * 10;

  // Recent log highlights (last 8 meaningful entries)
  const storyHighlights = useMemo(
    () => logs.slice(0, 8),
    [logs]
  );

  // Use device from props if provided, else from hook
  const actualDevice = deviceProp || device;
  const isMobile = actualDevice === 'mobile';

  return (
    <div className="win-screen-overlay" style={{ fontSize: responsiveFont, padding: isMobile ? '0.5rem 0.2rem' : actualDevice === 'tablet' ? '1.2rem 0.7rem' : '2.25rem 1rem' }}>
      {/* Stars */}
      <div className="win-stars">
        {stars.map((s, i) => (
          <div
            key={i}
            className="win-star"
            style={{
              left: s.left,
              top: s.top,
              animationDelay: s.delay,
              width: s.size,
              height: s.size,
            }}
          />
        ))}
      </div>

      {/* Clouds */}
      <div className="win-clouds">
        <div className="win-cloud" style={{ top: '10%' }} />
        <div className="win-cloud" />
        <div className="win-cloud" />
      </div>

      {/* Particles */}
      <div className="win-particles">
        {particles.map((p, i) => (
          <div
            key={i}
            className={`win-particle win-particle-${p.type}`}
            style={{
              left: p.left,
              bottom: p.bottom,
              animationDelay: p.delay,
            }}
          />
        ))}
      </div>

      {/* Flying reward emojis */}
      <div className="win-flying-rewards">
        {flyingItems.map((item, i) => (
          <span
            key={i}
            className="win-fly-item"
            style={{
              left: item.left,
              top: item.top,
              animationDelay: item.delay,
            }}
          >
            {item.emoji}
          </span>
        ))}
      </div>

      {/* Main content */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="win-content"
          >
            {/* Magic glow behind trophy */}
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <div
                className="win-magic-glow"
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 10, delay: 0.2 }}
              >
                <Trophy
                  size={isMobile ? 56 : 90}
                  className="text-gold mx-auto"
                  style={{ filter: 'drop-shadow(0 0 20px rgba(197,160,89,0.6))' }}
                />
              </motion.div>
            </div>

            {/* Hero name */}
            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="win-hero-name"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              🏰 {winner.name} 🏰
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="win-hero-title"
            >
              Journey Complete
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="win-hero-class"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {winner.characterClass} • Score: {score(winner)}
            </motion.p>

            {/* Winner's reward summary */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="win-rewards"
            >
              <div className="win-reward-card" style={{ animationDelay: '0.2s' }}>
                <span className="win-reward-icon"><Book size={20} className="text-gold" /></span>
                <span className="win-reward-value">{winner.resources.books}</span>
                <span className="win-reward-label">Books</span>
              </div>
              <div className="win-reward-card" style={{ animationDelay: '0.4s' }}>
                <span className="win-reward-icon"><Wand2 size={20} className="text-purple-400" /></span>
                <span className="win-reward-value">{winner.resources.arcane}</span>
                <span className="win-reward-label">Arcane</span>
              </div>
              <div className="win-reward-card" style={{ animationDelay: '0.6s' }}>
                <span className="win-reward-icon"><Scroll size={20} className="text-red-400" /></span>
                <span className="win-reward-value">{winner.resources.fate}</span>
                <span className="win-reward-label">Fate</span>
              </div>
              <div className="win-reward-card" style={{ animationDelay: '0.8s' }}>
                <span className="win-reward-icon"><Zap size={20} className="text-cyan-400" /></span>
                <span className="win-reward-value">{winner.resources.ink}</span>
                <span className="win-reward-label">Ink</span>
              </div>
              {winner.inventory.relics.length > 0 && (
                <div className="win-reward-card" style={{ animationDelay: '1s' }}>
                  <span className="win-reward-icon"><Key size={20} className="text-gold" /></span>
                  <span className="win-reward-value">{winner.inventory.relics.length}</span>
                  <span className="win-reward-label">Relics</span>
                </div>
              )}
            </motion.div>

            {/* Player rankings */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.4 }}
              className="win-rankings"
            >
              {sorted.map((p, i) => {
                const TokenIcon = TOKENS.find((t) => t.name === p.token)?.icon || User;
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.5 + i * 0.12 }}
                    className={`win-rank-card ${i === 0 ? 'win-rank-first' : 'win-rank-other'}`}
                  >
                    <div className="flex items-center" style={{ gap: isMobile ? '0.5rem' : '1rem' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontStyle: 'italic',
                          opacity: 0.4,
                          fontSize: isMobile ? '1rem' : '1.5rem',
                          minWidth: '2rem',
                        }}
                      >
                        #{i + 1}
                      </span>
                      <div
                        style={{
                          width: isMobile ? 28 : 36,
                          height: isMobile ? 28 : 36,
                          borderRadius: '50%',
                          backgroundColor: p.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          flexShrink: 0,
                        }}
                      >
                        <TokenIcon size={isMobile ? 14 : 18} />
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <p
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontStyle: 'italic',
                            fontSize: isMobile ? '0.9rem' : '1.15rem',
                          }}
                        >
                          {p.name}
                        </p>
                        <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.6 }}>
                          {p.resources.books} Books • {p.resources.arcane} Arcane • {p.resources.fate} Fate
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontStyle: 'italic',
                          fontSize: isMobile ? '1.25rem' : '1.75rem',
                          color: i === 0 ? '#ffd700' : 'inherit',
                        }}
                      >
                        {score(p)}
                      </p>
                      <p style={{ fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.4 }}>
                        Score
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Story recap */}
            {storyHighlights.length > 0 && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 2 }}
                className="win-story-recap"
              >
                <h3 className="win-story-title">📜 Your Epic Journey</h3>
                {storyHighlights.map((entry, i) => (
                  <div key={i} className="win-story-item">
                    {entry}
                  </div>
                ))}
              </motion.div>
            )}

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.3 }}
            >
              <a
                className="win-cta-link"
                href="https://azurasfirepublishing.com/bookboundindiegames"
                target="_blank"
                rel="noopener noreferrer"
              >
              </a>
            </motion.div>

            {/* Play Again */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 2.5, type: 'spring', damping: 12 }}
            >
              <button
                className="win-play-again"
                style={{ fontFamily: 'var(--font-display)' }}
                onClick={onPlayAgain}
              >
                ✨ Begin a New Journey ✨
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WinScreen;
