import { z } from "zod";

// Same rules as the API (server/src/modules/auth/auth.validation.ts)
const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address"));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "At least 2 characters").max(60, "At most 60 characters"),
  email,
  password: z.string().min(8, "At least 8 characters").max(72, "At most 72 characters"),
  organizationName: z
    .string()
    .trim()
    .min(2, "At least 2 characters")
    .max(80, "At most 80 characters"),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "At least 8 characters").max(72, "At most 72 characters"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;

// Profile (server/src/modules/user/user.validation.ts)
export const profileSchema = z.object({
  name: z.string().trim().min(2, "At least 2 characters").max(60, "At most 60 characters"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "At most 72 characters"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "The passwords don't match",
    path: ["confirmPassword"],
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    message: "New password must be different from the current one",
    path: ["newPassword"],
  });

export type ProfileValues = z.infer<typeof profileSchema>;
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
