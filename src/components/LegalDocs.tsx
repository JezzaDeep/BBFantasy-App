import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';

interface LegalDocProps {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}

export const LegalDocLayout: React.FC<LegalDocProps> = ({ title, onBack, children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="absolute inset-0 bg-paper rounded-3xl flex flex-col overflow-hidden z-50"
    >
      <div className="p-6 pb-4 border-b border-ink/10 flex items-center gap-3">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-ink/5 rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-ink" />
        </button>
        <h2 className="text-2xl font-display italic font-bold text-ink">{title}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar text-ink/80 space-y-4 text-sm leading-relaxed">
        {children}
      </div>
    </motion.div>
  );
};

export const RedeemGuideContent = () => (
  <div className="space-y-6">
    <section>
      <p>Players can redeem promotional or in-game codes to receive exclusive rewards, bonuses, or special items. Follow these steps to successfully redeem a code:</p>
    </section>

    <h3 className="text-xl font-display italic font-bold text-ink border-b border-ink/10 pb-2">How to Redeem a Code</h3>

    <section>
      <h3 className="font-bold text-ink text-base mb-1">1. Access the Redeem Section:</h3>
      <p>Navigate to the Settings menu and locate the "Redeem Magical Code" section.</p>
    </section>
    
    <section>
      <h3 className="font-bold text-ink text-base mb-1">2. Enter Your Code:</h3>
      <p>Type or paste the code into the text field exactly as provided. Codes are case-sensitive and must be entered without extra spaces.</p>
    </section>
    
    <section>
      <h3 className="font-bold text-ink text-base mb-1">3. Confirm Redemption:</h3>
      <p>Tap the <strong>Cast</strong> button. If the code is valid, your reward will be automatically added to your account.</p>
    </section>
    
    <section>
      <h3 className="font-bold text-ink text-base mb-1">4. Check Your Inventory:</h3>
      <p>Go to your player stats (by clicking your token on the board) to verify that your items, resources, or digital books have been received.</p>
    </section>

    <h3 className="text-xl font-display italic font-bold text-ink border-b border-ink/10 pb-2 mt-6">Important Notes</h3>
    <ul className="list-disc pl-5 space-y-2">
      <li>Each code can only be redeemed once per account unless otherwise stated.</li>
      <li>Codes may have expiration dates and are only valid during the promotional period.</li>
      <li>Some codes may be region-specific. Ensure that your account is eligible to redeem the code.</li>
      <li>If a code is invalid or has expired, an error message will be displayed.</li>
    </ul>

    <h3 className="text-xl font-display italic font-bold text-ink border-b border-ink/10 pb-2 mt-6">Support</h3>
    <p>If you experience issues redeeming a code, contact our Customer Support at <a href="mailto:moonspinepress@gmail.com" className="text-gold hover:underline font-medium">moonspinepress@gmail.com</a> with:</p>
    <ul className="list-disc pl-5 space-y-1">
      <li>Your account email/ID</li>
      <li>The code you are trying to redeem</li>
      <li>A screenshot of any error messages</li>
    </ul>
    <p>We will investigate and assist in resolving the issue.</p>
  </div>
);

export const FAQContent = () => (
  <div className="space-y-6">
    <section className="mb-6">
      <p>If you encounter issues, have questions, or need help, you can reach our support team via email: <a href="mailto:moonspinepress@gmail.com" className="text-gold hover:underline font-medium">moonspinepress@gmail.com</a></p>
    </section>

    <h3 className="text-xl font-display italic font-bold text-ink border-b border-ink/10 pb-2">Frequently Asked Questions (FAQ)</h3>

    <section>
      <h3 className="font-bold text-ink text-base mb-2">Q1: The game doesn’t play sounds. What should I do?</h3>
      <p>A: Make sure your device volume is up and that your browser/app allows sound playback. If problems persist, contact support.</p>
    </section>
    
    <section>
      <h3 className="font-bold text-ink text-base mb-2">Q2: Some cards or features aren’t working.</h3>
      <p>A: This can happen due to a bug or internet connection issues. Please report it to our support email.</p>
    </section>
    
    <section>
      <h3 className="font-bold text-ink text-base mb-2">Q3: How do I view the Privacy Policy or Terms of Use?</h3>
      <p>A: Use the in-game menu buttons labeled Privacy Policy and Terms of Use to open the documents directly in the app.</p>
    </section>
    
    <section>
      <h3 className="font-bold text-ink text-base mb-2">Q4: Can I suggest new game features?</h3>
      <p>A: Absolutely! We love player feedback. Email your ideas to <a href="mailto:moonspinepress@gmail.com" className="text-gold hover:underline font-medium">moonspinepress@gmail.com</a>.</p>
    </section>
    
    <section>
      <h3 className="font-bold text-ink text-base mb-2">Q5: Is my data safe?</h3>
      <p>A: Yes, all user data is handled according to our Privacy Policy, which explains what we collect and how it’s used.</p>
    </section>
  </div>
);

