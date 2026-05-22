import { motion, AnimatePresence } from 'framer-motion';
import { useNetwork } from '../hooks/useNetwork';

export default function OfflineBanner() {
  const { offline } = useNetwork();

  return (
    <AnimatePresence>
      {offline && (
        <motion.div
          initial={{ y: -70, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -70, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          className="fixed left-0 right-0 z-[9998] flex justify-center pointer-events-none"
          style={{ top: 'calc(var(--navbar-h, 4rem) + 8px)' }}
        >
          <div
            className="flex items-center gap-2.5 bg-[#1a1a2e] border border-red-500/40 px-5 py-2.5 rounded-full shadow-2xl"
            style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.45)' }}
          >
            <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
            <span className="text-red-300 text-sm font-semibold tracking-wide">
              No internet connection
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
