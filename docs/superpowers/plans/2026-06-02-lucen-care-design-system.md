# Lucen Care Design System V3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing teal-dominant token system with the V3 indigo/teal/amber design system — indigo (#3535A8) as sidebar and brand structure, teal (#3AB0A1) as primary CTA, amber (#F4A261) restricted to logo spark, NGO accent, and warnings only.

**Architecture:** CSS custom properties cascade from `:root` in `tokens.scss`. Role portals override accent variables via `.portal-{role}` classes applied to the `.shell` div by `SidebarShellComponent`. Feature components already consume token vars — the main work is (a) rewriting the token files and (b) replacing hardcoded `#0D9488` / `#2DD4BF` / `#134E4A` / `#091F1D` values in public-facing pages and dashboards.

**Tech Stack:** Angular 19 standalone components, SCSS, CSS custom properties. Verify each task with `ng build` in `lucen-care-app/`.

---

## File Map

| File | Action |
|------|--------|
| `src/assets/logo-v3.svg` | Create |
| `src/styles/tokens.scss` | Rewrite |
| `src/styles/tokens-patient.scss` | Fill in |
| `src/styles/tokens-ngo.scss` | Fill in |
| `src/styles/tokens-hmo.scss` | Fill in |
| `src/styles/tokens-researcher.scss` | Fill in |
| `src/app/shared/layout/public-shell/public-shell.component.scss` | Modify |
| `src/app/shared/components/badge/badge.component.scss` | Modify |
| `src/app/features/public/landing/landing.component.scss` | Rewrite |
| `src/app/features/public/role-selection/role-selection.component.scss` | Modify |
| `src/app/features/auth/login/login.component.scss` | Modify |
| `src/app/features/patient/dashboard/patient-dashboard.component.scss` | Modify |
| `src/app/features/ngo/dashboard/ngo-dashboard.component.scss` | Modify |
| `src/app/features/hmo/dashboard/hmo-dashboard.component.scss` | Modify |
| `src/app/features/researcher/dashboard/researcher-dashboard.component.scss` | Modify |

---

### Task 1: Create V3 logo SVG asset

**Files:**
- Create: `lucen-care-app/src/assets/logo-v3.svg`

The V3 logo is the V1 logo with two colour substitutions: navy `#1D4E89` → indigo `#3535A8`, and gold `#F2C94C` → amber `#F4A261`. Teal `#3AB0A1` is unchanged.

- [ ] **Step 1: Create the assets directory**

```bash
mkdir -p lucen-care-app/src/assets
```

Expected: no output, directory created.

- [ ] **Step 2: Locate the V1 logo SVG**

Ask the user for the file path to their V1 logo SVG (the navy/teal/gold version). Copy it into the assets directory:

```bash
cp "<path-to-v1-logo>" lucen-care-app/src/assets/logo-v1.svg
```

- [ ] **Step 3: Generate logo-v3.svg via colour substitution**

```bash
sed \
  -e 's/#1D4E89/#3535A8/gI' \
  -e 's/#1d4e89/#3535A8/gI' \
  -e 's/#F2C94C/#F4A261/gI' \
  -e 's/#f2c94c/#F4A261/gI' \
  lucen-care-app/src/assets/logo-v1.svg > lucen-care-app/src/assets/logo-v3.svg
```

Expected: `logo-v3.svg` created. Open both files and verify the outer cross arms and "Lucen" text changed from `#1D4E89` to `#3535A8`, and the spark accent changed from `#F2C94C` to `#F4A261`. Teal `#3AB0A1` should be unchanged.

- [ ] **Step 4: Verify SVG renders correctly**

Open `logo-v3.svg` in a browser (drag and drop the file). Confirm the logo shows indigo arms + indigo wordmark + teal accent shape + amber spark.

- [ ] **Step 5: Commit**

```bash
cd lucen-care-app
git add src/assets/logo-v3.svg src/assets/logo-v1.svg
git commit -m "feat: add V3 logo SVG with indigo brand colours"
```

---

### Task 2: Rewrite base design tokens

**Files:**
- Modify: `lucen-care-app/src/styles/tokens.scss`

This is the single source of truth for all colours, spacing, typography, radius, and shadows. Every change here cascades to the whole app. The sidebar tokens switch from dark-teal (`#134E4A`) to indigo (`#3535A8`). New tokens added: `--color-primary`, `--color-teal`, `--color-amber`, `--shadow-sm/md/lg`, `--radius-xs`, `--radius-2xl`.

- [ ] **Step 1: Verify build passes before touching anything**

```bash
cd lucen-care-app && ng build --configuration development 2>&1 | tail -5
```

Expected: `Build at: ... - Hash: ... - Time: ...ms` with no errors.

- [ ] **Step 2: Replace tokens.scss with new indigo-system tokens**

Replace the entire content of `lucen-care-app/src/styles/tokens.scss` with:

