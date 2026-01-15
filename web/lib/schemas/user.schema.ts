import { z } from 'zod';

export const userSchema = z.object({
    id: z.string(),
    email: z.email(),
    name: z.string().nullable().optional(),
    profilePic: z.string().nullable().optional(),
    role: z.string(),
    createdAt: z.string().or(z.date()), // Handle both string (JSON) and Date objects
    updatedAt: z.string().or(z.date()),
});

export type User = z.infer<typeof userSchema>;
