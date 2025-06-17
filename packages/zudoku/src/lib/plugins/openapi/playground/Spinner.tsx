import { motion } from "motion/react";

const ball = {
  width: 5,
  height: 5,
  borderRadius: "50%",
};

const Spinner = () => {
  return (
    <motion.div
      className="flex items-center gap-1"
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.2,
          },
        },
      }}
    >
      <motion.div
        className="bg-white/60"
        variants={{
          hidden: { opacity: 0, y: 3 },
          visible: {
            opacity: 1,
            y: 0,
            transition: {
              y: {
                type: "spring",
                stiffness: 300,
                damping: 10,
                repeat: Infinity,
                repeatType: "reverse",
              },
            },
          },
        }}
        style={ball}
      />
      <motion.div
        className="bg-white/60"
        variants={{
          hidden: { opacity: 0, y: 3 },
          visible: {
            opacity: 1,
            y: 0,
            transition: {
              y: {
                type: "spring",
                stiffness: 300,
                damping: 10,
                repeat: Infinity,
                repeatType: "reverse",
              },
            },
          },
        }}
        style={ball}
      />
      <motion.div
        className="bg-white/60"
        variants={{
          hidden: { opacity: 0, y: 3 },
          visible: {
            opacity: 1,
            y: 0,
            transition: {
              y: {
                type: "spring",
                stiffness: 300,
                damping: 10,
                repeat: Infinity,
                repeatType: "reverse",
              },
            },
          },
        }}
        style={ball}
      />
    </motion.div>
  );
};

export default Spinner;
