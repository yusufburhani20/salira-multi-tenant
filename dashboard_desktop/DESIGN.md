---
name: Academic Precision
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#434655'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#747686'
  outline-variant: '#c4c5d7'
  surface-tint: '#2151da'
  primary: '#0037b0'
  on-primary: '#ffffff'
  primary-container: '#1d4ed8'
  on-primary-container: '#cad3ff'
  inverse-primary: '#b7c4ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#004871'
  on-tertiary: '#ffffff'
  tertiary-container: '#006195'
  on-tertiary-container: '#b3d9ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001551'
  on-primary-fixed-variant: '#0039b5'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#cde5ff'
  tertiary-fixed-dim: '#94ccff'
  on-tertiary-fixed: '#001d32'
  on-tertiary-fixed-variant: '#004b74'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  margin: 2rem
  margin-sm: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system delivers an exacting, distraction-free environment engineered for academic administration, institutional reporting, and collegiate management. The aesthetic is strictly flat, functional, and authoritative—drawing influence from high-utility European typographic systems and contemporary clinical interfaces.

### Core Principles
- **Absolute Planarity**: Depth is communicated solely through planar division, background color juxtaposition, and explicit 1px borders. Drop shadows, directional lighting, and simulated physical extrusions are strictly prohibited.
- **Academic Authority**: Deep navy and royal hues evoke institutional trust, rigor, and scholarly clarity.
- **Architectural Division**: Information density is balanced using crisp wireframe structures, distinct cell-based groupings, and purposeful negative space.
- **High Legibility**: High-contrast ratios across text, status signals, and containers facilitate swift data absorption across intensive administrative workflows.

## Colors

The palette relies entirely on uniform, opaque colors. Gradients, translucent fills, and blurred masks are rejected in favor of high-contrast solid tokens.

### Palette Architecture
- **Primary (`#1d4ed8`)**: Royal Blue. Applied to active states, selected table records, primary calls to action, and key institutional metrics.
- **Secondary (`#0f172a`)**: Deep Navy Slate. Serves as the principal structural color for headers, dominant typographic elements, and high-priority chrome.
- **Tertiary (`#0369a1`)**: Academic Cyan. Reserved for secondary links, information badges, and auxiliary analytics.
- **Neutral Base (`#f8fafc`)**: Slate Tint Canvas. Forms the standard viewport background, producing crisp boundary contrast against white container surfaces.
- **Surface (`#ffffff`)**: Pure White. Dedicated to card interiors, data table rows, sheet drawers, and modal bodies.
- **Border Neutral (`#e2e8f0`)**: Standard division token for table cell boundaries, card perimeter strokes, and input outlines.
- **Border Strong (`#cbd5e1`)**: Elevated division token for active dividers, hover states on neutral controls, and header separators.

### Functional States
- **Success**: `#15803d` (Green 700) on `#f0fdf4` (Green 50) with `#bbf7d0` (Green 200) stroke.
- **Warning**: `#b45309` (Amber 700) on `#fffbeb` (Amber 50) with `#fde68a` (Amber 200) stroke.
- **Critical / Error**: `#b91c1c` (Red 700) on `#fef2f2` (Red 50) with `#fecaca` (Red 200) stroke.

## Typography

The type scale balances the geometric approachability of Plus Jakarta Sans for titles with the industrial tabular legibility of Inter for body text, data points, and interface labels.

### Rules of Application
- **Plus Jakarta Sans**: Applied strictly to page headers, modal titles, analytical scorecards, and major section banners to offer refined structure without excessive styling.
- **Inter**: Deployed across dense data grids, form structures, grade inputs, navigation items, and descriptive prose. Numerical figures in tabular views must employ tabular figures (`font-variant-numeric: tabular-nums`).
- **Uppercase Metadata**: Small labels (`label-sm`) use uppercase styling with positive letter spacing (`0.04em`) exclusively for table column headers, status markers, and operational metadata.

## Layout & Spacing

Layout execution relies on an explicit 12-column grid anchored by a rigid 8px baseline rhythm.

### Screen Adaptations
- **Desktop (1280px and wider)**: 12-column layout, 24px (`1.5rem`) gutters, 32px (`2rem`) screen edge margins. Sidebar remains fixed at 260px wide with a solid 1px vertical right border (`#e2e8f0`).
- **Tablet (768px – 1279px)**: 8-column layout, 16px (`1rem`) gutters, 24px (`1.5rem`) margins. Navigation condenses to a slim icon rail (72px wide) or collapsible off-canvas drawer.
- **Mobile (Below 768px)**: 4-column layout, 16px (`1rem`) gutters, 16px (`1rem`) margins. Data tables switch to stacked card structures or horizontal overflow scroll with fixed pinned columns.

### Density & Spacing Principles
- Metrics dashboards and data-dense tables utilize compact row height standards (36px–40px) to maximize on-screen analytical volume.
- Form regions and administrative panels expand to comfortable padding (`space-lg`) to reduce entry errors during long operational sessions.

