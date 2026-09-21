import React, { useState, useEffect, useCallback } from "react";
import { NavLink } from "react-router-dom";
import { Plus, SlidersHorizontal, AlertCircle, ArrowRightLeft } from "lucide-react";
import { getBudgetSummaryApi } from "../api/budgets";
import { getMonoAccountsApi } from "../api/mono";
import { BudgetSummaryResponse, MonoAccount } from "../types";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ErrorAlert } from "../components/common/ErrorAlert";
import { EmptyState } from "../components/common/EmptyState";
import { DashboardHero } from "../components/dashboard/DashboardHero";
import { BudgetProgressList } from "../components/dashboard/BudgetProgressList";
import { SpendingChart } from "../components/dashboard/SpendingChart";
import { MonoAccountsSection } from "../components/mono/MonoAccountsSection";
import { getErrorMessage } from "../api/client";

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<BudgetSummaryResponse | null>(null);
  const [monoAccounts, setMonoAccounts] = useState<MonoAccount[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [budgetData, accountsData] = await Promise.all([
        getBudgetSummaryApi(),
        getMonoAccountsApi().catch(() => []),
      ]);
      setSummary(budgetData);
      setMonoAccounts(accountsData);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load budget summary. Please check your connection."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const alertCategories = summary?.categories.filter((c) => c.isWarning || c.isOverLimit) || [];

  return (
    <div className="space-y-10">
      {/* Top Header: Actions aligned right without competing with hero */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
        <div>
          <h2 className="text-sm font-medium text-[var(--text-secondary)]">
            Monthly overview
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <NavLink
            to="/transactions"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm bg-[var(--accent-lime)] text-[var(--accent-lime-text)] hover:bg-[var(--accent-lime-hover)] transition-colors select-none"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add transaction</span>
          </NavLink>
          <NavLink
            to="/transfers"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--text-secondary)] transition-colors select-none"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <span>Send money</span>
          </NavLink>
          <NavLink
            to="/budgets"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--text-secondary)] transition-colors select-none"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <span>Manage limits</span>
          </NavLink>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="border border-[var(--border-color)] bg-[var(--bg-surface)] p-12 text-center">
          <LoadingSpinner message="Calculating ledger balances..." />
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="border border-[var(--border-color)] bg-[var(--bg-surface)] p-6">
          <ErrorAlert message={error} onRetry={fetchDashboardData} />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && summary && summary.categories.length === 0 && (
        <div className="border border-[var(--border-color)] bg-[var(--bg-surface)] p-8">
          <EmptyState
            title="No budget configured"
            description="No budget categories or recorded expenses exist for this period yet. Set your category limits to begin tracking."
            actionText="Configure limits"
            onAction={() => (window.location.href = "/budgets")}
          />
        </div>
      )}

      {/* Populated Dashboard Content */}
      {!isLoading && !error && summary && summary.categories.length > 0 && (
        <>
          {/* Dominant Hero Spending Figure */}
          <DashboardHero summary={summary} />

          {/* Over 80% Threshold Warning (used only when limits breached) */}
          {alertCategories.length > 0 && (
            <div
              id="budget-alert-banner"
              className="border border-[var(--alert-red)] bg-[var(--alert-red-subtle)] p-3 text-[var(--text-primary)]"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-[var(--alert-red)] mt-0.5 shrink-0" />
                <div className="text-xs leading-relaxed font-sans">
                  <p className="font-semibold text-[var(--alert-red)]">
                    {alertCategories.length}{" "}
                    {alertCategories.length === 1 ? "category has" : "categories have"} reached or
                    exceeded 80% of limit
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {alertCategories.map((c) => (
                      <span
                        key={c.category}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-[var(--alert-red)] bg-[var(--bg-surface)] font-mono text-[11px]"
                      >
                        <span className="text-[var(--text-primary)]">{c.category}</span>
                        <span className="text-[var(--alert-red)] font-semibold">
                          ${c.spent.toFixed(2)}
                        </span>
                        <span className="text-[var(--text-muted)]">
                          / ${c.budgeted.toFixed(2)} ({c.percentage}%)
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bank Account Linking Section (Mono Sandbox) */}
          <div className="border border-[var(--border-color)] bg-[var(--bg-surface)] p-6">
            <MonoAccountsSection
              accounts={monoAccounts}
              onAccountsUpdated={fetchDashboardData}
              onTransactionsImported={() => fetchDashboardData()}
            />
          </div>

          {/* Full-width budget categories section */}
          <div className="border border-[var(--border-color)] bg-[var(--bg-surface)] p-6 sm:p-8">
            <div className="pb-4 mb-6 border-b border-[var(--border-color)] flex items-baseline justify-between">
              <div>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  Category limits
                </h3>
                <p className="text-xs font-mono text-[var(--text-muted)] mt-0.5">
                  Allowance utilization per category
                </p>
              </div>
              <span className="text-xs font-mono text-[var(--text-secondary)]">
                {summary.categories.length} tracked
              </span>
            </div>

            {/* Thin full-width horizontal bars */}
            <BudgetProgressList categories={summary.categories} />
          </div>

          {/* Comparative category chart */}
          <div className="border border-[var(--border-color)] bg-[var(--bg-surface)] p-6">
            <div className="pb-3 mb-2 border-b border-[var(--border-color)]">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Expenditure comparison
              </h3>
              <p className="text-xs font-mono text-[var(--text-muted)] mt-0.5">
                Recorded spending versus allocated limits
              </p>
            </div>
            <SpendingChart categories={summary.categories} />
          </div>
        </>
      )}
    </div>
  );
};
