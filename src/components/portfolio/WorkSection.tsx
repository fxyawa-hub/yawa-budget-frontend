import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router-dom";

interface Project {
  id: string;
  title: string;
  category: string;
  year: string;
  problemStatement: string;
  techStack: string[];
  liveUrl?: string;
  isInternalLive?: boolean;
  githubUrl: string;
}

const projects: Project[] = [
  {
    id: "smartbudget",
    title: "SmartBudget (Yawa Budget)",
    category: "Financial Engine • Open Banking",
    year: "2024",
    problemStatement:
      "Intelligent personal finance engine that connects bank accounts via Mono's Open Banking sandbox, executes verified NUBAN transfers via Paystack, and catches budget overruns before they compound.",
    techStack: ["Java / Spring Boot", "React", "TypeScript", "Mono Sandbox", "Paystack API", "Tailwind CSS"],
    liveUrl: "/dashboard",
    isInternalLive: true,
    githubUrl: "https://github.com/fxyawa/smartbudget",
  },
  {
    id: "orderflow-engine",
    title: "OrderFlow Distributed Engine",
    category: "Distributed Systems • Transaction Processing",
    year: "2024",
    problemStatement:
      "High-throughput asynchronous order processing backend handling idempotent settlement, transactional outbox persistence, and fault-tolerant Kafka consumer retries.",
    techStack: ["Java 21", "Spring Boot", "Apache Kafka", "PostgreSQL", "Redis", "Docker"],
    githubUrl: "https://github.com/fxyawa/orderflow-engine",
  },
  {
    id: "telemetry-ledger",
    title: "Telemetry Ledger Service",
    category: "Financial Accounting • Audit Trails",
    year: "2023",
    problemStatement:
      "Double-entry bookkeeping and financial audit ledger enforcing immutability through cryptographic SHA-256 block hashes and sub-millisecond query indexing.",
    techStack: ["Spring Boot 3", "PostgreSQL", "Reactive Streams", "JUnit 5", "Grafana"],
    githubUrl: "https://github.com/fxyawa/ledger-service",
  },
  {
    id: "docuparse-ai",
    title: "DocuParse Intelligence",
    category: "Data Extraction • AI Integration",
    year: "2024",
    problemStatement:
      "Financial statement parser extracting structured tabular records using Gemini structured output schemas with strict confidence scoring and validation schemas.",
    techStack: ["React", "Node.js / Express", "Google GenAI SDK", "TypeScript", "Tailwind CSS"],
    githubUrl: "https://github.com/fxyawa/docuparse-ai",
  },
];

export const WorkSection: React.FC = () => {
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
    <section id="work" className="py-20 sm:py-28 border-b border-[var(--border-color)] scroll-mt-16">
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
            01 / Work
          </motion.div>
          <motion.h2
            variants={shouldReduceMotion ? undefined : itemVariants}
            className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]"
          >
            Selected systems and applications.
          </motion.h2>
          <motion.p
            variants={shouldReduceMotion ? undefined : itemVariants}
            className="text-sm text-[var(--text-secondary)] max-w-[65ch] leading-relaxed"
          >
            Production architectures designed for deterministic throughput, data integrity, and
            clean operational boundaries.
          </motion.p>
        </div>

        {/* Project Cards Grid: Single-column below 768px, 2-column above */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {projects.map((project) => (
            <motion.article
              key={project.id}
              variants={shouldReduceMotion ? undefined : itemVariants}
              className="group flex flex-col justify-between rounded-xs border border-[var(--border-color)] bg-[var(--bg-surface)] p-6 sm:p-7 transition-colors duration-200 hover:border-[#C9F24D]"
            >
              <div className="space-y-4">
                {/* Meta row: category and date */}
                <div className="flex items-center justify-between font-mono text-[11px] text-[var(--text-muted)] tracking-wider">
                  <span>{project.category}</span>
                  <span>{project.year}</span>
                </div>

                {/* Project title with subtle translation on card hover */}
                <h3 className="font-sans text-lg sm:text-xl font-bold tracking-tight text-[var(--text-primary)] transition-transform duration-200 group-hover:translate-x-1.5">
                  {project.title}
                </h3>

                {/* Problem Statement */}
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  {project.problemStatement}
                </p>
              </div>

              <div className="mt-8 space-y-6 pt-6 border-t border-[var(--border-color)]">
                {/* Tech Stack Tags in monospace */}
                <div className="flex flex-wrap gap-1.5">
                  {project.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="font-mono text-[11px] px-2 py-0.5 rounded-xs bg-[var(--bg-base)] text-[var(--text-secondary)] border border-[var(--border-color)]"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                {/* Action Links */}
                <div className="flex items-center gap-5 font-mono text-xs tracking-wider">
                  {project.liveUrl && project.isInternalLive ? (
                    <Link
                      to={project.liveUrl}
                      className="text-[var(--text-primary)] hover:text-[#C9F24D] transition-colors"
                    >
                      Live demo
                    </Link>
                  ) : project.liveUrl ? (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--text-primary)] hover:text-[#C9F24D] transition-colors"
                    >
                      Live demo
                    </a>
                  ) : null}

                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--text-secondary)] hover:text-[#C9F24D] transition-colors"
                  >
                    GitHub
                  </a>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </motion.div>
    </section>
  );
};
