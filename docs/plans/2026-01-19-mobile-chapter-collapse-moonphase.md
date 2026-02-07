# Moonphase Redesign

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the moonphase display with a Hodinkee-style rotating disc + mask approach.

**Architecture:** Feature 2: Replace current "rising moon" SVG with a rotating disc behind a shaped mask, matching how traditional watch moonphase complications work.

**Tech Stack:** Vanilla JavaScript, CSS transitions/transforms, SVG

---

## Feature 2: Hodinkee-Style Moonphase

Replace the current "rising moon" implementation with a rotating disc behind a shaped mask. This is how traditional watch moonphase complications work.

### Task 2.1: Download and Add Hodinkee Assets (User already did this)

**Files:**
- Create: `/Users/clayjones/Documents/Monafor/cpj-theme/assets/images/moonphase-mask.svg`
- Create: `/Users/clayjones/Documents/Monafor/cpj-theme/assets/images/moonphase-disc.svg`

**Step 1: Create the mask SVG**

Create `assets/images/moonphase-mask.svg` with the Hodinkee mask (saves us from hotlinking):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28">
  <defs>
    <mask id="moonMask">
      <rect width="28" height="28" fill="white"/>
      <circle cx="14" cy="14" r="10" fill="black"/>
    </mask>
  </defs>
  <rect width="28" height="28" fill="currentColor" mask="url(#moonMask)"/>
</svg>
```

Note: We'll actually inline the SVG in the template for better control.

**Step 2: Commit asset preparation**

```bash
mkdir -p assets/images
git add assets/images/
git commit -m "chore: prepare moonphase asset directory"
```

---

### Task 2.2: Replace Desktop Moonphase SVG

**Files:**
- Modify: `/Users/clayjones/Documents/Monafor/cpj-theme/partials/header.hbs:93-120`

**Step 1: Write the new moonphase SVG**

Replace the desktop moonphase section (lines 93-120) with:

```handlebars
<div class="header-moonphase" id="header-moonphase" title="Current moon phase">
    <div class="moonphase-watch">
        <svg class="moonphase-svg" viewBox="0 0 32 32" aria-hidden="true">
            <defs>
                <!-- Circular aperture mask - shows only a circle -->
                <mask id="moonAperture">
                    <rect width="32" height="32" fill="black"/>
                    <circle cx="16" cy="16" r="12" fill="white"/>
                </mask>
                <!-- Moon gradient for 3D effect -->
                <radialGradient id="moonGlow" cx="35%" cy="35%" r="55%">
                    <stop offset="0%" stop-color="#FFFEF5"/>
                    <stop offset="70%" stop-color="#E8E4D0"/>
                    <stop offset="100%" stop-color="#D0C8B0"/>
                </radialGradient>
            </defs>
            <!-- Night sky background -->
            <circle cx="16" cy="16" r="12" fill="#0A3A5C"/>
            <!-- Rotating disc with two moons -->
            <g id="moonphase-disc" mask="url(#moonAperture)">
                <rect x="-16" y="-16" width="64" height="64" fill="#0A3A5C"/>
                <!-- Two moons positioned for rotation -->
                <circle cx="16" cy="-8" r="9" fill="url(#moonGlow)"/>
                <circle cx="16" cy="40" r="9" fill="url(#moonGlow)"/>
            </g>
            <!-- Border ring -->
            <circle cx="16" cy="16" r="12" fill="none" stroke="var(--color-border)" stroke-width="1"/>
        </svg>
    </div>
</div>
```

**Step 2: Verify SVG renders**

Refresh the page and verify the moonphase shows as a circular window with a moon visible.

**Step 3: Commit**

```bash
git add partials/header.hbs
git commit -m "feat: replace desktop moonphase with rotating disc design"
```

---

### Task 2.3: Replace Mobile Moonphase SVG

**Files:**
- Modify: `/Users/clayjones/Documents/Monafor/cpj-theme/partials/header.hbs:53-73`

**Step 1: Write the new mobile moonphase SVG**

Replace the mobile moonphase section (lines 53-73) with:

```handlebars
<div class="mobile-moonphase">
    <svg class="moonphase-svg" viewBox="0 0 32 32" aria-hidden="true">
        <defs>
            <mask id="moonApertureMobile">
                <rect width="32" height="32" fill="black"/>
                <circle cx="16" cy="16" r="12" fill="white"/>
            </mask>
            <radialGradient id="moonGlowMobile" cx="35%" cy="35%" r="55%">
                <stop offset="0%" stop-color="#FFFEF5"/>
                <stop offset="70%" stop-color="#E8E4D0"/>
                <stop offset="100%" stop-color="#D0C8B0"/>
            </radialGradient>
        </defs>
        <circle cx="16" cy="16" r="12" fill="#0A3A5C"/>
        <g class="moonphase-disc-mobile" mask="url(#moonApertureMobile)">
            <rect x="-16" y="-16" width="64" height="64" fill="#0A3A5C"/>
            <circle cx="16" cy="-8" r="9" fill="url(#moonGlowMobile)"/>
            <circle cx="16" cy="40" r="9" fill="url(#moonGlowMobile)"/>
        </g>
        <circle cx="16" cy="16" r="12" fill="none" stroke="var(--color-border)" stroke-width="1"/>
    </svg>
