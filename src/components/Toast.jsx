import { AnimatePresence, motion } from "framer-motion";

export function Toast({ message }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="fixed right-5 top-5 z-50 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-2xl"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
