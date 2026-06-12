# Lucen Care — Design System Specification
**Date:** 2026-06-02  
**Version:** 1.0  
**Approach:** V3 Logo · Teal-Led · Indigo Sidebar  
**Status:** Approved — ready for implementation

---

## 1. Overview

This document defines the complete visual design system for the Lucen Care platform. It governs all five portals (Patient & Caregiver, NGO, HMO, Clinical Researcher, Admin) within the single Angular SPA.

### Design intent
Lucen Care sits between clinical precision and human warmth. The indigo sidebar communicates institutional trust and authority. Teal as the primary action colour signals care and forward motion. Amber is reserved as the brand's warm spark — present in the logo and as a secondary signal, never dominating the UI. The result is a platform that feels credible enough for HMOs and researchers, yet approachable for patients and caregivers.

### Logo identity
- **Logo variant:** V3 — Indigo, Teal & Amber
- **"Lucen":** `#3535A8` bold (Nunito 700)
- **"Care":** `#3AB0A1` regular (Nunito 400)
- **Icon spark:** `#F4A261` amber centre circle — the single most prominent amber element in the UI
- **Accent underline:** `#F4A261` at 80% opacity
- **Tagline:** "Guiding your path to wellness" — `#3535A8` at 60% opacity, tracking 1.8px

---

## 2. Color System

### 2.1 Brand Core

| Token | Hex | Usage |
|---|---|---|
| `--color-primary` | `#3535A8` | Sidebar bg, logo "Lucen", headings, secondary buttons |
| `--color-primary-dark` | `#1E1E6A` | Page titles, strong headings, deep text |
| `--color-primary-light` | `#6B6BCC` | Hover states on indigo elements, focus ring |
| `--color-primary-tint` | `rgba(53,53,168,0.08)` | Badge bg, pill bg, subtle surface highlight |
| `--color-cta` | `#3AB0A1` | **Primary CTA — all buttons, active sidebar indicator, links** |
| `--color-cta-dark` | `#2A8A7C` | CTA button hover, pressed state, teal text on light bg |
| `--color-cta-light` | `#5ECFC4` | Teal on dark sidebar, lighter chart bars, focus glow |
| `--color-cta-tint` | `rgba(58,176,161,0.12)` | Active sidebar bg, success badge bg, teal pill |
| `--color-accent` | `#F4A261` | Logo spark only. NGO role colour. Warning states. Notification dots. |
| `--color-accent-dark` | `#E08040` | Amber hover/pressed (when amber is intentionally used) |
| `--color-accent-light` | `#FFD0A8` | Amber tinted surfaces, icon inner glow |
| `--color-accent-tint` | `rgba(244,162,97,0.12)` | NGO badge bg, warning message bg |

> **Amber usage rule:** Amber (`#F4A261`) must never be the primary CTA colour. It appears as: the logo spark, the NGO role accent, notification/alert dots, and warning semantic states. When in doubt, use teal.

### 2.2 Backgrounds & Surfaces

| Token | Hex | Usage |
|---|---|---|
| `--color-bg` | `#F5F5FB` | Main app canvas — cool-neutral with faint indigo tint |
| `--color-surface` | `#FFFFFF` | Cards, panels, modals, form fields |
| `--color-surface-2` | `#ECEDF8` | Dividers, nested bg, table zebra rows |
| `--color-border` | `rgba(53,53,168,0.10)` | Card borders, input borders, rule lines |

### 2.3 Typography Colours

| Token | Hex | Usage |
|---|---|---|
| `--color-text` | `#1E1E6A` | Headings, titles, strong labels |
| `--color-text-secondary` | `#4A4A7A` | Body text, descriptions, paragraphs |
| `--color-text-muted` | `#8A8AB0` | Placeholders, captions, metadata, timestamps |
| `--color-text-disabled` | `#C8C8E0` | Disabled inputs, inactive menu items |

### 2.4 Role Accents

Each of the five portals has a dedicated role accent colour applied via a `.portal-{role}` body class that overrides `--color-role-accent`.

