# The result of review

Redesign profile with an animated connecting-dots interface

- PR: https://github.com/tttol/about-me-app/pull/5
- Date: 2026-11-03 (Asia/Tokyo)
- Reviewed head: `6137d409a61f473d8e2f3c69c8223b459308e16b`
- Branch: `codex/connecting-dots`; base: `main`
- Review passes: 3; repair cycles completed: 1 (required CI audit repair)
- Scope: complete PR diff, repository instructions, runtime lifecycle, geometry,
  accessibility, static-export contract, content, external links, and tests.
- Independent runtime and integration reviews were combined and verified.

## Review history

1. `ac84348`: reviewed the complete redesign. No CRITICAL or HIGH findings;
   the two MEDIUM findings below were reproduced. Application checks passed,
   but CI's existing development-dependency audit failed on `minimatch@10.2.6`.
2. `95529a6`: pinned patched `minimatch@11.0.4` through exact parent-version
   overrides for the three affected lint-tool consumers. Regenerated the lockfile
   and documented the override/removal condition. Direct toolchain versions,
   application sources, lint rules, and audit thresholds were not changed.
   Re-reviewed the final head and its dependency integration; no new findings.
3. `6137d40`: applied the requested density reduction, from 302 to 242 vertices
   (19.87% fewer), and colored the three navigation dots green. Brace generation
   now derives its count safely from the smaller ring count; the mesh has 729
   valid bonds. Re-ran checks and reviewed the updated head. No new findings;
   the two MEDIUM findings were reproduced again with the current geometry.

## ❌CRITICAL

None.

## 🔴HIGH

None.

## 🟡MEDIUM

### Comment1: Prevent vertex buttons from overlapping after rotation

Location: `app/components/MolecularScene.tsx:148-152`.

Each label is positioned independently using a fixed offset and viewport clamp,
with no collision resolution. At a 390 × 800 viewport, pause the object and drag
the canvas approximately 658.33px horizontally and 162.5px downward. Speaking
then occupies x=121.01, y=489.74, width=105.06, height=44, while Writing occupies
x=125.23, y=489.20, width=85.69, height=44. Writing overlays Speaking's central
text and hit target; `elementFromPoint(168.08, 511.47)` resolves to Writing.

This makes a section difficult to identify or select in that pose. Resolve
collisions between measured button rectangles while preserving stage bounds and
leader connections, and cover rotated poses in browser tests. Rotation or
dragging away from the pose recovers navigation, so this is MEDIUM rather than
a severe failure.

### Comment2: Avoid continuous redraws for stationary or invisible scenes

Location: `app/components/MolecularScene.tsx:109-165`; reading visibility at
`app/globals.css:176-177`.

The next frame is scheduled whenever the document is visible, even when explicit
Pause or reduced motion prevents pose changes, or when reading makes the canvas
invisible. Each frame projects 242 vertices, draws 729 bonds and all dots, and
rewrites label transforms. Instrumentation measured 18 `clearRect` calls in
300ms while paused and another 18 in 300ms while reading.

This is unnecessary rendering work during potentially long stationary sessions.
Schedule continuous frames only for rotation, dragging, or transitions, and
request individual redraws for resize, highlight, and settings changes. The
displayed behavior is correct, so this is a non-blocking performance finding.

## 🔵LOW

None.

## Verification

- `npm run check`: passed lint, strict types, 20 unit tests, and static build.
- `npm run test:e2e -- --config /private/tmp/about-me-pr-verification.config.ts`:
  all 18 desktop/mobile cases passed against an isolated port-3001 preview.
- Runtime diagnostics used an isolated port-3002 preview and inline Playwright
  scripts; the diagnostic preview and browser were stopped afterward.
- `git diff --check`: passed.
- `npm ci --no-audit --no-fund`: clean install passed after the lockfile repair.
- `npm ls minimatch --all`: all three scoped consumers resolve to one patched
  `minimatch@11.0.4`. Inspected consumer calls use retained matcher APIs, and
  representative project glob patterns passed compatibility smoke checks.
- `npm audit --audit-level=low`: zero vulnerabilities.
- `npm audit --omit=dev --audit-level=low`: zero vulnerabilities.
- Final GitHub CI succeeded for the reviewed head:
  https://github.com/tttol/about-me-app/actions/runs/41602741242 .
  This includes the repository's default checks, desktop/mobile browser tests,
  and both unchanged dependency audit commands.

## Disposition

The two MEDIUM findings remain, as allowed by the requested recursive-review
workflow. No application-code repair is required for a CRITICAL or HIGH finding.
The required-verification failure was repaired in one separate commit and the
final PR head was reviewed again. All three commits are pushed. The completion
condition is satisfied: CRITICAL = 0, HIGH = 0, and required verification passes.
The PR remains open and unmerged. This generated report is intentionally local
and uncommitted, as required by the recursive-review skill.
