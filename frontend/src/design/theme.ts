// CSS custom properties for both themes.
// Injected once into <head>; toggled by setting data-theme="light" on <html>.
// Accent / semantic / tint colors are intentionally NOT themed — brand consistency.

export const themeCSS = `
:root {
  /* ── Dark theme (default) ─────────────────────────────────────────── */
  --bk-bg-base:     #0A0E1A;
  --bk-bg-surface:  #131826;
  --bk-bg-surface2: #1A2138;
  --bk-bg-surface3: #232C44;

  /* RGB channels for rgba() overlays */
  --bk-bg-base-rgb:     10, 14, 26;
  --bk-bg-surface-rgb:  19, 24, 38;

  --bk-border-subtle:  rgba(255, 255, 255, 0.04);
  --bk-border-default: rgba(255, 255, 255, 0.08);
  --bk-border-strong:  rgba(255, 255, 255, 0.16);

  --bk-text-primary:   #F4F4F5;
  --bk-text-secondary: #A1A1AA;
  --bk-text-muted:     #71717A;

  /* Seat — available state only (rest are accent colors, theme-agnostic) */
  --bk-seat-available-bg:     rgba(255, 255, 255, 0.08);
  --bk-seat-available-border: rgba(255, 255, 255, 0.14);

  color-scheme: dark;
}

[data-theme="light"] {
  /* ── Light theme ──────────────────────────────────────────────────── */
  --bk-bg-base:     #FAFAFA;
  --bk-bg-surface:  #FFFFFF;
  --bk-bg-surface2: #F4F4F5;
  --bk-bg-surface3: #E4E4E7;

  --bk-bg-base-rgb:     250, 250, 250;
  --bk-bg-surface-rgb:  255, 255, 255;

  --bk-border-subtle:  rgba(0, 0, 0, 0.04);
  --bk-border-default: rgba(0, 0, 0, 0.10);
  --bk-border-strong:  rgba(0, 0, 0, 0.18);

  --bk-text-primary:   #18181B;
  --bk-text-secondary: #52525B;
  --bk-text-muted:     #71717A;

  --bk-seat-available-bg:     rgba(0, 0, 0, 0.06);
  --bk-seat-available-border: rgba(0, 0, 0, 0.14);

  color-scheme: light;
}

/* Body background follows theme */
body {
  background-color: var(--bk-bg-base);
  color: var(--bk-text-primary);
}

/* Theme transition — smooth switch, but skip on first paint */
.bk-theme-ready *,
.bk-theme-ready *::before,
.bk-theme-ready *::after {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-duration: 200ms;
  transition-timing-function: ease;
}
`;

export type Theme = 'dark' | 'light';
