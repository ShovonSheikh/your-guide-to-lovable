# TipKoro Design System

A comprehensive guide to the visual language and design tokens used throughout the TipKoro application.

---

## Typography

### Font Families

| Token | Font | Usage |
|-------|------|-------|
| `font-sans` | DM Sans | Body text, paragraphs, labels, buttons |
| `font-display` | Bricolage Grotesque | Headings (h1-h6), hero text, display text |

### Usage Examples

```html
<!-- Headings automatically use font-display via CSS -->
<h1>This uses Bricolage Grotesque</h1>

<!-- Body text uses font-sans by default -->
<p>This uses DM Sans</p>

<!-- Explicit usage -->
<span className="font-display">Display text</span>
<span className="font-sans">Body text</span>
```

---

## Color System

All colors use HSL format and are defined as CSS variables for easy theming.

### Core Colors

| Token | CSS Variable | Usage |
|-------|--------------|-------|
| `background` | `--background` | Page backgrounds |
| `foreground` | `--foreground` | Primary text color |
| `primary` | `--primary` | Primary actions, links |
| `primary-foreground` | `--primary-foreground` | Text on primary surfaces |
| `secondary` | `--secondary` | Secondary surfaces, inputs |
| `secondary-foreground` | `--secondary-foreground` | Text on secondary surfaces |
| `muted` | `--muted` | Muted backgrounds |
| `muted-foreground` | `--muted-foreground` | Subdued text, placeholders |
| `accent` | `--accent` | Accent highlights |
| `accent-foreground` | `--accent-foreground` | Text on accent surfaces |

### Brand Colors (TipKoro)

| Token | CSS Variable | Usage |
|-------|--------------|-------|
| `tipkoro-cream` | `--tipkoro-cream` | Warm background tones |
| `tipkoro-gold` | `--tipkoro-gold` | Primary brand color, CTAs |
| `tipkoro-gold-hover` | `--tipkoro-gold-hover` | Hover state for gold elements |
| `tipkoro-dark` | `--tipkoro-dark` | Dark text, contrast elements |
| `tipkoro-warm-gray` | `--tipkoro-warm-gray` | Subtle borders, dividers |

### Semantic Colors

| Token | CSS Variable | Usage |
|-------|--------------|-------|
| `success` | `--success` | Success states, confirmations |
| `success-foreground` | `--success-foreground` | Text on success surfaces |
| `destructive` | `--destructive` | Errors, destructive actions |
| `destructive-foreground` | `--destructive-foreground` | Text on destructive surfaces |

### Usage Examples

```tsx
// ✅ CORRECT - Use semantic tokens
<div className="bg-background text-foreground" />
<button className="bg-primary text-primary-foreground" />
<span className="text-muted-foreground" />

// ❌ WRONG - Never use direct colors
<div className="bg-white text-black" />
<button className="bg-amber-500" />
```

---

## Gradients

| Class | CSS Variable | Usage |
|-------|--------------|-------|
| `.gradient-gold` | `--gradient-gold` | Hero sections, CTAs, premium elements |
| `.gradient-warm` | `--gradient-warm` | Subtle background warmth |

### Gradient Definitions

```css
--gradient-gold: linear-gradient(135deg, hsl(35 80% 55%) 0%, hsl(30 85% 50%) 100%);
--gradient-warm: linear-gradient(180deg, hsl(35 50% 96%) 0%, hsl(35 40% 92%) 100%);
```

---

## Shadows

| Token | CSS Variable | Usage |
|-------|--------------|-------|
| `shadow-tipkoro` | `--tipkoro-card-shadow` | Default card elevation |
| `shadow-tipkoro-hover` | `--tipkoro-card-shadow-hover` | Elevated hover state |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | `calc(var(--radius) - 4px)` | Small elements, tags |
| `rounded-md` | `calc(var(--radius) - 2px)` | Buttons, inputs |
| `rounded-lg` | `var(--radius)` | Cards, modals |
| `rounded-2xl` | `1rem` | Large cards |
| `rounded-3xl` | `1.5rem` | Hero sections |

Base radius: `--radius: 0.75rem`

---

## Components

### Cards

```tsx
// Standard card
<div className="tipkoro-card">
  Content here
</div>

// Using Card component
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

### Buttons

| Variant | Usage |
|---------|-------|
| `default` | Standard actions |
| `hero` | Large hero CTAs with gradient background |
| `hero-accent` | Primary action buttons (gold/amber) |
| `outline` | Secondary actions |
| `ghost` | Tertiary/subtle actions |
| `destructive` | Delete, cancel actions |

```tsx
<Button variant="hero-accent">Pay & Continue</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Learn More</Button>
```

### Form Inputs

```tsx
// Use tipkoro-input class for styled inputs
<input className="tipkoro-input" placeholder="Enter text" />

// With label
<label className="tipkoro-label">Email</label>
<input className="tipkoro-input" type="email" />
```

---

## Animations

### Available Animations

| Class | Duration | Usage |
|-------|----------|-------|
| `animate-fade-in` | 0.5s | Page/section reveals |
| `animate-scale-in` | 0.3s | Modal/popup appearances |
| `animate-slide-in-right` | 0.3s | Sidebar/drawer entrances |
| `animate-shimmer` | 2s (infinite) | Loading states |
| `animate-bounce` | 1s (infinite) | Attention indicators |

### CSS Animations

| Animation | Usage |
|-----------|-------|
| `confetti-fall` | Celebration effects |
| `float` | Subtle floating motion |
| `pulse-glow` | Glowing attention effect |
| `slide-up` | Content reveal from below |

### Staggered Children

```tsx
// Apply staggered entrance animation to children
<div className="stagger-children">
  <div>First (0.1s delay)</div>
  <div>Second (0.2s delay)</div>
  <div>Third (0.3s delay)</div>
</div>
```

---

## Spacing & Layout

### Container

Max widths are responsive:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1200px

Default padding: `1rem`

```tsx
<div className="container">
  Centered content with max-width
</div>
```

---

## Dark Mode

The design system supports dark mode via the `.dark` class. All color tokens automatically switch values.

```tsx
// Colors automatically adapt
<div className="bg-background text-foreground">
  Works in both light and dark mode
</div>
```

---

## Best Practices

### DO ✅

1. **Use semantic color tokens** - `bg-primary`, `text-muted-foreground`
2. **Use the design system fonts** - `font-display` for headings, `font-sans` for body
3. **Leverage component variants** - Use button variants instead of custom styles
4. **Apply animations from the system** - `animate-fade-in`, `animate-scale-in`
5. **Use the card classes** - `.tipkoro-card` for consistent card styling

### DON'T ❌

1. **Avoid direct colors** - Never use `bg-white`, `text-black`, `bg-amber-500`
2. **Don't hardcode shadows** - Use `shadow-tipkoro` tokens
3. **Avoid custom font declarations** - Stick to `font-sans` and `font-display`
4. **Don't create one-off animations** - Extend the design system if needed
5. **Avoid mixing themes** - Ensure consistent use of light/dark tokens

---

## File References

- **CSS Variables**: `src/index.css`
- **Tailwind Config**: `tailwind.config.ts`
- **Button Variants**: `src/components/ui/button.tsx`
- **Card Component**: `src/components/ui/card.tsx`
