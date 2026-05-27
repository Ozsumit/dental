import { useState, useEffect } from "react";
import { X, Pencil, Loader2 } from "lucide-react";

interface EditProcedureModalProps {
  isOpen: boolean;
  procedure: Procedure | null;
  onClose: () => void;
  onSave: (id: string, cost: number) => Promise<void>;
  isSaving: boolean;
}

export default function EditProcedureModal({
  isOpen,
  procedure,
  onClose,
  onSave,
  isSaving,
}: EditProcedureModalProps) {
  const [cost, setCost] = useState<string>("");

  useEffect(() => {
    if (procedure) {
      setCost(procedure.cost.toString());
    }
  }, [procedure]);

  if (!isOpen || !procedure) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedCost = parseFloat(cost);
    if (!isNaN(parsedCost) && parsedCost >= 0) {
      onSave(procedure.id, parsedCost);
    }
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-sm">
            Edit Procedure Charge
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Treatment / Procedure Name
            </label>
            <input
              type="text"
              disabled
              value={procedure.name}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Patient
            </label>
            <input
              type="text"
              disabled
              value={`${procedure.patient?.firstName} ${procedure.patient?.lastName}`}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Charge Amount (NPR)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                NPR
              </span>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 focus:border-slate-300 focus:ring-2 focus:ring-blue-50 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none transition-all"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 bg-[#1E5B94] hover:bg-[#154675] text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-colors disabled:opacity-75 active:scale-[0.98]"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
