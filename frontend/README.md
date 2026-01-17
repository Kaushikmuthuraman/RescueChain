# Frontend Structure

React + Vite application with government-style UI for RescueChain platform.

## Directory Structure

### `/src/components`
Reusable UI components organized by feature area:
- `auth/` - Authentication components (login forms, OTP inputs)
- `victims/` - Victim-specific UI components
- `ngo/` - NGO dashboard and management components
- `ddma/` - DDMA (District Disaster Management Authority) components
- `sdma/` - SDMA (State Disaster Management Authority) components
- `payments/` - UPI QR display and payment status components
- `rescue/` - Rescue operation tracking and management components
- `common/` - Shared components (headers, footers, buttons, cards)

### `/src/pages`
Page-level components representing main application routes:
- `victim/` - Victim portal pages
- `ngo/` - NGO portal pages
- `ddma/` - DDMA portal pages
- `sdma/` - SDMA portal pages
- `auth/` - Authentication pages (login, OTP verification)

### `/src/services`
API integration and business logic services:
- `api/` - REST API client configuration and request handlers
- `auth/` - Authentication service (handles OTP for victims, credentials for orgs)

### `/src/utils`
Utility functions and helpers:
- `validation/` - Form validation utilities

### `/src/hooks`
Custom React hooks for reusable stateful logic

### `/src/context`
React Context providers for global state management (auth state, user data, etc.)

### `/src/assets`
Static assets:
- `images/` - Image files (logos, icons, uploaded photos for accountability)
- `styles/` - Global CSS, themes, and styling configurations

### `/public`
Static public assets served directly (favicon, manifest, etc.)
