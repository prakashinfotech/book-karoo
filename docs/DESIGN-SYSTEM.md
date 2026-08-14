# BookKaroo — Design System

> Cinematic, premium, dark-first. Inspired by BookMyShow but elevated.

## 1. Brand Direction
- **Mood:** Cinematic, premium, frictionless, emotionally engaging
- **Personality:** Confident, modern, Indian-rooted, bold
- **Anti-patterns:** generic SaaS, flat corporate, AI-cliché purple-on-white gradients

## 2. Color Tokens

### Dark theme (primary)
```css
--bg-base:          #0A0E1A;   /* deep navy-black */
--bg-surface:       #131826;   /* cards */
--bg-surface-2:     #1A2138;   /* elevated */
--bg-surface-3:     #232C44;   /* highest elevation */

--border-subtle:    rgba(255,255,255,0.06);
--border-default:   rgba(255,255,255,0.10);
--border-strong:    rgba(255,255,255,0.18);

--text-primary:     #F4F4F5;
--text-secondary:   #A1A1AA;
--text-muted:       #71717A;
--text-inverse:     #0A0E1A;

--accent-primary:   #E11D74;   /* rose */
--accent-primary-hover: #FF4D96;
--accent-secondary: #6366F1;   /* indigo */
--accent-tertiary:  #A855F7;   /* purple */

--gradient-hero:    linear-gradient(135deg, #6366F1 0%, #A855F7 50%, #E11D74 100%);
--gradient-card:    linear-gradient(180deg, rgba(99,102,241,0.08) 0%, rgba(168,85,247,0.04) 100%);

--success:          #10B981;
--warning:          #F59E0B;
--error:            #DC2626;
--info:             #3B82F6;

/* Seat states */
--seat-available:   #FFFFFF;
--seat-selected:    #E11D74;
--seat-booked:      #3F3F46;
--seat-locked:      #F59E0B;
--seat-recliner:    #FFD700;
--seat-gold:        #C0C0C0;
--seat-executive:   #4169E1;
--seat-normal:      #FFFFFF;
```

### Light theme
```css
--bg-base:          #FAFAFA;
--bg-surface:       #FFFFFF;
--bg-surface-2:     #F4F4F5;
--text-primary:     #18181B;
--text-secondary:   #52525B;
/* accents stay the same for brand consistency */
```

## 3. Typography

```css
--font-display:  'Playfair Display', 'Georgia', serif;   /* movie titles, hero */
--font-body:     'Inter', system-ui, sans-serif;          /* UI */
--font-mono:     'JetBrains Mono', monospace;             /* booking refs, codes */
```

### Scale (mobile → desktop)
| Token | Mobile | Desktop | Use |
|---|---|---|---|
| --text-xs | 11px | 12px | captions, badges |
| --text-sm | 13px | 14px | secondary text |
| --text-base | 15px | 16px | body |
| --text-lg | 17px | 18px | emphasized body |
| --text-xl | 19px | 20px | sub-headings |
| --text-2xl | 22px | 24px | section heading |
| --text-3xl | 26px | 30px | page heading |
| --text-4xl | 32px | 40px | hero |
| --text-5xl | 40px | 56px | hero display |

### Weights
- 400 regular, 500 medium, 600 semibold, 700 bold
- Display font: 600 / 700 only
- Line heights: tight 1.1 (display), normal 1.5 (body), relaxed 1.7 (long form)

## 4. Spacing (4px base)
```
--space-1:  4px
--space-2:  8px
--space-3:  12px
--space-4:  16px
--space-5:  20px
--space-6:  24px
--space-8:  32px
--space-10: 40px
--space-12: 48px
--space-16: 64px
--space-20: 80px
--space-24: 96px
```

## 5. Radii
```
--radius-sm:   6px   /* badges, chips */
--radius-md:   12px  /* buttons, inputs */
--radius-lg:   16px  /* cards */
--radius-xl:   24px  /* hero cards, modals */
--radius-2xl:  32px  /* feature blocks */
--radius-full: 9999px
```

## 6. Shadows (dark-aware)
```
--shadow-sm:  0 2px 6px rgba(0,0,0,0.25);
--shadow-md:  0 6px 20px rgba(0,0,0,0.35);
--shadow-lg:  0 16px 40px rgba(0,0,0,0.45);
--shadow-glow-primary:   0 0 24px rgba(225, 29, 116,0.35);
--shadow-glow-accent:    0 0 32px rgba(99,102,241,0.4);
```

