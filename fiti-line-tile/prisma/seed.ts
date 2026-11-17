import { resetDemo } from "../src/server/seed-demo";
import { prisma } from "../src/lib/db";

resetDemo()
  .then(async () => {
    console.log("Demo data ready");
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
