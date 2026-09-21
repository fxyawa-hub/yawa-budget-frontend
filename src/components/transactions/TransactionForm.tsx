import React, { useState } from "react";
import { Plus, Sparkles, DollarSign, Calendar, Tag, FileText } from "lucide-react";
import { Input } from "../common/Input";
import { Button } from "../common/Button";
import { ErrorAlert } from "../common/ErrorAlert";
import { CategorySuggestionModal } from "./CategorySuggestionModal";
import { categorizeTransactionApi } from "../../api/ai";
import { CreateTransactionPayload } from "../../types";
import { getErrorMessage } from "../../api/client";

interface TransactionFormProps {
  categories: string[];
  onSubmitTransaction: (payload: CreateTransactionPayload) => Promise<void>;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  categories,
  onSubmitTransaction,
}) => {
  const todayStr = new Date().toISOString().split("T")[0];

  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [date, setDate] = useState<string>(todayStr);
  const [category, setCategory] = useState<string>("");

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCategorizing, setIsCategorizing] = useState<boolean>(false);

  // State for AI Suggestion modal
  const [suggestionModalOpen, setSuggestionModalOpen] = useState<boolean>(false);
  const [aiSuggestion, setAiSuggestion] = useState<{
    suggestedCategory: string;
    confidence?: number;
    explanation?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError("Please enter a valid positive amount.");
      return;
    }

    if (!description.trim()) {
      setFormError("Please enter a transaction description.");
      return;
    }

    if (!date) {
      setFormError("Please choose a date.");
      return;
    }

    // If category is left blank, trigger AI categorization
    if (!category.trim()) {
      setIsCategorizing(true);
      try {
        const aiResult = await categorizeTransactionApi({
          description: description.trim(),
          amount: numAmount,
        });

        setAiSuggestion(aiResult);
        setSuggestionModalOpen(true);
      } catch (err) {
        setAiSuggestion({
          suggestedCategory: "Other",
          explanation: "Temporary categorization fallback.",
        });
        setSuggestionModalOpen(true);
      } finally {
        setIsCategorizing(false);
      }
      return;
    }

    // Category is provided directly: save immediately
    await saveTransaction(category.trim());
  };

  const saveTransaction = async (finalCategory: string) => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      await onSubmitTransaction({
        amount: parseFloat(amount),
        description: description.trim(),
        date,
        category: finalCategory,
      });

      // Reset form on success
      setAmount("");
      setDescription("");
      setDate(todayStr);
      setCategory("");
      setSuggestionModalOpen(false);
      setAiSuggestion(null);
    } catch (err) {
      setFormError(getErrorMessage(err, "Failed to record transaction. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalConfirm = async (finalCategory: string) => {
    await saveTransaction(finalCategory);
  };

  return (
    <div id="add-transaction-card" className="border border-[var(--border-color)] bg-[var(--bg-surface)] p-5 sm:p-6 mb-8">
      <div className="pb-3 mb-4 border-b border-[var(--border-color)]">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Record transaction
        </h3>
        <p className="text-xs font-mono text-[var(--text-muted)] mt-0.5">
          Leave category blank to automatically classify with AI
        </p>
      </div>

      {formError && <ErrorAlert message={formError} className="mb-4" />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Amount */}
          <Input
            id="tx-amount-input"
            label="Amount ($)"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            leftIcon={<DollarSign className="w-3.5 h-3.5" />}
            required
          />

          {/* Description */}
          <Input
            id="tx-desc-input"
            label="Description"
            type="text"
            placeholder="e.g. Grocery store, Subway"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            leftIcon={<FileText className="w-3.5 h-3.5" />}
            required
          />

          {/* Date */}
          <Input
            id="tx-date-input"
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            leftIcon={<Calendar className="w-3.5 h-3.5" />}
            required
          />

          {/* Optional Category */}
          <div>
            <label
              htmlFor="tx-category-select"
              className="block text-xs font-sans text-[var(--text-secondary)] mb-1"
            >
              Category <span className="text-[var(--text-muted)]">(optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                <Tag className="w-3.5 h-3.5" />
              </div>
              <select
                id="tx-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-sm border border-[var(--border-color)] bg-[var(--bg-surface)] pl-9 pr-3 py-1.5 text-sm text-[var(--text-primary)] transition-colors focus:outline-none focus:border-[var(--text-primary)]"
              >
                <option value="">Auto-detect with AI</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            id="submit-transaction-btn"
            type="submit"
            isLoading={isSubmitting || isCategorizing}
            leftIcon={
              !category.trim() ? (
                <Sparkles className="w-3.5 h-3.5" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )
            }
          >
            {isCategorizing
              ? "Categorizing..."
              : isSubmitting
              ? "Recording..."
              : !category.trim()
              ? "Categorize with AI and record"
              : "Record transaction"}
          </Button>
        </div>
      </form>

      {/* Confirmation modal for AI suggested category */}
      {aiSuggestion && (
        <CategorySuggestionModal
          isOpen={suggestionModalOpen}
          onClose={() => setSuggestionModalOpen(false)}
          description={description}
          amount={parseFloat(amount) || 0}
          suggestedCategory={aiSuggestion.suggestedCategory}
          confidence={aiSuggestion.confidence}
          explanation={aiSuggestion.explanation}
          availableCategories={categories}
          onConfirm={handleModalConfirm}
          isSaving={isSubmitting}
        />
      )}
    </div>
  );
};
