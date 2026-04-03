import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Coins, Sparkles, AlertTriangle, Clock, Scroll } from 'lucide-react';

// ---------------- TYPES ----------------
export interface MarketItem {
  id: string;
  name: string;
  category: string;
  type: 'card' | 'resource';
  resourceType?: string;
  quantity: number;
  basePrice: number;
  demand: number;
  icon: string;
}

export interface TradeItem {
  type: 'space' | 'fate_card' | 'arcane_card' | 'ink';
  id?: string | number;
  card?: any;
  amount?: number;
}

// ---------------- MARKET CARD ----------------
const MarketItemCard = ({
  item,
  onBuy,
  onSell,
  player,
  canOpenMarketplace,
  tx
}: any) => {
  const owned = item.resourceType ? (player?.resources?.[item.resourceType] || 0) : 0;
  const canBuy = canOpenMarketplace && (player?.resources?.ink || 0) >= item.basePrice && item.quantity > 0;
  const canSell = item.type === 'resource' && owned > 0;

  return (
    <div className="p-4 rounded-xl border border-white/10 bg-white/5 hover:border-white/20 transition-all group">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl group-hover:scale-110 transition-transform">{item.icon}</span>
        <div className="flex flex-col">
          <span className="font-bold text-white leading-tight" style={{ fontFamily: '"Cormorant Garamond", serif' }}>{item.name}</span>
          <span className="text-[10px] text-white/40 uppercase tracking-widest">{item.type}</span>
        </div>
        <div className="ml-auto flex flex-col items-end">
          <span className="text-xs font-bold text-[#e7c77f] bg-[#e7c77f]/10 px-2 py-0.5 rounded">x{item.quantity}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-black/30 p-2 rounded-lg flex flex-col items-center justify-center">
          <span className="text-[10px] text-white/40 uppercase mb-1">{tx('price') || 'Price'}</span>
          <div className="flex items-center gap-1 text-[#e7c77f] font-bold">
            <Coins size={14} />
            <span>{item.basePrice}</span>
          </div>
        </div>
        <div className="bg-black/30 p-2 rounded-lg flex flex-col items-center justify-center">
          <span className="text-[10px] text-white/40 uppercase mb-1">{tx('demand') || 'Demand'}</span>
          <span className="text-white font-bold">{item.demand}x</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onBuy(item)}
          disabled={!canBuy}
          className={`flex-1 py-2 rounded-lg font-bold uppercase tracking-wider text-[10px] transition-all ${
            canBuy 
              ? 'bg-gradient-to-r from-[#8f6335] to-[#b98446] text-[#fff4dc] hover:shadow-[0_0_15px_rgba(185,132,70,0.4)]' 
              : 'bg-white/5 text-white/20 cursor-not-allowed'
          }`}
        >
          {tx('buy') || 'Buy'}
        </button>
        {item.type === 'resource' && (
          <button
            onClick={() => onSell(item)}
            disabled={!canSell}
            className={`flex-1 py-2 rounded-lg font-bold uppercase tracking-wider text-[10px] border transition-all ${
              canSell 
                ? 'border-[#e7c77f] text-[#e7c77f] hover:bg-[#e7c77f]/10' 
                : 'border-white/10 text-white/20 cursor-not-allowed'
            }`}
          >
            {tx('sell') || 'Sell'}
          </button>
        )}
      </div>
    </div>
  );
};

// ---------------- TRADE ITEM CARD ----------------
const TradeItemCard = ({
  item,
  isOffered,
  onToggle,
  BOARD_SPACES,
  CARD_TX,
  currentLanguage
}: any) => {
  const getTitle = () => {
    if (item.type === 'space') return BOARD_SPACES[item.id!]?.name || `Space ${item.id}`;
    if (item.type === 'ink') return `${item.amount} Ink Points`;
    const card = item.card;
    return CARD_TX[currentLanguage]?.[card.id]?.title || card.title;
  };

  const getIcon = () => {
    if (item.type === 'space') return '🏰';
    if (item.type === 'ink') return '🖋️';
    return item.type === 'fate_card' ? '📜' : '🔮';
  };

  const getColorClass = () => {
    if (item.type === 'space') return 'border-[#e7c77f]/30 bg-white/5 text-[#e7c77f]';
    if (item.type === 'ink') return 'border-blue-500/30 bg-blue-500/5 text-blue-300';
    return item.type === 'fate_card' 
      ? 'border-red-900/30 bg-red-900/5 text-red-300' 
      : 'border-purple-900/30 bg-purple-900/5 text-purple-300';
  };

  return (
    <div className={`p-3 rounded-xl border flex items-center justify-between transition-all ${getColorClass()}`}>
      <div className="flex items-center gap-3">
        <span className="text-xl">{getIcon()}</span>
        <span className="text-sm font-medium" style={{ fontFamily: '"Cormorant Garamond", serif' }}>{getTitle()}</span>
      </div>
      <button
        onClick={onToggle}
        className={`text-[10px] uppercase font-bold px-3 py-1 rounded-lg transition-all ${
          isOffered
            ? 'bg-[#e7c77f] text-[#120f18] shadow-[0_0_10px_rgba(231,199,127,0.3)]'
            : 'border border-current opacity-60 hover:opacity-100'
        }`}
      >
        {isOffered ? 'Selected' : 'Select'}
      </button>
    </div>
  );
};

