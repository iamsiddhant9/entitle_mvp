const STATS = [
  { value: "12", label: "Government schemes covered" },
  { value: "<60s", label: "From questions to results" },
  { value: "EN + हिंदी", label: "Plain-language explanations" },
  { value: "0", label: "Personal details stored on-chain" },
];

export default function Stats() {
  return (
    <section className="mx-auto max-w-5xl px-4 pb-16">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm"
          >
            <p className="text-3xl font-extrabold tracking-tight text-slate-900">
              {stat.value}
            </p>
            <div className="mx-auto mt-2 h-0.5 w-8 rounded-full bg-gradient-to-r from-saffron to-indiagreen" />
            <p className="mt-2 text-xs font-medium text-slate-500">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
