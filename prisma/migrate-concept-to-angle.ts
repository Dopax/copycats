import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Starting migration: CreativeConcept -> AdAngle...');

    try {
        // 1. Rename the table
        console.log('Renaming table CreativeConcept to AdAngle...');
        await prisma.$executeRawUnsafe(`ALTER TABLE CreativeConcept RENAME TO AdAngle;`);

        // 2. Rename Foreign Key column in AdBatch
        // SQLITE doesn't support simple RENAME COLUMN in all versions or it might be tricky with FK constraints.
        // However, recent SQLite supports RENAME COLUMN.
        console.log('Renaming AdBatch.conceptId to AdBatch.angleId...');
        await prisma.$executeRawUnsafe(`ALTER TABLE AdBatch RENAME COLUMN conceptId TO angleId;`);

        // 3. Rename Foreign Key column in Brand (if needed?)
        // Brand has 'concepts' relation, but Brand doesn't hold the FK. CreativeConcept holds brandId.
        // So no change needed on Brand table columns.

        // 4. Update any other FKs?
        // CreativeConcept has themeId, desireId, etc. These stay on the table (now AdAngle).

        // 5. Relations in other tables are virtual (Prisma-level) or opposite side.

        console.log('✅ Migration successful!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
