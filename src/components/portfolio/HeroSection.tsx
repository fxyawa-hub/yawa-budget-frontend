import React from "react";
import { motion, useReducedMotion } from "motion/react";

export const HeroSection: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1], // clean ease-out, ~500ms
      },
    },
  };

  return (
    <section className="pt-24 pb-20 sm:pt-32 sm:pb-28 md:pt-40 md:pb-36 border-b border-[var(--border-color)]">
      <motion.div
        className="max-w-4xl space-y-8"
        initial={shouldReduceMotion ? false : "hidden"}
        animate="visible"
        variants={shouldReduceMotion ? undefined : containerVariants}
      >
        {/* Line 1: Identity metadata with one deliberate accent highlight */}
        <motion.div
          variants={shouldReduceMotion ? undefined : itemVariants}
          className="flex items-center gap-2.5 font-mono text-xs tracking-wider text-[var(--text-muted)]"
        >
          {/* One deliberate accent highlight in the hero */}
          <span className="w-2 h-2 rounded-full bg-[#C9F24D] shrink-0" />
          <span>FX Yawa</span>
          <span className="text-[var(--border-strong)]">/</span>
          <span>Full-stack software engineer</span>
        </motion.div>

        {/* Line 2: Headline — large, tight, heavy grotesk. Confident, not decorative. Sentence case. Fluid clamp */}
        <motion.h1
          variants={shouldReduceMotion ? undefined : itemVariants}
          className="font-sans font-extrabold tracking-[-0.035em] text-[var(--text-primary)] leading-[1.08]"
          style={{ fontSize: "clamp(2.5rem, 6vw + 0.75rem, 4.5rem)" }}
        >
          Building reliable backend services in Java and reactive interfaces in React.
        </motion.h1>

        {/* Line 3: One line on what I build — narrow measure (max ~65ch) */}
        <motion.p
          variants={shouldReduceMotion ? undefined : itemVariants}
          className="font-sans text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed max-w-[65ch]"
        >
          Specializing in enterprise architecture with Spring Boot, high-throughput distributed
          systems, and pragmatic AI integrations that eliminate real operational friction.
        </motion.p>

        {/* Line 4: Single CTA button */}
        <motion.div variants={shouldReduceMotion ? undefined : itemVariants} className="pt-2">
          <a
            href="#work"
            className="inline-flex items-center justify-center font-mono text-xs font-semibold px-6 py-3 rounded-xs bg-[#C9F24D] text-[#0A0A0B] hover:bg-[#BEEE3D] transition-colors focus:outline-none focus:ring-2 focus:ring-[#C9F24D] focus:ring-offset-2 focus:ring-offset-[var(--bg-base)]"
          >
            View selected work
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
};