## 7. Motion
```
--duration-fast:    150ms
--duration-base:    220ms
--duration-slow:    400ms
--duration-page:    600ms

--ease-out:    cubic-bezier(0.16, 1, 0.3, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

**Rules**
- Hover: opacity/transform changes in `--duration-fast`
- Modal/sheet enter: `--duration-base` `--ease-out`
- Page transitions: `--duration-page` with stagger
- Skeleton shimmer: 1.4s linear infinite

## 8. Breakpoints
```
sm: 360px   (small phones)
md: 768px   (tablets)
lg: 1024px  (laptops)
xl: 1440px  (desktop)
2xl: 1920px (large)
```
Mobile-first: write base styles for sm, then layer up.

## 9. Component States (every interactive)
| State | Visual |
|---|---|
| Default | base color |
| Hover | +5% lightness OR gradient shift, scale 1.02 (cards) |
| Focus | 2px outline `--accent-secondary`, 2px offset |
| Active | scale 0.98 |
| Disabled | opacity 0.4, cursor not-allowed |
| Loading | skeleton or spinner inside |

## 10. Core Components

### Button
- Variants: `primary` (rose), `secondary` (outline), `ghost`, `gradient` (hero CTAs)
- Sizes: sm (32h), md (40h), lg (48h), xl (56h)
- Always show focus ring; loading state replaces label with spinner

### Card
- Surface: `--bg-surface`
- Radius: `--radius-lg`
- Border: `--border-subtle`
- Hover: lift via `--shadow-md`, border `--border-default`

### Input
- Height: 44px (touch-friendly)
- Padding: 12px 16px
- Floating label OR top label, never placeholder-as-label
- Error: red border + helper text below

### Modal / Bottom Sheet
- Mobile: full-width bottom sheet with drag handle
- Desktop: centered modal, max-width 560px
- Backdrop: `rgba(0,0,0,0.7)` + backdrop-blur 8px

### Skeleton (use these, not spinners)
- Shimmer animation, `--bg-surface-2` base, `--bg-surface-3` highlight
- Match exact shape of incoming content

## 11. Patterns

### Movie Card
```
[Poster 2:3 ratio]
[Gradient overlay bottom 40%]
[Title — display font, 18px, white]
[Rating ★ 8.4 · Hindi · 2h 28m]
```
Hover: scale 1.04, glow shadow, "Book" CTA fades in.

### Seat Grid
- Square seats 28x28 mobile, 36x36 desktop
- Gap: 4px between seats, 16px aisle gap
- Row labels left, screen indicator top with curved gradient
- Sticky bottom bar on mobile

### Countdown Ring
- SVG circle, stroke-dashoffset animation
- 8 minutes total
- Color shift: green → orange (3min) → red pulsing (50s)

### Empty States
- Centered illustration (lottie or SVG)
- Heading + body + CTA
- Never just "No data"

## 12. Iconography
- **Library:** lucide-react
- Stroke 1.5px, sized 16/20/24
- Always paired with text or aria-label

## 13. Imagery
- Posters: from TMDB (CDN-served)
- Banners/empty states: Unsplash (curated)
- Avatars: dicebear (placeholder)
- Always lazy-load, use webp

## 14. Accessibility Checklist
- [x] Contrast ≥ 4.5:1 on all text
- [x] Focus visible on every interactive
- [x] Skip-to-main link
- [x] ARIA on icon buttons
- [x] Seat grid keyboard-navigable (arrow keys)
- [x] All forms labeled
- [x] No color-only state (always icon + text)

## 15. Tailwind Config (sketch)
```ts
// tailwind.config.ts excerpt
theme: {
  extend: {
    colors: {
      bg: { base: '#0A0E1A', surface: '#131826', /* ... */ },
      accent: { primary: '#E11D74', secondary: '#6366F1', tertiary: '#A855F7' },
    },
    fontFamily: {
      display: ['Playfair Display', 'serif'],
      sans: ['Inter', 'system-ui'],
    },
    borderRadius: { /* match tokens */ },
    boxShadow: { /* match tokens */ },
  }
}
```
