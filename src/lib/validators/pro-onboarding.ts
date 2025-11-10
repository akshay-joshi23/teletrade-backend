import { z } from "zod";

export const proOnboardingSchema = z.object({
  fullName: z.string().min(2).max(80),
  email: z.string().email(),
  phone: z
    .string()
    .min(7)
    .max(32)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  serviceLocation: z.string().min(2).max(100),
  primarySpecialty: z.enum(["PLUMBING", "ELECTRICAL", "HVAC", "GENERAL"]),
  yearsExperience: z.coerce.number().int().min(0).max(60),
  licenseNumber: z
    .string()
    .max(64)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  bio: z
    .string()
    .max(1000)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
});

export type ProOnboardingInput = z.infer<typeof proOnboardingSchema>;



