/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

// Lucide icons
import {
  Book,
  User,
  Trophy,
  Scroll,
  Shield,
  Flame,
  Zap,
  Crown,
  Map as MapIcon,
  Compass,
  Wand2,
  Key,
  Sparkles,
  Sword,
  X,
  Dices,
Info,
Play,
AlertTriangle,
Bookmark,
Droplet,
PenTool,
BookOpen,
Award,
Handshake,
Settings,
Pause,
Minimize2,
Maximize2,
LogOut,
History as HistoryIcon,
Sparkles as CrystalOrb,
Scroll as AncientScroll,
Flame as Dragon,
Wand2 as WizardStaff,
Key as RunedKey,
} from 'lucide-react';

// Game components
import { SetupScreen, COLOR_MAP, type SetupPlayer } from './components/SetupScreen';
import Marketplace from './components/Marketplace';
import WinScreen from './components/WinScreen';
import SettingsMenu from './components/SettingsMenu';

// i18n
import { type LanguageCode, LANGUAGES } from './i18n';
import { CARD_TX, RELIC_TX, SPACE_TX } from './i18n-content';


/* =========================
   TYPES
========================= */

type AppState = 'setup' | 'playing' | 'finished';

type TurnPhase =
  | 'upkeep'
  | 'ready'
  | 'rolling'
  | 'resolving_space'
  | 'resolving_card'
  | 'choosing_action'
  | 'seer_choosing'
  | 'turn_complete'
  | 'paused'
  | 'finished';

type SpaceType =
  | 'corner'
  | 'property'
  | 'special'
  | 'fate'
  | 'arcane'
  | 'pillar'
  | 'hazard'
  | 'safe'
  | 'portal'
  | 'quest';

type CardType = 'fate' | 'arcane' | 'quest' | 'relic';

type CardEffect =
  | { type: 'gain_books'; amount: number }
  | { type: 'lose_books'; amount: number }
  | { type: 'gain_arcane'; amount: number }
  | { type: 'lose_arcane'; amount: number }
  | { type: 'gain_fate'; amount: number }
  | { type: 'lose_fate'; amount: number }
  | { type: 'gain_ink'; amount: number }
  | { type: 'lose_ink'; amount: number }
  | { type: 'move_steps'; amount: number }
  | { type: 'skip_turns'; amount: number }
  | { type: 'banish'; turns: number }
  | { type: 'ensnare'; turns: number }
  | { type: 'bless'; turns: number }
  | { type: 'curse'; turns: number }
  | { type: 'drain'; turns: number }
  | { type: 'corrupt'; amount: number }
  | { type: 'cleanse' }
  | { type: 'gain_relic'; id: string }
  | { type: 'nothing' };

type Relic = {
  id: string;
  name: string;
  description: string;
  passive?: string;
  active?: {
    cost: Partial<PlayerResources>;
    effect: CardEffect;
  };
  isEasterEgg?: boolean;
  iconName?: string;
};

type Card = {
  id: string;
  title: string;
  description: string;
  effect: CardEffect;
  cost?: Partial<PlayerResources>;
};

type Space = {
  id: number;
  name: string;
  type: SpaceType;
  color?: string;
  prompt?: string;
  description?: string;
  image?: string;
  cost?: Partial<PlayerResources>;
  reward?: Partial<PlayerResources & { books: number }>;
};

type PlayerStatus = {
  banishedTurns: number;
  ensnaredTurns: number;
  skipTurns: number;
  blessedTurns: number;
  cursedTurns: number;
  drainedTurns: number;
  corruption: number;
};

type PlayerResources = {
  books: number;
  arcane: number;
  fate: number;
  ink: number;
};

type PlayerInventory = {
  fateCards: Card[];
  arcaneCards: Card[];
  questCards: Card[];
  relics: Relic[];
  books: string[];
  merch: string[];
};

type Player = {
  id: number;
  name: string;
  color: string;
  language: string;
  token: string;
  characterClass: string;
  position: number;
  completedSpaces: number[];
  ownedSpaces: number[];
  inventory: PlayerInventory;
  resources: PlayerResources;
  status: PlayerStatus;
  isOnline: boolean;
  isAI?: boolean;
  warriorBonusUsed?: boolean;
  stats: {
    arcaneSpacesVisited: number;
    fateCardsDrawn: number;
    lapsCompleted: number;
  };
};

type TradeItem =
  | { type: 'space'; id: number }
  | { type: 'fate_card'; card: Card }
  | { type: 'arcane_card'; card: Card }
  | { type: 'ink'; amount: number };

type Trade = {
  fromPlayerId: number;
  toPlayerId: number;
  offer: TradeItem[];
  request: TradeItem[];
};

type TradeBuilder = {
  toPlayerId: number | null;
  offer: TradeItem[];
  request: TradeItem[];
};

type MarketItem = {
  id: string;
  name: string;
  category: string;
  type: 'card' | 'resource';
  resourceType?: string;
  quantity: number;
  basePrice: number;
  demand: number;
  icon: string;
};

type MarketplaceState = {
  isOpen: boolean;
  lastOpenPhase: TurnPhase;
};

type GameRulesSection = {
  title: string;
  content?: string;
  items?: string[];
};

/* =========================
   CONSTANTS
========================= */

const GRID_SIZE = 11;
const MAX_PLAYERS = 8;
const WINNING_BOOKS = 10;

const GENRES = [
  {
    id: 'fantasy',
    name: 'Fantasy',
    icon: Wand2,
    color: '#c5a059',
    description: 'Dragons, magic, and ancient prophecies.',
  },
];

const TOKENS = [
  { name: 'Sword', icon: Sword },
  { name: 'Crystal Orb', icon: CrystalOrb },
  { name: 'Ancient Scroll', icon: AncientScroll },
  { name: 'Dragon', icon: Dragon },
  { name: 'Wizard Staff', icon: WizardStaff },
  { name: 'Runed Key', icon: RunedKey },
  { name: 'Crown', icon: Crown },
  { name: 'Shield', icon: Shield },
];

const GAME_RULES: GameRulesSection[] = [
  {
    title: 'Objective',
    content:
      'Travel the board, complete story spaces, survive magical hazards, gather power, and be the first reader to reach 10 Books.',
  },
  {
    title: 'Turn Structure',
    items: [
      'Roll the die and move forward.',
      'Resolve the space you land on.',
      'If you draw a card, its effect is applied when you confirm it.',
      'Then end your turn.',
    ],
  },
  {
    title: 'Statuses',
    items: [
      'Banished: lose turns while exiled.',
      'Ensnared: lose turns while trapped.',
      'Blessed: gain bonuses from magical events.',
      'Cursed: suffer penalties from magical events.',
    ],
  },
  {
    title: 'Winning',
    content: `The first player to reach ${WINNING_BOOKS} Books wins the journey.`,
  },
];

const RELICS: Relic[] = [
  { id: 'r1', name: 'Inkwell of Eternity', description: 'Gain 1 Ink at the start of every turn.', passive: 'Start of turn: +1 Ink' },
  { id: 'r2', name: 'Eye of the Seer', description: 'You can see the top card of the Fate deck.', passive: 'Fate Insight' },
  { id: 'r3', name: 'Arcane Battery', description: 'Store up to 5 extra Arcane Power.', passive: 'Max Arcane +5' },
  { id: 'r4', name: 'Fate-Twister Ring', description: 'Spend 2 Fate to re-roll any die.', active: { cost: { fate: 2 }, effect: { type: 'nothing' } } },
  { id: 'r5', name: 'Shield of Lore', description: 'Prevents the next 3 points of Corruption.', passive: 'Corruption Shield' },
  { id: 'e1', name: 'The Gilded Bookmark', description: 'A legendary bookmark found hidden in an ancient tome.', isEasterEgg: true, iconName: 'bookmark' },
  { id: 'e2', name: 'The Whispering Quill', description: 'A quill that seems to write its own stories.', isEasterEgg: true, iconName: 'quill' },
  { id: 'e3', name: 'The Midnight Ink', description: 'Ink that glows with a faint, ethereal light.', isEasterEgg: true, iconName: 'ink' },
  { id: 'e4', name: 'The Forgotten Chapter', description: 'A chapter from a book that was never supposed to be read.', isEasterEgg: true, iconName: 'chapter' },
  { id: 'e5', name: "The Author's Seal", description: 'The personal seal of the Great Architect of Stories.', isEasterEgg: true, iconName: 'seal' },
];

const FATE_CARDS: Card[] = [
  { id: 'f1', title: 'Lucky Find', description: 'You find a lost pouch. Gain 2 Ink and 1 Fate.', effect: { type: 'gain_ink', amount: 2 } },
  { id: 'f2', title: 'Cruel Omen', description: 'A dark prophecy slows your climb. Lose 1 Book.', effect: { type: 'lose_books', amount: 1 } },
  { id: 'f3', title: 'Twist of Destiny', description: 'Leap ahead 3 spaces.', effect: { type: 'move_steps', amount: 3 } },
  { id: 'f4', title: 'Frayed Path', description: 'Skip your next turn.', effect: { type: 'skip_turns', amount: 1 } },
  { id: 'f5', title: 'Blessed Passage', description: 'You are Blessed for 3 turns.', effect: { type: 'bless', turns: 3 } },
  { id: 'f6', title: 'Shadow Mark', description: 'You are Cursed for 3 turns.', effect: { type: 'curse', turns: 3 } },
  { id: 'f7', title: 'Winds of Change', description: 'Move forward 4 spaces.', effect: { type: 'move_steps', amount: 4 } },
  { id: 'f8', title: 'Sudden Eclipse', description: 'Lose 2 Arcane Power.', effect: { type: 'lose_arcane', amount: 2 } },
  { id: 'f9', title: 'Serendipity', description: 'Gain 2 Fate Tokens.', effect: { type: 'gain_fate', amount: 2 } },
  { id: 'f10', title: 'The Void Calls', description: 'Lose 1 Fate and 1 Arcane.', effect: { type: 'lose_fate', amount: 1 } },
  { id: 'f11', title: 'Ancient Relic', description: 'You discover a dusty artifact.', effect: { type: 'gain_relic', id: 'r1' } },
  { id: 'q2', title: 'Fate\'s Messenger', description: 'Draw 3 Fate cards.', effect: { type: 'gain_books', amount: 2 } },
  { id: 'q4', title: 'World Traveler', description: 'Complete a full lap of the board.', effect: { type: 'gain_books', amount: 2 } },
];

const ARCANE_TRIALS: Card[] = [
  { id: 'a1', title: 'Arcane Insight', description: 'Gain 3 Arcane Power.', effect: { type: 'gain_arcane', amount: 3 } },
  { id: 'a2', title: 'Mana Surge', description: 'Gain 1 Fate and 2 Arcane.', effect: { type: 'gain_fate', amount: 1 } },
  { id: 'a3', title: 'Unstable Portal', description: 'Move forward 5 spaces.', effect: { type: 'move_steps', amount: 5 } },
  { id: 'a4', title: 'Mystic Snare', description: 'Ensnared! Skip your next 2 turns.', effect: { type: 'ensnare', turns: 2 } },
  { id: 'a5', title: 'Exile Sigil', description: 'Banished! Skip your next turn.', effect: { type: 'banish', turns: 1 } },
  { id: 'a6', title: 'Spellwoven Reward', description: 'Gain 1 Book.', effect: { type: 'gain_books', amount: 1 } },
  { id: 'a7', title: 'Dark Pact', description: 'Gain 2 Books but gain 4 Corruption.', effect: { type: 'corrupt', amount: 4 } },
  { id: 'a8', title: 'Forbidden Knowledge', description: 'Gain 5 Arcane but you are Drained for 3 turns.', effect: { type: 'drain', turns: 3 } },
  { id: 'a9', title: 'Teleportation', description: 'Move forward 6 spaces.', effect: { type: 'move_steps', amount: 6 } },
  { id: 'a10', title: 'Arcane Shield', description: 'Heal all negative statuses.', effect: { type: 'cleanse' } },
  { id: 'a11', title: 'Ink Transmutation', description: 'Convert 2 Arcane into 5 Ink.', effect: { type: 'gain_ink', amount: 5 }, cost: { arcane: 2 } },
  { id: 'q1', title: 'The Scholar\'s Path', description: 'Visit 3 Arcane spaces.', effect: { type: 'gain_books', amount: 2 } },
  { id: 'q3', title: 'Arcane Master', description: 'Reach 10 Arcane Power.', effect: { type: 'gain_books', amount: 3 } },
];

