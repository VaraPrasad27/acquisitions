import { z } from 'zod';

export const updateUserSchema = z
  .object({
    name: z.string().min(2).max(255).trim().optional(),
    email: z.email().max(255).toLowerCase().trim().optional(),
    role: z.enum(['user', 'admin']).optional(),
  })
  .strict()
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field is required for update',
  });

export const userIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});
