import { expect, test, type Locator, type Page } from "@playwright/test";

async function readChapterGap(work: Locator): Promise<number> {
  return work.getByRole("article", { name: /^Company [AB]$/ })
    .evaluateAll(([middle, last]) => last.getBoundingClientRect().top - middle.getBoundingClientRect().top);
}

async function openWorkExperience(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("link", { name: "Work Experience", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("region", { name: "Work Experience", exact: true })).toBeVisible();
  await page.evaluate(() => new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  ));
}

test("the standalone timeline uses green dots and compact headings", async ({ page }) => {
  // Given a direct visit to Work Experience.
  await page.goto("/work-experience");
  const work = page.getByRole("region", { name: "Work Experience", exact: true });
  const expectedStyles = { dot: "rgb(74, 222, 128)", paragraphSize: 64 / 3 };

  // When the visitor opens a company's description.
  await work.getByRole("button", { name: "Explore PayPayカード株式会社 chapter", exact: true }).click();

  // Then the simplified content follows the requested typography and navigation.
  await expect(work.getByRole("heading", { name: "Work Experience", level: 2 })).toBeVisible();
  await expect(work.getByRole("heading", { level: 4 })).toHaveCount(3);
  await expect(page.getByText("Toru Takahashi", { exact: true })).toBeHidden();
  await expect(work.getByRole("link", { name: "←Back", exact: true })).toBeVisible();
  await expect(work.getByRole("region", { name: "PayPayカード株式会社 details", exact: true }))
    .toHaveText("Backend Engineer");
  const dotColor = await work.locator(".career-chapter__dot").first()
    .evaluate((element) => getComputedStyle(element).backgroundColor);
  const paragraphSize = await work.locator(".career-chapter__details p").first()
    .evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
  expect(dotColor).toBe(expectedStyles.dot);
  expect(paragraphSize).toBeCloseTo(expectedStyles.paragraphSize, 2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("a company chapter expands inline, moves later chapters down, and collapses", async ({ page }) => {
  // Given the three-company overview.
  await openWorkExperience(page);
  const work = page.getByRole("region", { name: "Work Experience", exact: true });
  const middle = work.getByRole("article", { name: "Company B", exact: true });
  const details = work.getByRole("region", { name: "Company B details", exact: true });
  const originalGap = await readChapterGap(work);
  await expect(work.getByRole("article")).toHaveCount(3);
  await expect(details).toBeHidden();

  // When the visitor explores the middle chapter.
  await middle.getByRole("button", { name: "Explore chapter", exact: true }).click();

  // Then its details appear in the timeline and later companies move down.
  await expect(details).toBeVisible();
  await expect(details).toHaveText("Role, team, and scope of responsibility. Projects, contributions, and lessons learned.");
  await expect(middle.getByRole("button", { name: "Collapse Company B chapter", exact: true }))
    .toHaveAttribute("aria-expanded", "true");
  await expect.poll(() => readChapterGap(work)).toBeGreaterThan(originalGap + 20);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  await middle.getByRole("button", { name: "Collapse chapter −", exact: true }).click();
  await expect(details).toBeHidden();
  await expect.poll(async () => Math.abs(await readChapterGap(work) - originalGap))
    .toBeLessThan(1);
  await expect(middle.getByRole("button", { name: "Explore chapter", exact: true })).toBeFocused();
});

test("keyboard visitors can switch chapters and return to their original connection", async ({ page }) => {
  // Given an open Work Experience screen with company nodes usable as buttons.
  await openWorkExperience(page);
  const work = page.getByRole("region", { name: "Work Experience", exact: true });
  const middle = work.getByRole("button", { name: "Explore Company B chapter", exact: true });
  const first = work.getByRole("button", { name: "Explore PayPayカード株式会社 chapter", exact: true });

  // When the visitor selects a chapter and then another using the keyboard.
  await middle.focus();
  await page.keyboard.press("Enter");
  await expect(work.getByRole("region", { name: "Company B details", exact: true })).toBeVisible();
  await first.focus();
  await page.keyboard.press("Enter");

  // Then only the selected chapter is exposed and Escape returns to the scene.
  await expect(work.getByRole("region", { name: "PayPayカード株式会社 details", exact: true })).toBeVisible();
  await expect(work.getByRole("region", { name: "Company B details", exact: true })).toBeHidden();
  await expect(work.getByRole("button", { name: "Collapse PayPayカード株式会社 chapter", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(work).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Work Experience", exact: true })).toBeFocused();
  await expect(page.getByRole("heading", { name: "About Me", exact: true })).toBeVisible();
});
