
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

async function main() {
    console.log("Fetching all creators...");
    const creators = await prisma.creator.findMany({});
    console.log(`Found ${creators.length} creators.`);

    for (const c of creators) {
        // Only update if not already approved or needs a token
        const needsUpdate = c.onboardingStep === 'DETAILS' || !c.magicLinkToken;
        
        if (needsUpdate) {
            const token = c.magicLinkToken || crypto.randomBytes(32).toString('hex');
            
            await prisma.creator.update({
                where: { id: c.id },
                data: {
                    onboardingStep: 'INSTRUCTIONS', // "Approve" them to the next steps
                    offerType: c.offerType || 'FREE_KIT', // Default offer
                    magicLinkToken: token
                }
            });
            console.log(`Updated ${c.name}: Status=INSTRUCTIONS, Token=${token.substring(0,8)}...`);
        } else {
            console.log(`Skipping ${c.name} (Already approved/has token).`);
        }
    }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
