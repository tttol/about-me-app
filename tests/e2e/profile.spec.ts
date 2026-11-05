import { expect, test, type Locator, type Page } from "@playwright/test";
import { createHash } from "node:crypto";
import { createMolecularGeometry, hitTestVertex, projectGeometry } from "../../app/lib/molecular-geometry";
import type { SectionId } from "../../app/lib/navigation";

const ARTICLES_URL = "https://tttol.github.io/t-search/";

const INTERNAL_SECTIONS = [
  {
    id: "work-experience",
    label: "Work Experience",
    links: [
      "https://www.linkedin.com/in/toru-takahashi-23b26729a/",
    ],
  },
  { id: "speakings", label: "Speakings", links: ["https://speakerdeck.com/tttol"] },
  { id: "awards", label: "Awards", links: [] },
  { id: "certifications", label: "Certifications", links: [] },
] as const;

const NAVIGATION = [
  ...INTERNAL_SECTIONS.map(({ label }) => ({ label, role: "link" as const })),
  { label: "Articles", role: "link" as const },
];

for (const { id, label } of INTERNAL_SECTIONS) {
  test(`${label} supports direct visits, reloads, and browser history`, async ({ page }) => {
    // Given a section URL opened without visiting the home page.
    await page.emulateMedia({ reducedMotion: "reduce" });
    const content = page.getByRole("region", { name: label, exact: true });

    // When the visitor opens and reloads that URL.
    const response = await page.goto(`/${id}`);
    await page.reload();

    // Then the standalone page survives reload and history navigation.
    expect(response?.status()).toBe(200);
    await expect(content).toBeVisible();
    await expect(page).toHaveURL(`/${id}`);
    await content.getByRole("link", { name: "←Back", exact: true }).click();
    await expect(page).toHaveURL("/");
    await expect(content).toHaveCount(0);
    await page.goBack();
    await expect(page).toHaveURL(`/${id}`);
    await expect(content).toBeVisible();
    await page.goForward();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("link", { name: label, exact: true })).toBeFocused();
  });
}

async function readPosition(vertex: Locator): Promise<string> {
  return vertex.evaluate((element) => element.style.transform);
}

async function waitForScenePaint(page: Page): Promise<void> {
  await page.evaluate(() => new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  ));
  const expected = { dimensionsMatch: true, painted: true };
  // ResizeObserver can clear the backing store after animation-frame callbacks.
  await expect.poll(() => page.getByTestId("molecular-canvas").evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const density = Math.min(window.devicePixelRatio || 1, 2);
    const pixels = element instanceof HTMLCanvasElement
      ? element.getContext("2d")?.getImageData(0, 0, element.width, element.height).data
      : undefined;
    return {
      dimensionsMatch: element instanceof HTMLCanvasElement &&
        element.width === Math.round(bounds.width * density) &&
        element.height === Math.round(bounds.height * density),
      painted: pixels?.some((value, index) => index % 4 === 3 && value > 0) ?? false,
    };
  })).toEqual(expected);
}

async function readCanvas(canvas: Locator): Promise<string> {
  const frame = await canvas.evaluate((element) => element instanceof HTMLCanvasElement ? element.toDataURL() : "");
  return createHash("sha256").update(frame).digest("hex");
}

