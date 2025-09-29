import { PrismaClient } from '@prisma/client'
export const db = globalThis.__db || new PrismaClient()
if (!(globalThis as any).__db) (globalThis as any).__db = db