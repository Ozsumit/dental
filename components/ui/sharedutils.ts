export const calculateAge = (dob: Date | string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

export const parseJson = (str: string | null | undefined): string[] => {
    if (!str) return [];
    try {
        if (typeof str === "string" && str.startsWith("[")) {
            return JSON.parse(str);
        }
        return str
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
    } catch {
        return [];
    }
};