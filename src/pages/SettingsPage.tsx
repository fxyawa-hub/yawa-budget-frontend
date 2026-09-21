import React, { useState, useEffect } from "react";
import { User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { DeleteAccountSection } from "../components/settings/DeleteAccountSection";
import { MonoAccountsSection } from "../components/mono/MonoAccountsSection";
import { getMonoAccountsApi } from "../api/mono";
import { MonoAccount } from "../types";

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [monoAccounts, setMonoAccounts] = useState<MonoAccount[]>([]);

  const loadAccounts = async () => {
    try {
      const data = await getMonoAccountsApi();
      setMonoAccounts(data);
    } catch {
      // Ignored in settings
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-[var(--border-color)]">
        <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
          Account settings
        </h1>
        <p className="text-xs font-mono text-[var(--text-muted)] mt-1">
          Credentials and ledger preferences
        </p>
      </div>

      {/* Profile Overview Panel */}
      <div className="border border-[var(--border-color)] bg-[var(--bg-surface)] p-6">
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-[var(--border-color)]">
          <div className="w-8 h-8 flex items-center justify-center border border-[var(--border-color)] text-[var(--text-secondary)] bg-[var(--bg-base)] rounded-xs">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Account profile
            </h3>
            <p className="text-xs font-mono text-[var(--text-muted)]">
              Active ledger member identity
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
          <div className="p-3 bg-[var(--bg-base)] border border-[var(--border-color)]">
            <span className="block text-[11px] font-mono text-[var(--text-muted)] mb-1">
              Full name
            </span>
            <span className="font-medium text-[var(--text-primary)]">
              {user?.name || "Not provided"}
            </span>
          </div>

          <div className="p-3 bg-[var(--bg-base)] border border-[var(--border-color)]">
            <span className="block text-[11px] font-mono text-[var(--text-muted)] mb-1">
              Email address
            </span>
            <span className="font-mono text-[var(--text-primary)]">
              {user?.email}
            </span>
          </div>
        </div>
      </div>

      {/* Open Banking Integration (Mono Sandbox) */}
      <div className="border border-[var(--border-color)] bg-[var(--bg-surface)] p-6">
        <MonoAccountsSection
          accounts={monoAccounts}
          onAccountsUpdated={loadAccounts}
        />
      </div>

      {/* Irreversible Account Deletion */}
      <DeleteAccountSection />
    </div>
  );
};
