"use client";

const MEDICAL_CONDITIONS = [
  { id: "CORD", label: "CORD" },
  { id: "Thyroid", label: "Thyroid" },
  { id: "Diabetes", label: "Diabetes" },
  { id: "Steroids", label: "Steroids" },
  { id: "X-Rays", label: "X-Rays/scans" },
  { id: "Cardiac", label: "Cardiac" },
  { id: "Epilepsy", label: "Epilepsy" },
  { id: "Cancer", label: "Cancer" },
  { id: "Surgery", label: "Surgery" },
  { id: "Pregnancy", label: "Pregnancy" },
  { id: "WeightLoss", label: "Weight Loss" },
  { id: "Other", label: "Other" },
];

interface SubjectiveTabProps {
  currentHistory?: string | null;
  pastHistory?: string | null;
  selectedConditions: string[];
  onToggleCondition: (id: string) => void;
  vasScore: number;
  onVasChange: (score: number) => void;
  onSave: (finalize: boolean) => void;
}

export function SubjectiveTab({
  currentHistory,
  pastHistory,
  selectedConditions,
  onToggleCondition,
  vasScore,
  onVasChange,
  onSave,
}: SubjectiveTabProps) {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl border border-slate-200 p-8 shadow-sm space-y-10 mb-8">
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">
            CURRENT HISTORY
          </label>
          <textarea
            name="currentHistory"
            defaultValue={currentHistory || ""}
            placeholder="Patient presents with lower back pain for 3 weeks, radiating to the left leg..."
            className="w-full border border-slate-200 rounded-lg p-4 text-sm min-h-[120px] focus:border-brand-600 outline-none text-slate-700 resize-none"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">
            PAST HISTORY
          </label>
          <textarea
            name="pastHistory"
            defaultValue={pastHistory || ""}
            placeholder="No major surgeries. History of mild hypertension (managed)."
            className="w-full border border-slate-200 rounded-lg p-4 text-sm min-h-[100px] focus:border-brand-600 outline-none text-slate-700 resize-none"
          />
        </div>

        <div className="border-t border-slate-100 pt-8">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 block">
            MEDICAL HISTORY
          </label>
          <div className="grid grid-cols-4 gap-4">
            {MEDICAL_CONDITIONS.map((cond) => {
              const isActive = selectedConditions.includes(cond.id);
              return (
                <div
                  key={cond.id}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    isActive ? "bg-brand-100" : "bg-transparent"
                  }`}
                >
                  <span className="text-sm text-slate-700">{cond.label}</span>
                  <button
                    type="button"
                    onClick={() => onToggleCondition(cond.id)}
                    className={`relative w-[44px] h-6 rounded-full transition-colors ${
                      isActive ? "bg-brand-800" : "bg-slate-200"
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        isActive ? "translate-x-5" : "translate-x-0 shadow-sm"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-slate-100 pt-8 pb-4">
          <div className="flex justify-between items-center mb-6">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">
              PAIN INTENSITY (VAS)
            </label>
            <span className="text-xs font-semibold text-red-600 bg-red-50 px-4 py-1.5 rounded-full border border-red-100">
              Score : {vasScore} / 10
            </span>
          </div>
          <div className="relative pl-2 pr-4">
            <div className="flex justify-between text-xs font-medium mb-4">
              <span className="text-green-500">0 = No Pain</span>
              <span className="text-red-700">10 = Worst Pain</span>
            </div>
            <div className="flex items-center gap-8">
              <div className="flex-1 relative">
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={vasScore}
                  onChange={(e) => onVasChange(parseInt(e.target.value))}
                  className="w-full h-3 rounded-full appearance-none outline-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-amber-500 [&::-webkit-slider-thumb]:shadow-md"
                  style={{
                    background: "linear-gradient(to right, #22c55e, #eab308, #ef4444)",
                  }}
                />
                <div className="flex justify-between mt-3 px-1">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <span key={n} className="text-xs text-slate-400 font-medium w-4 text-center">
                      {n}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-[40px] leading-none font-bold text-amber-500 w-12 text-center pb-4">
                {vasScore}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            onClick={() => onSave(false)}
            className="bg-brand-700 text-white px-6 py-2.5 rounded-md text-sm font-semibold hover:bg-brand-800 transition-colors"
          >
            Save Assessment
          </button>
        </div>
      </div>
    </div>
  );
}