async function initialPoint(page: Page, kind: "white" | "green", sectionId?: SectionId): Promise<Readonly<{
  index: number; x: number; y: number;
}>> {
  const canvas = page.getByTestId("molecular-canvas");
  await canvas.scrollIntoViewIfNeeded();
  await waitForScenePaint(page);
  const viewport = await canvas.evaluate((element) => {
    const { left, top, width, height } = element.getBoundingClientRect();
    return { left, top, width, height };
  });
  const geometry = createMolecularGeometry();
  const anchors = new Set(Object.values(geometry.anchors));
  const projected = projectGeometry(geometry, { ...viewport, yaw: 0, pitch: 0, collapse: 0 });
  const candidates = projected.map((point, index) => ({ ...point, index }))
    .filter(({ index }) => kind === "green" ? anchors.has(index) : !anchors.has(index))
    .filter(({ index }) => kind === "white" ||
      (sectionId ? index === geometry.anchors[sectionId] : index !== geometry.anchors.articles))
    .filter((point) => kind === "green" ||
      hitTestVertex(projected, point.x, point.y, 10) === point.index &&
      [...anchors].every((index) => Math.hypot(point.x - projected[index].x, point.y - projected[index].y) > 12))
    .sort((a, b) => b.depth - a.depth)
    .map(({ index, x, y }) => ({ index, x: x + viewport.left, y: y + viewport.top }));
  const target = await page.evaluate((points) => {
    const canvas = document.querySelector('[data-testid="molecular-canvas"]');
    return points.find(({ x, y }) => document.elementFromPoint(x, y) === canvas);
  }, candidates);
  expect(target, `a visible ${kind} vertex not covered by a label`).toBeDefined();
  return target ?? { index: -1, x: -1, y: -1 };
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
  for (const { label, role } of NAVIGATION) {
    await expect(page.getByRole(role, { name: label, exact: true })).toBeVisible();
  }
  await expect(page.getByRole("button", { name: "Today we've met!" })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test(`Articles opens article search directly in a new tab with ${reducedMotion} motion`, async ({ page, context }) => {
    // Given a live portfolio and a deterministic article-search destination.
    await page.emulateMedia({ reducedMotion });
    await context.route(ARTICLES_URL, (route) => route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><title>Article search</title><main>Article search</main>",
    }));
    await page.goto("/");
    const originalUrl = page.url();
    const articles = page.getByRole("link", { name: "Articles", exact: true });
    await expect(articles).toHaveAttribute("href", ARTICLES_URL);
    await expect(articles).toHaveAttribute("target", "_blank");
    await expect(articles).toHaveAttribute("rel", "noopener noreferrer");
    await expect.poll(() => readPosition(articles)).not.toBe("");

    // When the visitor clicks the label while the scene remains interactive.
    const opened = context.waitForEvent("page");
    await articles.click({ force: true });
    const articleSearch = await opened;
    await articleSearch.waitForLoadState("domcontentloaded");

    // Then the new tab has no opener and the original scene never enters a detail view.
    await expect(articleSearch).toHaveURL(ARTICLES_URL);
    expect(await articleSearch.evaluate(() => window.opener === null)).toBe(true);
    await expect(page).toHaveURL(originalUrl);
    await expect(page.getByTestId("molecular-stage")).toHaveAttribute("data-phase", "exploring");
    await expect(page.getByRole("region")).toHaveCount(0);
    await articleSearch.close();
  });
}

test("the object moves before selection and can be paused and resumed", async ({ page }) => {
  // Given an untouched scene, with the pointer away from the vertex labels.
  await page.goto("/");
  await page.mouse.move(0, 0);
  const workExperience = page.getByRole("link", { name: "Work Experience", exact: true });
  const canvas = page.getByTestId("molecular-canvas");
  await expect(workExperience).toBeVisible();
  await expect.poll(() => readPosition(workExperience)).not.toBe("");
  const originalFrame = await readCanvas(canvas);
  await expect.poll(() => readCanvas(canvas)).not.toBe(originalFrame);

  // When motion is paused.
  await page.getByRole("button", { name: "Pause animation", exact: true }).click();
  const resume = page.getByRole("button", { name: "Resume animation", exact: true });
  await expect(resume).toHaveAttribute("aria-pressed", "true");
  await waitForScenePaint(page);
  const frozenFrame = await readCanvas(canvas);
  await page.waitForTimeout(300);

  // Then vertices remain still until the visitor resumes the scene.
  expect(await readCanvas(canvas)).toBe(frozenFrame);
  await resume.click();
  await expect(page.getByRole("button", { name: "Pause animation", exact: true }))
    .toHaveAttribute("aria-pressed", "false");
  await expect.poll(() => readCanvas(canvas)).not.toBe(frozenFrame);
});

