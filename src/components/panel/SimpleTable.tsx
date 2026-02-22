// src/components/panel/SimpleTable.tsx
import React from "react";

export default function SimpleTable({
  columns,
  rows,
}: {
  columns: { key: string; label: string }[];
  rows: Record<string, React.ReactNode>[];
}) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-emerald-900/10 bg-white/70">
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-bold">
          <thead className="bg-white/70">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className="text-right px-4 py-3 text-emerald-950/60 whitespace-nowrap"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={idx} className="border-t border-emerald-900/10">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3 whitespace-nowrap">
                    {r[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
