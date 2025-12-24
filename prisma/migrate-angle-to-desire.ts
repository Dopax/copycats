
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting migration: Angle -> Desire');

    try {
        // 1. Rename Table
        console.log('Renaming table AdAngle to AdDesire...');
        await prisma.$executeRawUnsafe(`ALTER TABLE "AdAngle" RENAME TO "AdDesire";`);

        // 2. Rename Columns in Relations
        console.log('Renaming CreativeConcept.angleId to desireId...');
        await prisma.$executeRawUnsafe(`ALTER TABLE "CreativeConcept" RENAME COLUMN "angleId" TO "desireId";`);

        console.log('Renaming Ad.angleId to desireId...');
        await prisma.$executeRawUnsafe(`ALTER TABLE "Ad" RENAME COLUMN "angleId" TO "desireId";`);

        // Note: Indexes like "AdAngle_name_key" are NOT automatically renamed by SQLite usually, 
        // but Prisma `db push` will likely fix them or create new ones.
        // If we want to be clean, we could rename indexes, but it's complex. 
        // We'll let Prisma generic 'db push' handle index alignment if it complains, or just it will create new ones.

        console.log('Migration completed successfully.');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