for (const { id, label, links } of INTERNAL_SECTIONS) {
  test(`${label} folds the object before revealing its content and returns to the scene`, async ({ page }) => {
    // Given a complete molecular navigation scene.
    await page.goto("/");
    const stage = page.getByTestId("molecular-stage");
    const vertex = page.getByRole("link", { name: label, exact: true });
    const content = page.getByRole("region", { name: label, exact: true });

    // When the visitor selects a labeled vertex.
    await vertex.focus();
    await page.keyboard.press("Enter");

    // Then the fold completes before content becomes available.
    await expect(stage).toHaveAttribute("data-phase", "collapsing");
    await expect(content).toHaveCount(0);
    await expect(content).toBeVisible();
    await expect(stage).toHaveAttribute("data-phase", "reading");
    await expect(page).toHaveURL(`/${id}`);
    await expect(content).toBeFocused();
    for (const href of links) {
      const link = content.locator(`a[href="${href}"]`);
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    await content.getByRole("link", { name: /Back/ }).click();
    await page.mouse.move(0, 0);
    await expect(stage).toHaveAttribute("data-phase", "expanding");
    await expect(page).toHaveURL("/");
    await expect(content).toHaveCount(0);
    await expect(stage).toHaveAttribute("data-phase", "exploring");
    await expect(vertex).toBeFocused();
    await expect(vertex).toBeEnabled();
    await waitForScenePaint(page);
    const canvas = page.getByTestId("molecular-canvas");
    const returnedFrame = await readCanvas(canvas);
    await expect.poll(() => readCanvas(canvas)).not.toBe(returnedFrame);
    await expect(vertex).toBeFocused();
  });
}

test("keyboard selection and Escape preserve focus and resume motion after repeated visits", async ({ page }) => {
  // Given a visitor navigating without a pointer.
  await page.goto("/");
  await page.mouse.move(0, 0);
  const workExperience = page.getByRole("link", { name: "Work Experience", exact: true });
  const content = page.getByRole("region", { name: "Work Experience", exact: true });
  await workExperience.focus();

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
      await expect(workExperience).toBeFocused();
      await waitForScenePaint(page);
      const canvas = page.getByTestId("molecular-canvas");
      const returnedFrame = await readCanvas(canvas);
      await expect.poll(() => readCanvas(canvas)).not.toBe(returnedFrame);
      await expect(workExperience).toBeFocused();
    });
  }
});

test("a deliberate pause survives a section visit until the visitor resumes motion", async ({ page }) => {
  // Given a visitor who explicitly paused the scene.
  await page.goto("/");
  await page.getByRole("button", { name: "Pause animation", exact: true }).click();
  const workExperience = page.getByRole("link", { name: "Work Experience", exact: true });
  await workExperience.focus();

  // When the visitor opens a connection and returns.
  await page.keyboard.press("Enter");
  const content = page.getByRole("region", { name: "Work Experience", exact: true });
  await expect(content).toBeVisible();
  await content.getByRole("link", { name: /Back/ }).click();
  await page.mouse.move(0, 0);
  await expect(page.getByTestId("molecular-stage")).toHaveAttribute("data-phase", "exploring");
  await expect(workExperience).toBeFocused();
  await waitForScenePaint(page);
  const canvas = page.getByTestId("molecular-canvas");
  const pausedFrame = await readCanvas(canvas);
  await page.waitForTimeout(300);

  // Then the explicit pause is preserved, and Resume starts motion again.
  expect(await readCanvas(canvas)).toBe(pausedFrame);
  const resume = page.getByRole("button", { name: "Resume animation", exact: true });
  await expect(resume).toHaveAttribute("aria-pressed", "true");
  await resume.click();
  await page.mouse.move(0, 0);
  await expect.poll(() => readCanvas(canvas)).not.toBe(pausedFrame);
});

