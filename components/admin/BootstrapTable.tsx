'use client';

import { useMemo, useState } from 'react';

export type BsColumn<T> = { key: string; header: string; sortKey?: keyof T; render: (row: T) => React.ReactNode };

export default function BootstrapTable<T extends { id: string }>({
  columns,
  data,
  loading,
  searchKeys,
  pageSize = 10,
  emptyMessage = 'Nothing here yet.'
}: {
  columns: BsColumn<T>[];
  data: T[];
  loading?: boolean;
  searchKeys: (keyof T)[];
  pageSize?: number;
  emptyMessage?: string;
}) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: keyof T; dir: 'asc' | 'desc' } | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter((row) => searchKeys.some((key) => String(row[key] ?? '').toLowerCase().includes(q)));
  }, [data, search, searchKeys]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = String(a[sort.key] ?? '').toLowerCase();
      const bv = String(b[sort.key] ?? '').toLowerCase();
      if (av < bv) return sort.dir === 'asc' ? -1 : 1;
      if (av > bv) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function toggleSort(key: keyof T) {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc') return { key, dir: 'desc' };
      return null;
    });
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-end mb-3">
        <input
          type="search"
          className="form-control"
          style={{ maxWidth: 260 }}
          placeholder="Search…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {sorted.length === 0 ? (
        <p className="text-center text-muted py-5 mb-0">{emptyMessage}</p>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      onClick={col.sortKey ? () => toggleSort(col.sortKey as keyof T) : undefined}
                      style={col.sortKey ? { cursor: 'pointer', userSelect: 'none' } : undefined}
                    >
                      {col.header}
                      {col.sortKey && (
                        <i
                          className={`bi ms-1 ${
                            sort?.key === col.sortKey ? (sort.dir === 'asc' ? 'bi-caret-up-fill' : 'bi-caret-down-fill') : 'bi-chevron-expand text-muted'
                          }`}
                          style={{ fontSize: 11 }}
                        ></i>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => (
                  <tr key={row.id}>
                    {columns.map((col) => (
                      <td key={col.key}>{col.render(row)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="d-flex align-items-center justify-content-between mt-3">
              <span className="text-muted small">
                Page {currentPage} of {totalPages} · {sorted.length} results
              </span>
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item${currentPage === 1 ? ' disabled' : ''}`}>
                    <button type="button" className="page-link" disabled={currentPage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                      Previous
                    </button>
                  </li>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <li key={n} className={`page-item${n === currentPage ? ' active' : ''}`}>
                      <button type="button" className="page-link" onClick={() => setPage(n)}>
                        {n}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item${currentPage === totalPages ? ' disabled' : ''}`}>
                    <button
                      type="button"
                      className="page-link"
                      disabled={currentPage === totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
}