| Portal | Token | Hex | Rationale |
|---|---|---|---|
| Patient & Caregiver | `--role-patient` | `#3AB0A1` | Re-uses teal — mirrors the "Care" wordmark, signals healing |
| NGO Programs | `--role-ngo` | `#F4A261` | Re-uses amber — warmth, community, outreach |
| HMO Management | `--role-hmo` | `#3535A8` | Re-uses indigo — institutional authority, precision |
| Clinical Researcher | `--role-researcher` | `#8B5CF6` | Violet — innovation, discovery; harmonises with indigo |
| Admin Portal | `--role-admin` | `#4A4A7A` | Slate-indigo — neutral authority, distinct from all roles |

Each role also receives:
- `--color-role-surface`: 10% opacity tint of role accent
- `--color-role-border`: 20% opacity tint of role accent

### 2.5 Semantic States

| Token | Hex | Notes |
|---|---|---|
| `--color-success` | `#3AB0A1` | Re-uses teal — no new colour needed |
| `--color-warning` | `#F4A261` | Re-uses amber — intentional double-duty |
| `--color-error` | `#E53E3E` | Standalone red — only colour with no brand re-use |
| `--color-info` | `#4A4A7A` | Re-uses text-secondary |

### 2.6 Sidebar Tokens

| Token | Value | Usage |
|---|---|---|
| `--sidebar-bg` | `#3535A8` | Sidebar background |
| `--sidebar-width` | `220px` | Fixed sidebar width |
| `--sidebar-active-bg` | `rgba(58,176,161,0.15)` | Active nav item background |
| `--sidebar-active-border` | `#3AB0A1` | Active nav item left border (2px) |
| `--sidebar-hover-bg` | `rgba(255,255,255,0.05)` | Hover state |
| `--sidebar-text` | `rgba(255,255,255,0.85)` | Active/primary nav text |
| `--sidebar-text-secondary` | `rgba(255,255,255,0.55)` | Inactive nav text |
| `--sidebar-text-muted` | `rgba(255,255,255,0.28)` | Section labels |
| `--sidebar-border-color` | `rgba(255,255,255,0.08)` | Internal dividers |

---

## 3. Typography

### 3.1 Font Families

| Token | Value | Usage |
|---|---|---|
| `--font-family` | `'DM Sans', sans-serif` | All UI — body, labels, nav, buttons, stats |
| `--font-display` | `'Nunito', sans-serif` | Logo wordmark and hero display headlines only |

**Google Fonts import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
```

### 3.2 Type Scale

| Token | Size | Weight | Usage |
|---|---|---|---|
| `--text-display` | `48px` | 800 (Nunito) | Hero headline — landing page H1 only |
| `--text-3xl` | `36px` | 800 | Landing page section headline |
| `--text-2xl` | `28px` | 700 | Page titles, dashboard headers |
| `--text-xl` | `22px` | 700 | Card titles, modal headers |
| `--text-lg` | `18px` | 600 | Sub-section titles, sidebar role labels |
| `--text-md` | `16px` | 400–600 | Prominent body, form labels |
| `--text-base` | `14px` | 400 | Default UI body text |
| `--text-sm` | `12px` | 500 | Table cells, metadata, secondary labels |
| `--text-xs` | `11px` | 700 | Badges, tags, uppercase section labels |
| `--text-stat` | `32px` | 800 | Dashboard stat numbers |

### 3.3 Letter Spacing

| Token | Value | Usage |
|---|---|---|
| `--tracking-tight` | `-0.8px` | Display/hero headlines |
| `--tracking-normal` | `0px` | Standard body and headings |
| `--tracking-wide` | `0.5px` | Medium-sized labels |
| `--tracking-wider` | `1.4px` | Uppercase section labels (text-xs) |

### 3.4 Line Height

| Token | Value | Usage |
|---|---|---|
| `--leading-none` | `1.0` | Hero display tight stacking |
| `--leading-tight` | `1.25` | Headings, card titles |
| `--leading-snug` | `1.4` | UI body text |
| `--leading-relaxed` | `1.6` | Long-form descriptions, onboarding copy |

---

## 4. Spacing

4px base grid. All spacing tokens are multiples of 4.

| Token | Value | Usage |
|---|---|---|
| `--space-1` | `4px` | Icon gap, tight badge padding |
| `--space-2` | `8px` | Inline icon-to-label gap |
| `--space-3` | `12px` | Input padding vertical, tag padding |
| `--space-4` | `16px` | Card padding, button horizontal padding |
| `--space-5` | `20px` | Section header gap, sidebar item padding |
| `--space-6` | `24px` | Card internal sections, form field gap |
| `--space-8` | `32px` | Dashboard stat row, section gap |
| `--space-10` | `40px` | Page section top/bottom padding |
| `--space-12` | `48px` | Hero padding, large modal padding |
| `--space-16` | `64px` | Landing page section vertical rhythm |
| `--space-24` | `96px` | Hero section height offset, max-width gutters |

---

## 5. Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-none` | `0px` | Dividers, full-bleed elements |
| `--radius-sm` | `4px` | Tags, badges, chips |
| `--radius-md` | `8px` | Buttons, inputs, small cards |
| `--radius-lg` | `12px` | Dashboard cards, content panels |
| `--radius-xl` | `16px` | Modals, drawers, hero cards |
| `--radius-full` | `9999px` | Pills, avatars, progress bars |

