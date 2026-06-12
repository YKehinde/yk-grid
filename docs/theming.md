---
title: Theming
render_with_liquid: false
---

# Theming

The grid exposes a set of CSS custom properties on its root element. Override them on a parent selector or globally to match your design system.

---

## CSS custom properties

| Property | Default | Description |
|----------|---------|-------------|
| `--grid-border-colour` | `#e2e8f0` | Table and cell borders |
| `--grid-radius` | `0.5rem` | Border radius on wrapper, inputs, and buttons |
| `--grid-font-size` | `0.875rem` | Base font size for the entire grid |
| `--grid-cell-padding` | `0.625rem 0.875rem` | Padding inside data cells |
| `--grid-toolbar-gap` | `0.5rem` | Gap between toolbar items |
| `--grid-header-bg` | `#f1f5f9` | Header row and toolbar background |
| `--grid-row-hover-bg` | `#f8fafc` | Row background on hover |
| `--grid-selected-bg` | `#eef2ff` | Selected row background |
| `--grid-focus-ring` | `0 0 0 2px #6366f1` | `box-shadow` on focused interactive elements |
| `--grid-accent` | `#6366f1` | Accent colour (checkbox fill, active sort indicator) |

---

## Scoped to a single grid

Pass a `className` to `DataGrid` and set the variables on that class:

```css
.orders-grid {
  --grid-accent:         #0ea5e9;
  --grid-focus-ring:     0 0 0 2px #0ea5e9;
  --grid-selected-bg:    #f0f9ff;
  --grid-border-colour:  #cbd5e1;
  --grid-radius:         0.75rem;
}
```

```tsx
<DataGrid className="orders-grid" ... />
```

---

## Global override

Set the properties on `body` or a layout wrapper to apply to every grid on the page:

```css
body {
  --grid-font-size:    0.8125rem;
  --grid-cell-padding: 0.5rem 0.75rem;
  --grid-accent:       #7c3aed;
  --grid-focus-ring:   0 0 0 2px #7c3aed;
}
```

---

## Dark mode

```css
@media (prefers-color-scheme: dark) {
  .my-app {
    --grid-border-colour: #334155;
    --grid-header-bg:     #1e293b;
    --grid-row-hover-bg:  #1e293b;
    --grid-selected-bg:   #1e3a5f;
    --grid-accent:        #818cf8;
    --grid-focus-ring:    0 0 0 2px #818cf8;
  }
}
```

---

## Compact mode

Tighten rows and text for dense data tables:

```css
.compact-grid {
  --grid-font-size:    0.75rem;
  --grid-cell-padding: 0.25rem 0.5rem;
}
```

---

## Brand presets

### Sky blue

```css
.sky-grid {
  --grid-accent:      #0ea5e9;
  --grid-focus-ring:  0 0 0 2px #0ea5e9;
  --grid-selected-bg: #f0f9ff;
}
```

### Emerald

```css
.emerald-grid {
  --grid-accent:      #10b981;
  --grid-focus-ring:  0 0 0 2px #10b981;
  --grid-selected-bg: #ecfdf5;
}
```

### Rose

```css
.rose-grid {
  --grid-accent:      #f43f5e;
  --grid-focus-ring:  0 0 0 2px #f43f5e;
  --grid-selected-bg: #fff1f2;
}
```

---

## CSS modules / Tailwind

If you use CSS modules, define the overrides in your module file and apply the class to the grid:

```css
/* MyPage.module.css */
.grid {
  --grid-accent: theme('colors.blue.500');
  --grid-radius: theme('borderRadius.lg');
}
```

```tsx
import styles from './MyPage.module.css'
<DataGrid className={styles.grid} ... />
```

---

## What can't be customised via CSS variables

Row height is controlled by `--grid-cell-padding` and the font size. For a fixed row height, override the cell padding directly via the custom property rather than targeting internal class names (internal names may change across releases).

Column header text, sort icons, and filter icons inherit `--grid-font-size` and `--grid-accent`. There are no separate variables for them — use the `className` prop with a descendant selector only if absolutely necessary, and treat internal class names as unstable.
