# Animated portfolio design QA

final result: passed

## Latest refinement — irregular 3D graph from the supplied frame

- Source visual truth: `/var/folders/8z/x1lx37f97zg_kb2_j4vwfv6m0000gn/T/codex-clipboard-07b6ed00-5bca-4029-92ef-df67c5a4caed.png`.
  Local evidence copy: `artifacts/design-qa/graph-reference.png` (1530 × 1064).
  The frame is the structural reference for an irregular node-link network.
  Prior product constraints retain the black background, white connections,
  green navigation nodes, identity stack, and exact 86 nodes / 255 edges.
- Implementation: `http://127.0.0.1:3000/`, initial exploring state. Desktop
  screenshot: `artifacts/design-qa/graph-desktop.jpg`, 1422 × 1106 CSS/image
  pixels at density 1. Mobile: `graph-mobile.jpg`, 320 × 640, density 1.
- Normalized component comparison: `graph-reference-comparison.jpg` combines
  the source on the left and the rendered graph region on the right. The source
  fits a 1100 × 765 frame without distortion; the implementation's 1100 × 628
  canvas region at x161/y371 is padded to the same height. The combined output
  is 1920 × 668. This focuses on network structure rather than comparing the
  film HUD with the portfolio header. Full-page captures check the product UI.

### Comparison history

1. **[P1, fixed] Closed surface instead of scattered graph.** The prior model
   placed points on a connected shell. `graph-initial-comparison.jpg` shows
   the mismatch. Replaced ring/pole generation with seeded volume clusters,
   interior points, sparse outliers, a spanning tree, local links, and bridges.
2. **[P2, fixed] First graph split into three separated knots.** Evidence:
   `graph-first-scatter-comparison.jpg`. Overlapped cluster centers, widened
   their distributions, and increased the medium-link allocation from 24 to
   42 while keeping the total at 255. The final model has 15 central points
   inside normalized radius .4 and 45 inside .65, filling the triangular gap.
3. **Final pass: passed.** The combined final reference comparison shows a
   continuous tangled volume, uneven density, open gaps, and sparse branches.
   All 86 points remain connected. All 81 initial white points are deformable.

### Required fidelity surfaces

- **Fonts and typography:** portfolio Arial/system typography and all five
  category labels remain unchanged and untruncated. The film's telemetry text
  is not app content and is outside this scoped structural reference.
- **Spacing and layout:** About Me → original portrait → Toru Takahashi remains
  above the graph. The graph occupies approximately 900 × 595px in the desktop
  projection. At 320px, all labels stay within the viewport with 44px targets;
  there is no horizontal overflow.
- **Colors and tokens:** black background, white nodes/edges with depth opacity,
  green category points, and transparent outlined labels retain the established
  product theme. The film's blue grid and HUD are intentionally not copied.
- **Image quality and asset fidelity:** original portrait is retained. The graph
  is interactive canvas geometry, explicitly requested as live connected points,
  rather than a raster replacement. The lower network density follows the user's
  existing 86-point/255-edge constraint; the source frame contains many more.
- **Copy and content:** category destinations and section content are unchanged.
  Articles remains a direct new-tab link. The user-committed Work Experience
  timeline is preserved, including its clearly labelled placeholder chapters.

### Verification

- npm run check passed lint, types, 111 unit tests, and static production build.
- All 40 desktop/mobile browser cases passed, including chapter expansion and
  keyboard return in Work Experience, graph motion, repeated Reshape, actual
  node clicks, Articles new-tab routing, pause, reduced motion, and meeting flow.
- In-app browser checks confirmed Reshape changes the graph, Work Experience
  opens, and its Back control returns. Browser error logs were empty.
- No new actionable P0/P1/P2 differences remain in this graph correction.
  The two existing runtime/code-review follow-ups remain separately documented:
  labels can cover other green points in some poses, and stationary scenes
  redraw unnecessarily. They were not introduced by this model replacement.

Implementation checklist: exact counts retained; volumetric scatter and varied
connectivity implemented; desktop/mobile compared; navigation and deformation
verified; preview left running for review.

## Latest refinement — remove the hint and shorten Back copy

- Removed the visible "Green points explore · White points reshape" line.
- Renamed the section return button to exact "←Back", with no added space.
  Updated the two existing E2E selectors and README to match. Removed the two
  CSS rules that only served the deleted instruction paragraph.
- Evidence: `artifacts/design-qa/copy-overview.jpg` and `copy-detail.jpg`,
  both 390 × 844 at density 1. `copy-proof.jpg` combines both full views for
  inspection: the hint is absent on the left and ←Back is visible on the right.
