# Offbeat Travel India Design System

## Color Palette

### Primary Colors
- **Navy Background**: `#0B1220` - Primary dark background for all pages
- **Secondary Navy**: `#111827` - Slightly lighter navy for gradients
- **Muted Gold Accent**: `#C9A96E` - Primary accent for buttons, links, highlights
- **Light Gold**: `#D4B896` - Hover state for buttons
- **Lighter Gold**: `#E0C5A0` - Active state for buttons
- **Emerald Teal**: `#1F8A8A` - Secondary accent for gradients and icons

### Text Colors
- **Primary Text**: `#E5E7EB` - Soft white for all headings and primary text
- **Secondary Text**: `#E5E7EB/60` (opacity 60%) - For subtitles and secondary information
- **Tertiary Text**: `#E5E7EB/40` (opacity 40%) - For placeholders and hints

### Component Backgrounds
- **Card Background**: `bg-white/5 backdrop-blur-md` - Glassmorphic cards
- **Card Border**: `border-white/10` - Subtle white borders
- **Input Background**: `bg-white/5 backdrop-blur-md` - Form inputs

## Typography

- **Font Family**: Inter / System Sans-serif
- **Primary Weight**: `font-light` (300) - All body text and primary content
- **Emphasis Weight**: `font-semibold` (600) - Button text and important labels
- **Headings**: 
  - Large: `text-5xl md:text-6xl lg:text-7xl font-light` - Hero titles
  - Section: `text-4xl font-light` - Section headings
  - Card: `text-lg font-light` - Card titles

## Component Patterns

### Buttons
```jsx
className="bg-gradient-to-r from-[#C9A96E] to-[#D4B896] hover:from-[#D4B896] hover:to-[#E0C5A0] text-[#0B1220] font-semibold py-3 px-6 rounded-2xl hover:-translate-y-0.5 transition-all duration-300"
```

### Cards
```jsx
className="rounded-2xl bg-white/5 backdrop-blur-md border-white/10 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
```

### Inputs
```jsx
className="rounded-2xl border-white/10 bg-white/5 backdrop-blur-md text-[#E5E7EB] placeholder-[#E5E7EB]/40 focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20"
```

### Section Containers
```jsx
className="mx-auto max-w-7xl px-6 py-24"
```

### Image Overlays (Cards)
```jsx
className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent"
```

### Hover Scales
- Card Images: `group-hover:scale-105`
- Lists: `group-hover:scale-110`
- Buttons: `hover:-translate-y-0.5`

## Component Styling Updates

### Header
- Background: Navy with backdrop-blur: `bg-[#0B1220]/80 backdrop-blur-xl`
- Logo: Gradient icon `from-[#C9A96E] to-[#1F8A8A]` w-9 h-9, rounded-lg
- Buttons: Login = border-[#C9A96E]/40 + bg-white/5, Sign up = gradient
- Dropdown: `bg-white/5 backdrop-blur` with `border-[#C9A96E]/20`

### PlaceCard
- Height: `h-80` flex column centered
- Image: `group-hover:scale-105` with overlay gradient
- Details: Light typography, muted gold pricing
- Border: rounded-2xl, bg-white/5, border-white/10

### IndexPage Sections
- Hero: Full-screen with gradient glow from-[#C9A96E]/10, centered premium search bar
- Destination Cards: h-64 with image overlays, overlay grades
- Featured Listings: Premium heading hierarchy with soft subtitle
- Spacing: py-24 between sections, max-w-7xl containers

### Footer
- Background: `bg-[#0B1220] border-t border-white/10`
- Links: `text-[#E5E7EB]/70 hover:text-[#C9A96E]`
- Icons: `text-[#E5E7EB] hover:text-[#C9A96E]`
- Spacing: `py-12` with proper grid layout

### Forms (Login/Register)
- Background: Gradient from navy to teal with pattern overlay
- Card: Glassmorphic with backdrop-blur-xl
- Inputs: `.luxury-input` class with focus on muted gold
- Links: `text-[#C9A96E] hover:text-[#D4B896]`

### Error Handling
- Border: `border-red-500/50` on inputs
- Text: `text-red-500/70` for error messages
- Ring: `focus:ring-red-500/20` on error inputs

## Design Principles

1. **Luxury Aesthetic**: Muted gold paired with dark navy creates premium, sophisticated feel
2. **Glassmorphism**: All cards and containers use white/5 backdrop-blur for depth
3. **Light Typography**: Font-light throughout maintains elegant, modern appearance
4. **Generous Spacing**: py-24 between sections, proper whitespace hierarchy
5. **Smooth Interactions**: All transitions are 300ms, subtle scaling on hover
6. **Consistent Palette**: Only use the defined color palette - NO white, gray, or red backgrounds

## Do NOT Use
- `bg-white` - Use `bg-white/5 backdrop-blur-md` instead
- `bg-gray-*` or `bg-slate-*` - Use navy or white/5 instead
- `amber-*` or `yellow-*` - Use `#C9A96E` muted gold instead
- `text-black` or `text-gray-*` - Use `#E5E7EB` soft white instead
- `border-gray-*` - Use `border-white/10` instead
- Bold fonts (`font-bold`) - Use `font-light` or `font-semibold` only

## Commit History
- ✅ Missing photo upload endpoints created with Cloudinary integration
- ✅ All white/red colors removed globally
- ✅ Luxury dark navy/gold color system implemented site-wide
- ✅ Duplicate email validation with inline error display
- ✅ Premium hero and card sections redesigned
- ✅ Header minimized and re-styled with gradient logo
- ✅ Complete IndexPage redesigned with premium spacing
- ✅ SearchBar updated with luxury gradient button
- ✅ Footer completely redesigned with dark theme
- ✅ RegisterPage, LoginPage, AdminDashboard updated to new palette
- ✅ All remaining pages (ProfilePage, PlacePage, SingleBookedPlace, NotFoundPage) updated
- ✅ Unified luxury design system across entire application