const BOARD_SPACES: Space[] = [
  { id: 0, name: 'Begin Your Journey', type: 'corner', description: 'Begin the Journey. Gain 1 Fate and 1 Arcane.', image: 'https://i.postimg.cc/hGx9Ld9z/Begin.png' },
  { id: 1, name: 'Call of Adventure', type: 'property', color: 'brown', prompt: 'Risk Everything or Let it Consume You.', description: 'Fires Within by Jezza Deep', image: 'https://i.postimg.cc/yx64Lvq1/Fires-Within.png', cost: { ink: 2 }, reward: { books: 1 } },
  { id: 2, name: 'Fate', type: 'fate', description: 'Draw a Fate card.', image: 'https://i.postimg.cc/N0T16H16/Fate.png' },
  { id: 3, name: 'Humble Beginnings', type: 'property', color: 'brown', prompt: 'To know love one must know pain.', description: 'The Healing Touch by Zofia von Huck', image: 'https://i.postimg.cc/HnWD6BGp/The_Healing_Touch.png', cost: { ink: 2 }, reward: { books: 1 } },
  { id: 4, name: 'MAGICAL COST', type: 'hazard', description: 'Mana Drain: Lose 1 Arcane and 1 Book.' },
  { id: 5, name: 'EPIC QUEST', type: 'pillar', prompt: 'Read a journey that determines the fate of the world.', description: 'Some journeys shape legends.', image: 'https://i.postimg.cc/0Qs7cyfM/Epic_Quest.png', cost: { arcane: 3, fate: 3 }, reward: { books: 2 } },
  { id: 6, name: 'Hidden Power', type: 'property', color: 'cyan', prompt: 'Discover the key. Open the portal.', description: 'The Dream Haunters by Megan Mary', image: 'https://i.postimg.cc/mkZfm8xT/The-Dream-Hunters.png', cost: { ink: 3 }, reward: { books: 1 } },
  { id: 7, name: 'Arcane', type: 'arcane', description: 'Draw an Arcane card.', image: 'https://i.postimg.cc/43tz69zz/Arcane.png' },
  { id: 8, name: 'Spellbound Beginnings', type: 'property', color: 'cyan', prompt: 'Can one girl save the world?', description: 'A Lesson in Magic by Amanda Huxley', image: 'https://i.postimg.cc/C5MTcmy0/A-Lesson-in-Magic.png', cost: { ink: 3 }, reward: { books: 1 } },
  { id: 9, name: 'First Spell', type: 'property', color: 'cyan', prompt: 'Jax navigates teenage life to protect Cassie.', description: 'Forgotten Memories by Cecilia Agetun', image: 'https://i.postimg.cc/prVbsqNV/Forgotten-Memories.png', cost: { ink: 3 }, reward: { books: 1 } },
  { id: 10, name: 'ENSNARED', type: 'corner', description: 'Ensnared! Skip your next 2 turns.', image: 'https://i.postimg.cc/XvFwfCwy/Ensnared.png' },
  { id: 11, name: 'Ancient Prophecy', type: 'property', color: 'purple', prompt: 'Before the prophecy. Before the end.', description: 'Before the End by Jennifer Carter', image: 'https://i.postimg.cc/XJkcVgrV/Before_the_End.png', cost: { ink: 4 }, reward: { books: 1 } },
  { id: 12, name: 'Blood of the Gods', type: 'property', color: 'purple', prompt: 'She is the one thing the gods forgot to fear.', description: 'The Spiralbound Saga by JJ Cruz', image: 'https://i.postimg.cc/Kz2DSW8k/The_Spiral_bound_Saga.png', cost: { ink: 4 }, reward: { books: 1 } },
  { id: 13, name: 'Arcane', type: 'arcane', description: 'Draw an Arcane card.', image: 'https://i.postimg.cc/43tz69zz/Arcane.png' },
  { id: 14, name: 'Old Relics of Power', type: 'property', color: 'purple', prompt: 'Will Ian turn against the Hunters Guild?', description: 'Bound by Fate and Blood by Jenna OMalley', image: 'https://i.postimg.cc/Tw6JMs35/Boundof_Fate_and_Blood.png', cost: { ink: 4 }, reward: { books: 1 } },
  { id: 15, name: 'MAGIC & MYTH', type: 'pillar', prompt: 'A fantasy rooted in magic and ancient lore.', description: 'Every spell carries a story.', image: 'https://i.postimg.cc/V68XDkRd/Magic_Myth.png', cost: { arcane: 4, fate: 2 }, reward: { books: 2 } },
  { id: 16, name: 'Roads Untraveled', type: 'property', color: 'orange', prompt: 'An unlikely trio must find the princess.', description: 'Prophecies and Expectations by Josephine Carnes', image: 'https://i.postimg.cc/Tw6JMs3d/P_E.png', cost: { ink: 5 }, reward: { books: 1 } },
  { id: 17, name: 'Found Family', type: 'property', color: 'orange', prompt: 'Will she fight for the dust and crown?', description: 'Dust and Crown by Havelah McLat', image: 'https://i.postimg.cc/ydDjTRxd/Dust_Crown.png', cost: { ink: 5 }, reward: { books: 1 } },
  { id: 18, name: 'Fate', type: 'fate', description: 'Draw a Fate card.', image: 'https://i.postimg.cc/N0T16H16/Fate.png' },
  { id: 19, name: 'Trials on the Road', type: 'property', color: 'orange', prompt: 'The existence of tequila is at stake. Oh, and humanity too..', description: 'The Flaws of Gravity by Stephanie Caye', image: 'https://i.postimg.cc/3Rk1ZGNx/Flaws.png', cost: { ink: 5 }, reward: { books: 1 } },
  { id: 20, name: 'SANCTUARY', type: 'corner', description: 'Rest and reflection. Gain 2 Fate and heal all negative statuses.', image: 'https://i.postimg.cc/VNMjqCjt/Sanctuary.png' },
  { id: 21, name: 'Kingdoms at War', type: 'property', color: 'red', prompt: 'You feel the lie before you hear it.', description: 'Nanagin, Ravliean by H C Kilgour', image: 'https://i.postimg.cc/ydDjTRxY/Nanagin.png', cost: { ink: 6 }, reward: { books: 1 } },
  { id: 22, name: 'Arcane', type: 'arcane', description: 'Draw an Arcane card.', image: 'https://i.postimg.cc/43tz69zz/Arcane.png' },
  { id: 23, name: 'Moral Shadows', type: 'property', color: 'red', prompt: 'Survival is a choice.', description: 'Poisoned Pawn by K. L. Vincent', image: 'https://i.postimg.cc/LXJDVP5H/Poisoned_Pawn.png', cost: { ink: 6 }, reward: { books: 1 } },
  { id: 24, name: 'Cost of Victory', type: 'property', color: 'red', prompt: 'A journey that tests your morality and loyalty.', description: 'The Young Foreigner by V. Ananya', image: 'https://i.postimg.cc/4dYP1cyf/Young_Foreigner.png', cost: { ink: 6 }, reward: { books: 1 } },
  { id: 25, name: 'POWER & WAR', type: 'pillar', prompt: 'A fantasy driven by power struggles.', description: 'Crowns rise. Kingdoms fall.', image: 'https://i.postimg.cc/pTHKqLZ9/war_power.png', cost: { arcane: 5, fate: 1 }, reward: { books: 2 } },
  { id: 26, name: 'Courts & Crowns', type: 'property', color: 'yellow', prompt: 'Can she put an end to the fires of war?', description: 'Queen of Dark Fire by Mia Herald Hill', image: 'https://i.postimg.cc/26D7RtS1/Queen_of_Dark_Fire.png', cost: { ink: 7 }, reward: { books: 1 } },
  { id: 27, name: 'Dangerous Alliances', type: 'property', color: 'yellow', prompt: 'The brighter the light, the deeper the shadow.', description: 'Darkness Calls Softly by Cassie McDonald', image: 'https://i.postimg.cc/Tw6JMs3y/Darkness_Calls_Softly.png', cost: { ink: 7 }, reward: { books: 1 } },
  { id: 28, name: 'Fate', type: 'fate', description: 'Draw a Fate card.', image: 'https://i.postimg.cc/N0T16H16/Fate.png' },
  { id: 29, name: 'Betrayal at Court', type: 'property', color: 'yellow', prompt: 'A truth that will ruin it all.', description: 'City of Dust and Blood by S.J. Reid', image: 'https://i.postimg.cc/JnL5VFz0/City_of_Dust_and_Blood.png', cost: { ink: 7 }, reward: { books: 1 } },
  { id: 30, name: 'BANISHED', type: 'corner', description: 'Banished! Move to Ensnared and skip your next turn.', image: 'https://i.postimg.cc/KYLnPMn3/Banished.png' },
  { id: 31, name: 'Wild Magic', type: 'property', color: 'green', prompt: 'Fates collide in this gripping tale full of magic, love, and murder..', description: 'Letters in the Attic by Meredith Lindsey', image: 'https://i.postimg.cc/6Qpf9PsX/Letters-in-the-Attic.png', cost: { ink: 8 }, reward: { books: 2 } },
  { id: 32, name: 'Creatures of Legend', type: 'property', color: 'green', prompt: 'A 500-year-old vampiric detective.', description: 'Obsidian Murders by Nicole Brona', image: 'https://i.postimg.cc/j2pJrwRg/OMurders.png', cost: { ink: 8 }, reward: { books: 1 } },
  { id: 33, name: 'Fate', type: 'fate', description: 'Draw a Fate card.', image: 'https://i.postimg.cc/N0T16H16/Fate.png' },
  { id: 34, name: 'Balance Restored', type: 'property', color: 'green', prompt: 'May The Dawn Never Die!', description: "The Last Druid's Reckoning by Safinaz Dreamweaver", image: 'https://i.postimg.cc/x8wbSJ9s/Last_Druid.png', cost: { ink: 5 }, reward: { books: 1 } },
  { id: 35, name: 'REALMS & WORLDS', type: 'pillar', prompt: 'A fantasy defined by rich worldbuilding.', description: 'The world is the story.', image: 'https://i.postimg.cc/KYLnPMn7/realm_worlds.png', cost: { arcane: 2, fate: 5 }, reward: { books: 2 } },
  { id: 36, name: 'Arcane', type: 'arcane', description: 'Draw an Arcane card.', image: 'https://i.postimg.cc/43tz69zz/Arcane.png' },
  { id: 37, name: 'Portals & Planes', type: 'property', color: 'darkblue', prompt: "Can a girl from Earth save a world that's not her own?", description: 'Quest of the Stone Book 1 Ranger Chronicles by AJ Ashton', image: 'https://i.postimg.cc/cCp8NgdX/Quest_Stone.png', cost: { ink: 10 }, reward: { books: 2 } },
  { id: 38, name: 'Magical Cost', type: 'portal', description: 'Lose 1 Fate and 2 Ink.' },
  { id: 39, name: 'The Final Convergence', type: 'property', color: 'darkblue', prompt: 'The future of a dying race.', description: 'Remnants of a Scarlet Flame by Cindy L Sell', image: 'https://i.postimg.cc/1XkNZnyH/Remnants_OSF.png', cost: { ink: 10 }, reward: { books: 2 } },
];



const MARKET_ITEMS: MarketItem[] = [
  { id: 'm_books', name: 'Books', category: 'resource', type: 'resource', resourceType: 'books', quantity: 999, basePrice: 2, demand: 1, icon: '📘' },
  { id: 'm_arcane', name: 'Arcane', category: 'resource', type: 'resource', resourceType: 'arcane', quantity: 999, basePrice: 3, demand: 1, icon: '🪄' },
  { id: 'm_fate', name: 'Fate', category: 'resource', type: 'resource', resourceType: 'fate', quantity: 999, basePrice: 4, demand: 1, icon: '✨' },
  { id: 'm_ink', name: 'Ink', category: 'resource', type: 'resource', resourceType: 'ink', quantity: 999, basePrice: 3, demand: 1, icon: '🖋️' },
  { id: 'm_fateCard', name: 'Fate Card', category: 'fate', type: 'card', quantity: 30, basePrice: 5, demand: 1, icon: '📜' },
  { id: 'm_arcaneCard', name: 'Arcane Card', category: 'arcane', type: 'card', quantity: 25, basePrice: 6, demand: 1, icon: '🔮' },
];

const dynamicPrice = (item: MarketItem) => {
  const factor = Math.max(0.5, Math.min(2.2, 1 + (item.demand - 1) * 0.25));
  return Math.max(1, Math.ceil(item.basePrice * factor));
};

const clampMinZero = (value: number) => Math.max(0, value);

const shuffle = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const getSpacePosition = (index: number) => {
  if (index <= 10) return { row: 10, col: 10 - index };
  if (index <= 20) return { row: 20 - index, col: 0 };
  if (index <= 30) return { row: 0, col: index - 20 };
  if (index <= 40) return { row: index - 30, col: 10 };
  return { row: 5, col: 5 };
};

const updatePlayerByIndex = (
  players: Player[],
  index: number,
  updater: (player: Player) => Player
) => players.map((p, i) => (i === index ? updater(p) : p));

const getStatusLabel = (player: Player) => {
  const labels: string[] = [];
  if (player.status.banishedTurns > 0) labels.push(`Banished ${player.status.banishedTurns}`);
  if (player.status.ensnaredTurns > 0) labels.push(`Ensnared ${player.status.ensnaredTurns}`);
  if (player.status.skipTurns > 0) labels.push(`Skip ${player.status.skipTurns}`);
  if (player.status.blessedTurns > 0) labels.push(`Blessed ${player.status.blessedTurns}`);
  if (player.status.cursedTurns > 0) labels.push(`Cursed ${player.status.cursedTurns}`);
  return labels.join(' • ');
};

function LapCelebration({ player }: { player: Player; key?: React.Key }) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, y: 50 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0, opacity: 0, y: -50 }}
      className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none"
    >
      <div className="bg-red-600 text-white p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl border-4 border-white flex flex-col items-center gap-4">
        <Sparkles size={48} className="text-yellow-300 animate-pulse" />
        <h2 className="text-4xl md:text-6xl font-display italic font-black">LAP COMPLETE!</h2>
        <div className="text-xl md:text-2xl font-bold opacity-80">
          {player.name} collected 2 Books!
        </div>
      </div>
    </motion.div>
  );
}