- Browser verification opened Awards and returned with ←Back, with no errors.
  npm run check passed lint, types, 108 unit tests, and static build; all 12
  focused desktop/mobile Back-navigation tests passed.
- Commit 87fb722 was pushed to PR #5. Review: zero CRITICAL/HIGH, two existing
  MEDIUM, zero LOW, no new findings and no severe repair cycle.
- GitHub CI passed the full 32-case browser suite and both dependency audits:
  https://github.com/tttol/about-me-app/actions/runs/41718770777

## Latest refinement — halve vertices and restore simpler connections

- User confirmed that restoring edges means restoring the simpler pattern,
  rather than keeping the previous absolute total of 729 edges.
- Result: 86 vertices, 49.41% fewer than 170; 255 unique bonds. Six rings of
  fourteen points plus two poles retain the closed, uneven shell. Removed dense
  secondary ring connections and restored three original-style internal braces.
- Desktop capture: `artifacts/design-qa/sparse-desktop.jpg`, 1422 × 1106.
  Narrow mobile: `artifacts/design-qa/sparse-mobile.jpg`, 320 × 640. Density 1.
  Combined before/after: `artifacts/design-qa/sparse-comparison.jpg`, inspected
  with the 170-point/1,078-bond version on the left and the new mesh on the right.
- Required identity, typography, original portrait, five green category points,
  white wireframe, transparent labels, and black background retain their prior
  design. Mobile targets remain 44px high with no horizontal overflow. Browser
  error logs are empty.
- npm run check passed lint, types, all 108 unit tests, and the static build.
  All 32 desktop/mobile browser tests passed, including the five categories,
  point clicks, denting, twenty Reshapes, dragging, Back/Escape motion, explicit
  pause, reduced motion, and the existing meeting interaction.
- Pushed commit: 22d8afc on PR #5. Reviewed immutable head with zero
  CRITICAL/HIGH and two unchanged MEDIUM findings; no severe repair cycle.
  The local November 4 review report contains the refreshed reproduction.
- GitHub CI passed, including both dependency audits:
  https://github.com/tttol/about-me-app/actions/runs/41717942525

## Latest refinement — five sections and interactive dents

- Result: 170 vertices, 29.75% fewer than 242; 1,078 unique bonds, 47.87%
  more than 729. The uneven volume, white wireframe, black background, original
  portrait, and identity order remain.
- Green navigation labels are Work Experience, Speakings, Articles, Awards, and
  Certifications. All five outlined buttons remain transparent and separate.
  Awards and Certifications use the user-approved "Details coming soon" states.
- Clicking an unlabelled white point dents that point and pulls the surrounding
  mesh inward over 0.48 seconds. Green canvas points and text buttons open their
  corresponding sections. Dragging does not create a dent. Reshape offers a
  keyboard alternative, including while paused or with reduced motion.
- Desktop capture: `artifacts/design-qa/reshape-desktop.jpg`, 1422 × 1106.
  Narrow mobile: `artifacts/design-qa/reshape-mobile.jpg`, 320 × 640. Both were
  checked at density 1. Label backgrounds compute to rgba(0, 0, 0, 0), targets
  are at least 44px high, and browser error logs are empty.
- Matched before/after: `artifacts/design-qa/reshape-comparison.jpg`.
  Paused dent comparison: `artifacts/design-qa/dent-comparison.jpg`.
  Combined comparisons were inspected for geometry density, hierarchy, typography,
  color, image fidelity, and the local deformation effect.
- npm run check passed: lint, types, 108 unit tests, and static production build.
  All 32 desktop/mobile E2E cases passed, including real white/green canvas clicks,
  twenty consecutive Reshape actions, label separation after rotation, all five
  sections, Back/Escape motion, explicit pause, reduced motion, and meeting query.
- Pushed feature commit: 20741b8 on PR #5. The final code review has zero
  CRITICAL/HIGH and two MEDIUM findings in the local November 4 report.
- GitHub CI passed at that head, including browser tests and both dependency
  audits: https://github.com/tttol/about-me-app/actions/runs/41715711327
- Known follow-ups: in some rotated poses, a transparent label can cover another
  green point and intercept its click; stationary and reading scenes still redraw.
  These remain explicitly documented under the requested recursive-review scope.

## Latest refinement — 20% fewer vertices and green navigation nodes

- User-requested target: approximately 20% fewer vertices than 302; navigation
  vertices for Career, Speaking, and Writing should be green.
