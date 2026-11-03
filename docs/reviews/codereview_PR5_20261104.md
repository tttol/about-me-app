# The result of review

PR #5: Animated connecting-dots portfolio with a sharper polyhedral silhouette.

- PR: https://github.com/tttol/about-me-app/pull/5
- Reviewed head: acc0c7af1bc0b350bfb6d4ba5f133f1938e28e9e
- Branch: codex/connecting-dots; base: main; PR remains open.
- Applied code-review-one-shot and tttol-coding-standard, including the TypeScript guide.
- The independent reviewer verified the immutable local/GitHub head using gh pr view/diff and reviewed geometry, integration, documentation, and unchanged runtime limitations.
- Follow-up review: one final pass, zero severe repair cycles. Commit acc0c7a was pushed normally; no merge or history rewrite occurred. Only the geometry module and its existing unit test changed, with 37 insertions and 15 deletions.
- Narrower and stronger radial fields create a few asymmetric pointed tips and steeper shoulders. Counts remain exactly 86 vertices and 255 bonds, with the entire edge array and all five anchor indices identical to head 48c3770.
- Verification: npm run check passed lint, type checking, 109 unit tests, and the static production build in an isolated checkout. All 36 desktop/mobile Playwright cases passed, including section navigation, denting, dragging, pause, reduced motion, and Articles new-tab activation.
- GitHub CI succeeded at the reviewed head, including all 109 unit tests, 36 browser cases, and both dependency audits: https://github.com/tttol/about-me-app/actions/runs/41727913415
- Desktop and 320px mobile browser captures confirmed the more pointed shape, unchanged counts, transparent labels, and no overflow or console errors. Concurrent uncommitted Work Experience source, CSS, integration, and test edits were excluded from this commit and preserved.
- Geometry probes covered original and 500-dent shapes, four stages, 72 yaws, three pitches, and five collapse levels. Coordinates remain finite and in bounds; radii stay positive, dents move inward, and anchors remain unchanged. Maximum world radius is about 2.239, below focal distance 4.5. The desktop footprint remains about 900×577px.
- Previous label-to-label overlap is resolved by the new collision-aware layout. The two MEDIUM findings below remain under the requested review scope.

## ❌CRITICAL

None.

## 🔴HIGH

None.

## 🟡MEDIUM

### Comment1: A transparent label can intercept another green point's click

app/lib/label-layout.ts:54-76 separates label rectangles from each other but does not reserve green markers' hit areas. app/components/MolecularScene.tsx:232-246 applies those placements above the canvas. A refreshed probe for the final geometry at stage 296×318, yaw 4.4767695314, pitch 0.1163627424 reproduces overlap: Certifications spans x149.1377–283.1767 and y198.6139–242.6139, covering the Articles green center at (170.3716,221.1224), more than 21px inside the rectangle. These angles occur during normal autoplay. The overlaid HTML button therefore intercepts this visible point's click and routes to Certifications. Canvas hit-test priority cannot correct an event intercepted by a label. Reserve green-point disks when placing labels so visible category markers cannot route to a different destination. This unchanged finding is refreshed for the sharper 86-point model.

### Comment2: Stationary and hidden reading scenes keep redrawing the full mesh

app/components/MolecularScene.tsx:259 schedules another frame whenever the document is visible, even while explicitly paused, reduced motion is enabled, or section content hides the canvas. The unchanged loop now processes 86 vertices and 255 edges on each frame. Prior runtime measurements confirmed continuous stationary redraws; reducing geometry does not change that scheduling policy. This wastes rendering work and battery without changing visible output. Schedule frames for active motion or transitions and invalidate the scene for resize, hover, dragging, denting, or other relevant changes.

## 🔵LOW

None.

Final counts: CRITICAL 0 / HIGH 0 / MEDIUM 2 existing / LOW 0. New findings: 0.

This local report supersedes the earlier November 4 report for head 48c3770 and is intentionally excluded from the commit, as required by recursive-code-review.
