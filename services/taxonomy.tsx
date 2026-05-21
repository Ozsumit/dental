// useTaxonomies.ts
import { useMemo } from 'react';

// Define your types if using TypeScript (highly recommended here)
export interface TaxonomyItem {
    id: string;
    label: string;
    type: string;
    placeholder?: string;
    options?: string[];
}

export interface RawTaxonomy {
    group: string;
    category?: string;
    value: string;
    label: string;
    metadata?: {
        type?: string;
        placeholder?: string;
        options?: string[];
    };
}

export const useTaxonomyData = (taxonomies: RawTaxonomy[]) => {

    const MEDICAL_HISTORY_TAXONOMY = useMemo(() => {
        const grouped: Record<string, TaxonomyItem[]> = {};
        taxonomies.filter(t => t.group === "MEDICAL_HISTORY").forEach(t => {
            const cat = t.category || "General";
            if (!grouped[cat]) grouped[cat] = [];
            const metadata = t.metadata || {};
            grouped[cat].push({ id: t.value, label: t.label, type: metadata?.type || "info" });
        });
        return Object.keys(grouped).length > 0 ? grouped : { "General": [] };
    }, [taxonomies]);

    const DENTAL_RELEVANT_QUESTIONS = useMemo(() =>
        taxonomies.filter(t => t.group === "INTAKE_QUESTION").map(t => {
            const metadata = t.metadata || {};
            return { id: t.value, label: t.label, type: metadata?.type || "info" };
        }),
        [taxonomies]);

    const ON_EXAMINATION_TAXONOMY = useMemo(() => {
        const grouped: Record<string, TaxonomyItem[]> = {};
        taxonomies.filter(t => t.group === "EXAMINATION").forEach(t => {
            const cat = t.category || "General";
            if (!grouped[cat]) grouped[cat] = [];
            const metadata = t.metadata || {};
            grouped[cat].push({
                id: t.value,
                label: t.label,
                type: (metadata?.type as "text" | "checkbox" | "select") || "checkbox",
                placeholder: metadata?.placeholder,
                options: metadata?.options
            });
        });
        return grouped;
    }, [taxonomies]);

    const DENTAL_PROBLEM_TAXONOMY = useMemo(() => {
        const grouped: Record<string, string[]> = {};
        taxonomies.filter(t => t.group === "PROBLEM").forEach(t => {
            const cat = t.category || "General";
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(t.label);
        });
        return grouped;
    }, [taxonomies]);

    const DENTAL_DIAGNOSIS_TAXONOMY = useMemo(() => {
        const grouped: Record<string, string[]> = {};
        taxonomies.filter(t => t.group === "DIAGNOSIS").forEach(t => {
            const cat = t.category || "General";
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(t.label);
        });
        return grouped;
    }, [taxonomies]);

    const DENTAL_INVESTIGATION_TAXONOMY = useMemo(() => {
        const grouped: Record<string, string[]> = {};
        taxonomies.filter(t => t.group === "INVESTIGATION").forEach(t => {
            const cat = t.category || "General";
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(t.label);
        });
        return grouped;
    }, [taxonomies]);

    const DENTAL_TREATMENT_TAXONOMY = useMemo(() => {
        const grouped: Record<string, string[]> = {};
        taxonomies.filter(t => t.group === "TREATMENT").forEach(t => {
            const cat = t.category || "General";
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(t.label);
        });
        return grouped;
    }, [taxonomies]);

    // Return everything as an object
    return {
        MEDICAL_HISTORY_TAXONOMY,
        DENTAL_RELEVANT_QUESTIONS,
        ON_EXAMINATION_TAXONOMY,
        DENTAL_PROBLEM_TAXONOMY,
        DENTAL_DIAGNOSIS_TAXONOMY,
        DENTAL_INVESTIGATION_TAXONOMY,
        DENTAL_TREATMENT_TAXONOMY
    };
};