- Result: 242 vertices (19.87% fewer) and 729 valid bonds. The three navigation
  dots use `#4ade80`; all other geometry retains its white depth treatment.
  Bumps, dents, motion, transparent outlined labels, and identity order remain.
- Current desktop capture: `artifacts/design-qa/green-nodes-desktop.jpg`,
  1422 × 1106 CSS/image pixels at density 1. The matched before/after input,
  `artifacts/design-qa/green-nodes-comparison.jpg`, was inspected for density,
  color, layout, typography, photograph, and copy fidelity.
- Mobile evidence: `artifacts/design-qa/green-nodes-mobile.jpg`, 320 × 640,
  density 1. Initial button bounds remain inside the viewport, touch targets
  remain 44px tall, and there is no horizontal overflow or browser error log.
- `npm run check` passed (20 unit tests, lint, types, static build), and all 18
  desktop/mobile Playwright cases passed. The geometry checks also verified
  connectedness, distinct anchors, finite viewport fitting, and central collapse.
- Pushed commit: `6137d40` on PR #5. CI succeeded at that head. Follow-up code
  review: zero CRITICAL/HIGH, two previously documented MEDIUM findings.

No new P0/P1/P2 visual findings were identified in this scoped refinement.

## Final PR verification

PR #5 is open at https://github.com/tttol/about-me-app/pull/5 . The production
redesign and repository documentation were committed in `ac84348`; the required
lint-tool dependency audit repair was committed separately in `95529a6`.

The prior automated-browser coverage gap is now closed: all 18 desktop/mobile
Playwright cases passed against an isolated port-3001 preview, including motion
after Back/Escape, explicit pause persistence, and reduced-motion behavior.
After a clean dependency install, lint, types, all 20 unit tests, static build,
the 18 browser cases, and both full/production-only audits passed again. GitHub
CI also succeeded at final head `95529a65cc397fad83384bf54d47845d976cc7c6`.

The recursive code review found zero CRITICAL/HIGH and two non-blocking MEDIUM
findings, documented in `docs/reviews/codereview_PR5_20261103.md`. They concern
label overlap in a particular rotated pose and unnecessary stationary redraws.
These are retained as allowed by the requested review scope; no merge was made.

## Latest refinement — make vertex actions visibly clickable

- Career, Speaking, and Writing now have thin, rounded button outlines at rest.
  Their backgrounds remain fully transparent, so the mesh remains visible.
- Hover increases border contrast, underlines the label, and adds a restrained
  glow. Keyboard focus has a distinct 2px white ring with matching pill rounding;
  active feedback does not change button dimensions.
- The persistent hint now reads **Select a vertex · Drag to rotate · Pause**.
- Desktop evidence: `artifacts/design-qa/clickable-desktop.jpg`, 1422 × 1106,
  density 1. Before/after full-view comparison:
  `artifacts/design-qa/clickable-comparison.jpg`; focused comparison:
  `artifacts/design-qa/clickable-label-comparison.jpg`. Both combined inputs were
  inspected. Typography, profile spacing, monochrome palette, original photo,
  geometry, and section copy retain their prior design.
- Narrow mobile evidence: `artifacts/design-qa/clickable-mobile.jpg`, 320 × 640,
  density 1. All three buttons remain within the viewport with 44px hit-target
  height. The instruction row fits without horizontal overflow.
- Focus evidence: `artifacts/design-qa/clickable-focus.jpg`. Browser-computed
  background is transparent, border radius is 999px, focus outline is 2px, and
  desktop button height is approximately 49px, within the existing vertical fit.
- Browser verification confirmed keyboard activation into Career and return via
  Back to connections. The animation pause policy was not changed.
- `npm run check` passes, including all 20 unit tests and static production build.
  No new implementation-mirroring tests were added for these presentation changes.

No actionable P0/P1/P2 findings remain for this scoped refinement.

## Latest bug fix — resume motion after returning from details

Returning restored keyboard focus to the selected vertex. The renderer treated
both focus and hover as implicit pauses, leaving the object still after Back.
Focus and hover now highlight connections without stopping automatic rotation.
Explicit Pause, reduced-motion preferences, and active dragging retain their
existing behavior.

Verified in the in-app browser using the rebuilt production preview:

- Career click → details → Back restored Career focus while its projected
  position continued changing between samples.
- Speaking → details → Escape also restored focus with continuing motion.
- Explicit Pause → Writing → Back preserved both focus and the deliberate
  pause; the projected position stayed identical between samples. Resume was
  then activated, leaving the preview running.
