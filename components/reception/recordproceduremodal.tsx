"use client";

import { X } from "lucide-react";
import { saveProcedure } from "@/app/actions/receptionistActions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function RecordProcedureModal({
    patientId,
    isOpen,
    onClose,
}: {
    patientId: string;
    isOpen: boolean;
    onClose: () => void;
}) {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (formData: FormData) => saveProcedure(patientId, formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["patients"] });
            queryClient.invalidateQueries({ queryKey: ["patientDetails", patientId] });
            queryClient.invalidateQueries({ queryKey: ["adminStats"] });
            onClose();
        },
        onError: (e: any) => alert(e.message)
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-xl font-bold text-slate-800">Record New Procedure</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form
                    action={(formData: FormData) => mutation.mutate(formData)}
                    className="p-6 space-y-4"
                >
                    <Input
                        label="Procedure Name"
                        required
                        name="name"
                        placeholder="e.g. Scaling & Polishing"
                    />
                    <Input
                        label="Date"
                        required
                        type="date"
                        name="procedureDate"
                        defaultValue={new Date().toISOString().split("T")[0]}
                    />
                    <Input
                        label="Amount Charged ($)"
                        required
                        type="number"
                        name="cost"
                        step="0.01"
                        placeholder="0.00"
                    />
                    <div className="pt-2 flex justify-end gap-3 mt-4">
                        <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" loading={mutation.isPending}>
                            Save Record
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}