"use client";

import { useState, useRef } from "react";
import { Heart, Phone, Trash2, X } from "lucide-react";
import { Patient } from "@/lib/types/index";
import {
    linkFamilyMember,
    unlinkFamilyMember,
    searchPatientsToLink,
} from "@/app/actions/patientsActions";

export function FamilyGroupCard({
    patient,
    onSwitchPatient,
}: {
    patient: Patient;
    onSwitchPatient: (id: string) => void;
}) {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<
        { id: string; firstName: string; lastName: string; phone: string; dateOfBirth: Date }[]
    >([]);
    const [relations, setRelations] = useState<Record<string, string>>({});
    const latestQuery = useRef("");

    const handleSearch = async (query: string) => {
        latestQuery.current = query;
        if (!query || !query.trim()) {
            setSearchResults([]);
            return;
        }
        try {
            const res = await searchPatientsToLink(query, patient.id);
            if (latestQuery.current === query) {
                setSearchResults(res as any);
            }
        } catch (error) {
            console.error("Error searching patients to link:", error);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Heart className="w-4 h-4 text-emerald-600" /> Family & Dependents
            </h3>

            {patient.primaryAccount && (
                <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100/80 space-y-3">
                    <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest bg-emerald-100 px-2.5 py-1 rounded-full inline-block">
                        Dependent Profile
                    </span>
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Primary Guarantor</p>
                        <button
                            type="button"
                            onClick={() => onSwitchPatient(patient.primaryAccount!.id)}
                            className="text-sm font-bold text-brand-700 hover:text-brand-800 hover:underline text-left mt-0.5"
                        >
                            {patient.primaryAccount.firstName} {patient.primaryAccount.lastName}
                        </button>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">{patient.primaryAccount.phone}</p>
                    </div>
                    <button
                        type="button"
                        onClick={async () => {
                            await unlinkFamilyMember(patient.id);
                            onSwitchPatient(patient.id);
                        }}
                        className="w-full text-center py-2 border border-red-200 hover:bg-red-50 text-red-600 text-xs font-bold rounded-lg transition"
                    >
                        Unlink Account
                    </button>
                </div>
            )}

            {patient.familyMembers && patient.familyMembers.length > 0 && (
                <div className="space-y-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Linked Family Members</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {patient.familyMembers.map((member) => (
                            <div
                                key={member.id}
                                className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center hover:bg-slate-100/60 transition"
                            >
                                <button
                                    type="button"
                                    onClick={() => onSwitchPatient(member.id)}
                                    className="text-left group flex-1"
                                >
                                    <p className="text-sm font-bold text-slate-800 group-hover:text-brand-700 group-hover:underline">
                                        {member.firstName} {member.lastName}
                                    </p>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                                        {member.familyRelation || "Family"} · {member.phone}
                                    </p>
                                </button>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        await unlinkFamilyMember(member.id);
                                        onSwitchPatient(patient.id);
                                    }}
                                    className="text-slate-400 hover:text-red-650 p-1.5 hover:bg-red-50 rounded-lg transition"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!patient.primaryAccountId && (
                <div className="pt-3 border-t border-slate-100 space-y-3">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Link Family Member</p>
                    <div className="relative">
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                placeholder="Search by name or phone..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    handleSearch(e.target.value);
                                }}
                                onBlur={() => {
                                    setTimeout(() => {
                                        setSearchResults([]);
                                    }, 250);
                                }}
                                className="w-full pr-8 p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-600 outline-none"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setSearchResults([]);
                                        latestQuery.current = "";
                                    }}
                                    className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-100">
                                {searchResults.map((res) => (
                                    <div key={res.id} className="p-3 hover:bg-slate-50 flex justify-between items-center gap-2">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-bold text-slate-800 truncate">
                                                {res.firstName} {res.lastName}
                                            </p>
                                            <p className="text-[10px] text-slate-500">{res.phone}</p>
                                        </div>
                                        <div className="flex gap-1.5 shrink-0 items-center">
                                            <select
                                                value={relations[res.id] || "Child"}
                                                onChange={(e) => setRelations({ ...relations, [res.id]: e.target.value })}
                                                className="text-[10px] font-bold border border-slate-200 rounded p-1 bg-white"
                                            >
                                                <option value="Spouse">Spouse</option>
                                                <option value="Child">Child</option>
                                                <option value="Parent">Parent</option>
                                                <option value="Other">Other</option>
                                            </select>
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    await linkFamilyMember(patient.id, res.id, relations[res.id] || "Child");
                                                    setSearchQuery("");
                                                    setSearchResults([]);
                                                    onSwitchPatient(patient.id);
                                                }}
                                                className="px-2 py-1 bg-brand-700 hover:bg-brand-800 text-white rounded text-[10px] font-bold uppercase transition"
                                            >
                                                Link
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}