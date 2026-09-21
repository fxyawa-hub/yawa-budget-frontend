import React, { useState, useEffect } from "react";
import { X, Building2, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { ErrorAlert } from "../common/ErrorAlert";
import { MonoInstitution, MonoAccount } from "../../types";
import { getMonoInstitutionsApi, connectMonoAccountApi } from "../../api/mono";
import { getErrorMessage } from "../../api/client";

interface ConnectMonoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountConnected: (account: MonoAccount) => void;
}

export const ConnectMonoModal: React.FC<ConnectMonoModalProps> = ({
  isOpen,
  onClose,
  onAccountConnected,
}) => {
  const [institutions, setInstitutions] = useState<MonoInstitution[]>([]);
  const [selectedInstitution, setSelectedInstitution] = useState<string>("GTBank (Guaranty Trust Bank)");
  const [accountNumber, setAccountNumber] = useState<string>("0123456789");
  const [step, setStep] = useState<"select" | "connecting" | "success">("select");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [connectedAccount, setConnectedAccount] = useState<MonoAccount | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep("select");
      setError(null);
      getMonoInstitutionsApi()
        .then((data) => {
          setInstitutions(data);
          if (data.length > 0) {
            setSelectedInstitution(data[0].name);
          }
        })
        .catch(() => {
          // Fallback institutions if backend cold
          setInstitutions([
            { id: "inst_gtb", name: "GTBank (Guaranty Trust Bank)", bankCode: "058", country: "NG" },
            { id: "inst_zenith", name: "Zenith Bank", bankCode: "057", country: "NG" },
            { id: "inst_kuda", name: "Kuda Microfinance Bank", bankCode: "50211", country: "NG" },
            { id: "inst_access", name: "Access Bank", bankCode: "044", country: "NG" },
          ]);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    setStep("connecting");

    try {
      // Simulate realistic Mono widget auth handshake
      await new Promise((resolve) => setTimeout(resolve, 800));

      const account = await connectMonoAccountApi({
        institutionName: selectedInstitution,
        accountNumber: accountNumber.trim() || undefined,
      });

      setConnectedAccount(account);
      setStep("success");
      onAccountConnected(account);
    } catch (err) {
      setStep("select");
      setError(getErrorMessage(err, "Failed to connect bank account via Mono sandbox."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-color)] p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <X className="w-4 h-4" />
        </button>

        {step === "select" && (
          <form onSubmit={handleConnect} className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-color)]">
              <div className="w-7 h-7 flex items-center justify-center border border-[var(--border-color)] bg-[var(--bg-base)] text-[var(--text-primary)]">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Link Bank Account (Mono Sandbox)
                </h3>
                <p className="text-[11px] font-mono text-[var(--text-muted)]">
                  Open Banking test connection • Read-only
                </p>
              </div>
            </div>

            {error && <ErrorAlert message={error} />}

            <div className="p-2.5 bg-[var(--bg-base)] border border-[var(--border-color)] text-[11px] text-[var(--text-secondary)] space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-[var(--text-primary)]">
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-lime-text)] dark:text-[var(--accent-lime)]" />
                <span>Mono Sandbox Environment</span>
              </div>
              <p>
                Connects to Mono&apos;s Open Banking sandbox using test credentials. Pulls real-shaped transaction histories without live financial data or licensing requirements.
              </p>
            </div>

            <div className="space-y-1">
              <label htmlFor="mono-institution-select" className="block text-xs font-mono text-[var(--text-secondary)]">
                Select financial institution
              </label>
              <select
                id="mono-institution-select"
                value={selectedInstitution}
                onChange={(e) => setSelectedInstitution(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[var(--bg-base)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-primary)]"
              >
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.name}>
                    {inst.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Input
                id="mono-account-number"
                label="Test NUBAN Account Number (10 digits)"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="0123456789"
                maxLength={10}
                required
              />
              <p className="mt-1 text-[10px] font-mono text-[var(--text-muted)]">
                Default sandbox test account: 0123456789
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[var(--border-color)]">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
                Connect test account
              </Button>
            </div>
          </form>
        )}

        {step === "connecting" && (
          <div className="py-8 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[var(--border-color)] border-t-[var(--accent-lime)] rounded-full animate-spin mx-auto" />
            <div className="text-xs font-medium text-[var(--text-primary)]">
              Authenticating with Mono Sandbox...
            </div>
            <p className="text-[11px] font-mono text-[var(--text-muted)]">
              Securing Open Banking token and pulling transaction feed
            </p>
          </div>
        )}

        {step === "success" && connectedAccount && (
          <div className="space-y-4 text-center">
            <div className="w-10 h-10 border border-[var(--accent-lime)] bg-[var(--accent-lime-subtle)] text-[var(--accent-lime-text)] dark:text-[var(--accent-lime)] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Bank account linked
              </h3>
              <p className="text-xs font-mono text-[var(--text-muted)] mt-0.5">
                {connectedAccount.institutionName} •••• {connectedAccount.accountNumber.slice(-4)}
              </p>
            </div>

            <div className="p-3 bg-[var(--bg-base)] border border-[var(--border-color)] text-xs text-left font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Account name:</span>
                <span className="text-[var(--text-primary)] font-sans">{connectedAccount.accountName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Available balance:</span>
                <span className="text-[var(--text-primary)] font-bold">₦{connectedAccount.balance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Status:</span>
                <span className="text-[var(--accent-lime-text)] dark:text-[var(--accent-lime)] font-sans">Active (Sandbox)</span>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              className="w-full"
              onClick={onClose}
            >
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
