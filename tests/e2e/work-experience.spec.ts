import { expect, test, type Page } from "@playwright/test";

async function openWorkExperience(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Work Experience", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("region", { name: "Work Experience", exact: true })).toBeVisible();
  await page.evaluate(() => new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  ));
}

test("a company chapter expands inline, moves later chapters down, and collapses", async ({ page }) => {
  // Given the three-company overview.
  await openWorkExperience(page);
  const work = page.getByRole("region", { name: "Work Experience", exact: true });
  const middle = work.getByRole("article", { name: "Company B", exact: true });
  const last = work.getByRole("article", { name: "Company A", exact: true });
  const details = work.getByRole("region", { name: "Company B details", exact: true });
  const originalTop = await last.evaluate((element) => element.getBoundingClientRect().top + scrollY);
  await expect(work.getByRole("article")).toHaveCount(3);
  await expect(details).toBeHidden();

  // When the visitor explores the middle chapter.
  await middle.getByRole("button", { name: "Explore chapter", exact: true }).click();

  // Then its details appear in the timeline and later companies move down.
  await expect(details).toBeVisible();
  await expect(details.getByRole("heading", { name: "Selected work", exact: true })).toBeVisible();
  await expect(details.getByRole("heading", { name: "What I carried forward", exact: true })).toBeVisible();
  await expect(middle.getByRole("button", { name: "Collapse Company B chapter", exact: true }))
    .toHaveAttribute("aria-expanded", "true");
  await expect.poll(() => last.evaluate((element) => element.getBoundingClientRect().top + scrollY))
    .toBeGreaterThan(originalTop + 150);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  await middle.getByRole("button", { name: "Collapse chapter −", exact: true }).click();
  await expect(details).toBeHidden();
  await expect.poll(async () => Math.abs(await last.evaluate((element) => element.getBoundingClientRect().top + scrollY) - originalTop))
    .toBeLessThan(1);
  await expect(middle.getByRole("button", { name: "Explore chapter", exact: true })).toBeFocused();
});

test("keyboard visitors can switch chapters and return to their original connection", async ({ page }) => {
  // Given an open Work Experience screen with company nodes usable as buttons.
  await openWorkExperience(page);
  const work = page.getByRole("region", { name: "Work Experience", exact: true });
  const middle = work.getByRole("button", { name: "Explore Company B chapter", exact: true });
  const first = work.getByRole("button", { name: "Explore Company C chapter", exact: true });

  // When the visitor selects a chapter and then another using the keyboard.
  await middle.focus();
  await page.keyboard.press("Enter");
  await expect(work.getByRole("region", { name: "Company B details", exact: true })).toBeVisible();
  await first.focus();
  await page.keyboard.press("Enter");

  // Then only the selected chapter is exposed and Escape returns to the scene.
  await expect(work.getByRole("region", { name: "Company C details", exact: true })).toBeVisible();
  await expect(work.getByRole("region", { name: "Company B details", exact: true })).toBeHidden();
  await expect(work.getByRole("button", { name: "Collapse Company C chapter", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(work).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Work Experience", exact: true })).toBeFocused();
  await expect(page.getByRole("heading", { name: "About Me", exact: true })).toBeVisible();
});
