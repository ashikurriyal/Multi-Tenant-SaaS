import { z } from "zod";

// Same rules as the API
export const organizationNameSchema = z.object({
  name: z.string().trim().min(2, "At least 2 characters").max(80, "At most 80 characters"),
});

export const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
  role: z.enum(["ADMIN", "BILLING", "MEMBER"]),
});

export type OrganizationNameValues = z.infer<typeof organizationNameSchema>;
export type InviteValues = z.infer<typeof inviteSchema>;
