import { mkdir, rm, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { PRODUCTS, SCENARIOS, SHOP, STAFF } from "@/lib/demo/catalog";
import { RECIPES, paintPng } from "@/lib/matching/image";
import { addCustomerMessage } from "./inbound";

const PHOTOS = {
  exact: { file: "photo-exact.png", recipe: RECIPES.stoneGrayPhoto },
  wood: { file: "photo-wood.png", recipe: RECIPES.woodDark },
  conflict: { file: "photo-conflict.png", recipe: RECIPES.stoneBeige },
} as const;

export async function resetDemo() {
  const demoInquiries = await prisma.inquiry.findMany({ where: { isDemo: true }, select: { id: true, customerId: true } });
  const ids = demoInquiries.map((inquiry) => inquiry.id);
  const quoteIds = (await prisma.quote.findMany({ where: { inquiryId: { in: ids } }, select: { id: true } })).map((quote) => quote.id);
  await prisma.quoteLine.deleteMany({ where: { quoteId: { in: quoteIds } } });
  await prisma.quote.deleteMany({ where: { id: { in: quoteIds } } });
  await prisma.auditEvent.deleteMany({ where: { inquiryId: { in: ids } } });
  await prisma.message.deleteMany({ where: { inquiryId: { in: ids } } });
  await prisma.candidate.deleteMany({ where: { inquiryId: { in: ids } } });
  await prisma.extractedField.deleteMany({ where: { inquiryId: { in: ids } } });
  await prisma.attachment.deleteMany({ where: { inquiryId: { in: ids } } });
  await prisma.inquiry.deleteMany({ where: { id: { in: ids } } });
  for (const customerId of new Set(demoInquiries.map((inquiry) => inquiry.customerId))) {
    const remaining = await prisma.inquiry.count({ where: { customerId } });
    if (remaining === 0) {
      const customer = await prisma.customer.findUnique({ where: { id: customerId } });
      if (customer?.isSynthetic) await prisma.customer.delete({ where: { id: customerId } });
    }
  }
  await prisma.product.deleteMany({ where: { isDemo: true } });
  await prisma.staffUser.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.webhookEvent.deleteMany();
  const privateDir = path.join(process.cwd(), "data", "private");
  await rm(privateDir, { recursive: true, force: true });
  await mkdir(privateDir, { recursive: true });
  await mkdir(path.join(process.cwd(), "public", "tiles"), { recursive: true });

  await prisma.shop.create({ data: { ...SHOP, isDemo: true } });
  await prisma.staffUser.create({ data: STAFF });

  for (const product of PRODUCTS) {
    const painted = paintPng(product.recipe);
    const filename = `${product.sku}.png`;
    await writeFile(path.join(process.cwd(), "public", "tiles", filename), painted.png);
    await prisma.product.create({
      data: {
        id: product.id,
        sku: product.sku,
        name: product.name,
        brand: product.brand,
        widthMm: product.widthMm,
        heightMm: product.heightMm,
        finish: product.finish,
        color: product.color,
        marking: product.marking,
        unitsPerBox: product.unitsPerBox,
        stockBoxes: product.stockBoxes,
        active: product.active,
        discontinued: product.discontinued,
        unitPriceTwd: product.unitPriceTwd,
        imagePath: `/tiles/${filename}`,
        visualVector: JSON.stringify(painted.vector),
        similarGroup: product.similarGroup,
        isDemo: true,
      },
    });
  }

  const started = new Date("2026-11-16T01:30:00.000Z");
  for (const scenario of Object.values(SCENARIOS)) {
    await prisma.customer.create({
      data: {
        id: scenario.customerId,
        displayName: scenario.customer,
        phone: scenario.phone,
        isSynthetic: true,
      },
    });
    await prisma.inquiry.create({
      data: {
        id: scenario.id,
        customerId: scenario.customerId,
        scenarioKey: scenario.id,
        title: scenario.title,
        category: "補磚",
        status: "pending_review",
        truthSku: scenario.truthSku,
        suggestedReplies: JSON.stringify(scenario.replies),
        isDemo: true,
        createdAt: started,
        updatedAt: started,
      },
    });
    const photo = PHOTOS[scenario.photo];
    const painted = paintPng(photo.recipe);
    await writeFile(path.join(process.cwd(), "public", "tiles", photo.file), painted.png);
    await addCustomerMessage({
      inquiryId: scenario.id,
      body: scenario.text,
      channel: "simulator",
      publicPath: `/tiles/${photo.file}`,
      image: { buffer: painted.png, mime: "image/png" },
    });
  }
}

export async function createFreshInquiry(input: { name: string; body: string }) {
  const id = `inq-${crypto.randomUUID().slice(0, 8)}`;
  const customerId = `cus-${crypto.randomUUID().slice(0, 8)}`;
  await prisma.customer.create({
    data: { id: customerId, displayName: input.name.trim(), isSynthetic: true },
  });
  await prisma.inquiry.create({
    data: {
      id,
      customerId,
      title: "新詢問",
      category: "補磚",
      status: "pending_review",
      suggestedReplies: "[]",
      isDemo: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  await addCustomerMessage({ inquiryId: id, body: input.body, channel: "simulator" });
  return id;
}
