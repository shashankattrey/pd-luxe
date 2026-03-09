// components/AnalysisSummaryCard.tsx
const AnalysisSummaryCard = ({ analysis, onReset }) => {
  return (
    <div className="glass p-8 rounded-[2rem] border-gold/30 bg-gold/5 flex flex-col md:flex-row items-center justify-between animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gold">
          Your Monthly Profile
        </span>
        <h2 className="text-2xl font-serif font-bold">
          ₹{analysis.total.toLocaleString()} Analyzed
        </h2>
        <div className="flex gap-4 mt-2">
          {Object.entries(analysis.categories).map(
            ([cat, amt]) =>
              amt > 0 && (
                <div key={cat} className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase">
                    {cat}
                  </span>
                  <span className="text-xs font-bold">
                    ₹{amt.toLocaleString()}
                  </span>
                </div>
              ),
          )}
        </div>
      </div>

      <button
        onClick={onReset}
        className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-full text-xs font-bold transition-all"
      >
        Clear Statement
      </button>
    </div>
  );
};
