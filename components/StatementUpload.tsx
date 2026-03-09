// components/StatementUpload.tsx
import React, { useState } from "react";
import { Upload, FileText, CheckCircle } from "lucide-react";
import { parseCSVStatement, SpendSummary } from "@/lib/statement-parser";

export const StatementUpload = ({
  onAnalysisComplete,
}: {
  onAnalysisComplete: (s: SpendSummary) => void;
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const analysis = parseCSVStatement(text);
      onAnalysisComplete(analysis);
    };
    reader.readAsText(file);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      className={`relative group cursor-pointer border-2 border-dashed rounded-3xl p-12 transition-all 
        ${isDragging ? "border-gold bg-gold/5" : "border-white/10 hover:border-white/20"}`}
    >
      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="absolute inset-0 opacity-0 cursor-pointer"
      />

      <div className="flex flex-col items-center text-center space-y-4">
        <div className="p-4 bg-white/5 rounded-full group-hover:scale-110 transition-transform">
          <Upload className="w-8 h-8 text-gold" />
        </div>
        <div>
          <h3 className="text-xl font-serif font-bold">Upload Statement</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Drop your bank CSV here to unlock personalized intelligence.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="text-[10px] px-2 py-1 bg-white/5 rounded uppercase tracking-widest font-bold">
            Privacy Guaranteed
          </span>
          <span className="text-[10px] px-2 py-1 bg-white/5 rounded uppercase tracking-widest font-bold">
            Local Analysis
          </span>
        </div>
      </div>
    </div>
  );
};
