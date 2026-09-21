import React from "react";
import { BudgetSummaryResponse } from "../../types";
import { HeroCounter } from "./HeroCounter";

interface SummaryCardsProps {
  summary: BudgetSummaryResponse;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  const isOverBudget = summary.totalRemaining < 0;
  const alertCount = summary.categories.filter((c) => c.isWarning || c.isOverLimit).length;

  return (
    <div className="border border-[var(--border-color)] bg-[var(--bg-surface)] p-6 sm:p-8 mb-8">
      {/* Signature Moment 1: Hero Total Spending in Distinctive Serif with 800ms Count-Up */}
      <div className="mb-6">
        <p className="text-xs font-sans text-[var(--text-muted)] mb-1">
          Total spending this month &middot; {summary.month}
        </p>
        <div className="font-serif text-5xl sm:text-6xl font-bold tracking-tight text-[var(--text-primary)] leading-none">
          <HeroCounter value={summary.totalSpent} duration={800} />
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-2 font-sans">
          {summary.overallPercentage}% of total budgeted allowance utilized
        </p>
      </div>

      {/* Grouped subsidiary stats (clean ledger baseline, not 4 identical cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-[var(--border-color)]">
        <div>
          <span className="block text-xs font-sans text-[var(--text-muted)]">
            Total monthly budget
          </span>
          <span className="font-serif text-xl sm:text-2xl font-semibold text-[var(--text-primary)]">
            ${summary.totalBudget.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div>
          <span className="block text-xs font-sans text-[var(--text-muted)]">
            Remaining balance
          </span>
          <span
            className={`font-serif text-xl sm:text-2xl font-semibold ${
              isOverBudget
                ? "text-[var(--alert-accent)]"
                : "text-[var(--positive-accent)]"
            }`}
          >
            {isOverBudget ? "-" : ""}$
            {Math.abs(summary.totalRemaining).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="block text-[11px] text-[var(--text-muted)] font-sans">
            {isOverBudget ? "Over planned limit" : "Available to allocate"}
          </span>
        </div>

        <div>
          <span className="block text-xs font-sans text-[var(--text-muted)]">
            Categories past 80% limit
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className={`font-serif text-xl sm:text-2xl font-semibold ${
                alertCount > 0
                  ? "text-[var(--alert-accent)]"
                  : "text-[var(--text-primary)]"
              }`}
            >
              {alertCount}
            </span>
            <span className="text-xs text-[var(--text-muted)] font-sans">
              {alertCount === 1 ? "category flagged" : "categories flagged"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
