"use client";

import { useEffect, useRef } from "react";
import { FiX } from "react-icons/fi";
import BudgetForm from "@/components/BudgetForm";

export default function TransactionFormDialog({ onClose, ...form }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  function close() {
    if (!form.setup?.busy) onClose();
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby="transaction-form-title"
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[540px] overflow-y-auto overscroll-contain rounded-xl bg-transparent text-[var(--color-accent)] backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <button
        type="button"
        onClick={close}
        disabled={form.setup?.busy}
        aria-label="Close form"
        className="absolute right-3 top-3 z-10 grid size-10 place-items-center rounded-lg text-[var(--color-secondary)] hover:bg-white/8 disabled:opacity-50"
      >
        <FiX size={19} />
      </button>
      <BudgetForm {...form} />
    </dialog>
  );
}
