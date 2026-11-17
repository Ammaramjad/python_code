import { prisma } from "../src/lib/db";

async function main() {
  const marker = process.argv[2];
  const shop = await prisma.shop.findFirst();
  if (!shop || shop.phone !== marker) {
    console.error("missing marker", shop?.phone);
    process.exit(1);
  }
  console.log(`persisted ${shop.phone}`);
  await prisma.$disconnect();
}

main();
