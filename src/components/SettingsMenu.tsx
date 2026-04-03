import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Volume2, VolumeX, Gift, HelpCircle, Mail, X, Bell, Save, Facebook, Instagram
} from "lucide-react";
import { LANGUAGES, type LanguageCode } from "../i18n";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

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
}) => {
  const tx = (key: string) => LANGUAGES[currentLanguage]?.[key] || LANGUAGES['en'][key] || key;

  // Redeem code states
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemMessage, setRedeemMessage] = useState<string | null>(null);
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);
  const [rewardReceived, setRewardReceived] = useState<any>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);

  const handleRedeemSubmit = async () => {
    if (!auth.currentUser) {
      setRedeemMessage('❌ Please sign in to redeem codes.');
      return;
    }

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
            redeemedBy: auth.currentUser.uid
          });

          const reward = JSON.parse(codeData.reward);
          setRewardReceived(reward);
          setShowRewardAnimation(true);
          onRedeemReward(reward);
          setRedeemMessage(`✨ A magical gift appears!`);
        }
      } else {
        setRedeemMessage('❌ The code is invalid or has vanished!');
      }
    } catch (error) {
      console.error('Error redeeming code:', error);
      setRedeemMessage('❌ An error occurred. Please try again.');
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
                  <span>🖋 Ink Points</span> <span>{player.resources?.ink || 0}</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex justify-between font-bold">
                  <span>🔮 Fate Points</span> <span>{player.resources?.fate || 0}</span>
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
              <div className="flex items-center gap-2">
                <Gift size={20} className="text-gold" />
                <h3 className="font-bold text-ink/80">✨ Redeem Magical Code</h3>
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
                    animate={{ scale: 1.1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center pointer-events-none z-50"
                    onAnimationComplete={() => setTimeout(() => setShowRewardAnimation(false), 2000)}
                  >
                    <motion.div
                      className="p-6 bg-gradient-to-br from-purple-800/80 via-pink-700/70 to-yellow-500/60 rounded-3xl shadow-xl text-center text-white font-bold text-lg backdrop-blur-md"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1, rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 0.6 }}
                    >
                      {rewardReceived.ink && `🖋 Ink +${rewardReceived.ink}`}
                      {rewardReceived.fatePoints && `🔮 Fate +${rewardReceived.fatePoints}`}
                      {rewardReceived.books && `📚 Book: ${rewardReceived.books.join(', ')}`}
                      {rewardReceived.merch && `🎁 Merch: ${rewardReceived.merch.join(', ')}`}
                    </motion.div>
                    {/* Floating sparkles */}
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 bg-gold/80 rounded-full absolute"
                        style={{
                          top: `${Math.random() * 100}%`,
                          left: `${Math.random() * 100}%`,
                        }}
                        animate={{ y: [-10, 10], x: [-5, 5] }}
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

            {/* Support / Contact / Social */}
            <a href="https://drive.google.com/file/d/15CVbcNPh1ue-yVo-CyfCWDde2mGYZ-Oq/view?usp=sharing" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 glass-panel rounded-xl px-4 py-3 hover:bg-gold/5 text-ink/80 font-medium">
              <HelpCircle size={18} className="text-gold" /> {tx('settings_support')}
            </a>
            <a href="mailto:moonspinepress@gmail.com" className="flex items-center gap-3 glass-panel rounded-xl px-4 py-3 hover:bg-gold/5 text-ink/80 font-medium">
              <Mail size={18} className="text-gold" /> {tx('settings_contact')}
            </a>
            <a href="https://www.facebook.com/authorjezzadeep" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 glass-panel rounded-xl px-4 py-3 hover:bg-gold/5 text-ink/80 font-medium">
              <Facebook size={18} className="text-gold" /> Facebook
            </a>
            <a href="https://www.instagram.com/jezzadeep.author" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 glass-panel rounded-xl px-4 py-3 hover:bg-gold/5 text-ink/80 font-medium">
              <Instagram size={18} className="text-gold" /> Instagram
            </a>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-ink/10 text-xs text-center space-x-6 text-ink/60 font-medium relative z-10 pb-2">
            <a href="https://drive.google.com/file/d/19FiT-x7zAuhdNvyvi5IGfPN4Ewxe9fSr/view?usp=sharing" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors">Terms of Use</a>
            <a href="https://drive.google.com/file/d/1Ep9M7p02lsBc9Wwn82ZjBOji7A5X4DJM/view?usp=sharing" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors">Privacy Policy</a>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SettingsMenu;
