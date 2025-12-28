"use client";

import { ReactNode } from "react";

export default function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 modal-backdrop flex items-center justify-center px-4">
      <div className="modal-panel bg-white w-full max-w-md">
        <div className="flex justify-between items-center px-4 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-600)] text-white">
          <h2 className="font-semibold">{title}</h2>
          <button onClick={onClose} className="text-white opacity-90 hover:opacity-100">✕</button>
        </div>

        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
