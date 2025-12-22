import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const anglesData = [
  {
    name: "New Hobby",
    category: "Entertainment",
    brainClicks: "Oh, I have space for a little new hobby in my life, Life is not only work, I want consistent fun",
    description: "Davincified paint by numbers kits offer fun and relaxation without the complexity of traditional painting.",
    notes: "Some people that think they are creative, will be happy to have a new hobby like that."
  },
  {
    name: "Calm Fun",
    category: "Entertainment",
    brainClicks: "Oh, That's looking wonderful, I want to paint! looks fun",
    description: "Davincified paint by numbers kits provide satisfaction without demanding excessive energy",
    notes: "People love to have fun, this is the main reason they buy."
  },
  {
    name: "Distance Connection Gift",
    category: "Gifting",
    brainClicks: "Oh, my X would like it, I havent seen him in a long time.. It'll be nice for him to feel warm when he get's it and I'll get bonus points as well",
    description: "Davincified paint by numbers kits let you send a personalized, handmade experience to loved ones far away, showing distant loved ones they still matter despite physical distance and helping you stay connected through thoughtful creation.",
    notes: null
  },
  {
    name: "Newborn Gifts",
    category: "Gifting",
    brainClicks: "Oh, What a wonderfull gift to give to X, She's having a baby.",
    description: "Davincified paint by numbers kits let you create personalized gifts for new babies and parents",
    notes: null
  },
  {
    name: "Personal Gift",
    category: "Gifting",
    brainClicks: "Oh, This is a perfect fit for X, personal and non cliche.. much better than alternatives like perfumes",
    description: "Davincified paint by numbers kits give something that feels deeply personal and will last for years, showing real effort and care instead of generic store-bought options.",
    notes: null
  },
  {
    name: "Gift to grandparents",
    category: "Gifting",
    brainClicks: "Oh, my grandparent would love it, personal and a perfect fit.",
    description: null,
    notes: "maybe we can ride on guilt"
  },
  {
    name: "Gift to my kid",
    category: "Gifting",
    brainClicks: "Oh, this is an amazing gift for my kids, and they can even choose the theme",
    description: null,
    notes: null
  },
  {
    name: "Gift to my mom",
    category: "Gifting",
    brainClicks: null, // No internal monologue provided for High priority
    description: null,
    notes: null
  },
  {
    name: "Gift to my friend",
    category: "Gifting",
    brainClicks: null, // No internal monologue provided for High priority
    description: null,
    notes: null
  },
  {
    name: "Gift to my brother/sister",
    category: "Gifting",
    brainClicks: "Oh, this is an amazing gift for my brother. He will be shoked and will love me.",
    description: null,
    notes: "more potential to buy for little brothers/sisters"
  }
];

async function main() {
  console.log('Start seeding angles...');

  for (const angle of anglesData) {
    const existing = await prisma.adAngle.findFirst({
      where: { name: angle.name }
    });

    if (existing) {
      await prisma.adAngle.update({
        where: { id: existing.id },
        data: {
          category: angle.category,
          brainClicks: angle.brainClicks,
          description: angle.description,
          notes: angle.notes
        }
      });
      console.log(`Updated angle: ${angle.name}`);
    } else {
      await prisma.adAngle.create({
        data: {
          name: angle.name,
          category: angle.category,
          brainClicks: angle.brainClicks,
          description: angle.description,
          notes: angle.notes
        }
      });
      console.log(`Created angle: ${angle.name}`);
    }
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
