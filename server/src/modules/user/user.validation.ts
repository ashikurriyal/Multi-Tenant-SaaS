import { z } from 'zod';

const updateMe = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(60),
  }),
});

const changePassword = z.object({
  body: z
    .object({
      currentPassword: z.string().min(1, 'Current password is required'),
      newPassword: z.string().min(8, 'Password must be at least 8 characters').max(72),
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
      message: 'New password must be different from the current one',
      path: ['newPassword'],
    }),
});

export const UserValidation = { updateMe, changePassword };

export type TUpdateMePayload = z.infer<typeof updateMe>['body'];
export type TChangePasswordPayload = z.infer<typeof changePassword>['body'];
