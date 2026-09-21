import React from "react";
import { motion, useReducedMotion } from "motion/react";

export const AboutSection: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <section id="about" className="py-20 sm:py-28 border-b border-[var(--border-color)] scroll-mt-16">
      <motion.div
        initial={shouldReduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={shouldReduceMotion ? undefined : containerVariants}
        className="space-y-10"
      >
        {/* Section Header */}
        <div className="space-y-3">
          <motion.div
            variants={shouldReduceMotion ? undefined : itemVariants}
            className="font-mono text-xs text-[var(--text-muted)] tracking-wider"
          >
            02 / About
          </motion.div>
          <motion.h2
            variants={shouldReduceMotion ? undefined : itemVariants}
            className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]"
          >
            Engineering philosophy and focus.
          </motion.h2>
        </div>

        {/* Narrative: Short, direct. What I'm building toward, no life story. Narrow measure (max ~65ch). */}
        <div className="space-y-6 max-w-[65ch] text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed font-sans">
          <motion.p variants={shouldReduceMotion ? undefined : itemVariants}>
            I build backend architectures and developer platforms where correctness is non-negotiable.
            My primary technical stack centers on Java and Spring Boot for high-availability enterprise
            services, paired with modern TypeScript and React for clean, functional interfaces.
          </motion.p>

          <motion.p variants={shouldReduceMotion ? undefined : itemVariants}>
            I prioritize deterministic data flow, predictable latency, and clean domain boundaries.
            In an ecosystem frequently distracted by premature complexity, I value the fundamentals:
            idempotent API contracts, disciplined relational schemas, comprehensive integration testing,
            and observable system telemetry.
          </motion.p>

          <motion.p variants={shouldReduceMotion ? undefined : itemVariants}>
            Currently, I am integrating language models into enterprise ingestion pipelines—transforming
            unstructured documents and accounting data into structured, validated domain records without
            introducing brittle dependencies.
          </motion.p>

          <motion.p variants={shouldReduceMotion ? undefined : itemVariants}>
            Based in Nigeria, building for teams globally.
          </motion.p>
        </div>

        {/* Core Competencies in Monospace */}
        <motion.div
          variants={shouldReduceMotion ? undefined : itemVariants}
          className="pt-6 border-t border-[var(--border-color)] grid grid-cols-1 sm:grid-cols-3 gap-6"
        >
          <div className="space-y-2">
            <div className="font-mono text-xs text-[var(--text-primary)] font-semibold tracking-wider">
              Backend Systems
            </div>
            <p className="font-mono text-xs text-[var(--text-muted)] leading-relaxed">
              Java 21, Spring Boot, Spring Security, REST & gRPC, Hibernate/JPA, PostgreSQL, Redis.
            </p>
          </div>

          <div className="space-y-2">
            <div className="font-mono text-xs text-[var(--text-primary)] font-semibold tracking-wider">
              Frontend Engineering
            </div>
            <p className="font-mono text-xs text-[var(--text-muted)] leading-relaxed">
              React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, State Management.
            </p>
          </div>

          <div className="space-y-2">
            <div className="font-mono text-xs text-[var(--text-primary)] font-semibold tracking-wider">
              Distributed & AI
            </div>
            <p className="font-mono text-xs text-[var(--text-muted)] leading-relaxed">
              Apache Kafka, Docker, CI/CD pipelines, Gemini SDK, structured schema synthesis.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};
