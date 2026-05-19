"use client";

import Image from "next/image";

interface ObjectiveData {
  mobility: string;
  transfer: string;
  pinsNeedles: string;
  numbness: string;
  adl: Record<string, string>;
  rom: Record<string, string>;
  strength: Record<string, number>;
}

interface ObjectiveTabProps {
  objectiveData: ObjectiveData;
  setObjectiveData: (data: ObjectiveData) => void;
  onSave: (finalize: boolean) => void;
}

export function ObjectiveTab({
  objectiveData,
  setObjectiveData,
  onSave,
}: ObjectiveTabProps) {
  return (
    <div className="flex-1 flex overflow-hidden bg-white">
      {/* Left Sidebar Body Chart */}
      <div className="w-[340px] border-r border-slate-200 p-8 flex flex-col gap-8 shrink-0 overflow-y-auto">
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 block">
            BODY CHART
          </label>
          <div className="bg-[#dcdfdc] rounded-xl aspect-[4/5] relative overflow-hidden flex items-center justify-center border border-slate-200">
            <Image
              src="/image.jpg"
              className="w-full h-full object-contain mix-blend-multiply opacity-80"
              alt="Body Chart"
              fill
              sizes="340px"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
              PINS & NEEDLES LOCATION
            </label>
            <select
              value={objectiveData.pinsNeedles}
              onChange={(e) =>
                setObjectiveData({
                  ...objectiveData,
                  pinsNeedles: e.target.value,
                })
              }
              className="w-full border border-slate-200 rounded-md p-2.5 text-sm outline-none focus:border-brand-600 text-slate-700 bg-white"
            >
              <option>None</option>
              <option>Left Lumbar, L4-L5</option>
              <option>Right Lumbar, L4-L5</option>
              <option>Cervical C5-C6</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
              NUMBNESS LOCATION
            </label>
            <select
              value={objectiveData.numbness}
              onChange={(e) =>
                setObjectiveData({
                  ...objectiveData,
                  numbness: e.target.value,
                })
              }
              className="w-full border border-slate-200 rounded-md p-2.5 text-sm outline-none focus:border-brand-600 text-slate-700 bg-white"
            >
              <option>None</option>
              <option>Left leg (lateral)</option>
              <option>Right leg (lateral)</option>
              <option>Arm (medial)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Objective */}
      <div className="flex-1 p-10 overflow-y-auto relative">
        <div className="max-w-[700px] space-y-12 pb-24">
          {/* Function */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 block">
              FUNCTION
            </label>
            <div className="border-t border-slate-100 pt-6 space-y-4">
              {["Mobility", "Transfer"].map((type) => (
                <div
                  className="flex items-center justify-between"
                  key={type}
                >
                  <span className="text-sm text-slate-700">
                    {type}
                  </span>
                  <div className="flex bg-slate-100 border border-slate-200 rounded-md p-1 w-[340px] justify-between">
                    {["Independent", "Assisted", "Dependent"].map(
                      (val) => {
                        const key =
                          type.toLowerCase() as keyof ObjectiveData;
                        const isActive =
                          objectiveData[key] === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() =>
                              setObjectiveData({
                                ...objectiveData,
                                [key]: val,
                              })
                            }
                            className={`flex-1 py-1.5 text-xs rounded transition-colors ${
                              isActive
                                ? "bg-white shadow-sm text-slate-800 font-semibold border border-slate-200"
                                : "text-slate-400 hover:text-slate-600 font-medium"
                            }`}
                          >
                            {val}
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ADLs */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 block">
              ADLS — ACTIVITIES OF DAILY LIVING
            </label>
            <div className="border-t border-slate-100 pt-6 grid grid-cols-2 gap-x-12 gap-y-6">
              {[
                "Dressing",
                "Walking",
                "Toileting",
                "Bathing",
                "Stair Climbing",
                "Cooking",
              ].map((type) => {
                const key =
                  type === "Stair Climbing"
                    ? "stairClimbing"
                    : type.toLowerCase();
                return (
                  <div className="flex flex-col gap-3" key={type}>
                    <span className="text-sm text-slate-700">
                      {type}
                    </span>
                    <div className="flex bg-slate-100 border border-slate-200 rounded-md p-1">
                      {[
                        "Independent",
                        "Assisted",
                        "Dependent",
                      ].map((val) => {
                        const isActive =
                          objectiveData.adl[key] === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() =>
                              setObjectiveData({
                                ...objectiveData,
                                adl: {
                                  ...objectiveData.adl,
                                  [key]: val,
                                },
                              })
                            }
                            className={`flex-1 py-1.5 text-[11px] rounded transition-colors ${
                              isActive
                                ? "bg-white shadow-sm text-slate-800 font-semibold border border-slate-200"
                                : "text-slate-400 hover:text-slate-600 font-medium"
                            }`}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Joint ROM */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 block">
              JOINT ROM (RANGE OF MOTION)
            </label>
            <div className="border-t border-slate-100 pt-6 grid grid-cols-3 gap-x-8 gap-y-6">
              {[
                { label: "Flexion", key: "flexion" },
                { label: "Extension", key: "extension" },
                { label: "L. Lat. Flex", key: "lLatFlex" },
                { label: "R. Lat. Flex", key: "rLatFlex" },
                { label: "L. Rotation", key: "lRotation" },
                { label: "R. Rotation", key: "rRotation" },
              ].map((item) => (
                <div
                  className="flex items-center justify-between"
                  key={item.key}
                >
                  <span className="text-[13px] text-slate-500">
                    {item.label}
                  </span>
                  <div className="relative w-16">
                    <input
                      type="text"
                      value={objectiveData.rom[item.key]}
                      onChange={(e) =>
                        setObjectiveData({
                          ...objectiveData,
                          rom: {
                            ...objectiveData.rom,
                            [item.key]: e.target.value,
                          },
                        })
                      }
                      className="w-full border border-brand-700 text-slate-900 rounded-md py-1.5 text-center text-sm font-semibold outline-none focus:ring-1 focus:ring-brand-600"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Muscle Strength */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 block">
              MUSCLE STRENGTH (MRC SCALE)
            </label>
            <div className="border-t border-slate-100 pt-6 grid grid-cols-2 gap-x-12 gap-y-6">
              {[
                { label: "Hip Flexors", key: "hipFlexors" },
                { label: "Knee Extensors", key: "kneeExtensors" },
                { label: "Ankle DF", key: "ankleDF" },
                { label: "Hip Abductors", key: "hipAbductors" },
                { label: "Knee Flexors", key: "kneeFlexors" },
                { label: "Ankle PF", key: "anklePF" },
              ].map((item) => (
                <div
                  className="flex items-center justify-between"
                  key={item.key}
                >
                  <span className="text-sm text-slate-700">
                    {item.label}
                  </span>
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4, 5].map((score) => {
                      const isActive =
                        objectiveData.strength[item.key] ===
                        score;
                      return (
                        <button
                          key={score}
                          type="button"
                          onClick={() =>
                            setObjectiveData({
                              ...objectiveData,
                              strength: {
                                ...objectiveData.strength,
                                [item.key]: score,
                              },
                            })
                          }
                          className={`w-7 h-7 rounded text-xs font-medium flex items-center justify-center transition-colors border ${
                            isActive
                              ? "bg-brand-800 border-brand-800 text-white"
                              : "border-slate-200 text-slate-600 hover:border-slate-300 bg-white"
                          }`}
                        >
                          {score}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-10 right-10">
        <button
          type="submit"
          onClick={() => onSave(false)}
          className="bg-brand-700 text-white px-6 py-2.5 rounded-md text-sm font-semibold hover:bg-brand-800 transition-colors"
        >
          Save Assessment
        </button>
      </div>
    </div>
  );
}