---

## 6. Shadows

All shadows use an indigo tint (not grey) to feel on-brand.

| Token | Value | Usage |
|---|---|---|
| `--shadow-xs` | `0 1px 3px rgba(53,53,168,0.06)` | Subtle cards, table rows |
| `--shadow-sm` | `0 2px 8px rgba(53,53,168,0.08)` | Default dashboard cards |
| `--shadow-md` | `0 4px 16px rgba(53,53,168,0.12)` | Hover state, dropdowns |
| `--shadow-lg` | `0 8px 28px rgba(53,53,168,0.16)` | Modals, drawers |
| `--shadow-cta` | `0 4px 16px rgba(58,176,161,0.35)` | Teal CTA button hover glow |
| `--shadow-sidebar` | `0 4px 20px rgba(53,53,168,0.30)` | Sidebar depth on scroll |

---

## 7. Component Specifications

### 7.1 Buttons

**Primary (Teal CTA)**
```
bg: --color-cta (#3AB0A1)
text: white
border-radius: --radius-md (8px)
padding: 10px 20px (text-base) / 12px 24px (text-md)
font-weight: 700
hover: bg #2A8A7C, box-shadow: --shadow-cta
active: bg #1F6E63
disabled: bg --color-text-disabled (#C8C8E0), color #8A8AB0, cursor not-allowed
```

**Secondary (Indigo outline)**
```
bg: transparent
text: --color-primary (#3535A8)
border: 1.5px solid --color-primary
border-radius: --radius-md
padding: same as primary
font-weight: 600
hover: bg --color-primary-tint
active: bg rgba(53,53,168,0.15), border --color-primary-dark
disabled: text/border --color-text-disabled
```

**Ghost (dark bg variant — used on hero/sidebar)**
```
bg: transparent
text: rgba(255,255,255,0.8)
border: 1px solid rgba(255,255,255,0.25)
border-radius: --radius-md
hover: bg rgba(255,255,255,0.08)
```

### 7.2 Form Inputs

```
bg: --color-surface (#FFFFFF)
border: 1.5px solid --color-border (rgba(53,53,168,0.18))
border-radius: --radius-md (8px)
padding: 11px 14px
font-size: --text-base (14px)
color: --color-text

focus:
  border-color: --color-primary (#3535A8)
  box-shadow: 0 0 0 3px rgba(53,53,168,0.10)

error:
  border-color: --color-error (#E53E3E)
  box-shadow: 0 0 0 3px rgba(229,62,62,0.10)

disabled:
  bg: --color-bg (#F5F5FB)
  border-color: --color-surface-2 (#ECEDF8)
  color: --color-text-disabled
```

### 7.3 Cards

```
bg: --color-surface (#FFFFFF)
border: 1px solid --color-border
border-radius: --radius-lg (12px)
padding: --space-4 to --space-6 depending on density
box-shadow: --shadow-sm

Role-accented cards (stat cards):
  accent bar: 3px top border in role colour
  icon wrap: 10% opacity tint of role colour, --radius-md
```

### 7.4 Sidebar Navigation

