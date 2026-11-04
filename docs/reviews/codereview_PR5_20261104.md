# The result of review

PR #5: Compact clusters for each category's three connection targets.

- PR: https://github.com/tttol/about-me-app/pull/5
- Reviewed head: 1e0e93dd8d8d9d889d630bc86e1ae32ebff00cb2
- Branch: codex/connecting-dots; base: main; PR remains open.
- Applied code-review-one-shot and tttol-coding-standard, including the TypeScript guide.
- The independent reviewer verified the immutable local/GitHub head with gh pr view/diff and reviewed geometry, tests, documentation, and unchanged runtime limitations.
- Follow-up review: one final pass, zero severe repair cycles. Commit 1e0e93d was pushed normally; no merge or history rewrite occurred. Five files changed, with 114 insertions and 63 deletions. The local review report and concurrent Work Experience draft were excluded.
- Every category connects once to each of three distinct white points in a compact 3D cluster. The selector enumerates qualifying triples with every pair at most .32 world units apart, then chooses the nearest triple by summed squared distance to the category point. This replaces the former angular-separation policy.
- Maximum target-pair distances before → after: Work Experience 1.3872 → .2907; Speakings 1.6713 → .2687; Articles 1.4603 → .2037; Awards 1.6547 → .3189; Certifications 1.3344 → .2757. Spread is reduced 79–86%, and all groups meet the .35-unit acceptance bound.
- All 86 positions and five anchor IDs exactly match baseline 16b690c. There are still 255 unique valid edges: 15 category links and 240 white-to-white links. The white-only spanning tree connects all 81 white points before category links are added, avoiding inherited distant category endpoints. All 86 graph points are reachable.
- Renderer, navigation, Articles activation, deformation, and section code are unchanged. Independent projection probes after 100 dents match baseline positions exactly and remain finite and in bounds. Initial target clustering is measured in world space and therefore survives ordinary rotation.
- Verification: npm run check passed lint, type checking, 117 unit tests, and the Turbopack static production build in the workspace. A detached isolated checkout of only the scoped patch independently passed the same check and all 40 desktop/mobile browser cases on port 3002. Its geometry/test files were byte-compared with the committed source before cleanup.
- A concurrent user edit renamed the Work Experience Company C placeholder in app/lib/work-experience.ts. The workspace browser run passed 38 cases and failed the two exact-name Company C keyboard selectors; the isolated clean-scope run passed all 40. No test or content change was made for those failures. Original output and user-file hash checks were unchanged, the draft remains uncommitted, and the temporary verification checkout was removed.
- GitHub CI succeeded at the reviewed head, including all checks, the 40-case browser suite, and both dependency audits: https://github.com/tttol/about-me-app/actions/runs/41787216866
- Desktop/mobile screenshots and inspected full/focused before-and-after comparisons show narrower connection groups. The original identity, portrait, typography, spacing, colors, transparent labels, copy, and responsive bounds are retained. Design QA passed; the preview remains open.
- The two MEDIUM findings below are existing follow-ups outside the severe-finding repair scope. No new findings were identified.

## ❌CRITICAL

None.

## 🔴HIGH

None.

## 🟡MEDIUM

### Comment1: A transparent label can intercept another green point's click

app/lib/label-layout.ts:54-76 separates label rectangles from each other but does not reserve green markers' hit areas. app/components/MolecularScene.tsx:232-246 applies those placements above the canvas. A refreshed probe at stage 296×318, natural autoplay yaw 4.5902159327 and pitch .1079425767 reproduces overlap: Work Experience spans x8–174.7266 and y8–52, covering the Awards point at (119.5157,29.9217), 21.92px inside. The overlaid HTML button intercepts this visible point's click and routes to Work Experience. Canvas hit-test priority cannot correct an event intercepted by a label. Reserve green-point disks when placing labels so visible category markers cannot route to a different destination. Point positions and label placement are unchanged by the compact-target refinement.

### Comment2: Stationary and hidden reading scenes keep redrawing the graph

app/components/MolecularScene.tsx:259 schedules another frame whenever the document is visible, even while explicitly paused, reduced motion is enabled, or section content hides the canvas. The unchanged loop processes 86 vertices and 255 edges on each frame. Prior runtime measurements confirmed continuous stationary redraws; changing edge paths does not change that scheduling policy. This wastes rendering work and battery without changing visible output. Schedule frames for active motion or transitions and invalidate the scene for resize, hover, dragging, denting, or other relevant changes.

## 🔵LOW

None.

Final counts: CRITICAL 0 / HIGH 0 / MEDIUM 2 existing / LOW 0. New findings: 0.

This local report supersedes the earlier November 4 report for head 16b690c and is intentionally excluded from the commit, as required by recursive-code-review. The user committed an earlier report in baseline d2e5c8d; this update remains local.
