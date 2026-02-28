import { motion } from "framer-motion";

export default function PageLoader() {
  const text = "Kanthast";

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 bg-linear-to-br from-[#0B1120] via-blue-950 to-[#0f172a] flex items-center justify-center z-9999"
    >
      <motion.div
        initial="hidden"
        animate="visible"
        className="flex gap-1 text-4xl md:text-6xl font-bold text-white"
      >
        {text.split("").map((letter, index) => (
          <motion.span
            key={index}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              delay: index * 0.08,
              type: "spring",
              stiffness: 200,
            }}
            className="bg-linear-to-r from-cyan-300 to-cyan-500 bg-clip-text text-transparent"
          >
            {letter}
          </motion.span>
        ))}
      </motion.div>
    </motion.div>
  );
}