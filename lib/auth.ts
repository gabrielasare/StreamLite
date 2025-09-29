import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Github from 'next-auth/providers/github'
import { db } from './db'
import bcrypt from 'bcryptjs'


export const { handlers, auth } = NextAuth({
    providers: [
        Github({ clientId: process.env.GITHUB_ID!, clientSecret: process.env.GITHUB_SECRET! }),
        Credentials({
            name: 'Credentials',
            credentials: { email: {}, password: {} },
            async authorize(creds) {
                const user = await db.user.findUnique({ where: { email: creds!.email as string } })
                if (user?.passwordHash && bcrypt.compareSync(creds!.password as string, user.passwordHash)) {
                    return { id: user.id, email: user.email, name: user.name }
                }
                return null
            }   
        })
    ],
    session: { strategy: 'jwt' }
})