export const TermsContent = () => (
  <div className="space-y-4">
    <p className="font-bold">Effective Date: April 2026</p>
    
    <h3 className="font-bold text-ink text-base mt-4">1. Acceptance of Terms</h3>
    <p>By playing Bookbound: Indie Fantasy Edition (“the Game”), you agree to these Terms of Use. If you do not agree, do not play the Game.</p>
    
    <h3 className="font-bold text-ink text-base mt-4">2. License to Use</h3>
    <ul className="list-disc pl-5 space-y-2">
      <li>We grant you a limited, non-exclusive, non-transferable license to play the Game for personal, non-commercial use.</li>
      <li>You may not copy, modify, distribute, or sell the Game without permission.</li>
    </ul>
    
    <h3 className="font-bold text-ink text-base mt-4">3. User Conduct</h3>
    <ul className="list-disc pl-5 space-y-2">
      <li>You agree not to cheat, hack, or exploit bugs in the Game.</li>
      <li>You will not use the Game for illegal or harmful purposes.</li>
    </ul>
    
    <h3 className="font-bold text-ink text-base mt-4">4. Ownership</h3>
    <p>All intellectual property, including graphics, code, music, and story elements, belongs to Moonspine Press or its licensors.</p>
    
    <h3 className="font-bold text-ink text-base mt-4">5. Disclaimer of Warranties</h3>
    <ul className="list-disc pl-5 space-y-2">
      <li>The Game is provided “as is” without warranties.</li>
      <li>We do not guarantee uninterrupted or error-free gameplay.</li>
    </ul>
    
    <h3 className="font-bold text-ink text-base mt-4">6. Limitation of Liability</h3>
    <p>We are not liable for damages, lost data, or other losses arising from your use of the Game.</p>
    
    <h3 className="font-bold text-ink text-base mt-4">7. Updates & Changes</h3>
    <p>We may update or modify the Game and these Terms at any time. Changes will be posted in the Game or on our website.</p>
    
    <h3 className="font-bold text-ink text-base mt-4">8. Contact Us</h3>
    <p>Questions or support: email: <a href="mailto:moonspinepress@gmail.com" className="text-gold hover:underline font-medium">moonspinepress@gmail.com</a></p>
  </div>
);

export const PrivacyContent = () => (
  <div className="space-y-4">
    <p className="font-bold">Effective Date: April 2026</p>
    
    <h3 className="font-bold text-ink text-base mt-4">1. Introduction</h3>
    <p>Bookbound: Indie Fantasy Edition (“we,” “our,” or “the Game”) respects your privacy. This Privacy Policy explains what information we collect, how we use it, and your rights. By using the Game, you agree to this policy.</p>
    
    <h3 className="font-bold text-ink text-base mt-4">2. Information We Collect</h3>
    <ul className="list-disc pl-5 space-y-2">
      <li><strong>Personal Information:</strong> We do not require personal information to play the game.</li>
      <li><strong>Non-Personal Information:</strong> We may collect device type, operating system, IP address, game progress, in-game actions, and gameplay statistics for analytics and improving the Game.</li>
      <li><strong>Cookies & Local Storage:</strong> The Game may use local storage or cookies to save your preferences and game progress.</li>
    </ul>
    
    <h3 className="font-bold text-ink text-base mt-4">3. How We Use Your Information</h3>
    <ul className="list-disc pl-5 space-y-2">
      <li>To provide and improve the Game experience.</li>
      <li>To troubleshoot technical issues.</li>
      <li>To analyze usage trends to make gameplay better.</li>
    </ul>
    
    <h3 className="font-bold text-ink text-base mt-4">4. Sharing Your Information</h3>
    <ul className="list-disc pl-5 space-y-2">
      <li>We do not sell or rent your personal information.</li>
      <li>Non-personal aggregated data may be shared with service providers for analytics.</li>
    </ul>
    
    <h3 className="font-bold text-ink text-base mt-4">5. Third-Party Services</h3>
    <p>The Game may include links to external services or advertisements. We are not responsible for their privacy practices.</p>
    
    <h3 className="font-bold text-ink text-base mt-4">6. Data Security</h3>
    <p>We take reasonable measures to protect your data but cannot guarantee absolute security.</p>
    
    <h3 className="font-bold text-ink text-base mt-4">7. Children’s Privacy</h3>
    <p>The Game is suitable for ages 13+. We do not knowingly collect personal information from children under 13.</p>
    
    <h3 className="font-bold text-ink text-base mt-4">8. Contact Us</h3>
    <p>For questions about this Privacy Policy, email: <a href="mailto:moonspinepress@gmail.com" className="text-gold hover:underline font-medium">moonspinepress@gmail.com</a></p>
  </div>
);