// ---------------- MAIN COMPONENT ----------------
export interface MarketplaceProps {
  isOpen: boolean;
  onClose: () => void;
  items: MarketItem[];
  selectedItem: MarketItem | null;
  onSelectItem: (item: MarketItem) => void;
  onBuy: (item: MarketItem) => void;
  onSell: (item: MarketItem) => void;
  canOpenMarketplace: boolean;
  notification: { type: 'success' | 'error' | 'info'; message: string } | null;
  currentPlayer: any;
  players: any[];
  tradeBuilder: {
    toPlayerId: number | null;
    offer: TradeItem[];
    request: TradeItem[];
  };
  setTradeBuilder: React.Dispatch<React.SetStateAction<any>>;
  toggleTradeItem: (list: 'offer' | 'request', item: TradeItem) => void;
  onProposeTrade: () => void;
  tradeValueOffer: number;
  tradeValueRequest: number;
  hasTradedThisTurn: boolean;
  BOARD_SPACES: Record<string, any>;
  CARD_TX: Record<string, any>;
  currentLanguage: string;
  tx: (key: string) => string;
}

const Marketplace: React.FC<MarketplaceProps> = ({
  isOpen,
  onClose,
  items,
  selectedItem,
  onSelectItem,
  onBuy,
  onSell,
  canOpenMarketplace,
  notification,
  currentPlayer,
  players,
  tradeBuilder,
  setTradeBuilder,
  toggleTradeItem,
  onProposeTrade,
  tradeValueOffer,
  tradeValueRequest,
  hasTradedThisTurn,
  BOARD_SPACES,
  CARD_TX,
  currentLanguage,
  tx
}) => {
  const [activeTab, setActiveTab] = useState<'market' | 'trade'>('market');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-[#1a1524] border-2 border-[#c5a059] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] p-6 w-full max-w-6xl relative flex flex-col max-h-[90vh] overflow-hidden"
          >
            {/* Decorative Corners */}
            <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-[#c5a059]/30 rounded-tl-2xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-[#c5a059]/30 rounded-br-2xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col">
                <h2 className="text-4xl text-[#e7c77f] leading-none" style={{ fontFamily: '"Pirata One", serif' }}>
                  {tx('marketplace_title') || 'Marketplace of Tomes'}
                </h2>
                <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] mt-2">Ancient Scrolls & Arcane Exchange</p>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Tabs */}
                <div className="flex bg-black/40 p-1 rounded-full border border-white/5">
                  <button
                    onClick={() => setActiveTab('market')}
                    className={`px-6 py-2 rounded-full font-bold uppercase tracking-wider text-[10px] transition-all flex items-center gap-2 ${
                      activeTab === 'market' ? 'bg-[#e7c77f] text-[#120f18]' : 'text-white/40 hover:text-white'
                    }`}
                  >
                    <Scroll size={14} /> {tx('market_tab') || 'The Merchant'}
                  </button>
                  <button
                    onClick={() => setActiveTab('trade')}
                    className={`px-6 py-2 rounded-full font-bold uppercase tracking-wider text-[10px] transition-all flex items-center gap-2 ${
                      activeTab === 'trade' ? 'bg-[#e7c77f] text-[#120f18]' : 'text-white/40 hover:text-white'
                    }`}
                  >
                    <Sparkles size={14} /> {tx('trade_tab') || 'Player Trade'}
                  </button>
                </div>

                <button onClick={onClose} className="p-2 text-white/40 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>

            {notification && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-6 p-3 rounded-xl text-center font-bold text-xs uppercase tracking-widest border ${
                  notification.type === 'success' ? 'bg-green-900/20 text-green-400 border-green-900/50' :
                  notification.type === 'error' ? 'bg-red-900/20 text-red-400 border-red-900/50' :
                  'bg-blue-900/20 text-blue-400 border-blue-900/50'
                }`}
              >
                {notification.message}
              </motion.div>
            )}

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {activeTab === 'market' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                  {items.map(item => (
                    <MarketItemCard 
                      key={item.id}
                      item={item}
                      onBuy={onBuy}
                      onSell={onSell}
                      player={currentPlayer}
                      canOpenMarketplace={canOpenMarketplace}
                      tx={tx}
                    />
                  ))}
                </div>
              )}

              {activeTab === 'trade' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-4">
                  {/* Your Collection */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <h3 className="text-[10px] uppercase tracking-widest font-bold text-white/40">Your Collection</h3>
                      <span className="text-[10px] text-[#e7c77f] font-bold">{currentPlayer?.resources.ink} Ink</span>
                    </div>
                    <div className="space-y-2">
                      {/* Ink Trade Option */}
                      <div className="p-3 bg-blue-900/20 rounded-xl border border-blue-900/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🖋️</span>
                          <span className="text-sm text-blue-300" style={{ fontFamily: '"Cormorant Garamond", serif' }}>Ink Points (5)</span>
                        </div>
                        <button
                          onClick={() => toggleTradeItem('offer', { type: 'ink', amount: 5 })}
                          className={`text-[10px] uppercase font-bold px-3 py-1 rounded-lg transition-all ${
                            tradeBuilder.offer.some(i => i.type === 'ink')
                              ? 'bg-blue-600 text-white'
                              : 'text-blue-400 border border-blue-800/50 hover:bg-blue-900/30'
                          }`}
                        >
                          {tradeBuilder.offer.some(i => i.type === 'ink') ? 'Offered' : 'Offer'}
                        </button>
                      </div>

                      {currentPlayer?.completedSpaces.map((id: number) => (
                        <TradeItemCard 
                          key={`space-${id}`}
                          item={{ type: 'space', id }}
                          isOffered={tradeBuilder.offer.some(i => i.type === 'space' && i.id === id)}
                          onToggle={() => toggleTradeItem('offer', { type: 'space', id })}
                          BOARD_SPACES={BOARD_SPACES}
                          CARD_TX={CARD_TX}
                          currentLanguage={currentLanguage}
                        />
                      ))}
                      {currentPlayer?.inventory.fateCards.map((card: any, idx: number) => (
                        <TradeItemCard 
                          key={`fate-${card.id}-${idx}`}
                          item={{ type: 'fate_card', card }}
                          isOffered={tradeBuilder.offer.some(i => i.type === 'fate_card' && i.card.id === card.id)}
                          onToggle={() => toggleTradeItem('offer', { type: 'fate_card', card })}
                          BOARD_SPACES={BOARD_SPACES}
                          CARD_TX={CARD_TX}
                          currentLanguage={currentLanguage}
                        />
                      ))}
                      {currentPlayer?.inventory.arcaneCards.map((card: any, idx: number) => (
                        <TradeItemCard 
                          key={`arcane-${card.id}-${idx}`}
                          item={{ type: 'arcane_card', card }}
                          isOffered={tradeBuilder.offer.some(i => i.type === 'arcane_card' && i.card.id === card.id)}
                          onToggle={() => toggleTradeItem('offer', { type: 'arcane_card', card })}
                          BOARD_SPACES={BOARD_SPACES}
                          CARD_TX={CARD_TX}
                          currentLanguage={currentLanguage}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Partner Selection */}
                  <div className="space-y-6">
                    <h3 className="text-[10px] uppercase tracking-widest font-bold text-white/40 border-b border-white/10 pb-2">Select Partner</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {players.filter(p => p.id !== currentPlayer?.id).map(p => (
                        <button
                          key={p.id}
                          onClick={() => setTradeBuilder((prev: any) => ({ ...prev, toPlayerId: p.id, request: [] }))}
                          className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${
                            tradeBuilder.toPlayerId === p.id 
                              ? 'border-[#e7c77f] bg-[#e7c77f]/10 shadow-[0_0_15px_rgba(231,199,127,0.2)]' 
                              : 'border-white/5 bg-white/5 opacity-40 hover:opacity-100'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full border-2 border-white/20 shadow-lg" style={{ backgroundColor: p.color }} />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-white">{p.name}</span>
                        </button>
                      ))}
                    </div>

                    {tradeBuilder.toPlayerId && (
                      <div className="space-y-2 mt-4">
                        <h3 className="text-[10px] uppercase tracking-widest font-bold text-white/40 border-b border-white/10 pb-2">Their Collection</h3>
                        
                        {/* Ink Trade Option */}
                        <div className="p-3 bg-blue-900/20 rounded-xl border border-blue-900/30 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🖋️</span>
                            <span className="text-sm text-blue-300" style={{ fontFamily: '"Cormorant Garamond", serif' }}>Ink Points (5)</span>
                          </div>
                          <button
                            onClick={() => toggleTradeItem('request', { type: 'ink', amount: 5 })}
                            className={`text-[10px] uppercase font-bold px-3 py-1 rounded-lg transition-all ${
                              tradeBuilder.request.some(i => i.type === 'ink')
                                ? 'bg-blue-600 text-white'
                                : 'text-blue-400 border border-blue-800/50 hover:bg-blue-900/30'
                            }`}
                          >
                            {tradeBuilder.request.some(i => i.type === 'ink') ? 'Requested' : 'Request'}
                          </button>
                        </div>

                        {players.find(p => p.id === tradeBuilder.toPlayerId)?.completedSpaces.map((id: number) => (
                          <TradeItemCard 
                            key={`req-space-${id}`}
                            item={{ type: 'space', id }}
                            isOffered={tradeBuilder.request.some(i => i.type === 'space' && i.id === id)}
                            onToggle={() => toggleTradeItem('request', { type: 'space', id })}
                            BOARD_SPACES={BOARD_SPACES}
                            CARD_TX={CARD_TX}
                            currentLanguage={currentLanguage}
                          />
                        ))}
                        {players.find(p => p.id === tradeBuilder.toPlayerId)?.inventory.fateCards.map((card: any, idx: number) => (
                          <TradeItemCard 
                            key={`req-fate-${card.id}-${idx}`}
                            item={{ type: 'fate_card', card }}
                            isOffered={tradeBuilder.request.some(i => i.type === 'fate_card' && i.card.id === card.id)}
                            onToggle={() => toggleTradeItem('request', { type: 'fate_card', card })}
                            BOARD_SPACES={BOARD_SPACES}
                            CARD_TX={CARD_TX}
                            currentLanguage={currentLanguage}
                          />
                        ))}
                        {players.find(p => p.id === tradeBuilder.toPlayerId)?.inventory.arcaneCards.map((card: any, idx: number) => (
                          <TradeItemCard 
                            key={`req-arcane-${card.id}-${idx}`}
                            item={{ type: 'arcane_card', card }}
                            isOffered={tradeBuilder.request.some(i => i.type === 'arcane_card' && i.card.id === card.id)}
                            onToggle={() => toggleTradeItem('request', { type: 'arcane_card', card })}
                            BOARD_SPACES={BOARD_SPACES}
                            CARD_TX={CARD_TX}
                            currentLanguage={currentLanguage}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Summary */}
                  <div className="space-y-6 bg-black/40 p-6 rounded-2xl border border-white/5 h-fit sticky top-0">
                    <h3 className="text-[10px] uppercase tracking-widest font-bold text-white/40 border-b border-white/10 pb-2">Trade Summary</h3>

                    <div className="space-y-6">
                      <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold text-white/40">Your Offer</span>
                          <span className="text-xs text-white/60">{tradeBuilder.offer.length} Items</span>
                        </div>
                        <span className="text-3xl text-[#e7c77f]" style={{ fontFamily: '"Pirata One", serif' }}>{tradeValueOffer}</span>
                      </div>
                      
                      <div className="flex justify-center">
                        <div className="h-px w-full bg-white/10 relative">
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1a1524] px-2">
                            <Sparkles size={12} className="text-[#e7c77f]" />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold text-white/40">Your Request</span>
                          <span className="text-xs text-white/60">{tradeBuilder.request.length} Items</span>
                        </div>
                        <span className="text-3xl text-[#e7c77f]" style={{ fontFamily: '"Pirata One", serif' }}>{tradeValueRequest}</span>
                      </div>
                    </div>

                    {tradeBuilder.toPlayerId && Math.abs(tradeValueOffer - tradeValueRequest) > 5 && (
                      <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-xl flex items-start gap-3">
                        <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-red-300 uppercase tracking-wider leading-relaxed">
                          Highly Unbalanced Trade
                        </p>
                      </div>
                    )}

                    <button
                      disabled={!tradeBuilder.toPlayerId || (tradeBuilder.offer.length === 0 && tradeBuilder.request.length === 0) || hasTradedThisTurn}
                      onClick={onProposeTrade}
                      className="w-full py-4 bg-gradient-to-r from-[#8f6335] to-[#b98446] text-[#fff4dc] rounded-xl font-bold uppercase tracking-[0.2em] text-xs hover:shadow-[0_0_20px_rgba(185,132,70,0.4)] transition-all disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed"
                    >
                      {hasTradedThisTurn ? 'Cooldown Active' : 'Propose Trade'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Marketplace;
