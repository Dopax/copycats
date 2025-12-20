
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const password = await bcrypt.hash('password123', 10);

    const users = [
        { email: 'owner@copycatz.com', name: 'Owner User', role: 'OWNER' },
        { email: 'editor@copycatz.com', name: 'Video Editor', role: 'VIDEO_EDITOR' },
        { email: 'strategist@copycatz.com', name: 'Creative Strategist', role: 'CREATIVE_STRATEGIST' },
    ];

    for (const user of users) {
        await prisma.user.upsert({
            where: { email: user.email },
            update: {},
            create: {
                email: user.email,
                name: user.name,
                password,
                role: user.role
            }
        });
        console.log(`Seeded user: ${user.email}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
