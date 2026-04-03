import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  Sword,
  Crown,
  Shield,
  Flame,
  Wand2,
  X,
  Plus,
  Scroll as AncientScroll,
} from 'lucide-react';
import { LANGUAGES, LANGUAGE_LABELS, type LanguageCode } from '../i18n';
import './SetupScreen.css';
import { useDevice, useResponsiveFont } from '../MegaOptimization';
import { Tutorial, TutorialStep } from './Tutorial';
import { Fairy } from './Fairy';

export type ColorName = 'brown' | 'cyan' | 'purple' | 'orange' | 'red' | 'yellow' | 'green' | 'navy';
export type TokenName =
  | 'Sword'
  | 'Crystal Orb'
  | 'Ancient Scroll'
  | 'Dragon'
  | 'Wizard Staff'
  | 'Runed Key'
  | 'Crown'
  | 'Shield';

export type CharacterClass = 'Warrior' | 'Mage' | 'Rogue' | 'Cleric' | 'Ranger' | 'Paladin' | 'Bard' | 'Monk';

export interface SetupPlayer {
  name: string;
  color: ColorName;
  token: TokenName;
  language: LanguageCode;
  characterClass: CharacterClass;
  isAI?: boolean;
}

interface SetupScreenProps {
  onStart: (players: SetupPlayer[]) => void;
  primaryPlayerId?: string | null;
  primaryPlayerData?: any;
  musicEnabled: boolean;
  musicVolume: number;
  sfxEnabled: boolean;
  sfxVolume: number;
  onToggleMusic: () => void;
  onToggleSfx: () => void;
  onMusicVolumeChange: (value: number) => void;
  onSfxVolumeChange: (value: number) => void;
}

const MAX_PLAYERS = 8;

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    targetId: 'setup-language-selector',
    title: 'Choose Your Tongue',
    content: 'Select the language of the realm. All scrolls and incantations will adapt to your choice.'
  },
  {
    targetId: 'summon-reader-btn',
    title: 'Summon Reader',
    content: 'Bring forth another traveler to join your quest. Up to 4 souls can share this journey.'
  },
  {
    targetId: 'call-spirit-btn',
    title: 'Call Spirit',
    content: 'Invoke an ethereal companion to challenge you. These spirits possess their own ancient wisdom.'
  },
  {
    targetId: 'player-color-selector-0',
    title: 'Soul Aura',
    content: 'Choose the color of your aura. This will mark your presence upon the sacred board.'
  },
  {
    targetId: 'player-class-selector-0',
    title: 'Character Class',
    content: 'Select your path. Each class brings its own unique essence to the adventure.'
  },
  {
    targetId: 'begin-journey-btn',
    title: 'Begin Your Journey',
    content: 'Once all travelers are prepared, step through the portal and begin your epic tale.'
  }
];

export const SETUP_COLORS: ColorName[] = ['brown', 'cyan', 'purple', 'orange', 'red', 'yellow', 'green', 'navy'];
export const SETUP_TOKENS: TokenName[] = [
  'Sword',
  'Crystal Orb',
  'Ancient Scroll',
  'Dragon',
  'Wizard Staff',
  'Runed Key',
  'Crown',
  'Shield',
];
export const SETUP_LANGUAGES: LanguageCode[] = ['en', 'es', 'fr', 'it', 'ja', 'ko', 'de', 'pt', 'zh', 'ru', 'ar', 'hi', 'tr', 'pl', 'nl', 'th', 'vi', 'id', 'sv'];
export const SETUP_CLASSES: CharacterClass[] = ['Warrior', 'Mage', 'Rogue', 'Cleric', 'Ranger', 'Paladin', 'Bard', 'Monk'];

const TOKENS = [
  { name: 'Sword', icon: Sword },
  { name: 'Crystal Orb', icon: Sparkles },
  { name: 'Ancient Scroll', icon: AncientScroll },
  { name: 'Dragon', icon: Flame },
  { name: 'Wizard Staff', icon: Wand2 },
  { name: 'Runed Key', icon: Sparkles },
  { name: 'Crown', icon: Crown },
  { name: 'Shield', icon: Shield },
];

export const COLOR_MAP: Record<ColorName, string> = {
  brown: '#3d2500',
  cyan: '#0cc0df',
  purple: '#6b1fad',
  orange: '#e35619',
  red: '#bd0000',
  yellow: '#ffd230',
  green: '#007a3f',
  navy: '#0c3470',
};

const colorClassMap: Record<ColorName, string> = {
  brown: 'aura-brown',
  cyan: 'aura-cyan',
  purple: 'aura-purple',
  orange: 'aura-orange',
  red: 'aura-red',
  yellow: 'aura-yellow',
  green: 'aura-green',
  navy: 'aura-navy',
};