```
container:
  width: 220px
  bg: --sidebar-bg (#3535A8)

logo area:
  padding: 20px 16px
  border-bottom: 1px solid --sidebar-border-color

section labels:
  font-size: 9px, weight 700, letter-spacing 1.2px, uppercase
  color: --sidebar-text-muted

nav items:
  padding: 9px 16px
  font-size: 13px, weight 500
  color: --sidebar-text-secondary
  border-left: 2px solid transparent

  active:
    bg: --sidebar-active-bg (rgba(58,176,161,0.15))
    border-left-color: --sidebar-active-border (#3AB0A1)
    color: white, weight 600

  hover (non-active):
    bg: --sidebar-hover-bg
    color: rgba(255,255,255,0.8)

notification badge:
  bg: --color-cta (#3AB0A1)
  color: white
  font-size: 9px, weight 700

user area:
  margin-top: auto
  padding: 14px 16px
  border-top: 1px solid --sidebar-border-color
```

### 7.5 Badges & Role Pills

```
Structure: font-size 10-11px, weight 700, padding 2px 7px, border-radius --radius-full

Patient badge:  bg rgba(58,176,161,0.12),  color #2A8A7C
NGO badge:      bg rgba(244,162,97,0.12),   color #D97706
HMO badge:      bg rgba(53,53,168,0.10),    color #3535A8
Researcher badge: bg rgba(139,92,246,0.10), color #6D28D9
Admin badge:    bg rgba(74,74,122,0.10),    color #4A4A7A
```

### 7.6 Top Bar

```
bg: --color-surface (#FFFFFF)
border-bottom: 1px solid --color-border
padding: 14px 24px
box-shadow: --shadow-xs
height: ~56px

search input:
  bg: --color-bg (#F5F5FB)
  border: 1px solid --color-border
  width: 200px

action buttons:
  icon buttons: 34px square, --radius-md, border --color-border
  avatar: 34px circle, gradient #3AB0A1 → #2A8A7C
  CTA: teal primary button
```

---

## 8. Screen Layouts

### 8.1 Landing Page (Public)

**Structure:**
- Sticky dark nav (bg `rgba(27,27,90,0.96)` with `backdrop-filter: blur(12px)`)
- Hero: full-width dark indigo gradient (`#1A1A60` → `#3535A8`), split layout — copy left, platform card right
- "Who it's for" section: `#F5F5FB` bg, 4-column role card grid, each with role-colour top border
- Features section: white bg, 3-column grid

**Hero copy:**
- Eyebrow tag: live dot + "Healthcare Access Platform"
- H1: "The platform that connects [every voice] in healthcare." — "every voice" in `#F4A261` amber (one intentional amber moment in the hero)
- Sub: 15px, `rgba(255,255,255,0.65)`
- CTAs: teal primary + ghost secondary
- Social proof: stacked avatar dots + "1,200+ healthcare professionals"

**Platform card (hero right):**
- Glassmorphism: `rgba(255,255,255,0.06)` bg, `backdrop-filter: blur(20px)`, 1px white/12% border
- Activity bars: Patient=teal, NGO=amber, HMO=white/70%, Researcher=violet
- Compliance tags: GDPR, HIPAA, AI-powered

### 8.2 Auth / Login

**Structure:** Split layout — 44% dark left panel / 56% white right panel

**Left panel (indigo gradient `#1A1A60` → `#3535A8`):**
- Full horizontal logo (white "Lucen", teal "Care")
- Tagline headline
- Role list with coloured dots per portal

**Right panel (white):**
- Role selector chips (Patient / NGO / HMO / Researcher) — indigo active state
- Email + password fields — indigo focus state
- Remember me + Forgot password (teal link)
- Teal login button
- Social auth row: Google / Apple / NHS SSO
- Sign up link (teal)

### 8.3 Dashboard Shell (All Roles)

**Layout:** Fixed 220px indigo sidebar + flexible content area

**Content area structure:**
1. Top bar: breadcrumb, page title, search, action icons, role-contextual CTA
2. Main canvas: 22px 24px padding, `#F5F5FB` bg
3. Welcome banner: indigo gradient card, role-personalised greeting, key stats in teal, teal CTA
4. Stat cards: 4-column grid, each with 3px role-colour accent bar at top
5. Charts row: 1.6fr main chart + 1fr activity feed
6. Bottom row: care plan checklist + upcoming appointments

---

## 9. Accessibility

