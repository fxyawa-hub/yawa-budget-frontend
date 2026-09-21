import React, { useState } from "react";
import { Building2, RefreshCw, Plus, Unlink, Check, AlertCircle } from "lucide-react";
import { MonoAccount, MonoSyncResponse } from "../../types";
import { syncMonoTransactionsApi, unlinkMonoAccountApi } from "../../api/mono";
import { Button } from "../common/Button";
import { ConnectMonoModal } from "./ConnectMonoModal";
import { getErrorMessage } from "../../api/client";

interface MonoAccountsSectionProps {
  accounts: MonoAccount[];
  onAccountsUpdated: () => void;
  onTransactionsImported?: (count: number) => void;
  compact?: boolean;
}

export const MonoAccountsSection: React.FC<MonoAccountsSectionProps> = ({
  accounts,
  onAccountsUpdated,
  onTransactionsImported,
  compact = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSync = async (accountId: string) => {
    setFeedback(null);
    setSyncingId(accountId);
    try {
      const res = await syncMonoTransactionsApi(accountId);
      setFeedback({
        type: "success",
        message: `Synced ${res.importedCount} transaction(s) into Yawa Budget ledger.`,
      });
      onAccountsUpdated();
      if (onTransactionsImported) {
        onTransactionsImported(res.importedCount);
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message: getErrorMessage(err, "Failed to sync transactions from Mono."),
      });
    } finally {
      setSyncingId(null);
    }
  };

  const handleUnlink = async (accountId: string) => {
    if (!window.confirm("Are you sure you want to disconnect this test bank account?")) {
      return;
    }
    setFeedback(null);
    setUnlinkingId(accountId);
    try {
      await unlinkMonoAccountApi(accountId);
      setFeedback({
        type: "success",
        message: "Bank account disconnected.",
      });
      onAccountsUpdated();
    } catch (err) {
      setFeedback({
        type: "error",
        message: getErrorMessage(err, "Failed to disconnect bank account."),
      });
    } finally {
      setUnlinkingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <span>Linked bank accounts</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 border border-[var(--border-color)] bg-[var(--bg-base)] text-[var(--text-muted)]">
              Mono Sandbox
            </span>
          </h3>
          {!compact && (
            <p className="text-xs font-mono text-[var(--text-muted)] mt-0.5">
              Pull real-shaped bank statement transactions into your ledger via Open Banking
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="text-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          <span>Connect account</span>
        </Button>
      </div>

      {feedback && (
        <div
          className={`p-2.5 text-xs font-mono flex items-center gap-2 border ${
            feedback.type === "success"
              ? "border-[var(--accent-lime)] bg-[var(--accent-lime-subtle)] text-[var(--text-primary)]"
              : "border-[var(--alert-red)] bg-[var(--alert-red-subtle)] text-[var(--alert-red)]"
          }`}
        >
          {feedback.type === "success" ? (
            <Check className="w-3.5 h-3.5 text-[var(--accent-lime-text)] dark:text-[var(--accent-lime)] shrink-0" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="p-4 border border-[var(--border-color)] bg-[var(--bg-base)] text-center text-xs text-[var(--text-muted)] space-y-2">
          <p>No bank account linked yet.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsModalOpen(true)}
          >
            Connect test bank (Mono Sandbox)
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {accounts.map((acc) => {
            const isSyncing = syncingId === acc.id;
            const isUnlinking = unlinkingId === acc.id;
            const lastSync = acc.lastSyncedAt
              ? new Date(acc.lastSyncedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "Never";

            return (
              <div
                key={acc.id}
                className="p-3.5 border border-[var(--border-color)] bg-[var(--bg-base)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 flex items-center justify-center border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[var(--text-primary)]">
                        {acc.institutionName}
                      </span>
                      <span className="text-[11px] font-mono text-[var(--text-muted)]">
                        •••• {acc.accountNumber.slice(-4)}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-lime)]" title="Connected" />
                    </div>
                    <div className="text-[11px] font-mono text-[var(--text-secondary)] mt-0.5 flex flex-wrap gap-x-3">
                      <span>Bal: <strong className="text-[var(--text-primary)]">₦{acc.balance.toLocaleString()}</strong></span>
                      <span className="text-[var(--text-muted)]">Synced: {lastSync}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-7.5 px-2.5"
                    isLoading={isSyncing}
                    onClick={() => handleSync(acc.id)}
                    title="Pull real-shaped bank statement transactions"
                  >
                    <RefreshCw className={`w-3 h-3 mr-1 ${isSyncing ? "animate-spin" : ""}`} />
                    <span>Sync transactions</span>
                  </Button>
                  <button
                    type="button"
                    onClick={() => handleUnlink(acc.id)}
                    disabled={isUnlinking}
                    title="Disconnect account"
                    aria-label="Disconnect account"
                    className="p-1.5 border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--alert-red)] hover:border-[var(--alert-red)] transition-colors"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConnectMonoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAccountConnected={() => {
          onAccountsUpdated();
        }}
      />
    </div>
  );
};
