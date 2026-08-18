# Solis — Mobile UX Reference Index

## Overview
This document defines how Solis operates on mobile devices (`375px` to `768px`). Mobile is treated as a first-class, intentional experience rather than a collapsed desktop window.

---

## 1. Core Mobile Principles

### A. Bottom Navigation Thumb Zone
* Replaced desktop sidebar with a fixed bottom navigation bar with 5 intentional touch targets:
  1. `Daily Flow` (`/app/dashboard`)
  2. `Tasks` (`/app/tasks`)
  3. `Study` (`/app/study`)
  4. `Focus` (`/app/focus`)
  5. `Notes` (`/app/notes`)
* Target height: minimum `48px` with clear active indicators.

### B. Vertical Storytelling & Reduced Parallax
* On mobile screens, heavy multi-layer parallax is automatically throttled to prevent touch jitter.
* Daily Flow flows as a vertical narrative stream with generous spacing between Arrival, Momentum, and Today's Actions.

### C. Full-Screen Mobile Focus Sanctuary
* Entering Focus on mobile completely hides the bottom navigation bar and header chrome, maximizing timer visibility and intention clarity.

### D. Knowledge Studio Mobile Drawer
* Left Knowledge Index switches to a clean sliding drawer on mobile (`<1024px`), allowing the writing canvas to occupy 100% of the viewport width.
