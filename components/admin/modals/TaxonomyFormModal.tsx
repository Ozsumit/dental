"use client";

import { saveTaxonomy } from "@/app/actions/taxonomyActions";
import { X, Save } from "lucide-react";
import { Taxonomy } from "@prisma/client";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

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
            await saveTaxonomy(formData).catch(e => alert(e.message));
            onClose();
          }}
          className="p-6 space-y-5"
        >
          <input type="hidden" name="id" value={selectedTaxonomy?.id || ""} />
          <input type="hidden" name="tenantId" value={tenantId} />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Group"
              required
              name="group"
              defaultValue={selectedTaxonomy?.group || "DIAGNOSIS"}
              options={[
                { label: "Medical History", value: "MEDICAL_HISTORY" },
                { label: "Intake Question", value: "INTAKE_QUESTION" },
                { label: "Examination", value: "EXAMINATION" },
                { label: "Problem", value: "PROBLEM" },
                { label: "Diagnosis", value: "DIAGNOSIS" },
                { label: "Investigation", value: "INVESTIGATION" },
                { label: "Treatment", value: "TREATMENT" },
              ]}
            />
            <Input
              label="Order"
              name="order"
              type="number"
              defaultValue={selectedTaxonomy?.order || 0}
            />
          </div>

          <Input
            label="Category (Optional)"
            name="category"
            defaultValue={selectedTaxonomy?.category || ""}
            placeholder="e.g. Systemic Diseases"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Label"
              required
              name="label"
              defaultValue={selectedTaxonomy?.label}
              placeholder="e.g. Diabetes Mellitus"
            />
            <Input
              label="Value / ID"
              required
              name="value"
              defaultValue={selectedTaxonomy?.value}
              placeholder="e.g. DIABETES"
              className="font-mono"
            />
          </div>

          <Textarea
            label="Metadata JSON (Optional)"
            name="metadata"
            defaultValue={selectedTaxonomy?.metadata ? JSON.stringify(selectedTaxonomy.metadata) : ""}
            rows={3}
            placeholder='{"type": "critical", "options": ["A", "B"]}'
            className="font-mono text-xs"
          />

          <div className="pt-2 flex justify-end gap-3 mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              <Save className="w-4 h-4 mr-2" /> Save Taxonomy
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