```scss
:root {
  // Brand
  --color-primary:          #3535A8;
  --color-primary-dark:     #2929A0;
  --color-teal:             #3AB0A1;
  --color-amber:            #F4A261;

  // Backgrounds
  --color-bg:               #F4F5F8;
  --color-surface:          #FFFFFF;
  --color-surface-2:        #ECEDF5;
  --color-border:           rgba(53, 53, 168, 0.12);

  // Text
  --color-text:             #12122A;
  --color-text-secondary:   #4A4A7A;
  --color-text-muted:       #8A8AAF;

  // Semantic
  --color-error:            #DC2626;
  --color-warning:          #F4A261;
  --color-success:          #3AB0A1;

  // Role accent — default teal, overridden per portal
  --color-role-accent:      #3AB0A1;
  --color-role-surface:     rgba(58, 176, 161, 0.08);
  --color-role-border:      rgba(58, 176, 161, 0.20);

  // Sidebar — indigo
  --sidebar-width:          220px;
  --sidebar-bg:             #3535A8;
  --sidebar-active-bg:      rgba(58, 176, 161, 0.15);
  --sidebar-active-border:  #3AB0A1;
  --sidebar-hover-bg:       rgba(255, 255, 255, 0.07);
  --sidebar-text:           rgba(255, 255, 255, 0.90);
  --sidebar-text-secondary: rgba(255, 255, 255, 0.55);
  --sidebar-text-muted:     rgba(255, 255, 255, 0.30);
  --sidebar-border-color:   rgba(255, 255, 255, 0.10);

  // Typography
  --font-family:            'DM Sans', sans-serif;
  --text-xs:                11px;
  --text-sm:                12px;
  --text-base:              14px;
  --text-md:                16px;
  --text-lg:                20px;
  --text-xl:                24px;
  --text-2xl:               30px;
  --text-3xl:               36px;
  --font-regular:           400;
  --font-medium:            500;
  --font-semibold:          600;
  --font-bold:              700;
  --font-extrabold:         800;
  --tracking-tight:         -0.8px;
  --tracking-normal:        0px;
  --tracking-wide:          0.5px;
  --tracking-wider:         1.2px;

  // Spacing — 4px grid
  --space-1:   4px;
  --space-2:   8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;

  // Border radius
  --radius-xs:   4px;
  --radius-sm:   6px;
  --radius-md:   8px;
  --radius-lg:  12px;
  --radius-xl:  16px;
  --radius-2xl: 24px;
  --radius-full: 9999px;

  // Shadows — indigo-tinted
  --shadow-sm: 0 1px 3px rgba(53, 53, 168, 0.06), 0 1px 2px rgba(53, 53, 168, 0.04);
  --shadow-md: 0 4px 12px rgba(53, 53, 168, 0.10), 0 2px 4px rgba(53, 53, 168, 0.06);
  --shadow-lg: 0 8px 32px rgba(53, 53, 168, 0.12), 0 4px 8px rgba(53, 53, 168, 0.08);

  // Button tokens
  --btn-primary-bg:         var(--color-role-accent);
  --btn-primary-text:       #FFFFFF;
  --btn-secondary-bg:       transparent;
  --btn-secondary-border:   var(--color-role-accent);
  --btn-secondary-text:     var(--color-role-accent);
  --btn-accent-bg:          var(--color-role-accent);
  --btn-accent-text:        #FFFFFF;

  // Card tokens
  --card-bg:                var(--color-surface);
  --card-border:            var(--color-border);
  --card-radius:            var(--radius-lg);
  --card-padding:           var(--space-4);
}
```

- [ ] **Step 3: Verify build still passes**

```bash
ng build --configuration development 2>&1 | tail -5
```

Expected: no errors. Any "unknown CSS property" or "undefined variable" warnings indicate a token was used by name in a file but not yet defined — check the console output and fix.

- [ ] **Step 4: Commit**

```bash
git add src/styles/tokens.scss
git commit -m "feat: replace design tokens with V3 indigo/teal/amber system"
```

---

### Task 3: Fill role portal token overrides

**Files:**
- Modify: `lucen-care-app/src/styles/tokens-patient.scss`
- Modify: `lucen-care-app/src/styles/tokens-ngo.scss`
- Modify: `lucen-care-app/src/styles/tokens-hmo.scss`
- Modify: `lucen-care-app/src/styles/tokens-researcher.scss`

Each file targets `.portal-{role}` which is applied to `.shell` by `SidebarShellComponent` via `[ngClass]="portalClass"`. CSS custom properties cascade, so all descendants of `.portal-patient` (every component inside the dashboard shell) inherit the overrides automatically.

- [ ] **Step 1: Write tokens-patient.scss**

Replace the entire content of `lucen-care-app/src/styles/tokens-patient.scss`:

```scss
.portal-patient {
  --color-role-accent:    #3AB0A1;
  --color-role-surface:   rgba(58, 176, 161, 0.08);
  --color-role-border:    rgba(58, 176, 161, 0.20);
  --btn-primary-bg:       #3AB0A1;
  --btn-primary-text:     #FFFFFF;
  --btn-secondary-border: #3AB0A1;
  --btn-secondary-text:   #3AB0A1;
  --btn-accent-bg:        #3AB0A1;
  --btn-accent-text:      #FFFFFF;
}
```

- [ ] **Step 2: Write tokens-ngo.scss**

Replace the entire content of `lucen-care-app/src/styles/tokens-ngo.scss`:

```scss
.portal-ngo {
  --color-role-accent:    #F4A261;
  --color-role-surface:   rgba(244, 162, 97, 0.08);
  --color-role-border:    rgba(244, 162, 97, 0.20);
  --btn-primary-bg:       #F4A261;
  --btn-primary-text:     #12122A;
  --btn-secondary-border: #F4A261;
  --btn-secondary-text:   #F4A261;
  --btn-accent-bg:        #F4A261;
  --btn-accent-text:      #12122A;
}
```

