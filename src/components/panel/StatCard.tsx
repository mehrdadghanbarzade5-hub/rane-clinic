// src/components/panel/StatCard.tsx
export default function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[22px] border border-emerald-900/10 bg-white/80 p-5">
      <div className="text-xs font-bold text-emerald-950/55">{label}</div>
      <div className="mt-1 text-2xl font-bold text-emerald-950">{value}</div>
    </div>
  );
}