test("all five category labels remain separate after rotating the sculpture", async ({ page }) => {
  // Given a paused sculpture whose labels fit the current desktop or phone.
  await page.goto("/");
  await page.getByRole("button", { name: "Pause animation", exact: true }).click();
  const labels = page.getByRole("navigation", { name: "Explore my connections" }).locator("button, a");
  await expect(labels).toHaveCount(5);

  // When the visitor turns the sculpture through several oblique poses.
  for (const offset of [{ x: 65, y: 20 }, { x: -70, y: -35 }, { x: 45, y: 50 }, { x: -55, y: -45 }]) {
    const start = await initialPoint(page, "white");
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + offset.x, start.y + offset.y, { steps: 5 });
    await page.mouse.up();
    await page.mouse.move(0, 0);
    await waitForScenePaint(page);

    // Then every category remains a distinct, visible hit target.
    const rectangles = await labels.evaluateAll((elements) => elements.map((element) => {
      const { left, right, top, bottom } = element.getBoundingClientRect();
      return { left, right, top, bottom };
    }));
    const pairGaps = rectangles.flatMap((a, index) => rectangles.slice(index + 1).map((b) =>
      Math.max(b.left - a.right, a.left - b.right, b.top - a.bottom, a.top - b.bottom),
    ));
    expect(pairGaps.every((gap) => gap >= 6)).toBe(true);
    for (const { label, role } of NAVIGATION) {
      await expect(page.getByRole(role, { name: label, exact: true })).toBeInViewport();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the Articles green canvas point opens article search without folding the scene", async ({ page, context }) => {
    // Given the stationary Articles vertex and a deterministic destination.
    await context.route(ARTICLES_URL, (route) => route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><title>Article search</title><main>Article search</main>",
    }));
    await page.goto("/");
    await expect(page.getByText("Motion reduced", { exact: true })).toBeVisible();
    const target = await initialPoint(page, "green", "articles");
    const originalUrl = page.url();

    // When the point itself is clicked rather than its HTML label.
    const opened = context.waitForEvent("page");
    await page.mouse.click(target.x, target.y);
    const articleSearch = await opened;
    await articleSearch.waitForLoadState("domcontentloaded");

    // Then it follows the same external destination without navigation or deformation.
    await expect(articleSearch).toHaveURL(ARTICLES_URL);
    expect(await articleSearch.evaluate(() => window.opener === null)).toBe(true);
    await expect(page).toHaveURL(originalUrl);
    await expect(page.getByTestId("molecular-stage")).toHaveAttribute("data-phase", "exploring");
    await expect(page.getByTestId("molecular-stage")).toHaveAttribute("data-deformation-count", "0");
    await expect(page.getByRole("region")).toHaveCount(0);
    await articleSearch.close();
  });

  test("a white point indents the sculpture without opening a category", async ({ page }) => {
    // Given an unchanged stationary pose and an unobstructed white vertex.
    await page.goto("/");
    await expect(page.getByText("Motion reduced", { exact: true })).toBeVisible();
    const canvas = page.getByTestId("molecular-canvas");
    const stage = page.getByTestId("molecular-stage");
    const target = await initialPoint(page, "white");
    const original = await readCanvas(canvas);

    // When that actual canvas vertex is clicked.
    await page.mouse.click(target.x, target.y);
    await page.mouse.move(0, 0);

    // Then the shape changes while navigation remains in its exploring state.
    await expect(stage).toHaveAttribute("data-deformation-count", "1");
    await expect(canvas).toHaveAttribute("data-last-dented-vertex", String(target.index));
    await expect(stage).toHaveAttribute("data-phase", "exploring");
    await expect(page.getByRole("region")).toHaveCount(0);
    await expect.poll(() => readCanvas(canvas)).not.toBe(original);
  });

  test("a green canvas point opens its category without indenting the sculpture", async ({ page }) => {
    // Given a stationary green category vertex, clear of its text label.
    await page.goto("/");
    await expect(page.getByText("Motion reduced", { exact: true })).toBeVisible();
    const target = await initialPoint(page, "green");
    const geometry = createMolecularGeometry();
    const sectionId = Object.entries(geometry.anchors).find(([, index]) => index === target.index)?.[0];
    const section = INTERNAL_SECTIONS.find(({ id }) => id === sectionId);
    expect(section).toBeDefined();

    // When the visible green point itself is clicked.
    await page.mouse.click(target.x, target.y);

    // Then its category opens, including when a white point projects behind it.
    await expect(page.getByRole("region", { name: section?.label ?? "Unknown category", exact: true })).toBeVisible();
    await expect(page.getByTestId("molecular-stage")).toHaveAttribute("data-deformation-count", "0");
  });

  test("dragging from a white point rotates without recording an indentation", async ({ page }) => {
    // Given a stationary sculpture and a visible white point.
    await page.goto("/");
    await expect(page.getByText("Motion reduced", { exact: true })).toBeVisible();
    const canvas = page.getByTestId("molecular-canvas");
    const target = await initialPoint(page, "white");
    const original = await readCanvas(canvas);

    // When the visitor drags rather than clicks the point.
    await page.mouse.move(target.x, target.y);
    await page.mouse.down();
    await page.mouse.move(target.x + 40, target.y + 20, { steps: 5 });
    await page.mouse.up();
    await page.mouse.move(0, 0);

    // Then the pose changes without navigating or adding a dent.
    await expect(page.getByTestId("molecular-stage")).toHaveAttribute("data-deformation-count", "0");
    await expect(page.getByTestId("molecular-stage")).toHaveAttribute("data-phase", "exploring");
    await expect(page.getByRole("region")).toHaveCount(0);
    await expect.poll(() => readCanvas(canvas)).not.toBe(original);
  });

  test("the accessible Reshape action keeps working through twenty consecutive dents", async ({ page }) => {
    // Given reduced motion and the accessible alternative to pointing at small vertices.
    await page.goto("/");
    await expect(page.getByText("Motion reduced", { exact: true })).toBeVisible();
    const canvas = page.getByTestId("molecular-canvas");
    await waitForScenePaint(page);
    const original = await readCanvas(canvas);
    const reshape = page.getByRole("button", { name: "Indent a white point", exact: true });
    const stage = page.getByTestId("molecular-stage");

    // When twenty successive white points are indented.
    for (const count of Array.from({ length: 20 }, (_, index) => index + 1)) {
      await reshape.click();
      await expect(stage).toHaveAttribute("data-deformation-count", String(count));
    }

    // Then each action took effect and the sculpture remains explorable.
    await expect(stage).toHaveAttribute("data-phase", "exploring");
    await expect(page.getByRole("region")).toHaveCount(0);
    await expect.poll(() => readCanvas(canvas)).not.toBe(original);
    await expect(page.getByRole("status")).toContainText("Total dents: 20");
  });

  test("keeps the scene still and makes every connection available without a fold delay", async ({ page }) => {
    // Given the visitor's system preference for reduced motion.
    await page.goto("/");
    const stage = page.getByTestId("molecular-stage");
    const workExperience = page.getByRole("link", { name: "Work Experience", exact: true });
    await expect(workExperience).toBeVisible();
    await expect(page.getByRole("button", { name: "Pause animation", exact: true })).toBeDisabled();
    await expect(page.getByText("Motion reduced", { exact: true })).toBeVisible();
    await expect.poll(() => readPosition(workExperience)).not.toBe("");
    const canvas = page.getByTestId("molecular-canvas");
    const originalFrame = await readCanvas(canvas);
    await page.waitForTimeout(300);
    expect(await readCanvas(canvas)).toBe(originalFrame);

    // When each section is selected and dismissed.
    for (const { label } of INTERNAL_SECTIONS) {
      await page.getByRole("link", { name: label, exact: true }).click();
      const content = page.getByRole("region", { name: label, exact: true });

      // Then reading and navigation do not depend on the animation completing.
      await expect(stage).toHaveAttribute("data-phase", "reading", { timeout: 500 });
      await expect(content).toBeVisible();
      await expect(content).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(stage).toHaveAttribute("data-phase", "exploring", { timeout: 500 });
      const vertex = page.getByRole("link", { name: label, exact: true });
      await expect(vertex).toBeFocused();
      await page.mouse.move(0, 0);
      await waitForScenePaint(page);
      const returnedFrame = await readCanvas(canvas);
      await page.waitForTimeout(300);
      expect(await readCanvas(canvas)).toBe(returnedFrame);
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