export const SetupScreen: React.FC<SetupScreenProps> = ({
  onStart,
  primaryPlayerId,
  primaryPlayerData,
  musicEnabled,
  musicVolume,
  sfxEnabled,
  sfxVolume,
  onToggleMusic,
  onToggleSfx,
  onMusicVolumeChange,
  onSfxVolumeChange,
}) => {
  const { device } = useDevice();
  const responsiveFont = useResponsiveFont(18);
  const [uiLanguage, setUiLanguage] = useState<LanguageCode>('en');
  const [showSettings, setShowSettings] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const tutorialCompleted = localStorage.getItem('bookbound_tutorial_completed');
    if (!tutorialCompleted) {
      // Small delay to ensure elements are rendered
      const timer = setTimeout(() => setShowTutorial(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const completeTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('bookbound_tutorial_completed', 'true');
  };

  const [playerConfigs, setPlayerConfigs] = useState<SetupPlayer[]>(() => {
    if (primaryPlayerId && primaryPlayerData) {
      return [
        {
          name: primaryPlayerId,
          color: primaryPlayerData.color || 'brown',
          token: primaryPlayerData.token || 'Sword',
          language: primaryPlayerData.language || 'en',
          characterClass: primaryPlayerData.class || 'Warrior',
        }
      ];
    }
    return [
      { name: '', color: 'brown', token: 'Sword', language: 'en', characterClass: 'Warrior' },
      { name: '', color: 'cyan', token: 'Crystal Orb', language: 'en', characterClass: 'Mage' },
    ];
  });

  const tx = (key: string): string => LANGUAGES[uiLanguage]?.[key] || LANGUAGES.en[key] || key;

  const addPlayer = () => {
    if (playerConfigs.length < MAX_PLAYERS) {
      setPlayerConfigs([
        ...playerConfigs,
        {
          name: '',
          color: SETUP_COLORS[playerConfigs.length % SETUP_COLORS.length],
          token: SETUP_TOKENS[0],
          language: uiLanguage,
          characterClass: 'Warrior',
        },
      ]);
    }
  };

  const addAIPlayer = () => {
    if (playerConfigs.length < MAX_PLAYERS) {
      const aiCount = playerConfigs.filter(p => p.isAI).length;
      const isLyra = aiCount % 2 === 0;
      
      setPlayerConfigs([
        ...playerConfigs,
        {
          name: isLyra ? 'Lyra' : 'Kael',
          color: isLyra ? 'purple' : 'red',
          token: isLyra ? 'Crystal Orb' : 'Sword',
          language: uiLanguage,
          characterClass: isLyra ? 'Mage' : 'Warrior',
          isAI: true,
        },
      ]);
    }
  };

  const removePlayer = (index: number) => {
    if (playerConfigs.length > 1) {
      setPlayerConfigs(playerConfigs.filter((_, i) => i !== index));
    }
  };

  const updatePlayer = (index: number, updates: Partial<SetupPlayer>) => {
    setPlayerConfigs(playerConfigs.map((p, i) => (i === index ? { ...p, ...updates } : p)));
  };

  const handleStart = () => {
    onStart(playerConfigs);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="setup-screen mystical-bg"
      style={{ fontSize: responsiveFont, padding: device === 'mobile' ? '0.5rem 0.2rem' : device === 'tablet' ? '1.2rem 0.7rem' : '2.25rem 1rem' }}
    >
      <img
        src="https://i.postimg.cc/qtpdnF4P/Fantasy.png"
        alt="Bookbound Welcome"
        className="setup-bg-image"
        referrerPolicy="no-referrer"
      />
      <div className="mist-layer mist-layer-1" />
      <div className="mist-layer mist-layer-2" />
      <div className="sparkle-layer" />
      <div className="vignette" />

      <main
        className="setup-altar"
        style={{ padding: device === 'mobile' ? '0.7rem' : device === 'tablet' ? '1.2rem' : '1.7rem', width: device === 'mobile' ? '100%' : 'min(1100px, 100%)' }}
      >
        <header className="setup-header flex flex-col items-center">
          <img 
            src="https://i.postimg.cc/vHHDLbXP/banner.png" 
            alt="Bookbound Banner" 
            className="h-24 md:h-48 w-auto object-contain mb-4"
            referrerPolicy="no-referrer"
          />
          <Fairy 
            onClick={() => setShowTutorial(true)} 
            className="relative z-[9999] mb-8 scale-125" 
          />
        </header>

        <section className="language-selector">
          <label className="lang-label">Choose Your Tongue</label>
          <div className="tongue-box">
            <select
              id="setup-language-selector"
              value={uiLanguage}
              onChange={(e) => setUiLanguage(e.target.value as LanguageCode)}
              className="lang-select"
              title="Choose your language"
              aria-label="Choose your language"
            >
              {SETUP_LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {LANGUAGE_LABELS[lang]}
                </option>
              ))}
            </select>
          </div>
        </section>

        {playerConfigs.length < MAX_PLAYERS && (
          <div className="flex justify-center gap-4 mb-4">
            <button id="summon-reader-btn" className="primary-btn px-8 py-3 text-lg" onClick={addPlayer}>
              <Plus size={16} />
              {tx('addPlayer')}
            </button>
            <button id="call-spirit-btn" className="primary-btn px-8 py-3 text-lg" onClick={addAIPlayer}>
              <Plus size={16} />
              Call Spirit
            </button>
          </div>
        )}

        <section className="player-grid">
          {playerConfigs.map((player, index) => {
            const TokenIcon = TOKENS.find((t) => t.name === player.token)?.icon || Sword;
            return (
              <article 
                key={index} 
                className={`player-card ${colorClassMap[player.color]} summon-in`}
              >
                <div className="card-glow" />
                <div className="card-top">
                  <div className="token-seal pulse-soft" style={{ color: COLOR_MAP[player.color] }}>
                    <div
                      className="token-seal pulse-soft"
                      style={{ '--token-seal-color': COLOR_MAP[player.color] } as React.CSSProperties}
                    >
                      <TokenIcon size={24} />
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder={tx('namePlaceholder')}
                    value={player.name}
                    onChange={(e) => updatePlayer(index, { name: e.target.value })}
                    className="player-name-input"
                    disabled={player.isAI || (index === 0 && !!primaryPlayerId)}
                  />
                  {player.isAI && <span className="text-xs font-bold text-white/50 ml-2 uppercase tracking-wider">AI</span>}
                  {playerConfigs.length > 1 && (
                    <button onClick={() => removePlayer(index)} className="remove-btn" title="Remove player" aria-label="Remove player">
                      <X size={18} />
                    </button>
                  )}
                </div>

                <label className="field-label">{tx('token')}</label>
                <div className="token-grid">
                  {TOKENS.map((tkn) => (
                    <button
                      key={tkn.name}
                      onClick={() => updatePlayer(index, { token: tkn.name as TokenName })}
                      className={`token-btn ${player.token === tkn.name ? 'token-btn-active' : ''}`}
                      title={tkn.name}
                    >
                      <tkn.icon size={18} />
                    </button>
                  ))}
                </div>

                <label className="field-label">{tx('aura')}</label>
                <div className="color-grid" id={index === 0 ? "player-color-selector-0" : undefined}>
                  {SETUP_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => updatePlayer(index, { color: c })}
                      className={`color-btn ${player.color === c ? 'color-btn-active' : ''}`}
                      style={{ '--color-btn-bg': COLOR_MAP[c] } as React.CSSProperties}
                      title={c}
                    />
                  ))}
                </div>

                <label className="field-label">{tx('class')}</label>
                <div className="character-class-box">
                  <select
                    id={index === 0 ? "player-class-selector-0" : undefined}
                    value={player.characterClass}
                    onChange={(e) => updatePlayer(index, { characterClass: e.target.value as CharacterClass })}
                    className="lang-select"
                    title="Choose player class"
                    aria-label="Choose player class"
                  >
                    {SETUP_CLASSES.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="field-label">{tx('playerLanguage')}</label>
                <div className="tongue-box">
                  <select
                    value={player.language}
                    onChange={(e) => updatePlayer(index, { language: e.target.value as LanguageCode })}
                    className="lang-select"
                    title="Choose player language"
                    aria-label="Choose player language"
                  >
                    {SETUP_LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>
                        {LANGUAGE_LABELS[lang]}
                      </option>
                    ))}
                  </select>
                </div>
              </article>
            );
          })}
        </section>

        <div className="flex justify-center mt-4 mb-8">
          <button id="begin-journey-btn" className="primary-btn enter-book px-8 md:px-16 py-3 md:py-4 text-lg md:text-xl" onClick={handleStart}>
            {tx('start')}
          </button>
        </div>

        <footer className="setup-actions">
        </footer>
      </main>
      
      <Tutorial 
        steps={TUTORIAL_STEPS} 
        isOpen={showTutorial} 
        onComplete={completeTutorial} 
      />

      {showFAQ && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white text-black max-w-md w-full p-6 rounded-2xl">
            <h2 className="text-xl font-bold mb-4">FAQ</h2>

            <div className="space-y-3 text-sm">
              <p>
                <strong>How do I win?</strong>
                <br />
                Complete 10 books.
              </p>
              <p>
                <strong>What do Arcane cards do?</strong>
                <br />
                They provide powerful advantages.
              </p>
              <p>
                <strong>Can I trade?</strong>
                <br />
                Yes, via the marketplace.
              </p>
            </div>

            <button onClick={() => setShowFAQ(false)} className="mt-6 w-full bg-black text-white py-2 rounded-xl">
              Close
            </button>
          </div>
        </div>
      )}

    </motion.div>
  );
};

export default SetupScreen;