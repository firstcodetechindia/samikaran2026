import { useState, useEffect } from 'react';
import { X, Download, Share, Plus } from 'lucide-react';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export function PWAInstallPrompt() {
  const { isInstallable, isIOS, promptInstall, dismissPrompt, shouldShowPrompt, isInstalled } = usePWAInstall();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (shouldShowPrompt && !isInstalled) {
        setShowPrompt(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [shouldShowPrompt, isInstalled]);

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    dismissPrompt();
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-28 left-4 right-4 z-50 md:bottom-24 md:left-auto md:right-4 md:w-96"
        data-testid="pwa-install-prompt"
      >
        <div className="bg-gradient-to-r from-violet-600 to-pink-500 rounded-2xl p-4 shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-base">Install Samikaran App</h3>
              <p className="text-white/80 text-sm mt-0.5">
                {isIOS 
                  ? 'Add to Home Screen for the best experience'
                  : 'Install for quick access and offline support'
                }
              </p>
            </div>
            <button 
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 hover:bg-white/10 rounded-full transition-colors"
              aria-label="Dismiss"
              data-testid="button-dismiss-install"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>
          </div>

          {isIOS ? (
            <div className="mt-3 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <p className="text-white text-sm flex items-center gap-2">
                <span className="flex-shrink-0">1.</span>
                <span>Tap the</span>
                <Share className="w-4 h-4 flex-shrink-0" />
                <span>Share button</span>
              </p>
              <p className="text-white text-sm flex items-center gap-2 mt-2">
                <span className="flex-shrink-0">2.</span>
                <span>Tap</span>
                <Plus className="w-4 h-4 flex-shrink-0" />
                <span>Add to Home Screen</span>
              </p>
            </div>
          ) : (
            <div className="mt-3 flex gap-2">
              <Button
                onClick={handleDismiss}
                variant="ghost"
                className="flex-1 text-white hover:bg-white/10 border-white/20 border"
                data-testid="button-maybe-later"
              >
                Maybe Later
              </Button>
              <Button
                onClick={handleInstall}
                className="flex-1 bg-white text-violet-600 hover:bg-white/90 font-bold"
                disabled={!isInstallable}
                data-testid="button-install-app"
              >
                <Download className="w-4 h-4 mr-2" />
                Install
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
