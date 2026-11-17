import { expect, test } from "@playwright/test";

async function noOverflow(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
  expect(overflow).toBe(false);
}

test.beforeAll(async ({ request }) => {
  const response = await request.post("/api/demo/reset");
  expect(response.ok()).toBeTruthy();
});

test("desktop walks exact, substitute, and unresolved", async ({ page, viewport }) => {
  test.skip((viewport?.width ?? 0) < 1000);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /智慧辨識/ })).toBeVisible();
  await page.goto("/staff/inquiries/inq-exact");
  await expect(page.locator("[data-hydrated=yes]")).toBeVisible();
  await expect(page.getByTestId("candidate-sku").first()).toContainText("FT-3030-MAT-B");
  await expect(async () => {
    if ((await page.getByText("等待客戶").count()) === 0) {
      await page.getByTestId("send-followup").click();
    }
    await expect(page.getByText("等待客戶")).toBeVisible({ timeout: 4000 });
  }).toPass();
  await page.goto("/line/inq-exact");
  await expect(page.locator("[data-hydrated=yes]")).toBeVisible();
  const thread = page.getByTestId("line-thread");
  await page.getByTestId("suggested-reply").click();
  await expect(thread.getByText("背面印 FT-A30").or(page.getByTestId("line-error"))).toBeVisible();
  if (await page.getByTestId("line-error").count()) {
    throw new Error(await page.getByTestId("line-error").innerText());
  }
  await page.goto("/staff/inquiries/inq-exact");
  await expect(page.locator("[data-hydrated=yes]")).toBeVisible();
  await expect(page.getByTestId("candidate-sku").first()).toContainText("FT-3030-MAT-A");
  for (const label of ["寬度", "高度", "印字", "數量"]) {
    const row = page.locator("li", { hasText: label }).first();
    await row.getByRole("button", { name: "確認 / Confirm" }).click();
    await expect(row.getByText(/confirmed|corrected/)).toBeVisible();
  }
  await page.locator("article", { hasText: "FT-3030-MAT-A" }).getByRole("button", { name: /驗證為相同品/ }).click();
  await expect(page.getByTestId("match-class")).toContainText("相同品");
  await page.getByTestId("create-quote").click();
  await expect(page.getByTestId("approve-quote")).toBeVisible();
  await page.getByTestId("approve-quote").click();
  await expect(page.getByTestId("quote-preview").getByText("已核准", { exact: true }).first()).toBeVisible();
  await page.getByTestId("send-quote").click();
  await expect(page.getByText("已報價").first()).toBeVisible();
  await page.goto("/line/inq-exact");
  await expect(page.getByTestId("line-thread").getByText("報價單")).toBeVisible();
  await noOverflow(page);

  await page.goto("/staff/inquiries/inq-sub");
  await expect(page.getByTestId("candidate-sku").first()).toContainText("FT-600-DISC");
  const qty = page.locator("li", { hasText: "數量" }).first();
  await qty.getByRole("button", { name: "確認 / Confirm" }).click();
  await expect(qty.getByText(/confirmed|corrected/)).toBeVisible();
  await page.locator("article", { hasText: "FT-600-SUB" }).getByRole("button", { name: /提案替代品/ }).click();
  await expect(page.getByTestId("match-class")).toContainText("替代品");
  await page.getByTestId("create-quote").click();
  await expect(page.getByText("供應 16 片")).toBeVisible();
  await page.getByTestId("approve-quote").click();
  await page.getByTestId("send-quote").click();
  await expect(page.getByText("已報價").first()).toBeVisible();
  await page.goto("/line/inq-sub");
  await expect(page.locator("[data-hydrated=yes]")).toBeVisible();
  await page.getByTestId("accept-substitute").click();
  await expect(page.getByTestId("line-thread").getByText("我接受這張報價")).toBeVisible();

  await page.goto("/staff/inquiries/inq-open");
  await expect(page.getByTestId("exact-blocked").first()).toBeVisible();
  await page.getByTestId("candidate-card").first().getByRole("button", { name: /驗證為相同品/ }).click();
  await expect(page.getByTestId("action-error")).toBeVisible();
  await page.getByTestId("close-unresolved").click();
  await expect(page.getByText("未成交").first()).toBeVisible();
  await page.goto("/staff/inquiries/inq-exact");
  const href = await page.locator("a", { hasText: "預覽列印" }).first().getAttribute("href");
  await page.goto(href ?? "/");
  await expect(page.getByText("合計")).toBeVisible();
  await noOverflow(page);
  await page.goto("/compare");
  await expect(page.getByText("Verify in vendor demo").first()).toBeVisible();
  await page.goto("/metrics");
  await expect(page.getByText("Pilot data pending.")).toBeVisible();
  await noOverflow(page);
});

test("mobile workspace and chat do not overflow", async ({ page, viewport }) => {
  test.skip((viewport?.width ?? 0) >= 1000);
  await page.goto("/staff/inquiries/inq-exact");
  await page.getByTestId("tab-review").click();
  await expect(page.getByTestId("candidate-card").first()).toBeVisible();
  await noOverflow(page);
  await page.goto("/line/inq-exact");
  await expect(page.getByText("LINE 模擬器")).toBeVisible();
  await noOverflow(page);
  await page.goto("/catalog");
  await noOverflow(page);
});
