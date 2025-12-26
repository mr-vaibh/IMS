"use client";

export default function Pagination({ meta, onPage }: any) {
  const { offset, limit, total } = meta;

  return (
    <div className="flex gap-2 mt-3">
      <button
        disabled={offset === 0}
        onClick={() => onPage(offset - limit)}
      >
        Prev
      </button>

      <span>
        {offset + 1} – {Math.min(offset + limit, total)} of {total}
      </span>

      <button
        disabled={offset + limit >= total}
        onClick={() => onPage(offset + limit)}
      >
        Next
      </button>
    </div>
  );
}
