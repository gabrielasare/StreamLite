import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()


async function main() {
    await db.video.createMany({ data: [
    { title: 'Big Buck Bunny', description: 'Open movie', durationSec: 600, genres: ['Animation','Comedy'], maturity: 'G', status: 'processing' },
    { title: 'Sintel', description: 'Open movie', durationSec: 900, genres: ['Animation','Drama'], maturity: 'PG', status: 'processing' },
    ]})
}


main().then(()=>db.$disconnect())