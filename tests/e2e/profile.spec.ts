import { expect, test, type Locator, type Page } from "@playwright/test";

const SECTIONS = [
  {
    label: "Career",
    links: [
      "https://builder.aws.com/community/@tol",
      "https://github.com/tttol/about-me-app",
      "https://www.linkedin.com/in/toru-takahashi-23b26729a/",
    ],
  },
  { label: "Speaking", links: ["https://speakerdeck.com/tttol"] },
  {
    label: "Writing",
    links: ["https://blog.about-tttol.link/", "https://qiita.com/tttol777"],
  },
] as const;

async function readPosition(vertex: Locator): Promise<string> {
  return vertex.evaluate((element) => element.style.transform);
}

async function waitForScenePaint(page: Page): Promise<void> {
  await page.evaluate(() => new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  ));
}

test("the black profile preserves the identity order and fits the viewport", async ({ page }) => {
  // Given a fresh visit, without a meeting query.
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  // When the profile loads.
  const response = await page.goto("/");

  // Then the original identity remains above the live navigation.
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("About me - tttol");
  const heading = page.getByRole("heading", { name: "About Me", exact: true, level: 1 });
  const portrait = page.getByRole("img", { name: "Toru Takahashi", exact: true });
  const name = page.getByText("Toru Takahashi", { exact: true });
  await expect(heading).toBeVisible();
  await expect(portrait).toBeVisible();
  await expect(name).toBeVisible();
  await expect.poll(() => portrait.evaluate((image) =>
    image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0,
  )).toBe(true);

  const [headingBottom, portraitTop, portraitBottom, nameTop] = await Promise.all([
    heading.evaluate((element) => element.getBoundingClientRect().bottom),
    portrait.evaluate((element) => element.getBoundingClientRect().top),
    portrait.evaluate((element) => element.getBoundingClientRect().bottom),
    name.evaluate((element) => element.getBoundingClientRect().top),
  ]);
  expect(headingBottom).toBeLessThan(portraitTop);
  expect(portraitBottom).toBeLessThan(nameTop);
  expect(await page.locator("body").evaluate((element) => getComputedStyle(element).backgroundColor))
    .toBe("rgb(0, 0, 0)");
  await expect(page.getByTestId("molecular-canvas")).toBeVisible();
  for (const { label } of SECTIONS) {
    await expect(page.getByRole("button", { name: label, exact: true })).toBeVisible();
  }
  await expect(page.getByRole("button", { name: "Today we've met!" })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("the object moves before selection and can be paused and resumed", async ({ page }) => {
  // Given an untouched scene, with the pointer away from the vertex labels.
  await page.goto("/");
  await page.mouse.move(0, 0);
  const career = page.getByRole("button", { name: "Career", exact: true });
  await expect(career).toBeVisible();
  await expect.poll(() => readPosition(career)).not.toBe("");
  const originalPosition = await readPosition(career);
  await expect.poll(() => readPosition(career)).not.toBe(originalPosition);

  // When motion is paused.
  await page.getByRole("button", { name: "Pause animation", exact: true }).click();
  const resume = page.getByRole("button", { name: "Resume animation", exact: true });
  await expect(resume).toHaveAttribute("aria-pressed", "true");
  await waitForScenePaint(page);
  const frozenPosition = await readPosition(career);
  await page.waitForTimeout(300);

  // Then vertices remain still until the visitor resumes the scene.
  expect(await readPosition(career)).toBe(frozenPosition);
  await resume.click();
  await expect(page.getByRole("button", { name: "Pause animation", exact: true }))
    .toHaveAttribute("aria-pressed", "false");
  await expect.poll(() => readPosition(career)).not.toBe(frozenPosition);
});

for (const { label, links } of SECTIONS) {
  test(`${label} folds the object before revealing its content and returns to the scene`, async ({ page }) => {
    // Given a complete molecular navigation scene.
    await page.goto("/");
    const stage = page.getByTestId("molecular-stage");
    const vertex = page.getByRole("button", { name: label, exact: true });
    const content = page.getByRole("region", { name: label, exact: true });

    // When the visitor selects a labeled vertex.
    await vertex.focus();
    await page.keyboard.press("Enter");

    // Then the fold completes before content becomes available.
    await expect(stage).toHaveAttribute("data-phase", "collapsing");
    await expect(content).toHaveCount(0);
    await expect(content).toBeVisible();
    await expect(stage).toHaveAttribute("data-phase", "reading");
    await expect(content).toBeFocused();
    for (const href of links) {
      const link = content.locator(`a[href="${href}"]`);
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    await content.getByRole("button", { name: "Back to connections", exact: true }).click();
    await page.mouse.move(0, 0);
    await expect(stage).toHaveAttribute("data-phase", "expanding");
    await expect(content).toHaveCount(0);
    await expect(stage).toHaveAttribute("data-phase", "exploring");
    await expect(vertex).toBeFocused();
    await expect(vertex).toBeEnabled();
    const returnedPosition = await readPosition(vertex);
    await expect.poll(() => readPosition(vertex)).not.toBe(returnedPosition);
    await expect(vertex).toBeFocused();
  });
}

test("keyboard selection and Escape preserve focus and resume motion after repeated visits", async ({ page }) => {
  // Given a visitor navigating without a pointer.
  await page.goto("/");
  await page.mouse.move(0, 0);
  const career = page.getByRole("button", { name: "Career", exact: true });
  const content = page.getByRole("region", { name: "Career", exact: true });
  await career.focus();

  // When the visitor opens and closes the same connection more than once.
  for (const visit of [1, 2]) {
    await test.step(`keyboard visit ${visit}`, async () => {
      await page.keyboard.press("Enter");
      await expect(content).toBeVisible();
      await expect(content).toBeFocused();
      await page.keyboard.press("Escape");

      // Then focus returns to the originating vertex while the object continues moving.
      await expect(page.getByTestId("molecular-stage")).toHaveAttribute("data-phase", "exploring");
      await expect(content).toHaveCount(0);
      await expect(career).toBeFocused();
      const returnedPosition = await readPosition(career);
      await expect.poll(() => readPosition(career)).not.toBe(returnedPosition);
      await expect(career).toBeFocused();
    });
  }
});

test("a deliberate pause survives a section visit until the visitor resumes motion", async ({ page }) => {
  // Given a visitor who explicitly paused the scene.
  await page.goto("/");
  await page.getByRole("button", { name: "Pause animation", exact: true }).click();
  const career = page.getByRole("button", { name: "Career", exact: true });
  await career.focus();

  // When the visitor opens a connection and returns.
  await page.keyboard.press("Enter");
  const content = page.getByRole("region", { name: "Career", exact: true });
  await expect(content).toBeVisible();
  await content.getByRole("button", { name: "Back to connections", exact: true }).click();
  await page.mouse.move(0, 0);
  await expect(page.getByTestId("molecular-stage")).toHaveAttribute("data-phase", "exploring");
  await expect(career).toBeFocused();
  await waitForScenePaint(page);
  const pausedPosition = await readPosition(career);
  await page.waitForTimeout(300);

  // Then the explicit pause is preserved, and Resume starts motion again.
  expect(await readPosition(career)).toBe(pausedPosition);
  const resume = page.getByRole("button", { name: "Resume animation", exact: true });
  await expect(resume).toHaveAttribute("aria-pressed", "true");
  await resume.click();
  await page.mouse.move(0, 0);
  await expect.poll(() => readPosition(career)).not.toBe(pausedPosition);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("keeps the scene still and makes every connection available without a fold delay", async ({ page }) => {
    // Given the visitor's system preference for reduced motion.
    await page.goto("/");
    const stage = page.getByTestId("molecular-stage");
    const career = page.getByRole("button", { name: "Career", exact: true });
    await expect(career).toBeVisible();
    await expect(page.getByRole("button", { name: "Pause animation", exact: true })).toBeDisabled();
    await expect(page.getByText("Motion reduced", { exact: true })).toBeVisible();
    await expect.poll(() => readPosition(career)).not.toBe("");
    const originalPosition = await readPosition(career);
    await page.waitForTimeout(300);
    expect(await readPosition(career)).toBe(originalPosition);

    // When each section is selected and dismissed.
    for (const { label } of SECTIONS) {
      await page.getByRole("button", { name: label, exact: true }).click();
      const content = page.getByRole("region", { name: label, exact: true });

      // Then reading and navigation do not depend on the animation completing.
      await expect(stage).toHaveAttribute("data-phase", "reading", { timeout: 500 });
      await expect(content).toBeVisible();
      await expect(content).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(stage).toHaveAttribute("data-phase", "exploring", { timeout: 500 });
      const vertex = page.getByRole("button", { name: label, exact: true });
      await expect(vertex).toBeFocused();
      await page.mouse.move(0, 0);
      await waitForScenePaint(page);
      const returnedPosition = await readPosition(vertex);
      await page.waitForTimeout(300);
      expect(await readPosition(vertex)).toBe(returnedPosition);
    }
  });
});

test("meeting query, cancel, submit, reopen, and history preserve static behavior", async ({ page }) => {
  const errors: string[] = [];
  const requests: Readonly<{ method: string; url: string }>[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => requests.push({ method: request.method(), url: request.url() }));
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
  const writes = requests.filter(({ method }) => !["GET", "HEAD"].includes(method));
  expect(writes).toEqual([]);
  expect(errors).toEqual([]);
});