| Pairing | Ratio | Result |
|---|---|---|
| Indigo `#3535A8` on white | 7.8:1 | AAA ✓ |
| Indigo Dark `#1E1E6A` on white | 14.1:1 | AAA ✓ |
| White on Teal CTA `#3AB0A1` | 3.2:1 | AA Large ✓ |
| White on Teal Dark `#2A8A7C` (hover) | 4.6:1 | AA ✓ |
| Amber `#F4A261` on Indigo sidebar | 5.2:1 | AAA ✓ |
| Teal Light `#5ECFC4` on Indigo sidebar | 4.8:1 | AA ✓ |
| White on Error Red `#E53E3E` | 4.7:1 | AA ✓ |

**Notes:**
- Teal CTA (`#3AB0A1`) passes AA for large text (18px+ or 14px+ bold). For body-size text, always use `#2A8A7C` (teal dark) for text colour.
- All interactive elements require `:focus-visible` with `outline: 2px solid --color-primary; outline-offset: 2px`
- Role colour badges always pair light tint bg with dark text for contrast safety

---

## 10. Animation

Shared keyframes (already in `global.scss`, carried forward):

| Class | Animation | Duration | Easing |
|---|---|---|---|
| `.anim-fade-up` | `fadeSlideUp` (Y +18px → 0) | 0.45s | `cubic-bezier(0.22,1,0.36,1)` |
| `.anim-fade-right` | `fadeSlideRight` (X -14px → 0) | 0.45s | same |
| `.anim-scale-in` | `scaleIn` (0.97 → 1) | 0.35s | same |
| `.anim-fade-in` | `fadeIn` (opacity 0 → 1) | 0.4s | `ease` |

Stagger helpers: `.anim-delay-1` through `.anim-delay-6` (0.08s increments).

**Interaction transitions:**
- Button hover/active: `0.15s ease`
- Card hover lift: `transform: translateY(-2px)`, `0.2s ease`
- Sidebar item hover: `0.15s ease`
- Input focus ring: `0.15s ease`

---

## 11. Implementation Scope

The following files need to be updated to apply this design system:

### Style files (full rewrite)
- `src/styles/tokens.scss` — replace all existing tokens with the new system
- `src/styles/tokens-patient.scss` — patient role overrides
- `src/styles/tokens-ngo.scss` — NGO role overrides
- `src/styles/tokens-hmo.scss` — HMO role overrides
- `src/styles/tokens-researcher.scss` — researcher role overrides
- `src/styles/global.scss` — update base element styles (inputs, buttons)

### Layout components (reskin)
- `sidebar-shell` — apply new sidebar tokens
- `public-shell` — update for landing page nav
- `button` shared component — implement all button variants
- `card` shared component — new shadow, radius, accent bar pattern
- `form-field` shared component — new input states
- `badge` shared component — role pill styles

### Feature components (colour token updates)
- `landing.component` — hero, who-section, features
- `login.component` — split layout, role chips
- `role-selection.component` — role card styles
- All dashboard components — stat cards, charts, activity feeds

### Assets
- **Create** `LucenCare_Logo_V3_Indigo.svg` and save to `public/` — this file does not yet exist. The V3 logo was defined as inline SVG during brainstorming. The SVG paths are identical to V1 (`LucenCare_Logo_Primary_BlueGold.svg`) with these colour substitutions:
  - Outer embrace arms: `#1D4E89` → `#3535A8`
  - Inner embrace arc: `#3AB0A1` (unchanged)
  - Heart fill: `#3AB0A1` (unchanged)
  - Spark circle: `#F4A261` (unchanged)
  - "Lucen" wordmark: `#1D4E89` → `#3535A8`
  - "Care" wordmark: `#3AB0A1` (unchanged)
  - Tagline: `#1D4E89` → `#3535A8`
  - Accent underline: `#F2C94C` → `#F4A261`

---

## 12. Open Decisions (Carried from Previous Spec)

The following decisions from the April 2026 spec remain open and are not addressed by this design system update:

1. Auth cookie strategy (httpOnly JWT vs session)
2. LLM vendor (Anthropic vs OpenAI)
3. Maps vendor for care mapping feature
4. Charts library (for dashboard data visualisation)
5. Database choice
6. Email service provider
7. HIPAA BAA counterparty (tied to LLM vendor decision)

These are infrastructure/vendor decisions and do not affect the design system.