- Browser error logs were empty. Evidence screenshot:
  `artifacts/design-qa/return-motion.jpg`.

The Playwright scenarios now check continuing motion after Back and repeated
Escape returns, restored focus, explicit pause persistence, and reduced-motion
stillness. These automated browser scenarios were updated but not executed;
the return paths above were verified through the selected in-app browser.
`npm run check` passed: lint, types, 20 unit tests, and static production build.
No visual layout or asset changes were made by this fix.

## Latest refinement — denser, uneven geometry

The user's subsequent request supersedes the original mock's mesh density and
smooth silhouette: add more vertices, make the object bumpy in three dimensions,
and remove the label backgrounds that obscure the wireframe.

- Increased the mesh from **98 to 302 vertices**, with **910 unique bonds**.
- Added coherent broad lobes, deep dents, and smaller surface ripples in multiple
  3D directions. This changes the volume rather than only tessellating the old
  ellipsoid more finely.
- Changed vertex-label backgrounds to transparent. Browser-computed values for
  Career, Speaking, and Writing are all `rgba(0, 0, 0, 0)`.
- Current desktop evidence: `artifacts/design-qa/dense-desktop.jpg`, at
  1422 × 1106 CSS/image pixels, density 1. Current mobile evidence:
  `artifacts/design-qa/dense-mobile.jpg`, at 390 × 844, density 1.
- Full comparison: `artifacts/design-qa/comparison-density-refinement.jpg`, with
  the preceding implementation on the left and the refined implementation on the
  right at matched sizes. Focused label comparison:
  `artifacts/design-qa/label-refinement.jpg`. Both combined inputs were inspected.
- The identity stack, typography, spacing, original photo, and monochrome palette
  retain the previous design. Mesh changes are intentional new visual direction.
- Browser checks confirmed collapse before Writing content, subsequent reveal,
  Escape return, transparent label backgrounds, mobile label bounds, no horizontal
  overflow, and no browser error logs.
- `npm run check` passes, including **20 unit tests** and the static build.
  Geometry checks cover connectedness, uneven volume, finite projection, fitting,
  and collapse into the center. Automated Playwright execution remains a coverage
  gap as documented below.

No actionable P0/P1/P2 issues remain in this refinement. The following sections
preserve the original design comparison and implementation history.

## Visual truth and evidence

- Selected visual: the third displayed black-background concept, **Quiet Orbit**.
- Source visual truth: `/Users/tttol/.codex/generated_images/01a1a01d-ec50-7790-a2f3-537d71a32a5b/exec-0b9b574e-470f-4daa-a4f5-378bf23df5c3.png`.
- Implementation: `http://127.0.0.1:3000/`, production static export served by the repository's local preview.
- Final implementation screenshot: `artifacts/design-qa/desktop.jpg`.
- Full-view comparison: `artifacts/design-qa/comparison-final.jpg`, source left and implementation right in the same image.
- Focused identity comparison: `artifacts/design-qa/profile-comparison.jpg`, source left and implementation right. This checks typography, the photograph, crop, scale, and the required identity order.
- Additional evidence: `mobile.jpg`, `narrow-mobile.jpg`, `mobile-career.jpg`, `speaking.jpg`, `writing.jpg`, and `collapse.jpg` in `artifacts/design-qa/`.

The source and desktop implementation are both **1422 × 1106 pixels**. Browser CSS viewport was **1422 × 1106**, device density **1**. The full comparison joins the equal-size captures and scales the combined image to 1920 pixels wide for inspection; the focused comparison joins matching 500 × 370 crops without scaling. Mobile checks used **390 × 844** and **320 × 640** CSS viewports at density 1. Evidence images are local, ignored QA artifacts.

State: the initial black exploration scene, profile above a rotating polyhedron, no section selected. Live geometry naturally has different poses over time. Content views were checked separately because the selected visual does not specify an expanded section layout.

## Comparison history

### Initial pass — blocked

- **[P2] Object footprint too small.** `comparison-initial.jpg` showed the object occupying roughly 720 × 500 pixels where the selected concept calls for a substantially larger navigation sculpture. Increased the projection footprint to roughly 858 × 620 at a 1100 × 660 stage and used unfolded, pose-aware bounds to keep rotation inside the stage without canceling the collapse.
- **[P2] Foreground too dim.** The initial fine gray bonds and vertices lacked the source's white-on-black definition. Increased foreground opacity, vertex contrast, and edge weight while keeping rear bonds dimmer.
- **[P2] Excessively regular horizontal bands.** Increased deterministic vertex variation while retaining connected local polyhedral cells.

