import { motion } from 'framer-motion';

export function LoadingScreen() {
  return (
    <div className="h-screen flex items-center justify-center bg-bg relative">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full opacity-[0.06]"
          style={{
            background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 70%)',
            top: '30%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.06, 0.03, 0.06] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-5 relative z-10"
      >
        <div className="relative">
          <motion.div
            className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center shadow-xl shadow-accent/25"
            animate={{ rotateY: [0, 180, 360] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <p className="text-base font-semibold text-text font-heading tracking-tight">Taskly</p>
          <p className="text-xs text-text-tertiary">Setting up your workspace...</p>
        </div>
        <div className="flex gap-1.5 mt-1">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-accent"
              animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
