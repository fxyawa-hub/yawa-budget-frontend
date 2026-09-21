import React, { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { Modal } from "../common/Modal";

interface CategorySuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  description: string;
  amount: number;
  suggestedCategory: string;
  confidence?: number;
  explanation?: string;
  availableCategories: string[];
  onConfirm: (finalCategory: string) => void;
  isSaving: boolean;
}

export const CategorySuggestionModal: React.FC<CategorySuggestionModalProps> = ({
  isOpen,
  onClose,
  description,
  amount,
  suggestedCategory,
  confidence,
  explanation,
  availableCategories,
  onConfirm,
  isSaving,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(suggestedCategory);

  useEffect(() => {
    setSelectedCategory(suggestedCategory);
  }, [suggestedCategory]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm transaction category"
      confirmText={isSaving ? "Saving..." : "Confirm category"}
      onConfirm={() => onConfirm(selectedCategory)}
      isConfirming={isSaving}
    >
      <div className="space-y-4">
        <div className="border border-[var(--border-color)] bg-[var(--bg-base)] p-3 flex items-start gap-3">
          <div className="w-6 h-6 border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--accent-lime-text)] dark:text-[var(--accent-lime)] flex items-center justify-center shrink-0 rounded-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="text-xs text-[var(--text-primary)] font-sans">
            <p className="font-semibold">Category suggestion</p>
            <p className="mt-0.5 text-[var(--text-secondary)] font-mono text-[11px]">
              "{description}" (${amount.toFixed(2)})
            </p>
            {explanation && (
              <p className="mt-1 text-[var(--text-muted)] font-mono text-[11px]">{explanation}</p>
            )}
          </div>
        </div>

        {/* Suggested Category Highlight */}
        <div className="p-3 border border-[var(--border-color)] bg-[var(--bg-base)]">
          <label className="block text-[11px] font-mono text-[var(--text-muted)] mb-1">
            Suggested category
          </label>
          <div className="flex items-center gap-2">
            <span className="font-sans text-sm font-bold text-[var(--text-primary)]">
              {selectedCategory}
            </span>
            {confidence && (
              <span className="text-[10px] font-mono border border-[var(--border-color)] px-1.5 py-0.5 text-[var(--text-secondary)] rounded-xs">
                {Math.round(confidence * 100)}% match
              </span>
            )}
          </div>
        </div>

        {/* Option to change to a different category */}
        <div>
          <label
            htmlFor="category-override-select"
            className="block text-xs font-sans text-[var(--text-secondary)] mb-1"
          >
            Or assign an alternate category:
          </label>
          <select
            id="category-override-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full rounded-sm border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm text-[var(--text-primary)] transition-colors focus:outline-none focus:border-[var(--text-primary)]"
          >
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Modal>
  );
};