### Revised pass — passed

`comparison-final.jpg` and `profile-comparison.jpg` were opened together with their source/implementation content in the same inputs. The revised object has the intended scale, depth contrast, black/white treatment, and centered composition. No actionable P0/P1/P2 visual findings remain.

A separate code review found and fixed two interaction edge cases: pointer exit no longer clears a vertex's keyboard-focus pause, and interrupted dragging resets on window blur/visibility loss or release of the pointer button.

## Required fidelity surfaces

- **Fonts and typography:** clean sans-serif, regular-weight display text, readable upright navigation labels, and 16px section body text. All required text is untruncated. The system font is slightly narrower than the generated source, most visibly in the name; this is P3, with no hierarchy or readability impact.
- **Spacing and layout rhythm:** preserves the exact order **About Me → original photograph → Toru Takahashi**. The large object is below the identity, with controls underneath. Labels remain inside the stage as it rotates. No horizontal overflow at the checked desktop/mobile sizes; mobile vertex targets are at least 44px tall.
- **Colors and tokens:** pure `#000` background, white labels/points/bonds, and neutral opacity variations for depth. No retained blue gradient, colored accent, dashboard panels, or added card surfaces.
- **Image quality and asset fidelity:** uses the original `public/me-square.png`, with a circular crop and no generated replacement face. The portrait is slightly smaller than the generated mock, a P3 difference. The procedural canvas geometry is an intentional implementation of the user's explicit request for a continuously animated, interactive, crumpling polyhedron; it is not a substitute for a static illustration or photo. No new raster assets or dependencies were needed.
- **Copy and content:** the three preserved identity elements and Career/Speaking/Writing labels match the brief. Section content comes from verified repository profile facts and existing destinations. No invented employers, dated career history, named talks, or achievement metrics are presented.

## Interaction and accessibility verification

Verified in the in-app browser:

- The untouched object moves continuously before selection; projected vertex positions change over time.
- Pause freezes vertex positions; Resume restores motion.
- Dragging rotates the geometry, including while automatic rotation is paused.
- Career, Speaking, and Writing each enter `collapsing` with no section content present, then reveal the correct section after the fold completes.
- The fold still completes when automatic rotation was paused.
- Career shows the community profile, repository, and LinkedIn destinations; Speaking shows Speaker Deck; Writing shows Blog and Qiita.
- Reading focus moves to the named section. Escape and Back to connections return through expansion; focus returns to the originating vertex.
- Mobile content opens and returns correctly; label bounds remain within both checked mobile widths.
- The optional existing meeting query still opens and cancels its form.
- Browser error logs were checked and were empty.

Semantic buttons, visible focus styles, named content regions, image alt text, transition announcements, and inert navigation during transitions are implemented. Reduced-motion preferences disable idle rotation and bypass folding transitions. That preference path was reviewed in code and has automated test scenarios, but media emulation was unavailable in the selected in-app browser.

## Verification and remaining coverage gaps

- `npm run check`: passed — ESLint, strict type checking, **19 unit tests**, production static build.
- Final explicit-return-type change: type checking passed again.
- `git diff --check`: passed.
- The Playwright suite was updated for the new behavior but **was not executed**. Browser verification above used the selected in-app browser.
- Verification used locally available Node 24.22.0. Repository metadata continues to specify Node 24.22.1 for deployment builds; no production deployment was performed.

## Follow-up polish

- P3 only: refine font tracking, portrait diameter, or vertex weight if exact generated-image typography is desired.
- Geometry topology and changing poses intentionally differ from the illustrative source while preserving its composition and interaction intent.

## Implementation checklist

- [x] Preserve the identity stack and original portrait.
- [x] Match the monochrome composition and large wireframe footprint.
- [x] Implement continuous motion, drag, pause, crumple/reveal, and expansion.
- [x] Verify section links, keyboard return, responsive bounds, and browser errors.
- [x] Pass repository checks and record coverage gaps.
- [x] Leave the local preview running for review.

## Work Experience implementation — 2026-11-04

final result: passed

### Visual targets and captures

