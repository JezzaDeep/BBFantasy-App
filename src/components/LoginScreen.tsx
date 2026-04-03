import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth, googleProvider, signInWithPopup } from '../firebase';
import { Loader2, User, LogIn, UserPlus, AlertCircle, Chrome } from 'lucide-react';
import { SETUP_COLORS, SETUP_CLASSES, SETUP_TOKENS, SETUP_LANGUAGES } from './SetupScreen';

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

interface LoginScreenProps {
  onLoginSuccess: (playerData: any, playerId: string) => void;
  onBack?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onBack }) => {
  const [mode, setMode] = useState<'select' | 'login' | 'create'>('select');
  const [playerId, setPlayerId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Profile creation state
  const [color, setColor] = useState(SETUP_COLORS[0]);
  const [characterClass, setCharacterClass] = useState(SETUP_CLASSES[0]);
  const [token, setToken] = useState(SETUP_TOKENS[0]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedId = playerId.trim();
    if (!trimmedId) return;
    if (trimmedId.includes('/')) {
      setError('Player ID cannot contain slashes.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const docRef = doc(db, 'players', trimmedId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        // Update last login
        await setDoc(docRef, { lastLogin: Date.now() }, { merge: true });
        localStorage.setItem('bookbound_player_id', trimmedId);
        onLoginSuccess(data, trimmedId);
      } else {
        setError('Player ID not found. Please check your ID or create a new one.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err instanceof Error && err.message.includes('Missing or insufficient permissions')) {
        setError('Permission denied. Please check your Player ID.');
        handleFirestoreError(err, OperationType.GET, `players/${trimmedId}`);
      } else if (err instanceof Error && err.message.includes('the client is offline')) {
        setError('Firebase configuration error. The client is offline.');
      } else {
        setError(`Connection error: ${err instanceof Error ? err.message : 'Please try again.'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const trimmedId = user.uid;

      const docRef = doc(db, 'players', trimmedId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        await setDoc(docRef, { lastLogin: Date.now() }, { merge: true });
        localStorage.setItem('bookbound_player_id', trimmedId);
        onLoginSuccess(data, trimmedId);
      } else {
        // Create new player profile for Google user
        const newPlayerData = {
          name: user.displayName || 'Traveler',
          color: SETUP_COLORS[0],
          class: SETUP_CLASSES[0],
          token: SETUP_TOKENS[0],
          language: 'en',
          createdAt: Date.now(),
          lastLogin: Date.now(),
          email: user.email,
          uid: user.uid
        };
        await setDoc(docRef, newPlayerData);
        localStorage.setItem('bookbound_player_id', trimmedId);
        onLoginSuccess(newPlayerData, trimmedId);
      }
    } catch (err: any) {
      console.error('Google Login error:', err);
      setError(`Google Login failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedId = playerId.trim();
    if (!trimmedId) return;
    if (trimmedId.includes('/')) {
      setError('Player ID cannot contain slashes.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const docRef = doc(db, 'players', trimmedId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setError('This Player ID is already taken. Please choose another.');
      } else {
        const newPlayerData = {
          name: trimmedId,
          color,
          class: characterClass,
          token,
          language: 'en',
          createdAt: Date.now(),
          lastLogin: Date.now(),
        };
        await setDoc(docRef, newPlayerData);
        localStorage.setItem('bookbound_player_id', trimmedId);
        onLoginSuccess(newPlayerData, trimmedId);
      }
    } catch (err: any) {
      console.error('Create error:', err);
      if (err instanceof Error && err.message.includes('Missing or insufficient permissions')) {
        setError('Permission denied. Please try another Player ID.');
        handleFirestoreError(err, OperationType.CREATE, `players/${trimmedId}`);
      } else if (err instanceof Error && err.message.includes('the client is offline')) {
        setError('Firebase configuration error. The client is offline.');
      } else {
        setError(`Connection error: ${err instanceof Error ? err.message : 'Please try again.'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-ink/90 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="max-w-md w-full bg-paper rounded-3xl p-8 shadow-2xl border-2 border-gold/30 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-600 via-pink-500 to-gold" />
        
        <h2 className="text-3xl font-display italic text-ink text-center mb-8">
          {mode === 'select' ? 'Welcome Traveler' : mode === 'login' ? 'Return to the Realm' : 'Forge Your Legend'}
        </h2>

        <AnimatePresence mode="wait">
          {mode === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <button
                onClick={() => setMode('login')}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-ink text-paper rounded-xl font-bold hover:bg-ink/80 transition-colors shadow-lg"
              >
                <LogIn size={20} />
                I have a Player ID
              </button>
              <button
                onClick={() => setMode('create')}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gold text-ink rounded-xl font-bold hover:bg-gold/80 transition-colors shadow-lg"
              >
                <UserPlus size={20} />
                Create New Player
              </button>
              
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-ink/10"></div></div>
                <div className="relative flex justify-center text-xs uppercase tracking-widest"><span className="bg-paper px-2 text-ink/40">Or</span></div>
              </div>

              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-white border-2 border-ink/10 text-ink rounded-xl font-bold hover:bg-ink/5 transition-colors shadow-sm"
              >
                <Chrome size={20} />
                Sign in with Google
              </button>

              {onBack && (
                <button
                  onClick={onBack}
                  className="w-full py-3 text-ink/60 hover:text-ink font-medium transition-colors mt-4"
                >
                  Cancel
                </button>
              )}
            </motion.div>
          )}

          {mode === 'login' && (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleLogin}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-bold text-ink/70 mb-2 uppercase tracking-wider">Player ID</label>
                <input
                  type="text"
                  value={playerId}
                  onChange={(e) => setPlayerId(e.target.value)}
                  placeholder="e.g. MysticDragon42"
                  className="w-full px-4 py-3 rounded-xl bg-white border-2 border-ink/10 focus:border-gold outline-none transition-colors text-ink font-medium"
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setMode('select'); setError(null); }}
                  className="flex-1 py-3 px-4 bg-ink/5 text-ink rounded-xl font-bold hover:bg-ink/10 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !playerId.trim()}
                  className="flex-[2] py-3 px-4 bg-gold text-ink rounded-xl font-bold hover:bg-gold/80 transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Enter Realm'}
                </button>
              </div>
            </motion.form>
          )}

          {mode === 'create' && (
            <motion.form
              key="create"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleCreate}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-bold text-ink/70 mb-2 uppercase tracking-wider">Choose Player ID</label>
                <input
                  type="text"
                  value={playerId}
                  onChange={(e) => setPlayerId(e.target.value)}
                  placeholder="e.g. MysticDragon42"
                  className="w-full px-4 py-3 rounded-xl bg-white border-2 border-ink/10 focus:border-gold outline-none transition-colors text-ink font-medium"
                  required
                  maxLength={20}
                />
                <p className="text-xs text-ink/50 mt-1">This will be your unique login ID.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink/70 mb-1 uppercase tracking-wider">Class</label>
                  <select 
                    value={characterClass} 
                    onChange={(e) => setCharacterClass(e.target.value as any)}
                    className="w-full p-2 rounded-lg bg-white border border-ink/10 text-sm"
                  >
                    {SETUP_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink/70 mb-1 uppercase tracking-wider">Color</label>
                  <select 
                    value={color} 
                    onChange={(e) => setColor(e.target.value as any)}
                    className="w-full p-2 rounded-lg bg-white border border-ink/10 text-sm capitalize"
                  >
                    {SETUP_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setMode('select'); setError(null); }}
                  className="flex-1 py-3 px-4 bg-ink/5 text-ink rounded-xl font-bold hover:bg-ink/10 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !playerId.trim()}
                  className="flex-[2] py-3 px-4 bg-gold text-ink rounded-xl font-bold hover:bg-gold/80 transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Create Profile'}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