function Dice3D({ value, isRolling }: { value: number | null; isRolling: boolean }) {
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    if (isRolling) {
      const interval = setInterval(() => {
        setRotation({
          x: Math.floor(Math.random() * 360),
          y: Math.floor(Math.random() * 360),
          z: Math.floor(Math.random() * 360),
        });
      }, 100);
      return () => clearInterval(interval);
    }

    if (value) {
      const faceValue = ((value - 1) % 6) + 1;
      const faceRotations: Record<number, { x: number; y: number }> = {
        1: { x: 0, y: 0 },
        2: { x: 0, y: -90 },
        3: { x: 0, y: -180 },
        4: { x: 0, y: 90 },
        5: { x: -90, y: 0 },
        6: { x: 90, y: 0 },
      };
      const { x, y } = faceRotations[faceValue] || faceRotations[1];
      setRotation({ x, y, z: 0 });
    }
  }, [isRolling, value]);

  return (
    <div className="flex flex-col items-center">
      <div className={`dice-container ${isRolling ? 'dice-rolling' : ''}`}>
        <div
          className="dice"
          style={{
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg)`,
          }}
        >
          <div className="dice-face face-1">
            <div className="dot dot-cc"></div>
          </div>
          <div className="dice-face face-2">
            <div className="dot dot-tl"></div>
            <div className="dot dot-br"></div>
          </div>
          <div className="dice-face face-3">
            <div className="dot dot-tl"></div>
            <div className="dot dot-cc"></div>
            <div className="dot dot-br"></div>
          </div>
          <div className="dice-face face-4">
            <div className="dot dot-tl"></div>
            <div className="dot dot-tr"></div>
            <div className="dot dot-bl"></div>
            <div className="dot dot-br"></div>
          </div>
          <div className="dice-face face-5">
            <div className="dot dot-tl"></div>
            <div className="dot dot-tr"></div>
            <div className="dot dot-cc"></div>
            <div className="dot dot-bl"></div>
            <div className="dot dot-br"></div>
          </div>
          <div className="dice-face face-6">
            <div className="dot dot-tl"></div>
            <div className="dot dot-tr"></div>
            <div className="dot dot-ml"></div>
            <div className="dot dot-mr"></div>
            <div className="dot dot-bl"></div>
            <div className="dot dot-br"></div>
          </div>
        </div>
      </div>
      <div className={`dice-shadow ${isRolling ? 'dice-rolling-shadow' : ''}`} />
    </div>
  );
}

function IntroScreen({ onBegin, onLoad, hasSave, playSound }: { onBegin: () => void; onLoad: () => void; hasSave: boolean; playSound: (e: any) => void; key?: React.Key }) {
  console.log('IntroScreen rendering', { hasSave });
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex flex-col items-center justify-end pb-24 bg-ink overflow-hidden"
    >
      {/* Background Image with Zoom Animation */}
      <motion.div
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 10, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
        className="absolute inset-0 z-0"
      >
        <img
          src="https://i.postimg.cc/qqtpyHLV/FBBcover.png"
          alt="Fantasy Background"
          className="w-full h-full object-cover opacity-40"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/20 via-transparent to-ink" />
      </motion.div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{
              x: Math.random() * 100 + '%',
              y: Math.random() * 100 + '%',
              opacity: Math.random() * 0.5,
            }}
            animate={{
              y: [null, '-20px', '20px'],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute w-1 h-1 bg-gold rounded-full blur-[1px]"
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 flex flex-col gap-4">
        <motion.button
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ delay: 1, duration: 0.8 }}
          onClick={() => {
            console.log('Intro button clicked');
            onBegin();
          }}
          className="group relative px-12 py-6 bg-gold text-ink rounded-3xl font-display text-3xl italic overflow-hidden shadow-2xl hover:bg-white transition-all duration-500"
        >
          <span className="relative z-10">Start your Journey</span>
          <motion.div 
            className="absolute inset-0 bg-white/10"
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.6 }}
          />
        </motion.button>

        {hasSave && (
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            onClick={onLoad}
            className="group relative px-10 py-4 bg-white/10 text-white border border-white/20 rounded-2xl font-display text-xl italic overflow-hidden shadow-xl hover:bg-white/20 transition-all duration-500"
          >
           <span className="relative z-10 flex items-center justify-center gap-2">
  <HistoryIcon size={20} />
  Continue Journey
</span>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}



/* =========================
   APP
========================= */

export default function App() {
  console.log('App component rendering');
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const handleInteraction = () => {
      setHasInteracted(true);
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);
    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, []);
  const [appState, setAppState] = useState<AppState>('setup');
  const [showIntro, setShowIntro] = useState(true);
  const [turnPhase, setTurnPhase] = useState<TurnPhase>('ready');
  const [selectedGenre] = useState(GENRES[0]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [rollMultiplier] = useState(1);
  const [showLapCelebration, setShowLapCelebration] = useState(false);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [lastGlobalRoll, setLastGlobalRoll] = useState<number | null>(null);
  const fateDeckRef = React.useRef<Card[]>([]);
  const arcaneDeckRef = React.useRef<Card[]>([]);
  const lastFateCardId = React.useRef<string | null>(null);
  const lastArcaneCardId = React.useRef<string | null>(null);
  const [activeSpace, setActiveSpace] = useState<Space | null>(null);
  const [activeCard, setActiveCard] = useState<{ card: Card; type: CardType } | null>(null);
  const [logs, setLogs] = useState<string[]>([
    'Welcome to Bookbound: Indie Fantasy Edition. Begin your journey.',
  ]);
  const [zoom, setZoom] = useState(1);
  const [showTrade, setShowTrade] = useState(false);
  const [pendingTrade, setPendingTrade] = useState<Trade | null>(null);
  const [tradeBuilder, setTradeBuilder] = useState<TradeBuilder>({
    toPlayerId: null,
    offer: [],
    request: [],
  });
  const [hasTradedThisTurn, setHasTradedThisTurn] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  
  // Load settings from localStorage
  const [musicEnabled, setMusicEnabled] = useState(() => {
    const saved = localStorage.getItem('bookbound_music_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [musicVolume, setMusicVolume] = useState(() => {
    const saved = localStorage.getItem('bookbound_music_volume');
    return saved !== null ? JSON.parse(saved) : 0.5;
  });
  const [sfxEnabled, setSfxEnabled] = useState(() => {
    const saved = localStorage.getItem('bookbound_sfx_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [sfxVolume, setSfxVolume] = useState(() => {
    const saved = localStorage.getItem('bookbound_sfx_volume');
    return saved !== null ? JSON.parse(saved) : 0.5;
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('bookbound_notifications_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('bookbound_language');
    return (saved as LanguageCode) || 'en';
  });

  const saveGame = () => {
    const gameState = {
      players,
      currentPlayerIndex,
      logs,
      marketItemsState,
      musicEnabled,
      musicVolume,
      sfxEnabled,
      sfxVolume,
      notificationsEnabled,
      currentLanguage,
    };
    localStorage.setItem('bookbound_save', JSON.stringify(gameState));
    addLog('Game saved successfully.');
  };

  const loadGame = () => {
    const saved = localStorage.getItem('bookbound_save');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        setPlayers(state.players);
        setCurrentPlayerIndex(state.currentPlayerIndex);
        setLogs(state.logs);
        setMarketItemsState(state.marketItemsState);
        setMusicEnabled(state.musicEnabled);
        setMusicVolume(state.musicVolume);
        setSfxEnabled(state.sfxEnabled);
        setSfxVolume(state.sfxVolume);
        setNotificationsEnabled(state.notificationsEnabled);
        setCurrentLanguage(state.currentLanguage);
        setShowIntro(false);
        setAppState('playing');
        addLog('Game loaded successfully.');
      } catch (e) {
        console.error('Failed to load game', e);
        addLog('Failed to load game.');
      }
    }
  };
  const [customSoundUrls, setCustomSoundUrls] = useState<Record<string, string>>(() => {
    const defaults = {
      intro: 'https://moonspinepress5.edgeone.app/intro.mp3',
      setup: 'https://moonspinepress6.edgeone.app/setup.mp3',
      playing: 'https://moonspinepress.edgeone.app/playing.mp3',
      roll: 'https://moonspinepress2.edgeone.app/roll.mp3',
      buy: 'https://moonspinepress8.edgeone.app/buy.mp3',
      sell: 'https://moonspinepress4.edgeone.app/sell.mp3',
      trade: 'https://moonspinepress9.edgeone.app/trade.mp3',
      error: 'https://moonspinepress7.edgeone.app/error.mp3',
      milestone: 'https://moonspinepress3.edgeone.app/milestone.mp3'
    };
    localStorage.removeItem('bookbound_custom_sounds');
    return defaults;
  });

  const bgMusicRef = React.useRef<HTMLAudioElement | null>(null);

  // Background Music Management
  useEffect(() => {
    console.log('Music effect triggered', { musicEnabled, hasInteracted, showIntro, appState });
    if (!musicEnabled || !hasInteracted) {
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
      }
      return;
    }

    let musicUrl = '';
    
    if (showIntro) {
      musicUrl = customSoundUrls.intro;
    } else if (appState === 'setup') {
      musicUrl = customSoundUrls.setup;
    } else if (appState === 'playing') {
      musicUrl = customSoundUrls.playing;
    }

    console.log('Music URL:', musicUrl);
    if (!musicUrl) return;

    if (bgMusicRef.current) {
      bgMusicRef.current.pause();
      bgMusicRef.current = null;
    }

    bgMusicRef.current = new Audio(musicUrl);
    bgMusicRef.current.loop = true;
    bgMusicRef.current.volume = appState === 'playing' ? musicVolume * 0.4 : musicVolume;
    
    const playPromise = bgMusicRef.current.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.warn("Music playback failed:", error);
      });
    }

    return () => {
      // No-op to keep music playing across transitions
    };
  }, [showIntro, appState, musicEnabled, customSoundUrls.intro, customSoundUrls.setup, customSoundUrls.playing, musicVolume, hasInteracted]);

  // Persist settings to localStorage
  useEffect(() => {
    localStorage.setItem('bookbound_music_enabled', JSON.stringify(musicEnabled));
  }, [musicEnabled]);

  useEffect(() => {
    localStorage.setItem('bookbound_music_volume', JSON.stringify(musicVolume));
  }, [musicVolume]);

  useEffect(() => {
    localStorage.setItem('bookbound_sfx_enabled', JSON.stringify(sfxEnabled));
  }, [sfxEnabled]);

  useEffect(() => {
    localStorage.setItem('bookbound_sfx_volume', JSON.stringify(sfxVolume));
  }, [sfxVolume]);

  useEffect(() => {
    localStorage.setItem('bookbound_language', currentLanguage);
  }, [currentLanguage]);

  useEffect(() => {
    localStorage.setItem('bookbound_custom_sounds', JSON.stringify(customSoundUrls));
  }, [customSoundUrls]);

  const [marketplace, setMarketplace] = useState<MarketplaceState>({ isOpen: false, lastOpenPhase: 'ready' });
  const [marketItemsState, setMarketItemsState] = useState<MarketItem[]>(MARKET_ITEMS);
  const [selectedMarketItem, setSelectedMarketItem] = useState<MarketItem | null>(null);
  const [marketNotification, setMarketNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const [pendingWinnerId, setPendingWinnerId] = useState<number | null>(null);
  const [seerCards, setSeerCards] = useState<Card[]>([]);

  const currentPlayer = players[currentPlayerIndex] || null;
  const isRolling = turnPhase === 'rolling';
  const isPaused = turnPhase === 'paused';
  const isMyTurn = true;
  const isSkipped = currentPlayer?.status.skipTurns > 0 || 
                    currentPlayer?.status.banishedTurns > 0 || 
                    currentPlayer?.status.ensnaredTurns > 0;

  const addLog = (msg: string) => {
    setLogs((prev) => [msg, ...prev].slice(0, 60));
  };

  const flashMarket = (type: 'success' | 'error' | 'info', message: string) => {
    setMarketNotification({ type, message });
    setTimeout(() => setMarketNotification(null), 2200);
  };

  // Removed getDirectUrl function as it is no longer needed.

  const audioRefs = React.useRef<Record<string, HTMLAudioElement>>({});

  const playSound = (event: 'roll' | 'buy' | 'sell' | 'trade' | 'error' | 'milestone') => {
    console.log(`Attempting to play sound: ${event}`);
    if (!window.Audio || !sfxEnabled || !hasInteracted) return;
    
    const urlMap: Record<typeof event, string> = {
      roll: customSoundUrls.roll || '',
      buy: customSoundUrls.buy || '',
      sell: customSoundUrls.sell || '',
      trade: customSoundUrls.trade || '',
      error: customSoundUrls.error || '',
      milestone: customSoundUrls.milestone || '',
    };
    
    const finalUrl = urlMap[event];
    if (!finalUrl) return;

    if (!audioRefs.current[event]) {
      audioRefs.current[event] = new Audio(finalUrl);
    }
    
    const audio = audioRefs.current[event];
    audio.volume = sfxVolume;
    audio.currentTime = 0; // Reset to start
    audio.play().catch((err) => {
      console.warn(`SFX Playback failed for ${event}:`, err);
    });
  };

  const canOpenMarketplace = () => {
    return turnPhase === 'choosing_action' || turnPhase === 'ready' || turnPhase === 'turn_complete';
  };

  const checkWinner = (player: Player) => {
    if (player.resources.books >= WINNING_BOOKS) {
      setPendingWinnerId(player.id);
      setTurnPhase('finished');
      setAppState('finished');
      confetti({
        particleCount: 180,
        spread: 80,
        origin: { y: 0.65 },
      });
      addLog(`${player.name} has completed the journey and won the game!`);
      return true;
    }
    return false;
  };

  const checkQuests = (player: Player) => {
    if (player.inventory.questCards.length === 0) return player;

    let updatedPlayer = { ...player };
    let completedAny = false;

    const remainingQuests = player.inventory.questCards.filter(quest => {
      let isCompleted = false;
      const questTitle = CARD_TX[currentLanguage]?.[quest.id]?.title || quest.title;
      
      // Check completion conditions based on quest ID
      switch (quest.id) {
        case 'q1': // The Scholar's Path: Visit 3 Arcane spaces
          isCompleted = player.stats.arcaneSpacesVisited >= 3;
          break;
        case 'q2': // Fate's Messenger: Draw 3 Fate cards
          isCompleted = player.stats.fateCardsDrawn >= 3;
          break;
        case 'q3': // Arcane Master: Reach 10 Arcane Power
          isCompleted = player.resources.arcane >= 10;
          break;
        case 'q4': // World Traveler: Complete a full lap
          isCompleted = player.stats.lapsCompleted >= 1;
          break;
      }

      if (isCompleted) {
        completedAny = true;
        addLog(`Quest Completed! ${player.name} finished "${questTitle}".`);
        
        // Apply reward
        if (quest.effect.type === 'gain_books') {
          updatedPlayer.resources.books += quest.effect.amount;
        }
        
        return false; // Remove from inventory
      }
      return true; // Keep in inventory
    });

    if (completedAny) {
      updatedPlayer.inventory.questCards = remainingQuests;
      return updatedPlayer;
    }

    return player;
  };

  const calculateTradeValue = (items: TradeItem[], player: Player | null | undefined) => {
    // Accepts null/undefined player so UI can show a valid value before selection.
    if (!player) return 0;

    let total = 0;
    items.forEach((item) => {
      if (item.type === 'space') {
        const space = BOARD_SPACES[item.id];
        if (space.type === 'pillar') {
          total += 3;
        } else if (item.id <= 10) {
          total += 1;
        } else if (item.id <= 20) {
          total += 2;
        } else {
          total += 3;
        }

        if (space.type === 'property' && space.color) {
          const sameColorSpaces = player.completedSpaces.filter(
            (id) => BOARD_SPACES[id].color === space.color
          );
          if (sameColorSpaces.length >= 3) {
            total += 1;
          }
        }
      } else if (item.type === 'fate_card') {
        total += (item.card.id.length % 3) + 1;
      } else if (item.type === 'arcane_card') {
        total += (item.card.id.length % 3) + 3;
      } else if (item.type === 'ink') {
        total += (item.amount || 0) * 0.5; // Each Ink point is worth 0.5 trade value
      }
    });

    // Noble bonus: +1 trade value
    if (player.characterClass === 'noble') {
      total += 1;
    }
    
    return total;
  };

  const validateTrade = (trade: Trade) => {
    const fromPlayer = players.find((p) => p.id === trade.fromPlayerId);
    const toPlayer = players.find((p) => p.id === trade.toPlayerId);
    if (!fromPlayer || !toPlayer) return false;

    const hasOffer = trade.offer.every((item) => {
      if (item.type === 'space') return fromPlayer.completedSpaces.includes(item.id);
      if (item.type === 'fate_card') return fromPlayer.inventory.fateCards.some((c) => c.id === item.card.id);
      if (item.type === 'arcane_card') return fromPlayer.inventory.arcaneCards.some((c) => c.id === item.card.id);
      if (item.type === 'ink') return fromPlayer.resources.ink >= (item.amount || 0);
      return false;
    });

    const hasRequest = trade.request.every((item) => {
      if (item.type === 'space') return toPlayer.completedSpaces.includes(item.id);
      if (item.type === 'fate_card') return toPlayer.inventory.fateCards.some((c) => c.id === item.card.id);
      if (item.type === 'arcane_card') return toPlayer.inventory.arcaneCards.some((c) => c.id === item.card.id);
      if (item.type === 'ink') return toPlayer.resources.ink >= (item.amount || 0);
      return false;
    });

    return hasOffer && hasRequest;
  };

  const executeTrade = (trade: Trade) => {
    if (!validateTrade(trade)) {
      addLog("Trade failed: Items no longer available.");
      setPendingTrade(null);
      return;
    }

    const sender = players.find(p => p.id === trade.fromPlayerId);
    const receiver = players.find(p => p.id === trade.toPlayerId);
    if (sender?.characterClass === 'noble' || receiver?.characterClass === 'noble') {
      addLog(`Noble's Diplomacy: A favorable trade was struck!`);
    }

    setPlayers((prev) => {
      return prev.map((p) => {
        if (p.id === trade.fromPlayerId) {
          const next = { ...p, inventory: { ...p.inventory } };
          trade.offer.forEach((item) => {
            if (item.type === 'space') next.completedSpaces = next.completedSpaces.filter((id) => id !== item.id);
            if (item.type === 'fate_card') next.inventory.fateCards = next.inventory.fateCards.filter((c) => c.id !== item.card.id);
            if (item.type === 'arcane_card') next.inventory.arcaneCards = next.inventory.arcaneCards.filter((c) => c.id !== item.card.id);
            if (item.type === 'ink') next.resources.ink -= (item.amount || 0);
          });
          trade.request.forEach((item) => {
            if (item.type === 'space') next.completedSpaces = [...next.completedSpaces, item.id];
            if (item.type === 'fate_card') next.inventory.fateCards = [...next.inventory.fateCards, item.card];
            if (item.type === 'arcane_card') next.inventory.arcaneCards = [...next.inventory.arcaneCards, item.card];
            if (item.type === 'ink') next.resources.ink += (item.amount || 0);
          });
          return next;
        }
        if (p.id === trade.toPlayerId) {
          const next = { ...p, inventory: { ...p.inventory } };
          trade.request.forEach((item) => {
            if (item.type === 'space') next.completedSpaces = next.completedSpaces.filter((id) => id !== item.id);
            if (item.type === 'fate_card') next.inventory.fateCards = next.inventory.fateCards.filter((c) => c.id !== item.card.id);
            if (item.type === 'arcane_card') next.inventory.arcaneCards = next.inventory.arcaneCards.filter((c) => c.id !== item.card.id);
            if (item.type === 'ink') next.resources.ink -= (item.amount || 0);
          });
          trade.offer.forEach((item) => {
            if (item.type === 'space') next.completedSpaces = [...next.completedSpaces, item.id];
            if (item.type === 'fate_card') next.inventory.fateCards = [...next.inventory.fateCards, item.card];
            if (item.type === 'arcane_card') next.inventory.arcaneCards = [...next.inventory.arcaneCards, item.card];
            if (item.type === 'ink') next.resources.ink += (item.amount || 0);
          });
          return next;
        }
        return p;
      });
    });

    setPendingTrade(null);
    setHasTradedThisTurn(true);
    playSound('trade');
    addLog(`Trade completed.`);
  };

  const toggleTradeItem = (side: 'offer' | 'request', item: TradeItem) => {
    setTradeBuilder((prev) => {
      const list = side === 'offer' ? prev.offer : prev.request;
      const exists = list.some((i) => {
        if (i.type === 'space' && item.type === 'space') return i.id === item.id;
        if (i.type === 'fate_card' && item.type === 'fate_card') return i.card.id === item.card.id;
        if (i.type === 'arcane_card' && item.type === 'arcane_card') return i.card.id === item.card.id;
        if (i.type === 'ink' && item.type === 'ink') return true; // Only one ink entry allowed for now
        return false;
      });

      if (exists) {
        return {
          ...prev,
          [side]: list.filter((i) => {
            if (i.type === 'space' && item.type === 'space') return i.id !== item.id;
            if (i.type === 'fate_card' && item.type === 'fate_card') return i.card.id !== item.card.id;
            if (i.type === 'arcane_card' && item.type === 'arcane_card') return i.card.id !== item.card.id;
            if (i.type === 'ink' && item.type === 'ink') return false;
            return true;
          }),
        };
      } else {
        return {
          ...prev,
          [side]: [...list, item],
        };
      }
    });
  };

  const handleStartGame = (initialPlayers: SetupPlayer[]) => {
    if (initialPlayers.length > 0) {
      setCurrentLanguage(initialPlayers[0].language as LanguageCode);
    }
    setPlayers(initialPlayers.map((p, i) => ({
      id: i + 1,
      name: p.name,
      color: COLOR_MAP[p.color],
      language: p.language,
      token: p.token,
      characterClass: p.characterClass.toLowerCase(),
      position: 0,
      completedSpaces: [],
      ownedSpaces: [],
      inventory: { fateCards: [], arcaneCards: [], relics: [], questCards: [], books: [], merch: [] },
      resources: { books: 0, arcane: 2, fate: 1, ink: 0 },
      status: {
        banishedTurns: 0,
        ensnaredTurns: 0,
        skipTurns: 0,
        blessedTurns: 0,
        cursedTurns: 0,
        drainedTurns: 0,
        corruption: 0,
      },
      isOnline: true,
      isAI: p.isAI || false,
      stats: {
        arcaneSpacesVisited: 0,
        fateCardsDrawn: 0,
        lapsCompleted: 0,
      },
    })));
    setCurrentPlayerIndex(0);
    setFoundEasterEggs([]);
    setFoundEggThisTurn(null);
    setAppState('playing');
    setTurnPhase('ready');
    addLog(`The journey begins with ${initialPlayers.length} readers in the ${selectedGenre.name} realm.`);
  };

  const [foundEasterEggs, setFoundEasterEggs] = useState<string[]>([]);
  const [foundEggThisTurn, setFoundEggThisTurn] = useState<Relic | null>(null);

  const getRelicIcon = (relic: Relic, size = 24) => {
    if (relic.isEasterEgg) {
      switch (relic.iconName) {
        case 'bookmark': return <Bookmark size={size} />;
        case 'quill': return <PenTool size={size} />;
        case 'ink': return <Droplet size={size} />;
        case 'chapter': return <BookOpen size={size} />;
        case 'seal': return <Award size={size} />;
        default: return <Trophy size={size} />;
      }
    }
    return <Key size={size} />;
  };

  const checkEasterEgg = () => {
    if (!currentPlayer) return;
    
    // 15% chance to find an Easter Egg
    if (Math.random() < 0.15) {
      const availableEggs = RELICS.filter(r => r.isEasterEgg && !foundEasterEggs.includes(r.id));
      if (availableEggs.length > 0) {
        const egg = availableEggs[Math.floor(Math.random() * availableEggs.length)];
        setFoundEasterEggs(prev => [...prev, egg.id]);
        setFoundEggThisTurn(egg);
        setPlayers(prev => updatePlayerByIndex(prev, currentPlayerIndex, p => ({
          ...p,
          inventory: { ...p.inventory, relics: [...p.inventory.relics, egg] }
        })));
        addLog(`✨ EASTER EGG! ${currentPlayer.name} found a hidden trophy: ${egg.name}!`);
        playSound('milestone');
      }
    }
  };

  const resolveSpace = (space: Space) => {
    if (!currentPlayer) return;

    switch (space.type) {
      case 'fate': {
        checkEasterEgg();
        // Seer bonus: Draw 2 and pick 1
        if (currentPlayer.characterClass === 'seer') {
          const cards = drawMultipleCards('fate', 2);
          setSeerCards(cards);
          setTurnPhase('seer_choosing');
          addLog(`Seer's Insight: ${currentPlayer.name} peers into the future...`);
          return;
        }

        const card = drawCard('fate');
        const cardTitle = CARD_TX[currentLanguage]?.[card.id]?.title || card.title;
        setActiveCard({ card, type: 'fate' });
        setTurnPhase('resolving_card');
        addLog(`${currentPlayer.name} drew a Fate card: ${cardTitle}.`);
        return;
      }

      case 'arcane': {
        checkEasterEgg();
        const isMage = currentPlayer.characterClass === 'mage';
        const cards = drawMultipleCards('arcane', isMage ? 2 : 1);
        const card = cards[0];
        const cardTitle = CARD_TX[currentLanguage]?.[card.id]?.title || card.title;
        
        // Mage bonus: +1 Arcane card
        if (isMage) {
          const extraCard = cards[1];
          const extraCardTitle = CARD_TX[currentLanguage]?.[extraCard.id]?.title || extraCard.title;
          setPlayers(prev => updatePlayerByIndex(prev, currentPlayerIndex, p => ({
            ...p,
            inventory: { ...p.inventory, arcaneCards: [...p.inventory.arcaneCards, extraCard] }
          })));
          addLog(`Mage Bonus: ${currentPlayer.name} harnessed extra power and gained ${extraCardTitle}!`);
        }

        // Track arcane space visited for quests
        setPlayers(prev => updatePlayerByIndex(prev, currentPlayerIndex, p => ({
          ...p,
          stats: { ...p.stats, arcaneSpacesVisited: p.stats.arcaneSpacesVisited + 1 }
        })));

        setActiveCard({ card, type: 'arcane' });
        setTurnPhase('resolving_card');
        addLog(`${currentPlayer.name} drew an Arcane card: ${cardTitle}.`);
        return;
      }

      case 'quest': {
        checkEasterEgg();
        const card = drawCard('quest');
        const cardTitle = CARD_TX[currentLanguage]?.[card.id]?.title || card.title;
        setActiveCard({ card, type: 'quest' });
        setTurnPhase('resolving_card');
        addLog(`${currentPlayer.name} discovered a new Quest: ${cardTitle}.`);
        return;
      }

      case 'property':
      case 'pillar':
      case 'special':
      case 'portal':
      case 'hazard':
      case 'safe':
      case 'corner': {
        setActiveSpace(space);
        setTurnPhase('resolving_space');
        return;
      }

      default: {
        setTurnPhase('turn_complete');
      }
    }
  };

  const movePlayerTo = (player: Player, steps: number) => {
    const newPosition = (player.position + steps) % BOARD_SPACES.length;
    
    // Check if player passed the start (position 0)
    const passedStart = player.position + steps >= BOARD_SPACES.length;
    
    const updatedResources = { ...player.resources };
    if (passedStart) {
      updatedResources.books += 2 * rollMultiplier;
      setShowLapCelebration(true);
      setTimeout(() => setShowLapCelebration(false), 3000);
    }

    return {
      updatedPlayer: { 
        ...player, 
        position: newPosition,
        resources: updatedResources,
        stats: {
          ...player.stats,
          lapsCompleted: player.stats.lapsCompleted + (passedStart ? 1 : 0)
        }
      },
      landedSpace: BOARD_SPACES[newPosition],
    };
  };

  // Auto-skip turns if player is banished, ensnared, or skipping
  useEffect(() => {
    if (turnPhase === 'ready' && currentPlayer && isMyTurn) {
      const isSkipped = currentPlayer.status.skipTurns > 0 || 
                        currentPlayer.status.banishedTurns > 0 || 
                        currentPlayer.status.ensnaredTurns > 0;

      if (isSkipped) {
        const statusReason = currentPlayer.status.banishedTurns > 0 ? 'Banished' : 
                             currentPlayer.status.ensnaredTurns > 0 ? 'Ensnared' : 'Skipping Turn';
        
        const timer = setTimeout(() => {
          addLog(`${currentPlayer.name} is ${statusReason} and their turn is skipped.`);
          
          // Decrement the skip-related statuses here so they are only reduced when a turn is actually skipped
          setPlayers(prev => updatePlayerByIndex(prev, currentPlayerIndex, (p) => ({
            ...p,
            status: {
              ...p.status,
              skipTurns: clampMinZero(p.status.skipTurns - 1),
              banishedTurns: clampMinZero(p.status.banishedTurns - 1),
              ensnaredTurns: clampMinZero(p.status.ensnaredTurns - 1),
            }
          })));

          setTurnPhase('turn_complete');
          
          // Automatically advance to the next turn after a short delay
          setTimeout(() => {
            handleNextTurn(true);
          }, 1500);
        }, 1500);
        
        return () => clearTimeout(timer);
      }
    }
  }, [turnPhase, currentPlayer, isMyTurn, currentPlayerIndex]);

  const drawMultipleCards = (type: CardType, count: number): Card[] => {
    let deckRef: React.MutableRefObject<Card[]>;
    let source: Card[];
    let lastIdRef: React.MutableRefObject<string | null>;

    if (type === 'fate') {
      deckRef = fateDeckRef;
      source = FATE_CARDS;
      lastIdRef = lastFateCardId;
    } else {
      deckRef = arcaneDeckRef;
      source = ARCANE_TRIALS;
      lastIdRef = lastArcaneCardId;
    }

    const drawn: Card[] = [];
    for (let i = 0; i < count; i++) {
      if (deckRef.current.length === 0) {
        let newDeck = shuffle(source);
        // Avoid same card back-to-back after reshuffle if possible
        if (newDeck.length > 1 && newDeck[0].id === lastIdRef.current) {
          // Swap first and last
          [newDeck[0], newDeck[newDeck.length - 1]] = [newDeck[newDeck.length - 1], newDeck[0]];
        }
        deckRef.current = newDeck;
      }
      const card = deckRef.current[0];
      drawn.push(card);
      lastIdRef.current = card.id;
      deckRef.current = deckRef.current.slice(1);
    }

    return drawn;
  };

  const drawCard = (type: CardType): Card => drawMultipleCards(type, 1)[0];

  const handleRoll = async () => {
    if (!currentPlayer || turnPhase !== 'ready' || !isMyTurn || isSkipped) return;

    setTurnPhase('rolling');
    playSound('roll');
    await new Promise((resolve) => setTimeout(resolve, 1200));

    let baseRoll = Math.floor(Math.random() * 6) + 1;
    
    // Stronger anti-repeat bias: if same as last global roll, try to get a different one
    let attempts = 0;
    while (baseRoll === lastGlobalRoll && attempts < 5) {
      baseRoll = Math.floor(Math.random() * 6) + 1;
      attempts++;
    }
    
    setLastGlobalRoll(baseRoll);

    const rollBonus = currentPlayer.status.blessedTurns > 0 ? 1 : 0;
    const rollPenalty = currentPlayer.status.cursedTurns > 0 ? 1 : 0;
    
    const finalRoll = Math.max(1, baseRoll + rollBonus - rollPenalty);

    setLastRoll(finalRoll);

    const { updatedPlayer, landedSpace } = movePlayerTo(currentPlayer, finalRoll);

    setPlayers((prev) =>
      updatePlayerByIndex(prev, currentPlayerIndex, () => updatedPlayer)
    );

    const spaceName = SPACE_TX[currentLanguage]?.[landedSpace.id]?.name || landedSpace.name;
    addLog(`${currentPlayer.name} rolled a ${finalRoll} and landed on ${spaceName}.`);

    setActiveSpace(landedSpace);
    setTurnPhase('resolving_space');
    setMarketplace((prev) => ({
      ...prev,
      isOpen: true,
      lastOpenPhase: 'resolving_space',
    }));
  };

  const handleContinueSpace = () => {
    if (!activeSpace) return;
    const space = activeSpace;
    setActiveSpace(null);
    resolveSpace(space);
  };

  const completePrompt = (spaceId: number) => {
    if (!currentPlayer) return;

    const space = BOARD_SPACES[spaceId];
    let updatedWinner: Player | null = null;

    setPlayers((prev) =>
      updatePlayerByIndex(prev, currentPlayerIndex, (p) => {
        const alreadyCompleted = p.completedSpaces.includes(spaceId);
        const completedSpaces = alreadyCompleted ? p.completedSpaces : [...p.completedSpaces, spaceId];
        const ownedSpaces = p.ownedSpaces.includes(spaceId) ? p.ownedSpaces : [...p.ownedSpaces, spaceId];

        const next = {
          ...p,
          completedSpaces,
          ownedSpaces,
          resources: {
            ...p.resources,
            books: p.resources.books + (alreadyCompleted ? 0 : (space.reward?.books || 1) * rollMultiplier),
            arcane: p.resources.arcane + (space.reward?.arcane || 1) * rollMultiplier,
            fate: p.resources.fate + (space.reward?.fate || 0) * rollMultiplier,
            ink: p.resources.ink + (space.reward?.ink || 0) * rollMultiplier,
          },
        };

        // Deduct cost
        if (space.cost) {
          next.resources.ink = clampMinZero(next.resources.ink - (space.cost.ink || 0) * rollMultiplier);
          next.resources.arcane = clampMinZero(next.resources.arcane - (space.cost.arcane || 0) * rollMultiplier);
          next.resources.fate = clampMinZero(next.resources.fate - (space.cost.fate || 0) * rollMultiplier);
        }

        const checked = checkQuests(next);
        updatedWinner = checked;
        return checked;
      })
    );

    const spaceName = SPACE_TX[currentLanguage]?.[space.id]?.name || space.name;
    addLog(`${currentPlayer.name} completed ${spaceName} and received its rewards.`);
    setActiveSpace(null);
    setTurnPhase('turn_complete');

    setTimeout(() => {
      if (updatedWinner) checkWinner(updatedWinner);
    }, 0);
  };

  const applySimpleSpaceEffect = () => {
    if (!currentPlayer || !activeSpace) return;

    const space = activeSpace;
    let updatedPlayer: Player | null = null;
    let logMessage = '';
    
    // Play sound based on space type
    if (['dungeon', 'ensnared', 'banished'].some(kw => space.name.toLowerCase().includes(kw))) {
      playSound('error');
    }

    setPlayers((prev) =>
      updatePlayerByIndex(prev, currentPlayerIndex, (p) => {
        let next = {
          ...p,
          resources: { ...p.resources },
          status: { ...p.status },
        };

        switch (space.name) {
          case 'GO!':
          case 'START':
          case 'Begin Your Journey':
            next.resources.books += 2 * rollMultiplier;
            logMessage = `${p.name} landed on GO! and collected ${2 * rollMultiplier} Books.`;
            break;
          case 'THE DUNGEON':
          case 'ENSNARED':
            if (p.characterClass === 'warrior' && !p.warriorBonusUsed) {
              next.warriorBonusUsed = true;
              logMessage = `Warrior's Resolve: ${p.name} ignored the Dungeon trap!`;
            } else {
              next.status.ensnaredTurns += 2;
              logMessage = `${p.name} was Ensnared! They skip their next 2 turns.`;
            }
            break;
          case 'GO TO DUNGEON':
          case 'BANISHED':
            if (p.characterClass === 'warrior' && !p.warriorBonusUsed) {
              next.warriorBonusUsed = true;
              logMessage = `Warrior's Resolve: ${p.name} ignored the Banishment!`;
            } else {
              next.position = 10; // Move to Ensnared space
              next.status.banishedTurns += 1;
              next.resources.fate += 1 * rollMultiplier;
              logMessage = `${p.name} was Banished to the Dungeon! They move to Ensnared and skip their next turn.`;
            }
            break;
          case 'FREE PARKING':
          case 'SANCTUARY':
            next.resources.fate += 2 * rollMultiplier;
            next.status.cursedTurns = 0;
            next.status.ensnaredTurns = 0;
            next.status.banishedTurns = 0;
            next.status.drainedTurns = 0;
            logMessage = `${p.name} found Free Parking, gained ${2 * rollMultiplier} Fate, and was cleansed of all negative statuses.`;
            break;
          case 'MAGICAL COST':
            if (space.id === 4) {
              next.resources.arcane = clampMinZero(next.resources.arcane - 1 * rollMultiplier);
              next.resources.books = clampMinZero(next.resources.books - 1 * rollMultiplier);
              logMessage = `${p.name} paid a Magical Cost: lose ${1 * rollMultiplier} Arcane and ${1 * rollMultiplier} Book.`;
            } else {
              next.resources.books = clampMinZero(next.resources.books - 2 * rollMultiplier);
              logMessage = `${p.name} paid the Price of Power and lost ${2 * rollMultiplier} Books.`;
            }
            break;
          case 'Trials on the Road':
            next.resources.fate = clampMinZero(next.resources.fate - 1 * rollMultiplier);
            next.resources.ink = clampMinZero(next.resources.ink - 2 * rollMultiplier);
            logMessage = `${p.name} suffered Trials on the Road and lost ${1 * rollMultiplier} Fate and ${2 * rollMultiplier} Ink.`;
            break;
          case 'The Cost of Victory':
            next.resources.arcane = clampMinZero(next.resources.arcane - 2 * rollMultiplier);
            next.resources.books = clampMinZero(next.resources.books - 1 * rollMultiplier);
            logMessage = `${p.name} paid dearly for victory and lost ${2 * rollMultiplier} Arcane and ${1 * rollMultiplier} Book.`;
            break;
          case 'Wild Magic':
            next.resources.arcane += 3 * rollMultiplier;
            if (p.characterClass === 'warrior' && !p.warriorBonusUsed) {
              next.warriorBonusUsed = true;
              logMessage = `${p.name} harnessed Wild Magic: gain ${3 * rollMultiplier} Arcane and ignored the Curse!`;
            } else {
              next.status.cursedTurns += 2;
              logMessage = `${p.name} harnessed Wild Magic: gain ${3 * rollMultiplier} Arcane but become Cursed for 2 turns.`;
            }
            break;
          case 'Balance in Chaos':
            next.resources.arcane += 2 * rollMultiplier;
            next.resources.fate += 2 * rollMultiplier;
            logMessage = `${p.name} found Balance in Chaos and gained ${2 * rollMultiplier} Arcane + ${2 * rollMultiplier} Fate.`;
            break;
          case 'Portals & Gateways':
            next.resources.fate += 1 * rollMultiplier;
            next.resources.ink += 2 * rollMultiplier;
            logMessage = `${p.name} crossed Portals & Gateways and gained ${1 * rollMultiplier} Fate and ${2 * rollMultiplier} Ink.`;
            break;
          default:
            const spaceName = SPACE_TX[currentLanguage]?.[space.id]?.name || space.name;
            logMessage = `${p.name} continued onward from ${spaceName}.`;
            break;
        }

        const checked = checkQuests(next);
        updatedPlayer = checked;
        return checked;
      })
    );

    addLog(logMessage);
    setActiveSpace(null);
    setTurnPhase('turn_complete');

    setTimeout(() => {
      if (updatedPlayer) checkWinner(updatedPlayer);
    }, 0);
  };

  const applyCardEffect = () => {
    if (!currentPlayer || !activeCard) return;

    const { card, type } = activeCard;
    let updatedPlayer: Player | null = null;
    let nextSpace: Space | null = null;

    setPlayers((prev) =>
      updatePlayerByIndex(prev, currentPlayerIndex, (p) => {
        let next: Player = {
          ...p,
          resources: { ...p.resources },
          status: { ...p.status },
          inventory: {
            fateCards: [...(p.inventory.fateCards || [])],
            arcaneCards: [...(p.inventory.arcaneCards || [])],
            relics: [...(p.inventory.relics || [])],
            questCards: [...(p.inventory.questCards || [])],
            books: [...(p.inventory.books || [])],
            merch: [...(p.inventory.merch || [])],
          },
        };

        if (card.id.startsWith('q')) {
          next.inventory.questCards.push(card);
          const checkedQuest = checkQuests(next);
          setFoundEggThisTurn(null);
          updatedPlayer = checkedQuest;
          return checkedQuest;
        }

        if (type === 'fate') {
          next.inventory.fateCards.push(card);
          next.stats.fateCardsDrawn += 1;
        }
        if (type === 'arcane') next.inventory.arcaneCards.push(card);

        setFoundEggThisTurn(null);

        const effect = card.effect;
        switch (effect.type) {
          case 'gain_books':
            next.resources.books += effect.amount * rollMultiplier;
            break;
          case 'lose_books':
            next.resources.books = clampMinZero(next.resources.books - effect.amount * rollMultiplier);
            break;
          case 'gain_arcane':
            if (next.status.drainedTurns === 0) {
              next.resources.arcane += effect.amount * rollMultiplier;
            }
            break;
          case 'lose_arcane':
            next.resources.arcane = clampMinZero(next.resources.arcane - effect.amount * rollMultiplier);
            break;
          case 'gain_fate':
            next.resources.fate += effect.amount * rollMultiplier;
            break;
          case 'lose_fate':
            next.resources.fate = clampMinZero(next.resources.fate - effect.amount * rollMultiplier);
            break;
          case 'gain_ink':
            next.resources.ink += effect.amount * rollMultiplier;
            break;
          case 'lose_ink':
            next.resources.ink = clampMinZero(next.resources.ink - effect.amount * rollMultiplier);
            break;
          case 'move_steps': {
            const moved = movePlayerTo(next, effect.amount);
            next = moved.updatedPlayer;
            nextSpace = moved.landedSpace;
            break;
          }
          case 'skip_turns':
            next.status.skipTurns += effect.amount;
            break;
          case 'banish':
            if (p.characterClass === 'warrior' && !p.warriorBonusUsed) {
              next.warriorBonusUsed = true;
              addLog(`Warrior's Resolve: ${p.name} ignored the Banishment!`);
            } else {
              next.status.banishedTurns += effect.turns;
            }
            break;
          case 'ensnare':
            if (p.characterClass === 'warrior' && !p.warriorBonusUsed) {
              next.warriorBonusUsed = true;
              addLog(`Warrior's Resolve: ${p.name} ignored the Ensnarement!`);
            } else {
              next.status.ensnaredTurns += effect.turns;
            }
            break;
          case 'bless':
            next.status.blessedTurns += effect.turns;
            break;
          case 'curse':
            if (p.characterClass === 'warrior' && !p.warriorBonusUsed) {
              next.warriorBonusUsed = true;
              addLog(`Warrior's Resolve: ${p.name} ignored the Curse!`);
            } else {
              next.status.cursedTurns += effect.turns;
            }
            break;
          case 'drain':
            if (p.characterClass === 'warrior' && !p.warriorBonusUsed) {
              next.warriorBonusUsed = true;
              addLog(`Warrior's Resolve: ${p.name} ignored the Drain!`);
            } else {
              next.status.drainedTurns += effect.turns;
            }
            break;
          case 'corrupt':
            next.status.corruption += effect.amount;
            if (next.status.corruption >= 10) {
              next.status.banishedTurns += 2;
              next.status.corruption = 0;
              addLog(`${next.name} was consumed by corruption and Banished!`);
            }
            break;
          case 'cleanse':
            next.status.cursedTurns = 0;
            next.status.ensnaredTurns = 0;
            next.status.banishedTurns = 0;
            next.status.drainedTurns = 0;
            addLog(`${next.name} was cleansed of all negative statuses!`);
            break;
          case 'gain_relic': {
            const relic = RELICS.find((r) => r.id === effect.id);
            if (relic) {
              next.inventory.relics.push(relic);
              const relicName = RELIC_TX[currentLanguage]?.[relic.id]?.name || relic.name;
              addLog(`${next.name} acquired the relic: ${relicName}!`);
            }
            break;
          }
          default:
            break;
        }

        const checked = checkQuests(next);
        updatedPlayer = checked;
        return checked;
      })
    );

    const cardTitle = CARD_TX[currentLanguage]?.[card.id]?.title || card.title;
    addLog(`${currentPlayer.name} resolved "${cardTitle}".`);
    setActiveCard(null);

    setTimeout(() => {
      if (updatedPlayer && checkWinner(updatedPlayer)) return;

      if (nextSpace) {
        addLog(`${currentPlayer?.name} is moved by magic to ${nextSpace.name}.`);
        setActiveSpace(nextSpace);
        setTurnPhase('resolving_space');
      } else {
        setTurnPhase('turn_complete');
      }
    }, 0);
  };

  const buyFromMarketplace = (item: MarketItem) => {
    if (!currentPlayer) return;
    const price = dynamicPrice(item);
    if (item.quantity <= 0) { flashMarket('error', 'Item sold out'); playSound('error'); return; }

    if (currentPlayer.resources.ink < price) {
      flashMarket('error', `Not enough Ink to buy ${item.name} (Cost: ${price})`);
      playSound('error');
      return;
    }

    setPlayers((prev) => updatePlayerByIndex(prev, currentPlayerIndex, (p) => {
      const next = { ...p, resources: { ...p.resources, ink: p.resources.ink - price } };
      
      if (item.type === 'resource') {
        if (item.resourceType) {
          next.resources[item.resourceType] = (next.resources[item.resourceType] || 0) + 1;
        }
      } else {
        const inventory = { ...next.inventory };
        if (item.category === 'fate') inventory.fateCards = [...inventory.fateCards, { id: `f${Date.now()}`, title: item.name, description: 'Marketplace fate card', effect: { type: 'gain_fate', amount: 1 } }];
        if (item.category === 'arcane') inventory.arcaneCards = [...inventory.arcaneCards, { id: `a${Date.now()}`, title: item.name, description: 'Marketplace arcane card', effect: { type: 'gain_arcane', amount: 1 } }];
        if (item.category === 'quest') inventory.questCards = [...inventory.questCards, { id: `q${Date.now()}`, title: item.name, description: 'Marketplace quest card', effect: { type: 'gain_books', amount: 1 } }];
        next.inventory = inventory;
      }
      return next;
    }));

    setMarketItemsState((prev) => prev.map((m) => m.id === item.id ? { ...m, quantity: m.quantity - 1, demand: m.demand + 1 } : m));
    flashMarket('success', `${item.name} purchased for ${price} Ink`);
    playSound('buy');
  };

  const sellToMarketplace = (item: MarketItem) => {
    if (!currentPlayer || item.type !== 'resource' || !item.resourceType) return;
    if (currentPlayer.resources[item.resourceType] <= 0) {
      flashMarket('error', `No ${item.name} to sell`);
      playSound('error');
      return;
    }

    const price = Math.max(1, Math.floor(dynamicPrice(item) * 0.7)); // Sell for 70% of buy price
    setPlayers((prev) => updatePlayerByIndex(prev, currentPlayerIndex, (p) => {
      const next = { ...p, resources: { ...p.resources } };
      next.resources[item.resourceType!] = Math.max(0, next.resources[item.resourceType!] - 1);
      next.resources.ink += price;
      return next;
    }));

    setMarketItemsState((prev) => prev.map((m) => m.id === item.id ? { ...m, quantity: m.quantity + 1, demand: Math.max(1, m.demand - 1) } : m));
    flashMarket('success', `Sold 1 ${item.name} for ${price} Ink`);
    playSound('sell');
  };

  const handleNextTurn = (force = false) => {
    if (!force && turnPhase !== 'turn_complete') return;
    if (players.length === 0) return;

    setHasTradedThisTurn(false);
    setLastRoll(null);
    setActiveSpace(null);
    setActiveCard(null);

    const nextIndex = (currentPlayerIndex + 1) % players.length;
    const nextPlayer = players[nextIndex];

    // 1. Decrement statuses for the player who just FINISHED their turn
    // 2. Apply start-of-turn effects for the NEXT player
    setPlayers((prev) =>
      prev.map((p, idx) => {
        // Current player finishing turn
        if (idx === currentPlayerIndex) {
          return {
            ...p,
            status: {
              ...p.status,
              blessedTurns: clampMinZero(p.status.blessedTurns - 1),
              cursedTurns: clampMinZero(p.status.cursedTurns - 1),
              drainedTurns: clampMinZero(p.status.drainedTurns - 1),
            },
          };
        }
        
        // Next player starting turn
        if (idx === nextIndex) {
          let inkGain = 0;
          if (p.inventory.relics?.find(r => r.id === 'r1')) inkGain = 1;
          
          return {
            ...p,
            warriorBonusUsed: false,
            resources: {
              ...p.resources,
              ink: p.resources.ink + inkGain,
            },
          };
        }

        return p;
      })
    );

    setCurrentPlayerIndex(nextIndex);
    setTurnPhase('upkeep');

    addLog(`It is now ${nextPlayer.name}'s turn. Upkeep complete.`);
    
    setTimeout(() => {
      setTurnPhase('ready');
    }, 1000);
  };

  useEffect(() => {
    if (turnPhase === 'turn_complete') {
      const timer = setTimeout(() => {
        handleNextTurn(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [turnPhase]);

  // AI Turn Automation
  useEffect(() => {
    if (appState !== 'playing' || !currentPlayer || !currentPlayer.isAI) return;

    const delay = 1500;

    const timer = setTimeout(() => {
      switch (turnPhase) {
        case 'ready':
          handleRoll();
          break;
        case 'resolving_space':
          if (!activeSpace) break;
          if (activeSpace.type === 'property' || activeSpace.type === 'pillar') {
            const canAfford = 
              (activeSpace.cost?.ink || 0) <= (currentPlayer.resources.ink || 0) &&
              (activeSpace.cost?.arcane || 0) <= (currentPlayer.resources.arcane || 0) &&
              (activeSpace.cost?.fate || 0) <= (currentPlayer.resources.fate || 0);
            
            if (canAfford) {
              completePrompt(activeSpace.id);
            } else {
              setActiveSpace(null);
              setTurnPhase('turn_complete');
              const spaceName = SPACE_TX[currentLanguage]?.[activeSpace.id]?.name || activeSpace.name;
              addLog(`${currentPlayer.name} left ${spaceName} unresolved.`);
            }
          } else if (activeSpace.type === 'fate' || activeSpace.type === 'arcane') {
            handleContinueSpace();
          } else {
            applySimpleSpaceEffect();
          }
          break;
        case 'resolving_card':
          applyCardEffect();
          break;
        case 'seer_choosing':
          if (seerCards.length > 0) {
            const card = seerCards[0];
            const cardTitle = CARD_TX[currentLanguage]?.[card.id]?.title || card.title;
            setActiveCard({ card, type: 'fate' });
            setTurnPhase('resolving_card');
            setSeerCards([]);
            addLog(`${currentPlayer.name} chose the fate: ${cardTitle}.`);
          }
          break;
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [turnPhase, currentPlayerIndex, appState, activeSpace, activeCard, seerCards]);

  const handleRedeemReward = (reward: any) => {
    if (!currentPlayer) return;
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === currentPlayer.id) {
          return {
            ...p,
            resources: {
              ...p.resources,
              ink: p.resources.ink + (reward.ink || 0),
              fate: p.resources.fate + (reward.fatePoints || 0),
              books: p.resources.books + (reward.books ? reward.books.length : 0),
            },
            inventory: {
              ...p.inventory,
              books: [...p.inventory.books, ...(reward.books || [])],
              merch: [...p.inventory.merch, ...(reward.merch || [])],
            },
          };
        }
        return p;
      })
    );
    addLog(`✨ Magical code redeemed! Reward received.`);
  };

  const toggleZoom = () => setZoom((prev) => (prev === 1 ? 1.5 : 1));

  const winner = useMemo(() => players.find((p) => p.id === pendingWinnerId) || null, [players, pendingWinnerId]);

  console.log('App component about to render', { showIntro, appState, playerCount: players.length });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-paper overflow-hidden">
      <AnimatePresence mode="wait">
        {showIntro ? (
          <IntroScreen 
            key="intro" 
            onBegin={() => setShowIntro(false)} 
            onLoad={loadGame}
            hasSave={!!localStorage.getItem('bookbound_save')}
            playSound={playSound} 
          />
        ) : appState === 'setup' ? (
          <SetupScreen
            key="setup"
            onStart={handleStartGame}
            musicEnabled={musicEnabled}
            musicVolume={musicVolume}
            sfxEnabled={sfxEnabled}
            sfxVolume={sfxVolume}
            onToggleMusic={() => setMusicEnabled(!musicEnabled)}
            onToggleSfx={() => setSfxEnabled(!sfxEnabled)}
            onMusicVolumeChange={setMusicVolume}
            onSfxVolumeChange={setSfxVolume}
          />
        ) : (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full flex flex-col items-center"
          >
            <header className="w-full max-w-7xl flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => window.location.reload()}
                  className="p-2 hover:bg-ink/5 rounded-full transition-colors"
                >
                  <LogOut size={20} className="text-ink/40" />
                </button>
                <div>
                  <h1 className="text-3xl font-display font-bold italic text-ink">Bookbound</h1>
                  <p className="text-[10px] uppercase tracking-[0.3em] opacity-40 font-sans">
                    Indie Fantasy Edition
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowRules(true)}
                  className="p-3 glass-panel rounded-xl hover:bg-gold/10 transition-all"
                >
                  <Info size={20} />
                </button>
                <button
                  onClick={() => setTurnPhase(isPaused ? 'ready' : 'paused')}
                  className="p-3 glass-panel rounded-xl hover:bg-gold/10 transition-all"
                >
                  {isPaused ? <Play size={20} /> : <Pause size={20} />}
                </button>
                <button
                  onClick={toggleZoom}
                  className="p-3 glass-panel rounded-xl hover:bg-gold/10 transition-all"
                >
                  {zoom === 1 ? <Maximize2 size={20} /> : <Minimize2 size={20} />}
                </button>
                <button
                  onClick={() => {
                    if (!canOpenMarketplace()) {
                      flashMarket('info', 'Marketplace opens after rolling the die.');
                      return;
                    }
                    setMarketplace((prev) => ({ ...prev, isOpen: true, lastOpenPhase: turnPhase }));
                    setShowTrade(true);
                  }}
                  disabled={!canOpenMarketplace()}
                  className={`p-3 glass-panel rounded-xl transition-all ${canOpenMarketplace() ? 'hover:bg-gold/10' : 'opacity-30 cursor-not-allowed'}`}
                >
                  <Handshake size={20} />
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-3 glass-panel rounded-xl hover:bg-gold/10 transition-all"
                >
                  <Settings size={20} />
                </button>
              </div>
            </header>

            <main className="w-full max-w-[90rem] grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
              <div className="lg:col-span-4 flex flex-row flex-wrap gap-4">
                <div className="glass-panel rounded-3xl p-6" style={{ width: '295px', height: '204px' }}>
                  <h2 className="text-xs uppercase tracking-widest font-bold mb-4 opacity-40 font-sans">
                    Readers
                  </h2>
                  <div className="space-y-2">
                    {players.map((p, i) => (
                      <div
                        key={p.id}
                        className={`p-3 rounded-2xl border transition-all ${
                          i === currentPlayerIndex
                            ? 'bg-ink text-paper border-gold shadow-lg scale-105'
                            : 'bg-ink/5 border-transparent opacity-70'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm"
                            style={{ backgroundColor: p.color }}
                          >
                            {(() => {
                              const TokenIcon = TOKENS.find((t) => t.name === p.token)?.icon || User;
                              return <TokenIcon size={16} />;
                            })()}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-display text-sm italic truncate">{p.name}</p>
                            <div className="flex items-center gap-2 text-[8px] uppercase tracking-tighter opacity-70">
                              <span>{p.resources.books} Books</span>
                              <span>•</span>
                              <span>{p.resources.arcane} Arcane</span>
                              <span>•</span>
                              <span>{p.resources.fate} Fate</span>
                            </div>
                            {getStatusLabel(p) && (
                              <p className="text-[8px] mt-1 uppercase tracking-tight opacity-70">
                                {getStatusLabel(p)}
                              </p>
                            )}
                          </div>

                          {i === currentPlayerIndex && (
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                              className="w-2 h-2 rounded-full bg-gold shadow-[0_0_8px_gold]"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="glass-panel rounded-3xl p-4 flex flex-col" style={{ width: '295px', height: '138px' }}>
                  <div className="flex items-center justify-between mb-2 shrink-0">
                    <h2 className="text-xs uppercase tracking-widest font-bold opacity-40 font-sans">
                      Journal
                    </h2>
                    <HistoryIcon size={14} className="opacity-20" />
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-ink/10">
                    {logs.map((log, i) => (
                      <motion.p
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={i}
                        className={`text-[11px] leading-relaxed border-l-2 border-gold/30 pl-3 py-1 ${
                          i === 0 ? 'font-medium text-ink' : 'opacity-50'
                        }`}
                      >
                        {log}
                      </motion.p>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 flex flex-col items-center justify-start p-2 gap-4">
                <div className="flex flex-row flex-wrap gap-4 w-full justify-center">
                  <button 
                    onClick={() => setShowResources(true)}
                    className="glass-panel px-6 py-3 rounded-2xl font-display italic text-lg hover:bg-gold/10 transition-all flex items-center gap-2"
                  >
                    <Scroll size={20} className="text-gold" />
                    Resources
                  </button>
                  <button 
                    onClick={() => setShowArchive(true)}
                    className="glass-panel px-6 py-3 rounded-2xl font-display italic text-lg hover:bg-gold/10 transition-all flex items-center gap-2"
                  >
                    <Key size={20} className="text-gold" />
                    Archive & Relics
                  </button>

                  {turnPhase === 'ready' ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleRoll}
                      disabled={isPaused || !isMyTurn || isSkipped}
                      className={`px-8 py-3 rounded-2xl font-display italic text-lg transition-all shadow-lg flex items-center gap-2 ${
                        isPaused || !isMyTurn || isSkipped
                          ? 'bg-white/5 text-white/20 cursor-not-allowed'
                          : 'bg-gold text-ink hover:bg-white'
                      }`}
                    >
                      <Dices size={20} />
                      Roll the Dice of Fate
                    </motion.button>
                  ) : (
                    <button
                      onClick={() => handleNextTurn()}
                      disabled={turnPhase !== 'turn_complete' || isPaused || !isMyTurn}
                      className={`px-8 py-3 rounded-2xl font-display italic text-lg transition-all shadow-lg flex items-center gap-2 ${
                        turnPhase !== 'turn_complete' || isPaused || !isMyTurn
                          ? 'bg-white/5 text-white/20 cursor-not-allowed'
                          : 'bg-white text-ink hover:bg-gold hover:scale-105'
                      }`}
                    >
                      Next Turn
                    </button>
                  )}
                </div>
                <div className="w-full max-w-[min(100%,100vh)] aspect-square bg-ink/5 border border-ink/10 board-container relative overflow-hidden">
                  <AnimatePresence>
                    {(isRolling || (lastRoll !== null && turnPhase !== 'ready')) && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.4, top: '50%', left: '50%', x: '-50%', y: '-50%' }}
                        animate={
                          isRolling
                            ? { opacity: 1, scale: 1.2, top: '50%', left: '50%', x: '-50%', y: '-50%' }
                            : { opacity: 0.9, scale: 0.55, top: '100%', left: '100%', x: '-120%', y: '-120%' }
                        }
                        exit={{ opacity: 0, scale: 0.4, top: '50%', left: '50%', x: '-50%', y: '-50%' }}
                        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                        className="absolute z-50 pointer-events-none"
                      >
                        <div className="bg-ink/90 p-6 rounded-full shadow-2xl backdrop-blur-md border border-gold/30">
                          <Dice3D value={lastRoll} isRolling={isRolling} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <motion.div 
                    animate={{ scale: zoom }}
                    className="board-wrapper w-full h-full"
                  >
                    <div
                      className="board-grid relative origin-center transition-transform duration-500"
                      style={{
                        backgroundImage: 'url(https://i.postimg.cc/4HgCRMqB/FBBcover.png)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundColor: '#f5f2ed',
                      }}
                    >
                    <div className="absolute inset-[9.09%] flex flex-col items-center justify-center z-0 border border-ink/5 shadow-inner overflow-hidden">
                      <div className="relative z-10 w-full h-full flex items-center justify-center">
                        <img
                          src="https://i.postimg.cc/BbHsPkc3/Fantasy.png"
                          className="w-full h-full object-cover drop-shadow-2xl"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>

                    {BOARD_SPACES.map((space, i) => {
                      const { row, col } = getSpacePosition(i);
                      const isCompletedByCurrent = currentPlayer?.completedSpaces.includes(space.id);
                      const playersOnSpace = players.filter((p) => p.position === i);

                      return (
                        <div
                          key={space.id}
                          style={{ gridRow: row + 1, gridColumn: col + 1 }}
                          className={`space ${space.type === 'corner' ? 'space-corner' : ''}
                            ${space.type === 'pillar' ? 'space-pillar' : ''}
                            ${space.type === 'fate' ? 'space-fate' : ''}
                            ${space.type === 'arcane' ? 'space-arcane' : ''}
                            ${space.type === 'hazard' ? 'space-hazard' : ''}
                            ${space.type === 'safe' ? 'space-safe' : ''}
                            ${space.type === 'portal' ? 'space-portal' : ''}
                            ${space.type === 'quest' ? 'space-quest' : ''}
                            ${space.type === 'property' ? `space-property color-${space.color}` : ''}
                            ${isCompletedByCurrent ? 'opacity-60' : ''}
                            ${currentPlayer?.position === i ? 'space-active' : ''}
                          `}
                        >
                          {/* <span className="text-[8px] opacity-20 absolute top-0.5 right-1 font-mono">
                            {i}
                          </span> */}

                          {space.type === 'corner' && (
                            <div className="absolute inset-0 w-full h-full overflow-hidden p-1 flex items-center justify-center">
                              {space.image && (
                                <img 
                                  src={space.image} 
                                  alt="" 
                                  className="w-full h-full object-contain"
                                  referrerPolicy="no-referrer"
                                />
                              )}
                            </div>
                          )}

                          {space.type === 'quest' && (
                            <div className="flex flex-col items-center">
                              <Scroll size={6} className="md:w-[10px] md:h-[10px] mb-0.5 text-gold" />
                              <span className="space-name">
                                {SPACE_TX[currentLanguage]?.[space.id]?.name || space.name}
                              </span>
                            </div>
                          )}

                          {space.type === 'hazard' && (
                            <div className="flex flex-col items-center">
                              <Flame size={6} className="md:w-[10px] md:h-[10px] mb-0.5 text-red-700" />
                              <span className="space-name">
                                {SPACE_TX[currentLanguage]?.[space.id]?.name || space.name}
                              </span>
                            </div>
                          )}

                          {space.type === 'safe' && (
                            <div className="flex flex-col items-center">
                              <Shield size={6} className="md:w-[10px] md:h-[10px] mb-0.5 text-green-700" />
                              <span className="space-name">
                                {SPACE_TX[currentLanguage]?.[space.id]?.name || space.name}
                              </span>
                            </div>
                          )}

                          {space.type === 'portal' && (
                            <div className="flex flex-col items-center">
                              <Zap size={6} className="md:w-[10px] md:h-[10px] mb-0.5 text-cyan-700" />
                              <span className="space-name">
                                {SPACE_TX[currentLanguage]?.[space.id]?.name || space.name}
                              </span>
                            </div>
                          )}

                          {(space.type === 'property' ||
                            space.type === 'fate' ||
                            space.type === 'arcane' ||
                            space.type === 'pillar') && (
                            <div className="flex flex-col items-center w-full">
                              {space.image && (
                                <img 
                                  src={space.image} 
                                  alt="" 
                                  className="w-full h-6 object-contain rounded-sm mb-0.5 opacity-80 shadow-sm"
                                  referrerPolicy="no-referrer"
                                />
                              )}
                              <span className="space-name">
                                {SPACE_TX[currentLanguage]?.[space.id]?.name || space.name}
                              </span>
                            </div>
                          )}

                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none gap-1 flex-wrap p-1">
                            {playersOnSpace.map((p) => {
                              const TokenIcon = TOKENS.find((t) => t.name === p.token)?.icon || User;
                              const isActive = p.id === currentPlayer?.id;
                              return (
                                <motion.div
                                  key={p.id}
                                  layoutId={`player-token-${p.id}`}
                                  initial={{ y: -20, opacity: 0 }}
                                  animate={{ 
                                    y: isActive ? [-4, 0, -4] : 0, 
                                    opacity: 1 
                                  }}
                                  transition={
                                    isActive 
                                      ? { y: { repeat: Infinity, duration: 2, ease: "easeInOut" } }
                                      : { type: 'spring', stiffness: 300, damping: 15 }
                                  }
                                  className="relative group pointer-events-auto"
                                  style={{
                                    zIndex: isActive ? 50 : 10,
                                  }}
                                >
                                  {/* Tooltip */}
                                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-ink/95 text-gold text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-gold/30 z-50 shadow-xl font-sans tracking-wider">
                                    {p.name}
                                  </div>

                                  <div 
                                    className={`w-6 h-6 md:w-9 md:h-9 rounded-full flex items-center justify-center text-white transform -translate-y-2 relative border-[2px] md:border-[3px] shadow-lg transition-transform duration-300 ${isActive ? 'scale-125 z-50' : 'scale-100 z-10'}`}
                                    style={{
                                      borderColor: p.characterClass === 'noble' ? '#fbbf24' : 
                                                   p.characterClass === 'mage' ? '#c084fc' : 
                                                   p.characterClass === 'seer' ? '#22d3ee' : 
                                                   p.characterClass === 'warrior' ? '#94a3b8' : '#e2e8f0',
                                      background: 'linear-gradient(135deg, #3a3a3a 0%, #1a1a1a 100%)',
                                      boxShadow: isActive 
                                        ? `0 0 20px ${p.color}, inset 0 0 10px rgba(0,0,0,0.8)` 
                                        : `0 4px 8px rgba(0,0,0,0.5), inset 0 0 10px rgba(0,0,0,0.8)`
                                    }}
                                  >
                                    {/* Inner Colored Gem */}
                                    <div 
                                      className="absolute inset-[3px] md:inset-[4px] rounded-full overflow-hidden"
                                      style={{
                                        backgroundColor: p.color,
                                        boxShadow: `inset 0 0 10px rgba(0,0,0,0.6)`
                                      }}
                                    >
                                      {/* Gem 3D effects */}
                                      <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-black/70 pointer-events-none" />
                                      <div className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[60%] h-[25%] bg-white/40 rounded-full blur-[0.5px] pointer-events-none" />
                                    </div>

                                    {/* Token Icon */}
                                    <TokenIcon size={16} className="relative z-10 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]" />
                                    
                                    {/* Active Aura */}
                                    {isActive && (
                                      <div 
                                        className="absolute inset-0 rounded-full animate-ping opacity-30 pointer-events-none"
                                        style={{ backgroundColor: p.color }}
                                      />
                                    )}
                                  </div>
                                  
                                  {/* Shadow */}
                                  <div 
                                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-2 md:w-7 md:h-2.5 bg-black/50 blur-[3px] rounded-full transition-all duration-300" 
                                    style={{
                                      transform: isActive ? 'scale(0.8)' : 'scale(1)',
                                      opacity: isActive ? 0.4 : 0.7
                                    }}
                                  />
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  </motion.div>
                </div>
              </div>
            </main>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showResources && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink/80 backdrop-blur-md z-[200] flex items-center justify-center p-4"
          >
            <div className="bg-paper text-ink rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative">
              <button
                onClick={() => setShowResources(false)}
                className="absolute top-6 right-6 p-2 hover:bg-ink/5 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
              <h2 className="text-2xl font-display italic mb-6 text-center">Resources</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-ink/5 p-4 rounded-2xl border border-ink/10 text-center">
                  <Scroll size={24} className="text-fate-red mx-auto mb-2" />
                  <p className="text-xs uppercase opacity-60 font-bold">Fate</p>
                  <p className="text-3xl font-display">{currentPlayer?.resources.fate || 0}</p>
                </div>
                <div className="bg-ink/5 p-4 rounded-2xl border border-ink/10 text-center">
                  <Book size={24} className="text-gold mx-auto mb-2" />
                  <p className="text-xs uppercase opacity-60 font-bold">Books</p>
                  <p className="text-3xl font-display">{currentPlayer?.resources.books || 0}</p>
                </div>
                <div className="bg-ink/5 p-4 rounded-2xl border border-ink/10 text-center">
                  <Wand2 size={24} className="text-gold mx-auto mb-2" />
                  <p className="text-xs uppercase opacity-60 font-bold">Arcane</p>
                  <p className="text-3xl font-display">{currentPlayer?.resources.arcane || 0}</p>
                </div>
                <div className="bg-ink/5 p-4 rounded-2xl border border-ink/10 text-center">
                  <Zap size={24} className="text-cyan-600 mx-auto mb-2" />
                  <p className="text-xs uppercase opacity-60 font-bold">Ink</p>
                  <p className="text-3xl font-display">{currentPlayer?.resources.ink || 0}</p>
                </div>
                <div className="bg-ink/5 p-4 rounded-2xl border border-ink/10 text-center">
                  <Flame size={24} className="text-red-700 mx-auto mb-2" />
                  <p className="text-xs uppercase opacity-60 font-bold">Corrupt</p>
                  <p className="text-3xl font-display">{currentPlayer?.status.corruption || 0}</p>
                </div>
                <div className="bg-ink/5 p-4 rounded-2xl border border-ink/10 text-center">
                  <Shield size={24} className="text-green-700 mx-auto mb-2" />
                  <p className="text-xs uppercase opacity-60 font-bold">Status</p>
                  <p className="text-sm font-bold truncate mt-1">
                    {currentPlayer?.status.cursedTurns ? 'Cursed' : currentPlayer?.status.blessedTurns ? 'Blessed' : 'Clear'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showArchive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink/80 backdrop-blur-md z-[200] flex items-center justify-center p-4"
          >
            <div className="bg-paper text-ink rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative">
              <button
                onClick={() => setShowArchive(false)}
                className="absolute top-6 right-6 p-2 hover:bg-ink/5 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
              <h2 className="text-2xl font-display italic mb-6 text-center">Archive & Relics</h2>
              <div className="text-lg space-y-4 opacity-80 mb-6">
                <p className="flex justify-between border-b border-ink/10 pb-2"><span>Fate Cards:</span> <span className="font-bold">{currentPlayer?.inventory.fateCards?.length || 0}</span></p>
                <p className="flex justify-between border-b border-ink/10 pb-2"><span>Arcane Cards:</span> <span className="font-bold">{currentPlayer?.inventory.arcaneCards?.length || 0}</span></p>
                <p className="flex justify-between border-b border-ink/10 pb-2"><span>Active Quests:</span> <span className="font-bold">{currentPlayer?.inventory.questCards?.length || 0}</span></p>
                <p className="flex justify-between text-gold font-bold"><span>Relics:</span> <span>{currentPlayer?.inventory.relics?.length || 0}</span></p>
              </div>
              {currentPlayer?.inventory.relics?.length ? (
                <div className="mt-4">
                  <h3 className="text-sm uppercase tracking-widest opacity-50 mb-3 text-center">Relics & Trophies</h3>
                  <div className="pt-4 border-t border-ink/10 flex gap-3 flex-wrap justify-center">
                    {currentPlayer.inventory.relics?.map((r, idx) => {
                      const relicName = RELIC_TX[currentLanguage]?.[r.id]?.name || r.name;
                      const relicDesc = RELIC_TX[currentLanguage]?.[r.id]?.description || r.description;
                      const isEgg = r.isEasterEgg;
                      return (
                        <div 
                          key={`${r.id}-${idx}`} 
                          title={`${relicName}: ${relicDesc}`} 
                          className={`w-12 h-12 rounded-full flex items-center justify-center cursor-help transition-all duration-500 relative ${
                            isEgg 
                              ? 'bg-gold text-ink shadow-[0_0_20px_rgba(212,175,55,0.6)] border-2 border-gold animate-pulse' 
                              : 'bg-gold/20 text-gold hover:bg-gold/30'
                          }`}
                        >
                          {getRelicIcon(r)}
                          {isEgg && (
                            <motion.div
                              animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="absolute -top-1 -right-1 text-white"
                            >
                              <Sparkles size={14} />
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-center opacity-50 italic text-sm">No relics acquired yet.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPaused && appState === 'playing' && (
          <motion.div
            key="paused"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink/80 backdrop-blur-md z-[100] flex items-center justify-center"
          >
            <div className="text-center">
              <h2 className="text-6xl font-display italic text-paper mb-8">Journey Paused</h2>
              <div className="flex flex-col gap-4 max-w-xs mx-auto">
                <button
                  onClick={() => setTurnPhase('ready')}
                  className="w-full py-4 bg-gold text-ink rounded-2xl font-bold uppercase tracking-widest"
                >
                  Resume Journey
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full py-4 border border-paper/20 text-paper rounded-2xl font-bold uppercase tracking-widest"
                >
                  Exit to Menu
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <RulesModal open={showRules} onClose={() => setShowRules(false)} />

            <AnimatePresence>
              {activeSpace && (
                <motion.div
                  key="active-space"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-ink/80 backdrop-blur-md z-[500] flex items-center justify-center p-4"
                >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-md w-full glass-panel rounded-[2.5rem] p-6 shadow-2xl border-4 border-gold/20"
            >
              <div className="text-center mb-4">
                <h2 className="text-[10px] uppercase tracking-[0.4em] font-bold mb-1 opacity-40 font-sans">
                  Current Task
                </h2>
                <h3 className="text-2xl font-display italic text-ink mb-3">{SPACE_TX[currentLanguage]?.[activeSpace.id]?.name || activeSpace.name}</h3>

                {activeSpace.image ? (
                  <div className="mb-3 flex justify-center">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gold/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <img 
                        src={activeSpace.image} 
                        alt={SPACE_TX[currentLanguage]?.[activeSpace.id]?.name || activeSpace.name} 
                        className="w-24 h-36 object-contain bg-ink/5 rounded-xl shadow-2xl border-2 border-gold/30 relative z-10 transform -rotate-2 group-hover:rotate-0 transition-transform duration-500 p-1"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gold/10 text-gold mb-2">
                    {activeSpace.type === 'pillar' ? (
                      <Crown size={24} />
                    ) : activeSpace.type === 'property' ? (
                      <MapIcon size={24} />
                    ) : activeSpace.type === 'fate' ? (
                      <Scroll size={24} />
                    ) : activeSpace.type === 'arcane' ? (
                      <Wand2 size={24} />
                    ) : activeSpace.type === 'portal' ? (
                      <Key size={24} />
                    ) : (
                      <Compass size={24} />
                    )}
                  </div>
                )}
              </div>

              <div className="bg-ink/5 p-4 rounded-[1.5rem] border border-ink/10 mb-4 text-center">
                <p className="text-lg font-serif italic mb-2 leading-relaxed">
                  {SPACE_TX[currentLanguage]?.[activeSpace.id]?.prompt ? `"${SPACE_TX[currentLanguage]?.[activeSpace.id]?.prompt}"` : (SPACE_TX[currentLanguage]?.[activeSpace.id]?.description || activeSpace.description)}
                </p>
                <p className="text-[10px] opacity-60 font-sans uppercase tracking-widest font-bold">
                  {activeSpace.description}
                </p>
                
                {(activeSpace.cost || activeSpace.reward) && (
                  <div className="mt-4 pt-4 border-t border-ink/10 flex flex-col gap-1">
                    {activeSpace.cost && (
                      <div className="flex items-center justify-center gap-4 text-xs font-bold text-red-700 uppercase tracking-widest">
                        <span>Cost:</span>
                        {activeSpace.cost.ink && <span className="flex items-center gap-1"><Zap size={10} /> {activeSpace.cost.ink} Ink</span>}
                        {activeSpace.cost.arcane && <span className="flex items-center gap-1"><Wand2 size={10} /> {activeSpace.cost.arcane} Arcane</span>}
                        {activeSpace.cost.fate && <span className="flex items-center gap-1"><Scroll size={10} /> {activeSpace.cost.fate} Fate</span>}
                      </div>
                    )}
                    {activeSpace.reward && (
                      <div className="flex items-center justify-center gap-4 text-xs font-bold text-green-700 uppercase tracking-widest">
                        <span>Reward:</span>
                        {activeSpace.reward.books && <span className="flex items-center gap-1"><Book size={10} /> {activeSpace.reward.books} Books</span>}
                        {activeSpace.reward.arcane && <span className="flex items-center gap-1"><Wand2 size={10} /> {activeSpace.reward.arcane} Arcane</span>}
                        {activeSpace.reward.fate && <span className="flex items-center gap-1"><Scroll size={10} /> {activeSpace.reward.fate} Fate</span>}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                {(activeSpace.type === 'property' || activeSpace.type === 'pillar') && (
                  <button
                    onClick={() => completePrompt(activeSpace.id)}
                    disabled={
                      (activeSpace.cost?.ink || 0) > (currentPlayer?.resources.ink || 0) ||
                      (activeSpace.cost?.arcane || 0) > (currentPlayer?.resources.arcane || 0) ||
                      (activeSpace.cost?.fate || 0) > (currentPlayer?.resources.fate || 0)
                    }
                    className={`w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all shadow-lg ${
                      ((activeSpace.cost?.ink || 0) > (currentPlayer?.resources.ink || 0) ||
                      (activeSpace.cost?.arcane || 0) > (currentPlayer?.resources.arcane || 0) ||
                      (activeSpace.cost?.fate || 0) > (currentPlayer?.resources.fate || 0))
                        ? 'bg-ink/10 text-ink/20 cursor-not-allowed'
                        : 'bg-ink text-paper hover:bg-gold hover:text-ink'
                    }`}
                  >
                    {((activeSpace.cost?.ink || 0) > (currentPlayer?.resources.ink || 0) ||
                      (activeSpace.cost?.arcane || 0) > (currentPlayer?.resources.arcane || 0) ||
                      (activeSpace.cost?.fate || 0) > (currentPlayer?.resources.fate || 0))
                        ? 'Insufficient Resources'
                        : 'Mark as Completed'}
                  </button>
                )}

                {!(activeSpace.type === 'property' || activeSpace.type === 'pillar') && (
                  <button
                    onClick={applySimpleSpaceEffect}
                    className="w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all shadow-lg bg-ink text-paper hover:bg-gold hover:text-ink"
                  >
                    Resolve Space
                  </button>
                )}

                {(activeSpace.type === 'property' || activeSpace.type === 'pillar') && (
                  <button
                    onClick={() => {
                      setActiveSpace(null);
                      setTurnPhase('turn_complete');
                      const spaceName = SPACE_TX[currentLanguage]?.[activeSpace.id]?.name || activeSpace.name;
                      addLog(`${currentPlayer?.name} left ${spaceName} unresolved.`);
                    }}
                    className="w-full py-4 border-2 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all border-ink/20 hover:bg-ink/5"
                  >
                    Skip Prompt
                  </button>
                )}

                {(activeSpace.type === 'fate' || activeSpace.type === 'arcane') && (
                  <button
                    onClick={handleContinueSpace}
                    className="w-full py-4 border-2 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all border-ink/20 hover:bg-ink/5"
                  >
                    Draw Card
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

            <AnimatePresence>
              {turnPhase === 'seer_choosing' && seerCards.length > 0 && (
                <motion.div
                  key="seer-cards"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-ink/90 backdrop-blur-xl z-[500] flex items-center justify-center p-4"
                >
            <div className="max-w-4xl w-full text-center">
              <h2 className="text-5xl font-display italic text-white mb-2">Seer's Insight</h2>
              <p className="text-white/60 mb-12 uppercase tracking-[0.3em] text-xs">Choose the thread of fate you wish to follow</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {seerCards.map((card, idx) => {
                  const cardTitle = CARD_TX[currentLanguage]?.[card.id]?.title || card.title;
                  const cardDesc = CARD_TX[currentLanguage]?.[card.id]?.description || card.description;
                  return (
                    <motion.div
                      key={`${card.id}-${idx}`}
                      whileHover={{ scale: 1.05, y: -10 }}
                      className="bg-fate-red border-2 border-white/20 rounded-[2.5rem] p-10 text-white shadow-2xl cursor-pointer group"
                      onClick={() => {
                        setActiveCard({ card, type: 'fate' });
                        setTurnPhase('resolving_card');
                        setSeerCards([]);
                        addLog(`${currentPlayer?.name} chose the fate: ${cardTitle}.`);
                      }}
                    >
                      <div className="mb-6 flex justify-center opacity-40 group-hover:opacity-100 transition-opacity">
                        <Scroll size={48} />
                      </div>
                      <h3 className="text-3xl font-display italic mb-4">{cardTitle}</h3>
                      <div className="h-px bg-white/20 mb-6" />
                      <p className="text-lg leading-relaxed opacity-80 mb-8 font-serif italic">
                        "{cardDesc}"
                      </p>
                      <div className="text-[10px] uppercase tracking-widest font-bold text-white/40 group-hover:text-white transition-colors">
                        Select this Fate
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeCard && (
          <motion.div
            key="active-card"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className={`max-w-md w-full rounded-[2.5rem] p-10 text-center shadow-2xl border-4 ${
              activeCard.type === 'fate'
                ? 'bg-fate-red border-white/20 text-white'
                : activeCard.type === 'quest'
                ? 'bg-emerald-800 border-white/20 text-white'
                : 'bg-arcane-gray border-gold/20 text-paper'
            }`}
          >
            <div className="mb-6 flex justify-center">
              {activeCard.type === 'fate' ? (
                <Scroll size={48} />
              ) : activeCard.type === 'quest' ? (
                <Trophy size={48} />
              ) : (
                <Book size={48} />
              )}
            </div>
            <h3 className="text-4xl font-display italic mb-4">
              {CARD_TX[currentLanguage]?.[activeCard.card.id]?.title || activeCard.card.title}
            </h3>
            <div className="h-px bg-current opacity-20 mb-6" />
            <p className="text-lg leading-relaxed opacity-90 mb-8 font-serif italic">
              "{CARD_TX[currentLanguage]?.[activeCard.card.id]?.description || activeCard.card.description}"
            </p>

            {foundEggThisTurn && (
              <motion.div 
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                className="mb-8 p-4 bg-gold/20 border border-gold/40 rounded-2xl flex items-center gap-4 text-left relative overflow-hidden"
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-gold text-ink rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.5)] animate-pulse">
                    {getRelicIcon(foundEggThisTurn)}
                  </div>
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-1 -right-1 text-white"
                  >
                    <Sparkles size={14} />
                  </motion.div>
                </div>
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest font-bold text-gold mb-1">Easter Egg Found!</h4>
                  <p className="text-sm font-display italic text-white leading-tight">
                    {RELIC_TX[currentLanguage]?.[foundEggThisTurn.id]?.name || foundEggThisTurn.name}
                  </p>
                </div>
              </motion.div>
            )}

            <button
              onClick={applyCardEffect}
              className={`w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-sm transition-all ${
                activeCard.type === 'fate'
                  ? 'bg-white text-fate-red hover:bg-paper'
                  : activeCard.type === 'quest'
                  ? 'bg-white text-emerald-800 hover:bg-paper'
                  : 'bg-gold text-ink hover:bg-white'
              }`}
            >
              {activeCard.type === 'quest' ? 'Accept Quest' : 'Resolve Card'}
            </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

            <Marketplace
              isOpen={showTrade}
              onClose={() => setShowTrade(false)}
              items={marketItemsState.map(item => ({ ...item, basePrice: dynamicPrice(item) }))}
              selectedItem={selectedMarketItem}
              onSelectItem={setSelectedMarketItem}
              onBuy={buyFromMarketplace}
              onSell={sellToMarketplace}
              canOpenMarketplace={canOpenMarketplace()}
              notification={marketNotification}
              currentPlayer={currentPlayer}
              players={players}
              tradeBuilder={tradeBuilder}
              setTradeBuilder={setTradeBuilder}
              toggleTradeItem={toggleTradeItem}
              onProposeTrade={() => {
                setPendingTrade({
                  fromPlayerId: currentPlayer!.id,
                  toPlayerId: tradeBuilder.toPlayerId!,
                  offer: tradeBuilder.offer,
                  request: tradeBuilder.request,
                });
                setShowTrade(false);
                addLog(`Trade proposed to ${players.find((p) => p.id === tradeBuilder.toPlayerId)?.name}.`);
              }}
              tradeValueOffer={calculateTradeValue(tradeBuilder.offer, currentPlayer)}
              tradeValueRequest={tradeBuilder.toPlayerId ? calculateTradeValue(tradeBuilder.request, players.find((p) => p.id === tradeBuilder.toPlayerId)) : 0}
              hasTradedThisTurn={hasTradedThisTurn}
              BOARD_SPACES={BOARD_SPACES}
              CARD_TX={CARD_TX}
              currentLanguage={currentLanguage}
              tx={(key) => {
                const map: Record<string, string> = {
                  marketplace_title: 'Marketplace of Tomes',
                  market_tab: 'The Merchant',
                  trade_tab: 'Player Trade',
                  demand: 'Demand',
                  buy: 'Buy',
                  sell: 'Sell'
                };
                return map[key] || key;
              }}
            />

            <AnimatePresence>
              {pendingTrade && (
                <motion.div
                  key="pending-trade"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-ink/90 backdrop-blur-xl z-[500] flex items-center justify-center p-4"
                >
            <div className="max-w-2xl w-full glass-panel rounded-[3rem] p-10 shadow-2xl text-center">
              <h2 className="text-3xl font-display italic text-ink mb-2">Trade Proposal</h2>
              <p className="text-sm opacity-60 mb-8 italic">
                {players.find((p) => p.id === pendingTrade.fromPlayerId)?.name} is offering a trade
              </p>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="space-y-3 text-left">
                  <h4 className="text-[10px] uppercase font-bold opacity-40">They Offer</h4>
                  <div className="space-y-1">
                    {pendingTrade.offer.map((item, i) => {
                      let title = '';
                      if (item.type === 'space') title = SPACE_TX[currentLanguage]?.[item.id]?.name || BOARD_SPACES[item.id].name;
                      else if (item.type === 'ink') title = `${item.amount} Ink`;
                      else title = CARD_TX[currentLanguage]?.[item.card.id]?.title || item.card.title;
                      return (
                        <div key={i} className="text-xs font-display italic">
                          {title}
                        </div>
                      );
                    })}
                    {pendingTrade.offer.length === 0 && <div className="text-xs opacity-40 italic">Nothing</div>}
                  </div>
                </div>
                <div className="space-y-3 text-left">
                  <h4 className="text-[10px] uppercase font-bold opacity-40">They Request</h4>
                  <div className="space-y-1">
                    {pendingTrade.request.map((item, i) => {
                      let title = '';
                      if (item.type === 'space') title = SPACE_TX[currentLanguage]?.[item.id]?.name || BOARD_SPACES[item.id].name;
                      else if (item.type === 'ink') title = `${item.amount} Ink`;
                      else title = CARD_TX[currentLanguage]?.[item.card.id]?.title || item.card.title;
                      return (
                        <div key={i} className="text-xs font-display italic">
                          {title}
                        </div>
                      );
                    })}
                    {pendingTrade.request.length === 0 && <div className="text-xs opacity-40 italic">Nothing</div>}
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => executeTrade(pendingTrade)}
                  className="flex-1 py-4 bg-ink text-paper rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-gold hover:text-ink transition-all"
                >
                  Accept Trade
                </button>
                <button
                  onClick={() => {
                    setPendingTrade(null);
                    addLog("Trade proposal rejected.");
                  }}
                  className="flex-1 py-4 bg-ink/5 text-ink rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-fate-red hover:text-white transition-all"
                >
                  Reject
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {appState === 'finished' && pendingWinnerId !== null && (
          <WinScreen
            key="win-screen"
            winner={players.find(p => p.id === pendingWinnerId)!}
            players={players}
            logs={logs}
            device="desktop" // You might want to pass the actual device state here if available in App.tsx, or let WinScreen use its hook
            audioEnabled={sfxEnabled}
            audioVolume={sfxVolume}
            victorySoundUrl={customSoundUrls.milestone}
            onPlayAgain={() => window.location.reload()}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLapCelebration && currentPlayer && (
          <LapCelebration key="lap-celebration" player={currentPlayer} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <SettingsMenu 
            key="settings-menu" 
            onClose={() => setShowSettings(false)} 
            currentLanguage={currentLanguage}
            musicEnabled={musicEnabled}
            onToggleMusic={() => setMusicEnabled(!musicEnabled)}
            musicVolume={musicVolume}
            onUpdateMusicVolume={setMusicVolume}
            sfxEnabled={sfxEnabled}
            onToggleSfx={() => setSfxEnabled(!sfxEnabled)}
            sfxVolume={sfxVolume}
            onUpdateSfxVolume={setSfxVolume}
            notificationsEnabled={notificationsEnabled}
            onToggleNotifications={() => setNotificationsEnabled(!notificationsEnabled)}
            onSave={saveGame}
            onRedeemReward={handleRedeemReward}
            player={currentPlayer ? { 
              ink: currentPlayer.resources.ink, 
              fatePoints: currentPlayer.resources.fate, 
              inventory: currentPlayer.inventory 
            } : (players[0] ? {
              ink: players[0].resources.ink,
              fatePoints: players[0].resources.fate,
              inventory: players[0].inventory
            } : { ink: 0, fatePoints: 0, inventory: { books: [] } })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* =========================
   FANTASY CHARACTER GENERATOR
========================= */

const CLASSES = [
  { id: 'mage', name: 'Mage', icon: Wand2, emoji: '🔮', bonus: '+1 Arcane card when landing on Arcane' },
  { id: 'warrior', name: 'Warrior', icon: Sword, emoji: '⚔️', bonus: 'Ignore 1 negative effect per turn' },
  { id: 'seer', name: 'Seer', icon: Sparkles, emoji: '👁️', bonus: 'Peek at Fate cards before drawing' },
  { id: 'noble', name: 'Noble', icon: Crown, emoji: '👑', bonus: 'Trade advantage (extra value in trades)' },
];

/* =========================
   RULES MODAL
========================= */

function RulesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="rules"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-ink/90 backdrop-blur-xl z-[500] flex items-center justify-center p-4"
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
              {GAME_RULES.map((rule, i) => (
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
}
