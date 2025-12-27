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
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white w-full max-w-md rounded shadow-lg">
        <div className="flex justify-between items-center border-b px-4 py-3">
          <h2 className="font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-500">✕</button>
        </div>

        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
