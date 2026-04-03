import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Volume2, VolumeX, Gift, HelpCircle, Mail, X, Bell, Save, Facebook, Instagram, LogOut
} from "lucide-react";
import { LANGUAGES, type LanguageCode } from "../i18n";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { LegalDocLayout, FAQContent, TermsContent, PrivacyContent, RedeemGuideContent } from "./LegalDocs";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Props for settings menu
interface SettingsMenuProps {
  onClose: () => void;
  currentLanguage: LanguageCode;
  musicEnabled: boolean;
  onToggleMusic: () => void;
  musicVolume: number;
  onUpdateMusicVolume: (v: number) => void;
  sfxEnabled: boolean;
  onToggleSfx: () => void;
  sfxVolume: number;
  onUpdateSfxVolume: (v: number) => void;
  notificationsEnabled: boolean;
  onToggleNotifications: () => void;
  onSave: () => void;
  player: any; // for displaying balances
  onRedeemReward: (reward: any) => void; // function to handle rewards
  onSignOut?: () => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({
  onClose,
  currentLanguage,
  musicEnabled,
  onToggleMusic,
  musicVolume,
  onUpdateMusicVolume,
  sfxEnabled,
  onToggleSfx,
  sfxVolume,
  onUpdateSfxVolume,
  notificationsEnabled,
  onToggleNotifications,
  onSave,
  player,
  onRedeemReward,
  onSignOut,
}) => {
  const tx = (key: string) => LANGUAGES[currentLanguage]?.[key] || LANGUAGES['en'][key] || key;

  // Redeem code states
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemMessage, setRedeemMessage] = useState<string | null>(null);
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);
  const [rewardReceived, setRewardReceived] = useState<any>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);

  // Legal docs state
  const [activeDoc, setActiveDoc] = useState<'faq' | 'terms' | 'privacy' | 'redeem' | null>(null);

  const handleRedeemSubmit = async () => {
    if (!redeemCode.trim()) return;

    setIsRedeeming(true);
    setRedeemMessage('Checking code...');

    try {
      const codeRef = doc(db, 'redeemCodes', redeemCode.toUpperCase());
      const codeSnap = await getDoc(codeRef);

      if (codeSnap.exists()) {
        const codeData = codeSnap.data();
        if (codeData.redeemed) {
          setRedeemMessage('❌ This code has already been redeemed.');
        } else {
          // Redeem the code
          await updateDoc(codeRef, {
            redeemed: true,
            redeemedBy: auth.currentUser?.uid || 'anonymous'
          });

          let reward;
          try {
            reward = typeof codeData.reward === 'string' ? JSON.parse(codeData.reward) : codeData.reward;
          } catch (e) {
            console.error("Failed to parse reward:", e);
            reward = codeData.reward; // fallback
          }
          
          setRewardReceived(reward);
          setShowRewardAnimation(true);
          onRedeemReward(reward);
          setRedeemMessage(`✨ A magical gift appears!`);
        }
      } else {
        setRedeemMessage('❌ The code is invalid or has vanished!');
      }
    } catch (error: any) {
      console.error('Error redeeming code:', error);
      setRedeemMessage(`❌ Error: ${error?.message || 'An error occurred. Please try again.'}`);
      if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
        handleFirestoreError(error, OperationType.UPDATE, `redeemCodes/${redeemCode.trim()}`);
      }
    } finally {
      setIsRedeeming(false);
      setRedeemCode('');
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="settings-menu"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-3xl border border-gold/30 bg-paper shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="relative z-20 p-6 pb-0 flex items-center justify-between">
            <h2 className="text-3xl font-display italic text-ink">{tx('settings_title')}</h2>
            <button
              onClick={onClose}
              className="p-2 text-ink/60 hover:text-gold transition-colors rounded-full hover:bg-ink/5"
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-4 relative z-10 custom-scrollbar">

            {/* Player Balances (Fantasy style) */}
            {player && (
              <div className="space-y-2">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex justify-between font-bold">
                  <span>🖋 Ink Points</span> <span>{player.ink || 0}</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex justify-between font-bold">
                  <span>🔮 Fate Points</span> <span>{player.fatePoints || 0}</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex justify-between font-bold">
                  <span>📚 Books in Tome</span> <span>{player.inventory?.books?.length || 0}</span>
                </div>
              </div>
            )}

            {/* Music Settings */}
            <div className="glass-panel rounded-xl px-4 py-3 space-y-2">
              <button
                onClick={onToggleMusic}
                className="w-full flex items-center justify-between hover:bg-gold/5 transition-colors"
              >
                <div className="flex items-center gap-3 text-ink/80">
                  {musicEnabled ? <Volume2 size={18} className="text-gold" /> : <VolumeX size={18} className="text-ink/40" />}
                  <span className="font-medium">{tx('settings_sound')} (Music)</span>
                </div>
                <span className={`text-sm font-bold ${musicEnabled ? 'text-gold' : 'text-ink/40'}`}>
                  {musicEnabled ? tx('on') : tx('off')}
                </span>
              </button>
              {musicEnabled && (
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={musicVolume}
                  onChange={(e) => onUpdateMusicVolume(parseFloat(e.target.value))}
                  className="w-full accent-gold h-1 bg-ink/10 rounded-lg cursor-pointer mt-2"
                />
              )}
            </div>

            {/* SFX Settings */}
            <div className="glass-panel rounded-xl px-4 py-3 space-y-2">
              <button
                onClick={onToggleSfx}
                className="w-full flex items-center justify-between hover:bg-gold/5 transition-colors"
              >
                <div className="flex items-center gap-3 text-ink/80">
                  {sfxEnabled ? <Volume2 size={18} className="text-gold" /> : <VolumeX size={18} className="text-ink/40" />}
                  <span className="font-medium">{tx('settings_sound')} (SFX)</span>
                </div>
                <span className={`text-sm font-bold ${sfxEnabled ? 'text-gold' : 'text-ink/40'}`}>
                  {sfxEnabled ? tx('on') : tx('off')}
                </span>
              </button>
              {sfxEnabled && (
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={sfxVolume}
                  onChange={(e) => onUpdateSfxVolume(parseFloat(e.target.value))}
                  className="w-full accent-gold h-1 bg-ink/10 rounded-lg cursor-pointer mt-2"
                />
              )}
            </div>

            {/* Notifications */}
            <button
              onClick={onToggleNotifications}
              className="w-full flex items-center justify-between glass-panel rounded-xl px-4 py-3 hover:bg-gold/5 transition-colors"
            >
              <div className="flex items-center gap-3 text-ink/80">
                <Bell size={18} className={notificationsEnabled ? "text-gold" : "text-ink/40"} />
                <span className="font-medium">{tx('settings_notifications')}</span>
              </div>
              <span className={`text-sm font-bold ${notificationsEnabled ? 'text-gold' : 'text-ink/40'}`}>
                {notificationsEnabled ? tx('on') : tx('off')}
              </span>
            </button>

            {/* Redeem Code (Fantasy) */}
            <div className="glass-panel rounded-xl p-4 space-y-2 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift size={20} className="text-gold" />
                  <h3 className="font-bold text-ink/80">✨ Redeem Magical Code</h3>
                </div>
                <button 
                  onClick={() => setActiveDoc('redeem')}
                  className="p-1 text-ink/40 hover:text-gold transition-colors rounded-full hover:bg-ink/5"
                  title="How to redeem codes"
                >
                  <HelpCircle size={16} />
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value)}
                  placeholder="Enter your code..."
                  className="flex-1 px-3 py-2 rounded-xl bg-white border border-ink/20 text-black placeholder:text-ink/40"
                />
                <button
                  onClick={handleRedeemSubmit}
                  disabled={isRedeeming}
                  className="px-4 py-2 rounded-xl bg-gold font-bold hover:shadow-lg transition text-ink disabled:opacity-50"
                >
                  {isRedeeming ? 'Casting...' : 'Cast'}
                </button>
              </div>
              {redeemMessage && <p className="text-sm text-ink/80 mt-2">{redeemMessage}</p>}

              {/* Magical Reward Reveal */}
              <AnimatePresence>
                {showRewardAnimation && rewardReceived && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="fixed inset-0 flex flex-col items-center justify-center z-[10000] bg-black/60 backdrop-blur-sm p-4"
                  >
                    <motion.div
                      className="p-8 bg-gradient-to-br from-purple-800 via-pink-700 to-yellow-600 rounded-3xl shadow-2xl text-center text-white font-bold text-lg max-w-sm w-full border-4 border-gold/50 relative overflow-hidden"
                      initial={{ scale: 0.8, y: 50 }}
                      animate={{ scale: 1, y: 0 }}
                      transition={{ type: "spring", bounce: 0.5 }}
                    >
                      <h2 className="text-3xl font-display italic text-gold mb-4 drop-shadow-md">Reward Claimed!</h2>
                      
                      <div className="space-y-3 mb-6 text-left bg-black/20 p-4 rounded-xl">
                        {rewardReceived.ink && <p>🖋 Ink: <span className="text-gold">+{rewardReceived.ink}</span></p>}
                        {rewardReceived.fatePoints && <p>🔮 Fate: <span className="text-gold">+{rewardReceived.fatePoints}</span></p>}
                        {rewardReceived.books && rewardReceived.books.length > 0 && <p>📚 Books: <span className="text-gold">{rewardReceived.books.join(', ')}</span></p>}
                        {rewardReceived.merch && rewardReceived.merch.length > 0 && <p>🎁 Merch: <span className="text-gold">{rewardReceived.merch.join(', ')}</span></p>}
                        
                        {rewardReceived.digitalBooks && rewardReceived.digitalBooks.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-white/20">
                            <p className="mb-2 text-gold">📖 Digital Deliveries:</p>
                            {rewardReceived.digitalBooks.map((b: any, i: number) => (
                              <a key={i} href={b.url} target="_blank" rel="noopener noreferrer" className="block w-full py-2 px-4 bg-white text-ink rounded-lg text-sm hover:bg-gold transition-colors mb-2 text-center">
                                Open: {b.title}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>

                      <button 
                        onClick={() => setShowRewardAnimation(false)}
                        className="w-full py-3 bg-gold text-ink rounded-xl font-bold uppercase tracking-widest hover:bg-white transition-colors shadow-lg"
                      >
                        Awesome!
                      </button>
                    </motion.div>
                    
                    {/* Floating sparkles */}
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 bg-gold/80 rounded-full absolute pointer-events-none"
                        style={{
                          top: `${Math.random() * 100}%`,
                          left: `${Math.random() * 100}%`,
                        }}
                        animate={{ y: [-20, 20], x: [-10, 10] }}
                        transition={{ repeat: Infinity, duration: 1 + Math.random() }}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Save Game */}
            <button 
              onClick={() => { onSave(); onClose(); }}
              className="w-full flex items-center gap-3 glass-panel rounded-xl px-4 py-3 hover:bg-gold/5 transition-colors text-ink font-bold border-2 border-gold/20"
            >
              <Save size={18} className="text-gold" />
              <span className="flex-1 text-left">Save Game Progression</span>
              <div className="text-[10px] uppercase tracking-wider text-gold/60 font-bold bg-gold/5 px-2 py-1 rounded">Local Save</div>
            </button>

            {/* Switch Player */}
            {onSignOut && (
              <button 
                onClick={() => { onSignOut(); onClose(); }}
                className="w-full flex items-center gap-3 glass-panel rounded-xl px-4 py-3 hover:bg-red-500/10 transition-colors text-red-600 font-bold border-2 border-red-500/20"
              >
                <LogOut size={18} />
                <span className="flex-1 text-left">Switch Player Profile</span>
              </button>
            )}

            {/* Support / Contact / Social */}
            <div className="flex gap-3">
              <button onClick={() => setActiveDoc('faq')} className="flex-1 flex justify-center items-center glass-panel rounded-xl py-3 hover:bg-gold/10 transition-colors" title="Support & FAQ">
                <HelpCircle size={24} className="text-gold" />
              </button>
              <a href="mailto:moonspinepress@gmail.com" className="flex-1 flex justify-center items-center glass-panel rounded-xl py-3 hover:bg-gold/10 transition-colors" title="Contact">
                <Mail size={24} className="text-gold" />
              </a>
              <a href="https://www.facebook.com/authorjezzadeep" target="_blank" rel="noopener noreferrer" className="flex-1 flex justify-center items-center glass-panel rounded-xl py-3 hover:bg-gold/10 transition-colors" title="Facebook">
                <Facebook size={24} className="text-gold" />
              </a>
              <a href="https://www.instagram.com/jezzadeep.author" target="_blank" rel="noopener noreferrer" className="flex-1 flex justify-center items-center glass-panel rounded-xl py-3 hover:bg-gold/10 transition-colors" title="Instagram">
                <Instagram size={24} className="text-gold" />
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-ink/10 text-xs text-center space-x-6 text-ink/60 font-medium relative z-10 pb-2">
            <button onClick={() => setActiveDoc('terms')} className="hover:text-gold transition-colors">Terms of Use</button>
            <button onClick={() => setActiveDoc('privacy')} className="hover:text-gold transition-colors">Privacy Policy</button>
          </div>

          {/* Legal Docs Overlay */}
          <AnimatePresence>
            {activeDoc && (
              <LegalDocLayout 
                title={
                  activeDoc === 'faq' ? 'Support & FAQ' : 
                  activeDoc === 'terms' ? 'Terms of Use' : 
                  activeDoc === 'redeem' ? 'Redeeming Codes' :
                  'Privacy Policy'
                } 
                onBack={() => setActiveDoc(null)}
              >
                {activeDoc === 'faq' && <FAQContent />}
                {activeDoc === 'terms' && <TermsContent />}
                {activeDoc === 'privacy' && <PrivacyContent />}
                {activeDoc === 'redeem' && <RedeemGuideContent />}
              </LegalDocLayout>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SettingsMenu;
