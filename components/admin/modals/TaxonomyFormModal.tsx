
"use client";

import { saveTaxonomy } from "@/app/actions/taxonomyActions";
import { X, Save } from "lucide-react";
import { Taxonomy } from "@prisma/client";

interface TaxonomyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTaxonomy: Taxonomy | null;
  tenantId: string;
}

export default function TaxonomyFormModal({ isOpen, onClose, selectedTaxonomy, tenantId }: TaxonomyFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800">
            {selectedTaxonomy ? "Edit Clinical Taxonomy" : "New Clinical Taxonomy"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form
          action={async (formData) => {
            await saveTaxonomy(formData);
            onClose();
          }}
          className="p-6 space-y-5"
        >
          <input type="hidden" name="id" value={selectedTaxonomy?.id || ""} />
          <input type="hidden" name="tenantId" value={tenantId} />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Group</label>
              <select
                required
                name="group"
                defaultValue={selectedTaxonomy?.group || "DIAGNOSIS"}
                className="mt-1.5 w-full p-3 border border-slate-300 rounded-xl outline-none bg-white font-bold text-sm"
              >
                <option value="MEDICAL_HISTORY">Medical History</option>
                <option value="INTAKE_QUESTION">Intake Question</option>
                <option value="EXAMINATION">Examination</option>
                <option value="PROBLEM">Problem</option>
                <option value="DIAGNOSIS">Diagnosis</option>
                <option value="INVESTIGATION">Investigation</option>
                <option value="TREATMENT">Treatment</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Order</label>
              <input
                name="order"
                type="number"
                defaultValue={selectedTaxonomy?.order || 0}
                className="mt-1.5 w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-600 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Category (Optional)</label>
            <input
              name="category"
              defaultValue={selectedTaxonomy?.category || ""}
              className="mt-1.5 w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-600 outline-none"
              placeholder="e.g. Systemic Diseases"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Label</label>
              <input
                required
                name="label"
                defaultValue={selectedTaxonomy?.label}
                className="mt-1.5 w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-600 outline-none"
                placeholder="e.g. Diabetes Mellitus"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Value / ID</label>
              <input
                required
                name="value"
                defaultValue={selectedTaxonomy?.value}
                className="mt-1.5 w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-600 outline-none font-mono text-sm"
                placeholder="e.g. DIABETES"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Metadata JSON (Optional)</label>
            <textarea
              name="metadata"
              defaultValue={selectedTaxonomy?.metadata ? JSON.stringify(selectedTaxonomy.metadata) : ""}
              rows={3}
              className="mt-1.5 w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-600 outline-none font-mono text-xs resize-none"
              placeholder='{"type": "critical", "options": ["A", "B"]}'
            />
          </div>

          <div className="pt-2 flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-slate-700 font-bold hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-brand-700 text-white font-bold hover:bg-brand-800 rounded-xl shadow-md transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Taxonomy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