</div>
```

**Step 2: Verify mobile moonphase**

Open mobile menu and verify moonphase renders correctly.

**Step 3: Commit**

```bash
git add partials/header.hbs
git commit -m "feat: replace mobile moonphase with rotating disc design"
```

---

### Task 2.4: Update CSS for New Moonphase

**Files:**
- Modify: `/Users/clayjones/Documents/Monafor/cpj-theme/assets/css/screen.css:343-367`

**Step 1: Update moonphase CSS**

Find the `.moonphase-watch` styles (~line 343-367) and update:

```css
.header-moonphase {
    display: flex;
    align-items: center;
}

.moonphase-watch {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    overflow: hidden;
}

.moonphase-svg {
    width: 100%;
    height: 100%;
    display: block;
}

#moonphase-disc,
.moonphase-disc-mobile {
    transform-origin: 16px 16px;
    transition: transform 1s ease-out;
}

.mobile-moonphase {
    width: 32px;
    height: 32px;
}

.mobile-moonphase .moonphase-svg {
    width: 100%;
    height: 100%;
}
```

**Step 2: Verify styles**

Check that moonphase appears as a clean 32x32 circle on both desktop and mobile.

**Step 3: Commit**

```bash
git add assets/css/screen.css
git commit -m "style: update moonphase CSS for circular rotating disc"
```

---

### Task 2.5: Update JavaScript Moon Phase Calculation

**Files:**
- Modify: `/Users/clayjones/Documents/Monafor/cpj-theme/assets/js/main.js:303-319`

**Step 1: Write the new rotation calculation**

Replace the `updateMoonPhase()` function with:

```javascript
/**
 * Rotate the moon disc based on current phase
 * Disc rotates to show the correct phase through the circular aperture.
 * Phase 0 (new moon) = disc rotated so no moon visible (moons at top/bottom)
 * Phase 0.5 (full moon) = full moon centered in aperture
 *
 * The disc has two moons at cy=-8 and cy=40, spaced 48 units apart.
 * One full rotation (360°) = one lunar cycle.
 */
function updateMoonPhase(phase) {
    // Convert phase (0-1) to rotation degrees
    // Phase 0 (new moon): rotate so moons are hidden (at 0° or 180°)
    // Phase 0.5 (full moon): rotate so moon is centered (at 90° or 270°)
    const rotation = phase * 360;

    if (moonDisc) {
        moonDisc.setAttribute('transform', `rotate(${rotation}, 16, 16)`);
    }
    if (mobileMoonDisc) {
        mobileMoonDisc.setAttribute('transform', `rotate(${rotation}, 16, 16)`);
    }

    // Update title with phase name
    if (moonphaseEl) {
        const phaseName = getMoonPhaseName(phase);
        moonphaseEl.setAttribute('title', phaseName);
    }
}
```

**Step 2: Test the rotation**

1. Open browser DevTools console
2. Manually test rotation: `document.getElementById('moonphase-disc').setAttribute('transform', 'rotate(90, 16, 16)')`
3. Verify moon position changes correctly

**Step 3: Commit**

```bash
git add assets/js/main.js
git commit -m "feat: update moonphase calculation to use rotation"
```

---

### Task 2.6: Tune Moon Positioning

**Files:**
- Modify: `/Users/clayjones/Documents/Monafor/cpj-theme/partials/header.hbs` (both moonphase SVGs)
- Modify: `/Users/clayjones/Documents/Monafor/cpj-theme/assets/js/main.js` (updateMoonPhase)

**Step 1: Test and adjust moon positions**

The moon circles at cy=-8 and cy=40 may need adjustment. Test by:

1. Setting phase to 0 (new moon) - moons should be hidden
2. Setting phase to 0.25 (first quarter) - half moon effect
3. Setting phase to 0.5 (full moon) - full moon centered
4. Setting phase to 0.75 (last quarter) - other half moon

Adjust `cy` values in the SVG if needed to get proper visibility at each phase.

**Step 2: Adjust rotation offset if needed**

If new moon doesn't hide the moon properly, add an offset to the rotation:

```javascript
const rotation = (phase * 360) + OFFSET; // OFFSET might be needed
```

**Step 3: Commit adjustments**

```bash
git add partials/header.hbs assets/js/main.js
git commit -m "fix: tune moonphase positioning for accurate display"
```

---

### Task 2.7: Final Testing and Polish

**Files:**
- All modified files

**Step 1: Test moonphase accuracy**

Compare displayed phase with actual current moon phase (use timeanddate.com/moon/phases).

**Step 2: Cross-browser testing**

Test in:
- Safari (iOS and macOS)
- Chrome
- Firefox

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: hodinkee-style moonphase complete"
```

---

## Summary of Changes

| File | Changes |
|------|---------|
| `assets/css/screen.css` | Circular moonphase styles |
| `assets/js/main.js` | Rotation-based moon phase |
| `partials/header.hbs` | New moonphase SVG structure (both desktop and mobile) |

## Testing Checklist

- [ ] Moonphase displays correct current phase
- [ ] Moonphase rotates smoothly when phase changes
- [ ] Mobile moonphase matches desktop
- [ ] No console errors
- [ ] Works in Safari, Chrome, Firefox
