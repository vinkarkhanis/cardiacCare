# Z-Index Hierarchy Documentation

## Overview

This document outlines the z-index hierarchy used throughout the Cardiac Health Agent application to ensure proper layering of UI elements and prevent visual conflicts.

## Z-Index Scale

The application uses a structured z-index system defined in `src/app/globals.css`:

```css
:root {
  /* Z-index hierarchy for consistent layering */
  --z-base: 0;
  --z-content: 10;
  --z-sidebar: 40;
  --z-dropdown: 50;
  --z-overlay: 60;
  --z-modal: 100;
  --z-toast: 200;
}
```

## Implementation

### Current Z-Index Usage

| Element | Z-Index | Tailwind Class | Purpose |
|---------|---------|----------------|---------|
| **Base Content** | 0-10 | `z-0` to `z-10` | Normal page content, cards, etc. |
| **Sidebar Overlay** | 30 | `z-30` | Mobile sidebar backdrop |
| **Sidebar** | 40 | `z-40` | Navigation sidebar (mobile) |
| **Dropdowns** | 50 | `z-50` | User profile dropdown, context menus |
| **Overlays** | 60 | `z-60` | General purpose overlays |
| **Modals** | 100 | `z-[100]` | Logout confirmation, settings modals |
| **Toasts** | 200 | `z-[200]` | Notifications, alerts (future use) |

### Specific Components

#### Navigation & Layout
- **Sidebar (Mobile)**: `z-40` - Appears above content but below modals
- **Sidebar Overlay**: `z-30` - Background overlay for mobile sidebar
- **Header**: Default stacking context

#### Interactive Elements
- **User Profile Dropdown**: `z-50` - Above sidebar but below modals
- **Context Menus**: `z-50` - Same level as dropdowns
- **Tooltips**: `z-50` - Same level as dropdowns

#### Modal System
- **Logout Modal**: `z-[100]` - Top-level modal
- **Signup Modal**: `z-[100]` - Top-level modal
- **Future Modals**: `z-[100]` - All modals should use this level

#### Special Cases
- **HeartbeatLoader**: `z-10` - Internal component layering
- **Chat Messages**: Default stacking - Let natural document flow handle layering

## Best Practices

### 1. Modal Implementation
All modals should use `z-[100]` to ensure they appear above all other content:

```tsx
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center">
  {/* Modal content */}
</div>
```

### 2. Dropdown Menus
Dropdown menus should use `z-50` for consistent layering:

```tsx
<div className="absolute top-full left-0 bg-white shadow-lg border z-50">
  {/* Dropdown content */}
</div>
```

### 3. Sidebar Components
- Mobile sidebar: `z-40`
- Sidebar overlay: `z-30`

```tsx
{/* Mobile sidebar */}
<div className="fixed inset-y-0 left-0 w-64 bg-white z-40 lg:z-auto">
  {/* Sidebar content */}
</div>

{/* Sidebar overlay */}
<div className="fixed inset-0 bg-black/20 z-30 lg:hidden" />
```

## Problem Resolution

### Issue: Logout Modal Behind Other Elements
**Problem**: The logout confirmation modal was appearing behind chat cards and other UI elements.

**Root Cause**: Multiple elements using the same z-index value (`z-50`) created layering conflicts.

**Solution**: 
1. Established clear z-index hierarchy
2. Moved modal to `z-[100]` (dedicated modal layer)
3. Adjusted dropdown to `z-50` (dropdown layer)
4. Set sidebar to `z-40` (navigation layer)

### Before vs After

**Before (Problematic)**:
- Logout Modal: `z-50`
- User Dropdown: `z-50`
- Sidebar: `z-50`
- **Result**: Layering conflicts

**After (Fixed)**:
- Logout Modal: `z-[100]`
- User Dropdown: `z-50`  
- Sidebar: `z-40`
- **Result**: Clear hierarchy

## Future Considerations

### 1. Toast Notifications
When implementing toast notifications, use `z-[200]`:

```tsx
<div className="fixed top-4 right-4 z-[200]">
  {/* Toast content */}
</div>
```

### 2. Loading Overlays
For full-screen loading states, use `z-60`:

```tsx
<div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-60">
  {/* Loading content */}
</div>
```

### 3. Context Menus
Right-click context menus should use `z-50` like other dropdowns.

### 4. Popover Components
Complex popovers with multiple layers may need `z-60` for the overlay and `z-70` for the content.

## Testing Checklist

When adding new layered elements, verify:

- [ ] Element appears above intended background elements
- [ ] Element appears below intended foreground elements  
- [ ] No visual conflicts with existing UI components
- [ ] Proper behavior on mobile and desktop
- [ ] Accessibility (focus trapping, keyboard navigation)

## Common Z-Index Values Reference

```css
/* Use these Tailwind classes for consistency */
.z-0     /* Base content */
.z-10    /* Enhanced content */
.z-30    /* Overlays */
.z-40    /* Sidebar */
.z-50    /* Dropdowns */
.z-[100] /* Modals */
.z-[200] /* Toasts */
```

This hierarchy ensures a smooth, conflict-free user experience across all interactions in the Cardiac Health Agent application.