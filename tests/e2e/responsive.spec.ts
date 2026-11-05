import { expect, test, type Page } from "@playwright/test";

const VIEWPORTS = [
  { width: 280, height: 653 },
  { width: 320, height: 568 },
  { width: 360, height: 640 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 600, height: 800 },
  { width: 601, height: 800 },
  { width: 700, height: 900 },
  { width: 768, height: 1024 },
  { width: 844, height: 390 },
  { width: 1280, height: 720 },
] as const;

const ROUTES = ["/", "/speakings", "/awards", "/certifications", "/work-experience"] as const;

/** Checks actual content bounds as well as the document's scrollable width. */
async function expectWidthToFit(page: Page): Promise<void> {
  const expected = { pageFits: true, overflowingContent: [], scrollX: 0 };
  await page.evaluate(() => window.scrollTo({ left: 1000, behavior: "instant" }));
  await expect.poll(() => page.evaluate(() => {
    const selectors = ".profile > *, .vertex, .scene-controls, .connection-content, .connection-content h2, .connection-content h3, .connection-content p, .connection-content a, iframe, .career-chapter__copy, .career-chapter__dot, .career-chapter__toggle, form, form input, form button";
    const overflowingContent = [...document.querySelectorAll<HTMLElement>(selectors)]
      .filter((element) => element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && !element.closest("[inert], [hidden]"))
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.left < -1 || rect.right > innerWidth + 1 ||
          (element.clientWidth > 0 && element.scrollWidth > element.clientWidth + 1);
      })
      .map((element) => element.className || element.tagName);
    return {
      pageFits: document.documentElement.scrollWidth <= innerWidth && document.body.scrollWidth <= innerWidth,
      overflowingContent,
      scrollX,
    };
  })).toEqual(expected);
}

for (const viewport of VIEWPORTS) {
  test.describe(`${viewport.width} × ${viewport.height}`, () => {
    test.use({ viewport, reducedMotion: "reduce" });

    for (const route of ROUTES) {
      test(`${route} fits horizontally and retains its layout`, async ({ page }) => {
        // Given the same routes and slide containers at each viewport size.
        await page.route("https://speakerdeck.com/player/**", (request) => request.fulfill({
          contentType: "text/html", body: "<!doctype html><title>Slide player</title>",
        }));

        // When the page is opened directly.
        await page.goto(route);

        // Then content fits without hiding an oversized element beyond the viewport.
        await expectWidthToFit(page);
      });
    }

    test("the timeline keeps its desktop arrangement when expanded", async ({ page }) => {
      // Given a centered timeline with alternating company descriptions.
      await page.goto("/work-experience");
      const expected = ["right", "left", "right"];
      const sides = await page.locator(".career-chapter").evaluateAll((chapters) => chapters.map((chapter) => {
        const dot = chapter.querySelector(".career-chapter__dot")?.getBoundingClientRect();
        const copy = chapter.querySelector(".career-chapter__copy")?.getBoundingClientRect();
        return (copy?.left ?? 0) > (dot?.left ?? 0) ? "right" : "left";
      }));
      expect(sides).toEqual(expected);

      for (const company of ["PayPay Card Corporation", "NRI Netcom, Ltd.", "CSE Co.,Ltd."]) {
        // When a company chapter opens.
        await page.getByRole("button", { name: `Explore ${company} chapter`, exact: true }).click();

        // Then its text stays within its column and the page width.
        await expect(page.getByRole("region", { name: `${company} details`, exact: true })).toBeVisible();
        await expectWidthToFit(page);
      }
      const centered = await page.locator(".career-chapter__dot").evaluateAll((dots) => dots.every((dot) => {
        const rect = dot.getBoundingClientRect();
        const timeline = dot.closest(".career-timeline")?.getBoundingClientRect();
        return Math.abs(rect.left + rect.width / 2 - (timeline?.left ?? 0) - (timeline?.width ?? 0) / 2) < 1;
      }));
      expect(centered).toBe(true);
    });

    test("the meeting form fits the same viewport", async ({ page }) => {
      // Given the optional local meeting form.
      await page.goto("/?meet=responsive-check");

      // When the form is opened.
      await page.getByRole("button", { name: "Today we've met!" }).click();

      // Then its input and actions remain within the screen.
      await expect(page.getByPlaceholder("Enter your name")).toBeVisible();
      await expectWidthToFit(page);
    });
  });
}

test("navigation refits after resizing an already-open page", async ({ page }) => {
  // Given an animated desktop graph.
  await page.goto("/");

  // When the same page is resized through phone, tablet, and desktop widths.
  for (const viewport of VIEWPORTS) {
    await page.setViewportSize(viewport);

    // Then moving labels still fit after the resize observer updates the canvas.
    await expectWidthToFit(page);
    await page.waitForTimeout(150);
    await expectWidthToFit(page);
  }
});
