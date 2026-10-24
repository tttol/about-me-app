import { expect, test } from "@playwright/test";

test("static profile, assets, links, and manual theme remain usable", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("About me - tttol");
  await expect(page.getByText("Software Engineer", { exact: true })).toBeVisible();
  await expect(page.getByRole("img", { name: "Toru Takahashi" })).toBeVisible();
  await expect.poll(() => page.locator("img").evaluateAll((images) =>
    images.every((image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0),
  )).toBe(true);
  await expect(page.getByRole("link", { name: "Blog", exact: true }))
    .toHaveAttribute("href", "https://blog.about-tttol.link/");
  await expect(page.locator('a[href="https://github.com/tttol"]')).toBeVisible();
  await expect(page.getByRole("button", { name: "Today we've met!" })).toHaveCount(0);

  const main = page.locator("main");
  const gradient = page.locator("main > div");
  const lightColor = await main.evaluate((element) => getComputedStyle(element).color);
  const lightGradient = await gradient.evaluate((element) => getComputedStyle(element).backgroundImage);
  expect(lightGradient).toContain("linear-gradient");
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await page.locator("#moon").click();
    await expect(main).toHaveClass(/(?:^|\s)dark(?:\s|$)/);
    expect(await main.evaluate((element) => getComputedStyle(element).color)).not.toBe(lightColor);
    expect(await gradient.evaluate((element) => getComputedStyle(element).backgroundImage)).not.toBe(lightGradient);
    await page.locator("#sun").click();
    await expect(main).not.toHaveClass(/(?:^|\s)dark(?:\s|$)/);
    expect(await main.evaluate((element) => getComputedStyle(element).color)).toBe(lightColor);
    expect(await gradient.evaluate((element) => getComputedStyle(element).backgroundImage)).toBe(lightGradient);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("meeting query, cancel, submit, reopen, and history preserve static behavior", async ({ page }) => {
  const errors: string[] = [];
  const writes: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (!["GET", "HEAD"].includes(request.method())) writes.push(request.url());
  });
  await page.goto("/?meet=");
  const open = page.getByRole("button", { name: "Today we've met!" });
  await expect(open).toHaveCount(0);
  await page.goto("/?meet=regression-test");
  await open.click();
  const field = page.getByPlaceholder("Enter your name");
  await expect(field).toBeVisible();
  const overlay = page.locator("div.fixed.inset-0");
  expect(await overlay.evaluate((element) => getComputedStyle(element).backgroundColor))
    .toMatch(/0\.5|50%/);
  await field.fill("キャンセルする名前");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(field).toHaveCount(0);
  await expect(page).toHaveURL(/\?meet=regression-test$/);

  for (const name of ["山田太郎", "<script>alert(1)</script>", ""]) {
    await open.click();
    await field.fill(name);
    await expect(page.locator("#submitButton")).toBeEnabled();
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await expect(field).toHaveCount(0);
    await expect(page).toHaveURL(/\?meet=regression-test$/);
  }
  await page.goBack();
  await expect(open).toHaveCount(0);
  await page.goForward();
  await expect(open).toBeVisible();
  await open.click();
  await expect(page.locator("#submitButton")).toBeEnabled();
  expect(writes).toEqual([]);
  expect(errors).toEqual([]);
});
