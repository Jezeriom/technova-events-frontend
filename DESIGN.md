---
name: Precision Utility
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
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#002113'
  on-tertiary-container: '#009668'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-padding-desktop: 32px
  container-padding-mobile: 16px
  gutter: 24px
  sidebar-width: 260px
  topbar-height: 64px
---

## Brand & Style

The design system is anchored in the concept of **Operational Clarity**. It targets event coordinators and administrative professionals who manage high-stakes logistics under pressure. The aesthetic is a refined evolution of the "card-and-board" productivity model, blending the approachable nature of consumer task tools with the rigors of an enterprise-grade administrative portal.

The style is **Corporate Modern with a Minimalist focus**. It emphasizes functional density without clutter, utilizing generous whitespace to prevent cognitive overload. The UI should evoke a sense of calm, organized control, ensuring that "TechNova Events" feels both technologically advanced and reliably professional.

## Colors

The palette is designed to reduce eye strain during long-form administrative work. The foundation is built on **Slate and Ice Blues** (Neutrals), creating a cool, calm environment.

- **Primary:** A deep Slate (#0F172A) used for high-contrast typography and critical navigation elements to establish authority.
- **Secondary:** A vibrant Tech Blue (#3B82F6) for primary actions and interactive states.
- **Surface:** The main workspace (canvas) uses a muted Off-White/Blue tint (#F8FAFC), while individual cards use pure white (#FFFFFF) to pop against the background.
- **Accents:** Success states use Emerald (#10B981) and specialized tech-focused highlights use Indigo (#6366F1).

## Typography

This design system utilizes **Geist** for its technical precision and monospaced-influenced tracking, which aids in reading data-heavy event tables and schedules. 

Typography is utilized as a structural element. **Labels** are treated with higher weights and slight tracking increases to differentiate them from **Body** text. Distinct hierarchy is maintained by contrasting the deep Slate primary color for headers against a softer Charcoal for body copy. Headlines use a tighter letter-spacing to maintain a "tight," professional look.

## Layout & Spacing

The layout follows a **Fixed-Sidebar, Fluid-Canvas** model. 
- **Sidebar:** A narrow, high-contrast column on the left for primary navigation.
- **Top Bar:** A slim, white utility bar for search, notifications, and profile.
- **The Canvas:** A soft-colored background area where "Cards" are organized. 

The spacing rhythm is based on an **8px grid**. Gutters between cards are fixed at 24px to maintain a sense of "breathable" organization. For complex event dashboards, a 12-column grid is used within the canvas, allowing elements to span 3 (quarter), 4 (third), or 6 (half) columns.

## Elevation & Depth

This design system uses **Tonal Layering** combined with **Ambient Shadows** to create a tactile, physical feel for digital objects.

1.  **Level 0 (Canvas):** The base background, slightly tinted, no shadow.
2.  **Level 1 (Cards/Sidebar):** Pure white surfaces with a very soft, diffused shadow (Offset: 0, 2px; Blur: 4px; Opacity: 0.05, Color: Slate). This makes cards feel like they are resting just above the surface.
3.  **Level 2 (Dropdowns/Modals):** Increased elevation with a sharper shadow to indicate temporary focus and interaction.
4.  **Interactive State:** On hover, cards should subtly lift (shadow deepens and expands) to provide tactile feedback without moving the actual element position.

## Shapes

The shape language is consistently **Rounded**, leaning into a modern and approachable persona. 

- **Standard Elements (Buttons, Inputs):** 0.5rem (8px).
- **Containers (Cards, Modals):** 1rem (16px) to emphasize the "card-centric" nature of the management portal.
- **Search Bars:** Often fully pill-shaped (rounded-full) to distinguish navigation/utility actions from content actions.

## Components

### Buttons
- **Primary:** Solid Secondary Blue with white text. High-contrast.
- **Secondary:** Transparent background with a 1px Slate-200 border.
- **Ghost:** No border, appears on hover. Used for sidebar items.

### Cards
Cards are the primary unit of information. They must include a consistent 24px internal padding. Headers within cards should use `title-lg`.

### Status Chips
Small, high-contrast pills used to indicate event status (e.g., "Confirmed," "In Progress," "Draft"). They use a 10% opacity version of the status color for the background and 100% opacity for the text.

### Input Fields
Inputs use a subtle light-gray background (#F1F5F9) that transitions to white on focus with a 2px blue border. Labels always sit above the input in `label-md` style.

### Sidebar Items
Items use a "Selected State" indicator—a 4px vertical bar on the extreme left of the active item—to provide clear navigation context without cluttering the list.

### Progress Bars
Used extensively for event registration tracking. Use a thin 8px height with a rounded track. The fill uses the primary blue or success emerald.