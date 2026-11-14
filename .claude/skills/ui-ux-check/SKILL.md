---
name: ui-ux-check
description: Audits a small web app's UI and UX at phone, tablet and desktop widths — tap target size, text legibility and contrast, horizontal overflow, bottom-bar clearance, feedback on save, empty states and focus rings — then reports pass/fail per item and fixes what fails. Use when asked to review, polish or check the UI/UX, or before a release.
---

# UI/UX check

Reusable checklist for the FirstRep app (and other static HTML/CSS/JS apps).

## 1. Serve the app
From the project folder: `python -I -m http.server 5180`, then open `http://localhost:5180`.

## 2. Check three widths
Use the Browser pane's viewport preset (or `resize_window`):
- Phone: 375 × 812
- Tablet: 768 × 1024
- Desktop: 1280 × 800

Reset to desktop when finished.

## 3. Run the automated audit
Run this in the page with the JavaScript tool at each width and note the output.
It handles Chrome's `color(srgb …)` format, which appears for translucent backgrounds,
and it skips checkboxes and radios whose wrapping label is already 44 px.

```js
(() => {
  const parse = (c) => {
    const n = c.match(/[\d.]+/g).map(Number);
    if (c.startsWith("color(srgb")) return [n[0] * 255, n[1] * 255, n[2] * 255, n[3] ?? 1];
    return [n[0], n[1], n[2], n[3] ?? 1];
  };
  const lum = (c) => {
    const v = parse(c).slice(0, 3).map((x) => {
      x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const bgOf = (el) => {
    for (let e = el; e; e = e.parentElement) {
      const c = getComputedStyle(e).backgroundColor;
      if (parse(c)[3] > 0) return c; // first non-transparent ancestor
    }
    return "rgb(255,255,255)";
  };
  const out = { width: innerWidth, horizontalOverflow: document.documentElement.scrollWidth > innerWidth, smallTargets: [], lowContrast: [], smallInputs: [] };
  const name = (el) => (el.id ? "#" + el.id : el.className && typeof el.className === "string" ? "." + el.className.split(" ")[0] : el.tagName) + " " + (el.textContent || "").trim().slice(0, 30);
  document.querySelectorAll("a, button, input, select, textarea, label.chip, label.tog, .opt").forEach((el) => {
    const cs = getComputedStyle(el), r = el.getBoundingClientRect();
    if (!r.width || !r.height || cs.display === "none" || el.closest("[hidden]")) return;
    const box = el.type === "checkbox" || el.type === "radio" ? el.closest("label")?.getBoundingClientRect() || r : r;
    if (box.width < 44 || box.height < 44) out.smallTargets.push(`${name(el)} ${Math.round(box.width)}×${Math.round(box.height)}`);
    const textLike = /INPUT|SELECT|TEXTAREA/.test(el.tagName) && !["checkbox", "radio", "range"].includes(el.type);
    if (textLike && parseFloat(cs.fontSize) < 16) out.smallInputs.push(name(el));
  });
  document.querySelectorAll("p, li, span, h1, h2, h3, label, td, th, summary, .muted").forEach((el) => {
    if (!el.childNodes.length || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return;
    const cs = getComputedStyle(el), r = ratio(cs.color, bgOf(el)), need = parseFloat(cs.fontSize) >= 18.66 ? 3 : 4.5;
    if (r < need && el.getBoundingClientRect().height) out.lowContrast.push(`${name(el)} ${r.toFixed(2)}:1 (need ${need})`);
  });
  out.smallTargets = out.smallTargets.slice(0, 25); out.lowContrast = out.lowContrast.slice(0, 25);
  return out;
})()
```

If a contrast failure looks wrong, read the element's computed `color` and its ancestor's `backgroundColor` directly before changing any CSS.

## 4. Look at each screen
Open each tab (Today, Plan, Exercises, Progress, Friends, Settings), the setup wizard, one exercise guide sheet and an active workout. Check by eye.

## 5. Checklist (pass / fail each)
- **Tap targets:** buttons, links, chips and checkboxes are at least 44 × 44 CSS px (a checkbox counts through its label).
- **Input size:** text inputs and selects are at least 16 px, so iOS doesn't zoom on focus.
- **No horizontal scroll** at any width.
- **Contrast:** body and muted text reach 4.5:1 (3:1 for large text), in light and dark mode.
- **Bottom tab bar** never covers the last card. Bottom padding is at least the bar's height.
- **One primary action** per screen, full-width on phones.
- **Every save gives feedback** (toast or visible change).
- **Empty states** explain what to do next.
- **Focus rings** are visible when tabbing with a keyboard.
- **Safe areas:** notch and home-bar insets are respected.
- **Dangerous actions** (reset, remove, discard) ask for confirmation.

## 6. Report and fix
Give a table of checks with pass/fail and the evidence. Fix failures in CSS first. Re-run the audit to confirm.
