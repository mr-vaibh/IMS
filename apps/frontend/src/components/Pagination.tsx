"use client";

export default function Pagination({ meta, onPage }: any) {
  const { offset, limit, total } = meta;

  return (
    <div className="flex items-center gap-3 mt-3">
      <button
        className={`pagination-btn ${offset === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
        disabled={offset === 0}
        onClick={() => onPage(Math.max(0, offset - limit))}
      >
        Prev
      </button>

      <div className="text-sm muted">
        {offset + 1} – {Math.min(offset + limit, total)} of {total}
      </div>

      <button
        className={`pagination-btn ${offset + limit >= total ? 'opacity-40 cursor-not-allowed' : ''}`}
        disabled={offset + limit >= total}
        onClick={() => onPage(Math.min(total - limit, offset + limit))}
      >
        Next
      </button>
    </div>
  );
}
