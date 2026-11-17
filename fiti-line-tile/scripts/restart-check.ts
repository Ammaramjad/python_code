import { spawnSync } from "child_process";
import { prisma } from "../src/lib/db";

const marker = `restart-${Date.now()}`;

async function main() {
  const shop = await prisma.shop.findFirst();
  if (!shop) throw new Error("Seed the demo database before the restart check");
  await prisma.shop.update({ where: { id: shop.id }, data: { phone: marker } });
  await prisma.$disconnect();
  const child = spawnSync(process.execPath, ["--env-file=.env", "--import", "tsx", "scripts/restart-read.ts", marker], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  if (child.status !== 0) {
    console.error(child.stdout, child.stderr);
    throw new Error("Restarted process did not read the saved shop phone");
  }
  console.log(child.stdout.trim());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
