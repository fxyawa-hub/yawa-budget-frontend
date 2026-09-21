import React, { useState, useEffect, useCallback } from "react";
import { RefreshCw, Building2, Check, ArrowRightLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { getTransactionsApi, createTransactionApi } from "../api/transactions";
import { getBudgetsApi } from "../api/budgets";
import { getMonoAccountsApi, syncMonoTransactionsApi } from "../api/mono";
import { Transaction, CreateTransactionPayload, MonoAccount } from "../types";
import { TransactionForm } from "../components/transactions/TransactionForm";
import { TransactionList } from "../components/transactions/TransactionList";
import { Button } from "../components/common/Button";
import { ConnectMonoModal } from "../components/mono/ConnectMonoModal";
import { getErrorMessage } from "../api/client";

const DEFAULT_CATEGORY_LIST = [
  "Groceries",
  "Dining Out",
  "Housing & Rent",
  "Transportation",
  "Utilities",
  "Entertainment",
  "Shopping",
  "Healthcare",
  "Personal Care",
  "Other",
];

export const TransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORY_LIST);
  const [monoAccounts, setMonoAccounts] = useState<MonoAccount[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [txData, budgetsData, accountsData] = await Promise.all([
        getTransactionsApi(),
        getBudgetsApi().catch(() => []),
        getMonoAccountsApi().catch(() => []),
      ]);

      setTransactions(txData);
      setMonoAccounts(accountsData);

      // Merge predefined categories with user's specific budget categories
      const userCategories = budgetsData.map((b) => b.category);
      const mergedCategories = Array.from(new Set([...DEFAULT_CATEGORY_LIST, ...userCategories]));
      setCategories(mergedCategories);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load transactions. Please try again."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateTransaction = async (payload: CreateTransactionPayload) => {
    const created = await createTransactionApi(payload);
    setTransactions((prev) => [created, ...prev]);
  };

  const handleSyncMono = async () => {
    if (monoAccounts.length === 0) {
      setIsConnectModalOpen(true);
      return;
    }
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const targetAccount = monoAccounts[0];
      const res = await syncMonoTransactionsApi(targetAccount.id);
      setSyncFeedback(`Successfully synced ${res.importedCount} transactions from ${targetAccount.institutionName} into Yawa Budget.`);
      await fetchData();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to sync transactions from bank account."));
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="pb-4 border-b border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)] font-sans">
            Transactions
          </h1>
          <p className="text-xs font-mono text-[var(--text-muted)] mt-1">
            Ledger records, manual entries, and synced bank statements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSyncMono}
            isLoading={isSyncing}
            className="text-xs"
            title="Pull real-shaped bank statement transactions from connected bank"
          >
            <Building2 className="w-3.5 h-3.5 mr-1 text-[var(--accent-lime-text)] dark:text-[var(--accent-lime)]" />
            <span>{monoAccounts.length > 0 ? "Sync from Bank (Mono)" : "Connect Bank (Mono)"}</span>
          </Button>

          <Link
            to="/transfers"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--text-secondary)] transition-colors select-none"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <span>Send Money</span>
          </Link>
        </div>
      </div>

      {syncFeedback && (
        <div className="p-3 border border-[var(--accent-lime)] bg-[var(--accent-lime-subtle)] text-xs font-mono text-[var(--text-primary)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-[var(--accent-lime-text)] dark:text-[var(--accent-lime)]" />
            <span>{syncFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncFeedback(null)}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Form to add transaction (calls POST /ai/categorize if category blank) */}
      <TransactionForm
        categories={categories}
        onSubmitTransaction={handleCreateTransaction}
      />

      {/* List of past transactions with loading, error, and empty states */}
      <TransactionList
        transactions={transactions}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
      />

      <ConnectMonoModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onAccountConnected={() => {
          setIsConnectModalOpen(false);
          fetchData();
        }}
      />
    </div>
  );
};