Note: NGO uses amber (#F4A261) which is a light colour — buttons need `--btn-primary-text: #12122A` (dark text) for WCAG AA contrast.

- [ ] **Step 3: Write tokens-hmo.scss**

Replace the entire content of `lucen-care-app/src/styles/tokens-hmo.scss`:

```scss
.portal-hmo {
  --color-role-accent:    #3535A8;
  --color-role-surface:   rgba(53, 53, 168, 0.08);
  --color-role-border:    rgba(53, 53, 168, 0.20);
  --btn-primary-bg:       #3535A8;
  --btn-primary-text:     #FFFFFF;
  --btn-secondary-border: #3535A8;
  --btn-secondary-text:   #3535A8;
  --btn-accent-bg:        #3535A8;
  --btn-accent-text:      #FFFFFF;
}
```

- [ ] **Step 4: Write tokens-researcher.scss**

Replace the entire content of `lucen-care-app/src/styles/tokens-researcher.scss`:

```scss
.portal-researcher {
  --color-role-accent:    #8B5CF6;
  --color-role-surface:   rgba(139, 92, 246, 0.08);
  --color-role-border:    rgba(139, 92, 246, 0.20);
  --btn-primary-bg:       #8B5CF6;
  --btn-primary-text:     #FFFFFF;
  --btn-secondary-border: #8B5CF6;
  --btn-secondary-text:   #8B5CF6;
  --btn-accent-bg:        #8B5CF6;
  --btn-accent-text:      #FFFFFF;
}
```

- [ ] **Step 5: Verify build**

```bash
ng build --configuration development 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/styles/tokens-patient.scss src/styles/tokens-ngo.scss src/styles/tokens-hmo.scss src/styles/tokens-researcher.scss
git commit -m "feat: add role portal token overrides for all four portals"
```

---

### Task 4: Update PublicShell nav and footer

**Files:**
- Modify: `lucen-care-app/src/app/shared/layout/public-shell/public-shell.component.scss`

The nav and footer have hardcoded teal `#0D9488` / `rgba(13,148,136,...)` values. Switch them to indigo. The footer background changes from dark teal `#134E4A` to dark indigo `#1A1A5E`. The nav login button changes from teal to indigo.

- [ ] **Step 1: Replace public-shell.component.scss**

Replace the entire content of `lucen-care-app/src/app/shared/layout/public-shell/public-shell.component.scss`:

```scss
.shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);

  &__content {
    flex: 1;
  }
}

.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 48px;
  height: 62px;
  background: #FFFFFF;
  border-bottom: 1px solid rgba(53, 53, 168, 0.10);
  position: sticky;
  top: 0;
  z-index: 100;

  &__brand {
    color: #3535A8;
    font-weight: var(--font-extrabold);
    font-size: var(--text-base);
    letter-spacing: var(--tracking-wider);
  }

  &__links {
    display: flex;
    align-items: center;
    gap: 28px;
  }

  &__link {
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    transition: color 0.15s;

    &:hover { color: var(--color-text); }

    &--outline {
      border: 1.5px solid rgba(53, 53, 168, 0.25);
      color: #3535A8;
      padding: 7px 18px;
      border-radius: var(--radius-md);
      font-weight: var(--font-semibold);
      transition: border-color 0.15s, box-shadow 0.15s;

      &:hover {
        border-color: rgba(53, 53, 168, 0.55);
        box-shadow: 0 0 10px rgba(53, 53, 168, 0.10);
      }
    }

    &--filled {
      background: #3535A8;
      color: #FFFFFF;
      padding: 8px 20px;
      border-radius: var(--radius-md);
      font-weight: var(--font-extrabold);
      font-size: var(--text-sm);
      transition: box-shadow 0.15s, transform 0.1s;

      &:hover {
        box-shadow: 0 4px 16px rgba(53, 53, 168, 0.30);
        transform: translateY(-1px);
      }
    }
  }
}

.footer {
  padding: 18px 48px;
  background: #1A1A5E;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;

  &__brand {
    color: rgba(255, 255, 255, 0.85);
    font-size: var(--text-sm);
    font-weight: var(--font-extrabold);
    letter-spacing: var(--tracking-wide);
  }

  &__links {
    display: flex;
    gap: 20px;

    a {
      color: rgba(255, 255, 255, 0.30);
      font-size: var(--text-xs);
      transition: color 0.15s;
      &:hover { color: rgba(255, 255, 255, 0.60); }
    }
  }
}
```

- [ ] **Step 2: Verify build**

```bash
ng build --configuration development 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/shared/layout/public-shell/public-shell.component.scss
git commit -m "feat: update public shell nav/footer to indigo brand colours"
```

---

### Task 5: Update Badge component semantic colours

**Files:**
- Modify: `lucen-care-app/src/app/shared/components/badge/badge.component.scss`

The success badge uses a bright green (`#34D399`) that no longer matches our success colour token (`#3AB0A1` teal). Update the hardcoded success colours to teal. The warning colour (`#F59E0B`) stays — that's close to our amber warning semantic. The role badge uses token vars and needs no change.

- [ ] **Step 1: Replace badge.component.scss**

Replace the entire content of `lucen-care-app/src/app/shared/components/badge/badge.component.scss`:

```scss
.badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;

  &--success {
    background: rgba(58, 176, 161, 0.12);
    color: #2A8A7D;
  }

  &--warning {
    background: rgba(244, 162, 97, 0.12);
    color: #C4700A;
  }

  &--error {
    background: rgba(220, 38, 38, 0.10);
    color: #DC2626;
  }

  &--neutral {
    background: rgba(74, 74, 122, 0.08);
    color: var(--color-text-secondary);
  }

  &--role {
    background: var(--color-role-surface);
    color: var(--color-role-accent);
  }
}
```

- [ ] **Step 2: Verify build**

```bash
ng build --configuration development 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/shared/components/badge/badge.component.scss
git commit -m "feat: update badge semantic colours to match V3 tokens"
```

---

### Task 6: Retheme Landing page

**Files:**
- Modify: `lucen-care-app/src/app/features/public/landing/landing.component.scss`

The landing page currently uses a dark-green teal-heavy theme (`#091F1D` hero background, `#2DD4BF`/`#0D9488` accent values everywhere). Replace with the V3 dark-indigo hero (`#0D0D2B`), indigo structure colours, and teal kept only for CTAs and accent elements.

Key changes:
- Hero background: `#091F1D` → `#0D0D2B`
- Hero orb A (large blob): teal → indigo `rgba(53,53,168,0.30)`
- Hero orb B (small blob): keep teal `rgba(58,176,161,0.18)` — it's the teal accent
- Hero dot grid: teal dot → indigo dot `rgba(53,53,168,0.04)`
- Hero headline gradient: `#2DD4BF→#0D9488` → `#3AB0A1→#3535A8`
- Hero CTA button + glow: `#2DD4BF` → `#3AB0A1`
- Avatar background dots: teal shades → indigo/teal shades
- Hero card (`.pcard`) border + glow: teal tint → indigo tint
- Who section dot grid: teal → indigo
- Who section eyebrow: teal → indigo
- Who item dividers + hover: teal → indigo
- Features section background: `#0A2E2B` → `#0D0D2B`
- Feature card border-top accent: keep teal (CTA accent role)

- [ ] **Step 1: Replace landing.component.scss**

Replace the entire content of `lucen-care-app/src/app/features/public/landing/landing.component.scss`:

```scss
@keyframes driftA {
  0%,100%{transform:translate(0,0);}
  40%    {transform:translate(-60px,45px);}
  70%    {transform:translate(35px,-25px);}
}
@keyframes driftB {
  0%,100%{transform:translate(0,0);}
  35%    {transform:translate(55px,-50px);}
  75%    {transform:translate(-30px,40px);}
}
@keyframes pulse {
  0%,100%{box-shadow:0 0 0 0 rgba(58,176,161,.55);}
  50%    {box-shadow:0 0 0 7px rgba(58,176,161,0);}
}
@keyframes ringPulse {
  0%  {transform:scale(1);opacity:.9;}
  100%{transform:scale(2.6);opacity:0;}
}
@keyframes barIn {
  from{width:0;}
  to  {width:var(--w);}
}

// ── Shared ────────────────────────────────────────────────────
.landing { overflow:hidden; }

// ══ HERO ══════════════════════════════════════════════════════
.hero {
  background:#0D0D2B;
  background-image:radial-gradient(circle,rgba(53,53,168,.04) 1px,transparent 1px);
  background-size:30px 30px;
  min-height:calc(100vh - 62px);
  position:relative;
  display:flex;
  align-items:center;
  overflow:hidden;

  &__orb {
    position:absolute;
    border-radius:50%;
    pointer-events:none;
    filter:blur(90px);
  }
  &__orb--a {
    width:640px;height:520px;
    background:radial-gradient(ellipse,rgba(53,53,168,.30) 0%,transparent 65%);
    top:-10%;left:-8%;
    animation:driftA 16s ease-in-out infinite;
  }
  &__orb--b {
    width:500px;height:440px;
    background:radial-gradient(ellipse,rgba(58,176,161,.18) 0%,transparent 65%);
    bottom:-5%;right:-5%;
    animation:driftB 20s ease-in-out infinite;
  }

  &__inner {
    max-width:1240px;
    margin:0 auto;
    padding:80px 64px;
    display:grid;
    grid-template-columns:1.1fr 0.9fr;
    gap:80px;
    align-items:center;
    position:relative;
    z-index:1;
    width:100%;
  }

  // ── Copy ──
  &__copy { display:flex; flex-direction:column; gap:32px; }

  &__eyebrow {
    display:inline-flex;
    align-items:center;
    gap:10px;
    background:rgba(255,255,255,.06);
    border:1px solid rgba(58,176,161,.28);
    border-radius:999px;
    padding:8px 18px;
    color:rgba(58,176,161,.90);
    font-size:var(--text-xs);
    font-weight:var(--font-semibold);
    letter-spacing:var(--tracking-wider);
    width:fit-content;
    backdrop-filter:blur(8px);
  }

  &__live-dot {
    width:7px;height:7px;
    border-radius:50%;
    background:#3AB0A1;
    position:relative;
    flex-shrink:0;
    animation:pulse 2.2s ease-in-out infinite;
    &::after {
      content:'';
      position:absolute;
      inset:-3px;
      border-radius:50%;
      border:1.5px solid #3AB0A1;
      animation:ringPulse 2.2s ease-out infinite;
    }
  }

  &__hed {
    font-size:72px;
    font-weight:var(--font-regular);
    color:#FFFFFF;
    line-height:1.08;
    letter-spacing:-2.5px;
    margin:0;
  }

  &__hed-accent {
    font-weight:var(--font-extrabold);
    background:linear-gradient(120deg,#3AB0A1 0%,#3535A8 100%);
    -webkit-background-clip:text;
    -webkit-text-fill-color:transparent;
    background-clip:text;
  }

  &__sub {
    color:rgba(255,255,255,.58);
    font-size:var(--text-md);
    line-height:1.8;
    max-width:420px;
    margin:0;
  }

  &__actions { display:flex; align-items:center; gap:var(--space-4); }

  &__btn-primary {
    background:#3AB0A1;
    color:#0D0D2B;
    padding:14px 28px;
    border-radius:var(--radius-md);
    font-size:var(--text-base);
    font-weight:var(--font-extrabold);
    font-family:var(--font-family);
    box-shadow:0 4px 24px rgba(58,176,161,.35);
    transition:box-shadow .2s, transform .15s;
    &:hover{box-shadow:0 8px 32px rgba(58,176,161,.50);transform:translateY(-2px);}
  }

  &__btn-ghost {
    color:rgba(255,255,255,.55);
    font-size:var(--text-base);
    font-weight:var(--font-medium);
    font-family:var(--font-family);
    border-bottom:1px solid rgba(255,255,255,.18);
    padding-bottom:1px;
    transition:color .15s,border-color .15s;
    &:hover{color:rgba(255,255,255,.90);border-color:rgba(255,255,255,.50);}
  }

  &__proof { display:flex; align-items:center; gap:var(--space-3); }

  &__proof-text {
    color:rgba(255,255,255,.42);
    font-size:var(--text-sm);
    strong{color:rgba(255,255,255,.75);}
  }
}

.avatars {
  display:flex;
  &__dot {
    width:30px;height:30px;
    border-radius:50%;
    margin-left:-8px;
    border:2px solid #0D0D2B;
    &:first-child{margin-left:0;}
    &--1{background:linear-gradient(135deg,#3535A8,#5B5BC8);}
    &--2{background:linear-gradient(135deg,#3AB0A1,#5AC8BC);}
    &--3{background:linear-gradient(135deg,#2929A0,#3535A8);}
    &--4{background:linear-gradient(135deg,#8B5CF6,#A78BF8);}
  }
}

// ── Platform card ─────────────────────────────────────────────
.hero__card-wrap {
  display:flex;
  justify-content:flex-end;
}

.pcard {
  background:rgba(255,255,255,.04);
  backdrop-filter:blur(24px);
  border:1px solid rgba(53,53,168,.25);
  border-radius:20px;
  padding:28px;
  width:100%;
  max-width:400px;
  box-shadow:
    0 0 0 1px rgba(53,53,168,.07),
    0 32px 64px rgba(0,0,0,.35),
    0 0 80px rgba(53,53,168,.10);

  &__top {
    display:flex;
    justify-content:space-between;
    align-items:center;
    margin-bottom:22px;
  }

  &__label {
    color:rgba(255,255,255,.40);
    font-size:var(--text-xs);
    font-weight:var(--font-semibold);
    letter-spacing:var(--tracking-wider);
    text-transform:uppercase;
  }

  &__status {
    display:flex;
    align-items:center;
    gap:6px;
    color:#3AB0A1;
    font-size:var(--text-xs);
    font-weight:var(--font-semibold);
  }

  &__status-dot {
    width:6px;height:6px;
    border-radius:50%;
    background:#3AB0A1;
    animation:pulse 2s ease-in-out infinite;
  }

  &__stats {
    display:grid;
    grid-template-columns:repeat(4,1fr);
    gap:var(--space-2);
    margin-bottom:22px;
  }

  &__stat {
    background:rgba(255,255,255,.05);
    border:1px solid rgba(255,255,255,.07);
    border-radius:10px;
    padding:12px 6px;
    text-align:center;
    display:flex;
    flex-direction:column;
    gap:4px;
  }

  &__stat-n {
    color:#3AB0A1;
    font-size:var(--text-base);
    font-weight:var(--font-extrabold);
    letter-spacing:-0.5px;
  }

  &__stat-l {
    color:rgba(255,255,255,.30);
    font-size:9px;
    font-weight:var(--font-medium);
    line-height:1.3;
  }

  &__rule {
    height:1px;
    background:rgba(255,255,255,.07);
    margin-bottom:18px;
  }

  &__activity-label {
    color:rgba(255,255,255,.30);
    font-size:var(--text-xs);
    font-weight:var(--font-semibold);
    letter-spacing:var(--tracking-wide);
    text-transform:uppercase;
    margin-bottom:14px;
  }

  &__rows { display:flex; flex-direction:column; gap:14px; margin-bottom:22px; }

  &__row { display:flex; align-items:center; gap:10px; }

  &__row-icon {
    font-size:16px;
    width:30px;height:30px;
    display:flex;align-items:center;justify-content:center;
    background:rgba(255,255,255,.06);
    border-radius:8px;
    flex-shrink:0;
  }

  &__row-body { flex:1; display:flex; flex-direction:column; gap:6px; }

  &__row-head {
    display:flex;
    justify-content:space-between;
    align-items:center;
  }

  &__row-name {
    color:rgba(255,255,255,.65);
    font-size:var(--text-xs);
    font-weight:var(--font-medium);
  }

  &__row-pct {
    color:rgba(255,255,255,.35);
    font-size:var(--text-xs);
  }

  &__track {
    height:4px;
    background:rgba(255,255,255,.08);
    border-radius:999px;
    overflow:hidden;
  }

  &__fill {
    display:block;
    height:100%;
    border-radius:999px;
    background:linear-gradient(90deg,#3535A8,#3AB0A1);
    animation:barIn 1.4s cubic-bezier(.22,1,.36,1) both;
    animation-delay:.9s;
    width:0;
  }

  &__tags {
    display:flex;
    gap:var(--space-2);
  }

  &__tag {
    background:rgba(58,176,161,.09);
    border:1px solid rgba(58,176,161,.18);
    color:rgba(58,176,161,.75);
    font-size:10px;
    font-weight:var(--font-semibold);
    padding:3px 10px;
    border-radius:999px;
  }
}

// ══ WHO SECTION ═══════════════════════════════════════════════
.who {
  background:#F4F5F8;
  background-image:radial-gradient(circle,rgba(53,53,168,.06) 1px,transparent 1px);
  background-size:28px 28px;
  padding:100px 64px;

  &__inner { max-width:1240px; margin:0 auto; }

  &__head {
    margin-bottom:64px;
  }

  &__eyebrow {
    display:inline-block;
    color:#3535A8;
    font-size:var(--text-xs);
    font-weight:var(--font-semibold);
    letter-spacing:var(--tracking-wider);
    text-transform:uppercase;
    margin-bottom:var(--space-3);
  }

  &__title {
    color:var(--color-text);
    font-size:var(--text-3xl);
    font-weight:var(--font-extrabold);
    letter-spacing:var(--tracking-tight);
  }

  &__list { display:flex; flex-direction:column; }
}

.who-item {
  display:flex;
  align-items:center;
  gap:32px;
  padding:28px 0;
  border-top:1px solid rgba(53,53,168,.10);
  cursor:pointer;
  transition:background .15s;
  border-radius:var(--radius-lg);

  &:last-child { border-bottom:1px solid rgba(53,53,168,.10); }

  &:hover { padding-left:16px; padding-right:16px; margin:0 -16px; background:rgba(53,53,168,.04); }

  &__num {
    font-size:var(--text-2xl);
    font-weight:var(--font-extrabold);
    color:rgba(53,53,168,.18);
    min-width:52px;
    letter-spacing:-1px;
    transition:color .2s;
    font-variant-numeric:tabular-nums;
  }

  &:hover &__num { color:#3535A8; }

  &__icon {
    font-size:26px;
    width:52px;height:52px;
    display:flex;align-items:center;justify-content:center;
    background:rgba(53,53,168,.07);
    border-radius:var(--radius-lg);
    flex-shrink:0;
    transition:background .2s;
  }

  &:hover &__icon { background:rgba(53,53,168,.13); }

  &__body { flex:1; display:flex; flex-direction:column; gap:4px; }

  &__label {
    font-size:var(--text-md);
    font-weight:var(--font-bold);
    color:var(--color-text);
  }

  &__desc {
    font-size:var(--text-sm);
    color:var(--color-text-secondary);
  }

  &__arrow {
    font-size:var(--text-xl);
    color:rgba(53,53,168,.25);
    transition:transform .25s, color .2s;
  }

  &:hover &__arrow { transform:translateX(8px); color:#3535A8; }
}

// ══ FEATURES ══════════════════════════════════════════════════
.features {
  background:#0D0D2B;
  padding:100px 64px;

  &__inner { max-width:1240px; margin:0 auto; }

  &__eyebrow {
    display:inline-block;
    color:rgba(58,176,161,.60);
    font-size:var(--text-xs);
    font-weight:var(--font-semibold);
    letter-spacing:var(--tracking-wider);
    text-transform:uppercase;
    margin-bottom:var(--space-3);
  }

  &__title {
    color:#FFFFFF;
    font-size:var(--text-3xl);
    font-weight:var(--font-extrabold);
    letter-spacing:var(--tracking-tight);
    margin-bottom:56px;
  }

  &__grid {
    display:grid;
    grid-template-columns:repeat(4,1fr);
    gap:var(--space-4);
  }
}

.feat {
  background:rgba(255,255,255,.04);
  border:1px solid rgba(255,255,255,.07);
  border-top:2px solid rgba(58,176,161,.35);
  border-radius:16px;
  padding:28px 24px;
  display:flex;
  flex-direction:column;
  gap:10px;
  transition:background .2s, transform .2s, border-top-color .2s;

  &:hover {
    background:rgba(255,255,255,.07);
    transform:translateY(-6px);
    border-top-color:#3AB0A1;
  }

  &__icon { font-size:28px; }
  &__title { color:rgba(255,255,255,.88); font-size:var(--text-base); font-weight:var(--font-bold); }
  &__desc  { color:rgba(255,255,255,.38); font-size:var(--text-xs); line-height:1.65; }
}
```

- [ ] **Step 2: Verify build**

```bash
ng build --configuration development 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/features/public/landing/landing.component.scss
git commit -m "feat: retheme landing page to indigo hero with teal CTAs"
```

---

### Task 7: Fix RoleSelection undefined CSS variables

**Files:**
- Modify: `lucen-care-app/src/app/features/public/role-selection/role-selection.component.scss`

The role-selection page uses two undefined variables (`--color-accent`, `--color-navy`) which resolve to `initial`/transparent and break the CTA button and radio elements. Also fixes the `.role-selection__title` which has `color: white` — that was valid on a dark background but the page uses `var(--color-bg)` which is now a light `#F4F5F8`.

- [ ] **Step 1: Replace role-selection.component.scss**

Replace the entire content of `lucen-care-app/src/app/features/public/role-selection/role-selection.component.scss`:

```scss
.role-selection {
  min-height: calc(100vh - 52px);
  background: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-8);

  &__inner {
    width: 100%;
    max-width: 480px;
  }

  &__title {
    color: var(--color-text);
    font-size: var(--text-2xl);
    font-weight: var(--font-extrabold);
    letter-spacing: var(--tracking-tight);
    text-align: center;
    margin-bottom: var(--space-2);
  }

  &__subtitle {
    color: var(--color-text-muted);
    font-size: var(--text-sm);
    text-align: center;
    margin-bottom: var(--space-6);
  }

  &__signin {
    color: var(--color-text-muted);
    font-size: var(--text-xs);
    text-align: center;
    margin-top: var(--space-4);

    a { color: #3AB0A1; font-weight: var(--font-semibold); }
  }
}

.role-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.role-option {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  width: 100%;
  text-align: left;

  &__icon {
    width: 38px;
    height: 38px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
    background: var(--color-surface-2);
  }

  &__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__label {
    color: var(--color-text);
    font-size: var(--text-sm);
    font-weight: var(--font-semibold);
  }

  &__desc {
    color: var(--color-text-secondary);
    font-size: var(--text-xs);
  }

  &__radio {
    width: 20px;
    height: 20px;
    border-radius: var(--radius-full);
    border: 1.5px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: var(--font-extrabold);
    flex-shrink: 0;

    &--checked {
      background: #3AB0A1;
      border-color: #3AB0A1;
      color: #FFFFFF;
    }
  }

  &--selected {
    background: rgba(58, 176, 161, 0.06);
    border-color: rgba(58, 176, 161, 0.35);
  }

  &--patient.role-option--selected {
    background: rgba(58, 176, 161, 0.06);
    border-color: rgba(58, 176, 161, 0.35);
    .role-option__label { color: #2A8A7D; }
  }

  &--ngo.role-option--selected {
    background: rgba(244, 162, 97, 0.06);
    border-color: rgba(244, 162, 97, 0.35);
    .role-option__label { color: #C4700A; }
    .role-option__radio--checked { background: #F4A261; border-color: #F4A261; color: #12122A; }
  }

  &--hmo.role-option--selected {
    background: rgba(53, 53, 168, 0.06);
    border-color: rgba(53, 53, 168, 0.35);
    .role-option__label { color: #3535A8; }
    .role-option__radio--checked { background: #3535A8; border-color: #3535A8; color: #FFFFFF; }
  }

  &--researcher.role-option--selected {
    background: rgba(139, 92, 246, 0.06);
    border-color: rgba(139, 92, 246, 0.35);
    .role-option__label { color: #7C3AED; }
    .role-option__radio--checked { background: #8B5CF6; border-color: #8B5CF6; color: #FFFFFF; }
  }
}

.role-cta {
  width: 100%;
  padding: 13px;
  border-radius: var(--radius-lg);
  background: #3535A8;
  color: #FFFFFF;
  font-size: var(--text-base);
  font-weight: var(--font-extrabold);
  font-family: var(--font-family);
  cursor: pointer;
  border: none;
  transition: opacity 0.15s, box-shadow 0.15s;

  &:hover:not(:disabled) {
    opacity: 0.9;
    box-shadow: 0 4px 16px rgba(53, 53, 168, 0.30);
  }

  &:disabled {
    background: var(--color-surface-2);
    color: var(--color-text-muted);
    cursor: not-allowed;
  }
}
```

- [ ] **Step 2: Verify build**

```bash
ng build --configuration development 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/features/public/role-selection/role-selection.component.scss
git commit -m "fix: resolve undefined CSS vars and dark text on role selection page"
```

---

### Task 8: Update Login hardcoded teal references

**Files:**
- Modify: `lucen-care-app/src/app/features/auth/login/login.component.scss`

The login page has three hardcoded `rgba(13, 148, 136, ...)` values: the card's drop shadow, the CTA button's hover shadow, and the disabled button background. Replace these with indigo-tinted equivalents.

- [ ] **Step 1: Replace login.component.scss**

Replace the entire content of `lucen-care-app/src/app/features/auth/login/login.component.scss`:

```scss
.auth-page {
  min-height: calc(100vh - 54px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-8);
  background: var(--color-bg);
}

.auth-card {
  width: 100%;
  max-width: 400px;
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(53, 53, 168, 0.08);
  animation: scaleIn 0.4s cubic-bezier(0.22,1,0.36,1) both;

  &__accent {
    height: 4px;
    background: var(--color-role-accent);
  }

  &__body {
    padding: var(--space-8) var(--space-6);
  }

  &__header {
    margin-bottom: var(--space-6);
  }

  &__role-badge {
    display: inline-block;
    background: var(--color-role-surface);
    border: 1px solid var(--color-role-border);
    color: var(--color-role-accent);
    font-size: var(--text-xs);
    font-weight: var(--font-semibold);
    letter-spacing: var(--tracking-wide);
    padding: 4px 12px;
    border-radius: var(--radius-full);
    margin-bottom: var(--space-3);
  }

  &__title {
    color: var(--color-text);
    font-size: var(--text-xl);
    font-weight: var(--font-extrabold);
    letter-spacing: var(--tracking-tight);
    margin-bottom: var(--space-1);
  }

  &__subtitle {
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
  }

  &__footer {
    color: var(--color-text-secondary);
    font-size: var(--text-xs);
    text-align: center;
    margin-top: var(--space-5);

    a {
      color: var(--color-role-accent);
      font-weight: var(--font-semibold);
    }
  }
}

.auth-card input:not([type='checkbox']):not([type='radio']) {
  background: var(--color-surface-2);
  border-color: var(--color-border);
  color: var(--color-text);

  &::placeholder { color: var(--color-text-muted); }
  &:focus { background: #FFFFFF; }
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);

  &__forgot {
    align-self: flex-end;
    color: var(--color-text-muted);
    font-size: var(--text-xs);
    margin-top: calc(var(--space-1) * -1);
    transition: color 0.15s;

    &:hover { color: var(--color-role-accent); }
  }

  &__server-error {
    color: #DC2626;
    font-size: var(--text-xs);
    background: rgba(220, 38, 38, 0.06);
    border: 1px solid rgba(220, 38, 38, 0.20);
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-4);
  }
}

.auth-btn {
  width: 100%;
  padding: 13px;
  border-radius: var(--radius-lg);
  background: var(--color-role-accent);
  color: var(--btn-primary-text);
  font-size: var(--text-base);
  font-weight: var(--font-extrabold);
  font-family: var(--font-family);
  border: none;
  cursor: pointer;
  transition: opacity 0.15s, box-shadow 0.20s;

  &:hover:not(:disabled) {
    opacity: 0.92;
    box-shadow: var(--shadow-md);
  }

  &:disabled {
    background: var(--color-surface-2);
    color: var(--color-text-muted);
    cursor: not-allowed;
  }
}
```

- [ ] **Step 2: Verify build**

```bash
ng build --configuration development 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/features/auth/login/login.component.scss
git commit -m "fix: replace hardcoded teal in login with token-based values"
```

---

### Task 9: Update dashboard progress-bar track colours

**Files:**
- Modify: `lucen-care-app/src/app/features/patient/dashboard/patient-dashboard.component.scss`
- Modify: `lucen-care-app/src/app/features/ngo/dashboard/ngo-dashboard.component.scss`
- Modify: `lucen-care-app/src/app/features/hmo/dashboard/hmo-dashboard.component.scss`
- Modify: `lucen-care-app/src/app/features/researcher/dashboard/researcher-dashboard.component.scss`

All four dashboard SCSS files have progress/bar track backgrounds using `rgba(13, 148, 136, 0.08)` (hardcoded teal). Replace with `var(--color-role-surface)` so they inherit the correct portal colour. Also fix the patient dashboard quick-action hover shadow and the amber widget highlight to use new amber values.

- [ ] **Step 1: Fix patient-dashboard.component.scss**

Make these three targeted edits to `lucen-care-app/src/app/features/patient/dashboard/patient-dashboard.component.scss`:

**Edit 1** — quick-action hover shadow (line ~65):

Change:
```scss
    box-shadow: 0 6px 20px rgba(13, 148, 136, 0.18);
```
To:
```scss
    box-shadow: var(--shadow-md);
```

**Edit 2** — widget--highlight amber (lines ~101-103):

Change:
```scss
  &--highlight {
    border-color: rgba(245, 158, 11, 0.25);
    background: rgba(245, 158, 11, 0.05);
  }
```
To:
```scss
  &--highlight {
    border-color: rgba(244, 162, 97, 0.25);
    background: rgba(244, 162, 97, 0.05);
  }
```

- [ ] **Step 2: Fix ngo-dashboard.component.scss**

Make this targeted edit to `lucen-care-app/src/app/features/ngo/dashboard/ngo-dashboard.component.scss`:

**Edit** — program-bar track background (line ~197):

Change:
```scss
  background: rgba(13, 148, 136, 0.08);
```
To:
```scss
  background: var(--color-role-surface);
```

Also update the `stat-card--accent` amber to new amber values (line ~58):

Change:
```scss
  &--accent {
    border-color: rgba(245, 158, 11, 0.3);
    background: rgba(245, 158, 11, 0.05);
  }
```
To:
```scss
  &--accent {
    border-color: rgba(244, 162, 97, 0.30);
    background: rgba(244, 162, 97, 0.05);
  }
```

- [ ] **Step 3: Fix hmo-dashboard.component.scss**

Make this targeted edit to `lucen-care-app/src/app/features/hmo/dashboard/hmo-dashboard.component.scss`:

**Edit** — completeness bar track background (line ~142):

Change:
```scss
    background: rgba(13, 148, 136, 0.08);
```
To:
```scss
    background: var(--color-role-surface);
```

- [ ] **Step 4: Fix researcher-dashboard.component.scss**

Make this targeted edit to `lucen-care-app/src/app/features/researcher/dashboard/researcher-dashboard.component.scss`:

**Edit** — enrol-bar track background (line ~161):

Change:
```scss
  background: rgba(13, 148, 136, 0.08);
```
To:
```scss
  background: var(--color-role-surface);
```

- [ ] **Step 5: Verify build**

```bash
ng build --configuration development 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/features/patient/dashboard/patient-dashboard.component.scss \
        src/app/features/ngo/dashboard/ngo-dashboard.component.scss \
        src/app/features/hmo/dashboard/hmo-dashboard.component.scss \
        src/app/features/researcher/dashboard/researcher-dashboard.component.scss
git commit -m "fix: replace hardcoded teal in dashboard progress tracks with role token"
```

---

### Task 10: Visual smoke test

**Files:** None (read-only verification)

- [ ] **Step 1: Start the dev server (if not already running)**

```bash
ng serve --open 2>&1 &
```

Wait for `Local: http://localhost:4200/` in the output.

- [ ] **Step 2: Run a production build to catch any remaining issues**

```bash
ng build --configuration production 2>&1 | tail -10
```

Expected: `Build at: ... - Hash: ... - Time: ...ms` with no errors or `WARNING: CSS property unknown` messages.

- [ ] **Step 3: Check each screen**

Navigate to each route and verify the following:

| Route | Check |
|-------|-------|
| `/` (landing) | Dark indigo hero (`#0D0D2B`), teal CTA button, indigo orb on left, teal orb on right. "Who" section has indigo dividers and eyebrow. Features section dark indigo. |
| `/get-started` (role-selection) | Light `#F4F5F8` background, dark readable title, each role selects with correct colour (teal/patient, amber/NGO, indigo/HMO, violet/researcher). CTA is indigo. |
| `/auth/patient/login` | Card shadow is subtle, top accent stripe is teal, CTA button teal. |
| `/auth/ngo/login` | Top accent stripe is amber, CTA is amber with dark text. |
| `/auth/hmo/login` | Top accent stripe and CTA are indigo. |
| `/patient/dashboard` | Indigo sidebar, teal active nav item underline, teal primary button, teal appointment day numbers. |
| `/ngo/dashboard` | Indigo sidebar, amber active nav item underline, amber primary button, stat-card accent uses amber. |
| `/hmo/dashboard` | Indigo sidebar, indigo active nav item underline, indigo primary button. |
| `/researcher/dashboard` | Indigo sidebar, violet active nav item underline, violet primary button. |

- [ ] **Step 4: Confirm amber constraint**

Verify amber (`#F4A261`) does NOT appear as a primary CTA outside of the NGO portal. It should only appear in:
- The logo spark
- NGO portal active nav + buttons
- Warning semantic states (e.g., `--color-warning`)

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete V3 design system — indigo brand, teal CTA, amber restricted"
```
