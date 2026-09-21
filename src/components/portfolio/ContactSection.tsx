import React, { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, Copy } from "lucide-react";

export const ContactSection: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);

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

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("fxyawa@gmail.com");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="contact" className="py-20 sm:py-28 scroll-mt-16">
      <motion.div
        initial={shouldReduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={shouldReduceMotion ? undefined : containerVariants}
        className="space-y-12"
      >
        {/* Section Header */}
        <div className="space-y-3">
          <motion.div
            variants={shouldReduceMotion ? undefined : itemVariants}
            className="font-mono text-xs text-[var(--text-muted)] tracking-wider"
          >
            03 / Contact
          </motion.div>
          <motion.h2
            variants={shouldReduceMotion ? undefined : itemVariants}
            className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]"
          >
            Initiate communication.
          </motion.h2>
          <motion.p
            variants={shouldReduceMotion ? undefined : itemVariants}
            className="text-sm text-[var(--text-secondary)] max-w-[65ch] leading-relaxed"
          >
            Open to engineering inquiries, architecture consultations, and technical leadership roles.
          </motion.p>
        </div>

        {/* Contact Links Grid */}
        <motion.div
          variants={shouldReduceMotion ? undefined : itemVariants}
          className="border border-[var(--border-color)] bg-[var(--bg-surface)] p-6 sm:p-8 rounded-xs space-y-6 max-w-2xl"
        >
          {/* Direct Email Row with Copy Option */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-color)]">
            <div className="space-y-1">
              <span className="font-mono text-[11px] text-[var(--text-muted)] tracking-wider">
                Direct Email
              </span>
              <div>
                <a
                  href="mailto:fxyawa@gmail.com"
                  className="font-sans text-base font-semibold text-[var(--text-primary)] hover:text-[#C9F24D] transition-colors"
                >
                  fxyawa@gmail.com
                </a>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyEmail}
              className="inline-flex items-center gap-2 font-mono text-xs px-3 py-1.5 rounded-xs border border-[var(--border-color)] bg-[var(--bg-base)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors self-start sm:self-auto"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-[#C9F24D]" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy email</span>
                </>
              )}
            </button>
          </div>

          {/* Social Profiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="font-mono text-[11px] text-[var(--text-muted)] tracking-wider">
                Source Code
              </span>
              <div>
                <a
                  href="https://github.com/fxyawa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-[var(--text-secondary)] hover:text-[#C9F24D] transition-colors"
                >
                  github.com/fxyawa
                </a>
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-mono text-[11px] text-[var(--text-muted)] tracking-wider">
                Professional Network
              </span>
              <div>
                <a
                  href="https://linkedin.com/in/fxyawa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-[var(--text-secondary)] hover:text-[#C9F24D] transition-colors"
                >
                  linkedin.com/in/fxyawa
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Minimal Footer */}
        <motion.div
          variants={shouldReduceMotion ? undefined : itemVariants}
          className="pt-12 border-t border-[var(--border-color)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs text-[var(--text-muted)]"
        >
          <span>© 2026 FX Yawa. All rights reserved.</span>
          <span>Java • Spring Boot • React • Distributed Systems</span>
        </motion.div>
      </motion.div>
    </section>
  );
};
