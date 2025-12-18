
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
    // Check if exists first
    const exists = await prisma.brand.findFirst({ where: { name: "Davincified" } })
    if (exists) {
        console.log("Davincified already exists")
        return
    }
    await prisma.brand.create({
        data: {
            name: "Davincified",
            color: "#161618",
            color2: "#ffffff"
        }
    })
    console.log("Seeded Davincified")
}
main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