- Selected overview: `/Users/tttol/.codex/generated_images/01a1a336-6a06-7be2-9a06-5854a3d288ba/exec-72c3113d-5c38-4781-96d4-99a9d26406ee.png`.
- Approved expanded Company B chapter: `/Users/tttol/.codex/generated_images/01a1a336-6a06-7be2-9a06-5854a3d288ba/exec-bc21a002-32d3-404a-b949-c9f3d338493f.png`.
- Implementation preview: `http://127.0.0.1:3003/`, through Work Experience.
- Overview implementation: `artifacts/design-qa/work-experience/overview.png`.
  Source and implementation are both 1374 × 1145 pixels, at a 1374 × 1145 CSS
  viewport and density 1. All three chapters are collapsed.
- Expanded implementation: `artifacts/design-qa/work-experience/expanded.png`.
  Source and implementation are both 973 × 1616 pixels, at a 973 × 1616 CSS
  viewport and density 1. Company B is expanded; Company C/A remain collapsed.
- Mobile: `artifacts/design-qa/work-experience/mobile.png`, 320 × 1664 full-page
  pixels, captured at 320 × 844 CSS pixels and density 1, with Company B expanded.
- Browser-rendered evidence used a separate Chrome tab because this chat's
  in-app browser was unavailable. Temporary viewport overrides were reset.

### Comparison history

- Initial comparison found P2 undersized company controls and typography, making
  the detailed chapter denser and less prominent than the approved images.
  Evidence: `overview-comparison-before-refinement.jpg` and
  `expanded-comparison-before-refinement.jpg` in the Work Experience QA folder.
- Refined the heading scale and vertical rhythm, enlarged the desktop company
  buttons to 144px and company names to 56px, strengthened company-name weight,
  and increased detail body text to 18px. The mobile layout retains 72px company
  controls and a single readable story column.
- Post-fix comparisons were opened as combined source/implementation inputs:
  `overview-comparison.jpg`, `expanded-comparison.jpg`, and the focused
  `chapter-detail-comparison.jpg` in the same folder. Source is on the left.
  These cover the whole composition plus readable chapter typography and copy.
- No actionable P0/P1/P2 findings remain. P3 differences are the exact generated
  font shapes, a small amount of vertical spacing, and some text wrapping.
  The browser uses consistent control and type tokens across overview/detail
  states where the two generated references differ slightly from each other.

### Required fidelity surfaces

- Typography: regular Arial/Helvetica-family page heading, stronger company
  headings, readable chapter headings/body, and underlined chapter actions.
  Headings and body are untruncated at the verified desktop and 320px sizes.
- Spacing/layout: three company buttons share one continuous vertical spine.
  Company C/A stories are on the right and B on the left on desktop. Expanded
  details remain in that company's column and push later companies downward.
  Mobile uses a left spine and one story column, with no horizontal overflow.
- Colors/tokens: black background, white line and company buttons, gray secondary
  copy, and #4ade80 selected outlines, open-state copy, and return action.
- Asset fidelity: this interior design has no photographs, illustrations or
  corporate logos. The circles are semantic interactive buttons and the spine
  is a structural timeline separator; no raster artwork was replaced.
- Copy/content: all three company labels and chapter details remain explicit
  placeholders. Approved titles and descriptions are preserved. Existing real
  professional links remain in a quiet footer below the timeline, alongside a
  placeholder notice; neither is presented as an employer or accomplishment.

### Interaction and verification

- Explore chapter and the company-dot button both toggle the chapter. The
  selected node has a green outline, and the action becomes Collapse chapter.
- Only one chapter opens at a time. Collapsing restores the original timeline
  geometry; the collapse regression test waits for the initial rendered frame
  before measuring the baseline.
- Keyboard activation, expanded-state attributes, named detail regions, focus
  restoration, Back, and Escape are verified. Closed panels are inert and hidden
  from the accessibility tree. Reduced motion removes transition delay.
- The compact Work Experience header replaces the home identity stack while
  reading this screen; the home header returns with the connections scene.
- `npm run check` passed lint, types, all 108 unit tests, and static export.
- All 40 desktop/mobile Playwright tests passed on an isolated port-3004 preview,
  including four new chapter interaction cases, existing motion/return behavior,
  external Articles navigation, and the optional meeting form.
- Browser console errors were checked and the result was empty.

### Implementation checklist

- [x] Preserve the selected overview and approved inline detail structure.
- [x] Implement all three company controls and expansion/collapse behavior.
- [x] Keep company data separate from rendering for later real career details.
- [x] Verify narrow-screen bounds, keyboard use, focus, and motion preferences.
- [x] Compare matching source and implementation states at matching dimensions.
- [x] Preserve concurrent Articles changes and the existing home scene.
- [x] Leave the isolated local preview running for inspection.
