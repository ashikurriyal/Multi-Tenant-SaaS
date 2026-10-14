import type { PlatformRole } from '../../generated/prisma/client';

// Gives req.user a real type everywhere passport sets it
declare global {
  namespace Express {
    interface User {
      id: string;
      name: string;
      email: string;
      platformRole: PlatformRole;
    }
  }
}

export {};
