import { z } from "zod";

// Helper functions for backward compatibility/utilities if needed
const validateName = (value: string) => {
  return !/[0-9]/.test(value);
};

const validatePhone = (value: string) => {
  if (value.length !== 10) {
    return "Phone number must be 10 digits long";
  }
  return !/[0-9]/.test(value);
};

// 1. Patient Form Validation Schema
export const patientSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "First name is required.")
      .regex(/^[^0-9]+$/, "First name cannot contain numbers."),
    lastName: z
      .string()
      .min(1, "Last name is required.")
      .regex(/^[^0-9]+$/, "Last name cannot contain numbers."),
    dateOfBirth: z.string().min(1, "Birth date is required."),
    gender: z
      .string()
      .min(1, "Gender is required.")
      .regex(/^[^0-9]+$/, "Gender name cannot contain numbers."),

    bloodGroup: z.string().optional(),
    phone: z
      .string()
      .min(1, "Phone number is required.")
      .regex(
        /^\d{10}$/,
        "Phone number must be exactly 10 digits without letters or symbols.",
      ),
    email: z
      .string()
      .email("Invalid email address.")
      .optional()
      .or(z.literal("")),
    address: z.string().optional(),
    role: z.string().optional(),
    allergies: z.string().optional(),
    // Conditional fields (appointment)
    createAppointment: z.string().optional(),
    appointmentDate: z.string().optional(),
    doctorId: z.string().optional(),
    billAmount: z.string().optional(),
    isPaid: z.string().optional(),
    treatments: z.union([z.string(), z.array(z.string())]).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.createAppointment === "true") {
      if (!data.appointmentDate || !data.appointmentDate.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["appointmentDate"],
          message: "Preferred date is required when scheduling an appointment.",
        });
      }
      if (!data.doctorId || !data.doctorId.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["doctorId"],
          message:
            "Assigning a doctor is required when scheduling an appointment.",
        });
      }
    }
  });

// Helper for Patient Intake form (FormData)
export const formValidation = (formData: FormData): string | null => {
  const data: Record<string, any> = {};
  for (const [key, value] of formData.entries()) {
    if (key === "treatments") {
      if (!data[key]) {
        data[key] = [];
      }
      data[key].push(value);
    } else {
      data[key] = value;
    }
  }

  const result = patientSchema.safeParse(data);
  if (!result.success) {
    return result.error.issues[0].message;
  }
  return null;
};

// 2. Appointment Validation Schema
export const appointmentSchema = z.object({
  patientId: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  appointmentDate: z.string().min(1, "Appointment date is required."),
  status: z.string().optional(),
  doctorId: z.string().min(1, "Assigning a doctor is required."),
  billAmount: z.string().optional(),
  isPaid: z.string().optional(),
  treatments: z.union([z.string(), z.array(z.string())]).optional(),
});

// Helper for Appointment Form (FormData)
export const validateAppointmentForm = (
  formData: FormData,
  isCreatingPatient: boolean,
): string | null => {
  const data: Record<string, any> = {};
  for (const [key, value] of formData.entries()) {
    if (key === "treatments") {
      if (!data[key]) {
        data[key] = [];
      }
      data[key].push(value);
    } else {
      data[key] = value;
    }
  }

  const schema = appointmentSchema.superRefine((val, ctx) => {
    if (isCreatingPatient) {
      if (!val.firstName || !val.firstName.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["firstName"],
          message: "First name is required for new patient.",
        });
      } else if (/[0-9]/.test(val.firstName)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["firstName"],
          message: "First name cannot contain numbers.",
        });
      }

      if (!val.lastName || !val.lastName.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lastName"],
          message: "Last name is required for new patient.",
        });
      } else if (/[0-9]/.test(val.lastName)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lastName"],
          message: "Last name cannot contain numbers.",
        });
      }

      if (!val.phone || !val.phone.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["phone"],
          message: "Phone number is required for new patient.",
        });
      } else if (!/^\d{10}$/.test(val.phone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["phone"],
          message: "Phone number must be exactly 10 digits.",
        });
      }
    } else {
      if (!val.patientId || !val.patientId.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["patientId"],
          message: "Please select a patient.",
        });
      }
    }
  });

  const result = schema.safeParse(data);
  if (!result.success) {
    return result.error.errors[0].message;
  }
  return null;
};

// 3. Settings Profile Validation Schema
export const profileSchema = z.object({
  username: z
    .string()
    .min(1, "Username is required.")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain alphanumeric characters, underscores, and hyphens.",
    ),
  fullName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^\+?[\d\s-]{7,15}$/.test(val), {
      message: "Invalid phone number format.",
    }),
  email: z
    .string()
    .email("Invalid email address.")
    .optional()
    .or(z.literal("")),
  specialization: z.string().optional(),
  nmcRegNo: z.string().optional(),
});

export const validateProfileForm = (data: any): string | null => {
  const result = profileSchema.safeParse(data);
  if (!result.success) {
    return result.error.errors[0].message;
  }
  return null;
};

// 4. Settings Password Change Schema
export const changePasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(6, "Password must be at least 6 characters long."),
    confirmPassword: z
      .string()
      .min(6, "Password must be at least 6 characters long."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const validatePasswordForm = (data: any): string | null => {
  const result = changePasswordSchema.safeParse(data);
  if (!result.success) {
    return result.error.errors[0].message;
  }
  return null;
};
export const getAppointmentFormSchema = (isCreatingPatient: boolean) => {
  return z
    .object({
      patientId: z.string().optional(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      phone: z.string().optional(),
      appointmentDate: z.string().min(1, "Appointment date is required."),
      status: z.string().optional(),
      doctorId: z.string().min(1, "Assigning a doctor is required."),
      billAmount: z.string().optional(),
      isPaid: z.boolean().optional(),
      treatments: z.array(z.string()).optional(),
    })
    .superRefine((val, ctx) => {
      // Prevent scheduling for yesterday or older
      const todayStr = new Date().toLocaleDateString("en-CA"); // Safely produces local "YYYY-MM-DD"
      if (val.appointmentDate && val.appointmentDate < todayStr) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["appointmentDate"],
          message: "Appointment date cannot be scheduled in the past.",
        });
      }

      if (isCreatingPatient) {
        if (!val.firstName || !val.firstName.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["firstName"],
            message: "First name is required.",
          });
        } else if (/[0-9]/.test(val.firstName)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["firstName"],
            message: "First name cannot contain numbers.",
          });
        }

        if (!val.lastName || !val.lastName.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["lastName"],
            message: "Last name is required.",
          });
        } else if (/[0-9]/.test(val.lastName)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["lastName"],
            message: "Last name cannot contain numbers.",
          });
        }

        if (!val.phone || !val.phone.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["phone"],
            message: "Phone number is required.",
          });
        } else if (!/^\d{10}$/.test(val.phone)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["phone"],
            message: "Phone number must be exactly 10 digits.",
          });
        }
      } else {
        if (!val.patientId || !val.patientId.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["patientId"],
            message: "Please select a patient.",
          });
        }
      }
    });
};

export { validateName, validatePhone };
