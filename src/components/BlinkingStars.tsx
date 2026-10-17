import { memo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

function BlinkingStars() {
  // Decorative and endless, so it is left out for people who ask for less motion.
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <AnimatePresence>
      {[...Array<number>(20)].map((_, i) => (
        <motion.div
          key={i}
          aria-hidden="true"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.7, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse",
            delay: i * 0.1,
          }}
          className="absolute w-2 h-2 bg-yellow-200 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        />
      ))}
    </AnimatePresence>
  );
}

export default memo(BlinkingStars);