## Elevation & Depth

This system operates without simulated physical light sources or dropshadow filters (`box-shadow: none !important`). Depth is achieved purely through layered solid planes, crisp 1px strokes, and deliberate foreground-to-background contrast.

### Elevation Tiers
- **Canvas Base (Tier 0)**: `#f8fafc`. The default backdrop over which all interface cards, navigation rails, and dashboards reside.
- **Contained Surface (Tier 1)**: `#ffffff` background with a mandatory continuous `1px solid #e2e8f0` outline. Used for cards, tables, dashboard widgets, and static panels.
- **Elevated Modals & Popovers (Tier 2)**: `#ffffff` surface, bounded by an intensified `1px solid #cbd5e1` outline. Background scrims must use a solid matte overlay of `#0f172a` at 40% opacity without backdrop filters.
- **Hover & Interaction Shift**: Interactive elements never raise via translation (`translateY`) or shadow spread. Instead, interactive surfaces signify state shifts via background fill tinting (`#f8fafc` to `#f1f5f9`) or border color changes (`#e2e8f0` to `#1d4ed8`).

## Shapes

Corner radii across the system use consistent geometric boundaries that maintain a clean, organized appearance across administrative tools.

### Radius Assignments
- **Inputs, Buttons, Badges, Dropdowns**: `rounded-md` (6px to 8px / 0.5rem) to preserve compact horizontal density.
- **Cards, Panels, Modal Windows, Data Grid Enclosures**: `rounded-lg` (12px to 16px / 1rem) or `rounded-xl` (16px / 1rem), consistently outlined by a sharp 1px border.
- **Internal Elements inside Nested Cards**: Inner elements must match or scale down their corner radius relative to the container (e.g., an internal filter cell within an outer `rounded-xl` container uses `rounded-md` or `rounded-lg`).

## Components

### Buttons
- **Primary**: Solid `#1d4ed8` fill, `#ffffff` text, no shadow, `rounded-md`, 1px border colored `#1d4ed8`. Hover: `#1e40af`. Active: `#1d4ed8`.
- **Secondary / Slate**: Solid `#0f172a` fill, `#ffffff` text, no shadow, `rounded-md`, 1px border colored `#0f172a`. Hover: `#1e293b`.
- **Outline / Neutral**: Solid `#ffffff` fill, `#0f172a` text, 1px border `#e2e8f0`, `rounded-md`. Hover: `#f8fafc` fill with border `#cbd5e1`.
- **Destructive**: Solid `#ffffff` fill, `#b91c1c` text, 1px border `#fca5a5`. Hover: `#fef2f2` fill.

### Input Fields
- **Container**: Solid `#ffffff` fill, 1px solid `#e2e8f0`, `rounded-md`, horizontal padding 12px, vertical padding 8px.
- **Typography**: Inter 14px regular (`#0f172a`), placeholder in `#94a3b8`.
- **States**:
  - Focus: 1px solid `#1d4ed8` with a 1px outline offset of `#1d4ed8` (no blurred focus rings).
  - Error: 1px solid `#b91c1c`.

### Cards & Analytical Widgets
- **Structure**: Surface `#ffffff`, perimeter `1px solid #e2e8f0`, corner radius `rounded-xl` (16px), zero drop shadow.
- **Header**: Separated by a bottom border `1px solid #e2e8f0`, padding 16px 20px. Includes section title in Plus Jakarta Sans 16px Semibold (`#0f172a`).
- **Body**: Padding 20px.

### Chips & Badges
- **General Rules**: 1px solid border, `rounded-md` (6px), no drop shadow, padding 2px 8px, font size 12px Inter medium.
- **Primary / Active Status**: Fill `#eff6ff`, border `#bfdbfe`, text `#1d4ed8`.
- **Neutral / Draft Status**: Fill `#f1f5f9`, border `#cbd5e1`, text `#475569`.
- **Alert / Overdue Status**: Fill `#fef2f2`, border `#fecaca`, text `#b91c1c`.

### Checkboxes & Radio Controls
- **Geometry**: Checkboxes use `rounded-sm` (3px); radios use 50% border radius. 
- **Base State**: 1px solid `#cbd5e1`, background `#ffffff`.
- **Selected State**: 1px solid `#1d4ed8`, background `#1d4ed8`, check/bullet glyph rendered in pure `#ffffff`.

### Academic Data Tables
- **Container**: Framed in a single continuous `1px solid #e2e8f0` outer border with `rounded-xl` overflow-hidden corners.
- **Header Row**: Background `#f8fafc`, 1px solid bottom border `#e2e8f0`, text in Inter 12px Semibold uppercase with letter-spacing `0.04em`, color `#64748b`.
- **Data Rows**: Background `#ffffff`, alternating optional zebra tint `#fcfcfd`, bottom border `1px solid #f1f5f9`.
- **Hover State**: Entire row transitions to `#f8fafc` on mouseover. Selected rows use `#eff6ff` with a 2px left border accent in `#1d4ed8`.