# 🔧 AURA CareLink — 100% Responsive Improvement Plan

> A complete, file-by-file audit of every responsiveness gap in the frontend, paired with concrete implementation ideas to make the project fully adaptive across **mobile (320px–480px)**, **tablet (481px–1024px)**, and **desktop (1025px+)** viewports.

---

## Table of Contents

1. [Global / Root-Level Fixes](#1-global--root-level-fixes)
2. [Login Page](#2-login-page)
3. [AppShell, Sidebar & Header](#3-appshell-sidebar--header)
4. [Dashboard View](#4-dashboard-view)
5. [Hero Section](#5-hero-section)
6. [Recovery Twin View](#6-recovery-twin-view)
7. [Sentinel View](#7-sentinel-view)
8. [Appointments View](#8-appointments-view)
9. [Wearables View](#9-wearables-view)
10. [Care Coordinator / Chat View](#10-care-coordinator--chat-view)
11. [Caregiver Portal View](#11-caregiver-portal-view)
12. [Doctor Portal & Sub-Views](#12-doctor-portal--sub-views)
13. [Admin Portal View](#13-admin-portal-view)
14. [Users View](#14-users-view)
15. [Government Portal View](#15-government-portal-view)
16. [Settings View](#16-settings-view)
17. [UI Primitives (ui.jsx)](#17-ui-primitives-uijsx)
18. [Charts (charts.jsx)](#18-charts-chartsjsx)
19. [Modals (Global Pattern)](#19-modals-global-pattern)
20. [Typography & Touch Target Audit](#20-typography--touch-target-audit)
21. [Testing Checklist](#21-testing-checklist)

---

## 1. Global / Root-Level Fixes

**Files:** `app/globals.css`, `app/layout.js`

### Current Issues
- No `<meta name="viewport">` tag is explicitly set (Next.js adds one by default, but it should be verified).
- No CSS utility for safe-area insets (needed for devices with notches / home indicators).
- No global `overflow-x: hidden` on `<body>` to prevent horizontal scroll caused by absolute-positioned decorative elements (e.g., Hero light blooms).

### Implementation Ideas

```css
/* globals.css — add at the top */

/* Prevent accidental horizontal overflow on mobile */
html, body {
  overflow-x: hidden;
}

/* iOS safe-area padding utility (useful for bottom-fixed elements) */
.safe-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

/* Touch-friendly minimum tap target */
.touch-target {
  min-height: 44px;
  min-width: 44px;
}
```

- **Viewport meta** — Verify `layout.js` renders `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />` (Next.js does this automatically, but confirm `viewport-fit=cover` is present for notched devices).
- **Font scaling** — The root font size is browser-default (16px). Consider adding a CSS clamp for the base size to scale slightly with viewport: `font-size: clamp(15px, 1vw + 12px, 16px)`.

---

## 2. Login Page

**File:** `app/(auth)/login/page.js`, `components/LoginForm.jsx`

### Current Issues
- The login page uses `lg:grid-cols-2` — on tablet (768–1023px) both panels stack, which is fine, **but the left brand panel has no max-height** and can push the form below the fold.
- The heading `text-6xl` (on sm+) may be too large on smaller tablets.
- The role selector grid (`grid-cols-2`) cramps on 320px screens — the "Government Authority" button with `col-span-2` is okay, but the 2-col buttons can be tight.

### Implementation Ideas

| Area | Fix |
|------|-----|
| Brand panel height | Add `lg:max-h-dvh lg:overflow-hidden` and `max-h-[45dvh] lg:max-h-none` on mobile so the brand panel doesn't eat the whole screen when stacked. |
| Heading size | Use `text-3xl sm:text-5xl lg:text-6xl` instead of `sm:text-6xl` for smoother scaling. |
| Role buttons | Switch to `grid-cols-1 xs:grid-cols-2` (define `xs` at 400px in Tailwind config) or use `flex flex-wrap gap-3` so buttons auto-wrap. |
| Form padding | Current `px-6 py-12 sm:px-10` is good. Add `max-w-full` on the form container so it never overflows narrow screens. |
| Concentric ring decorations | These use fixed pixel sizes (`size-[560px]`). On mobile, they bleed outside the container. Add `overflow-hidden` (already present on the parent div). Verify it clips correctly. |

---

## 3. AppShell, Sidebar & Header

**Files:** `components/AppShell.jsx`, `components/Sidebar.jsx`, `components/Header.jsx`

### Current Issues

#### AppShell
- ✅ Already has a mobile drawer pattern with `lg:hidden` / `lg:block` — this is well done.
- ⚠️ The content area uses `p-4 sm:p-6 lg:p-8` — good progressive padding. No issues.

#### Sidebar
- The sidebar width is hardcoded at `w-[286px]` on desktop and `w-[280px]` on mobile drawer. Works fine.
- ⚠️ Nav items use `text-xs` — may be too small for comfortable reading on mobile. Consider `text-sm` for touch.
- ⚠️ No bottom safe-area padding inside the mobile drawer for notched phones.

#### Header
- ⚠️ **Sign out button is `hidden` on mobile** (`hidden sm:inline-flex`) — there is no way to sign out on mobile unless the user goes to Settings. Consider adding sign-out inside the mobile sidebar or as a user menu.
- ⚠️ User name/role is `hidden sm:block` — fine, but the avatar alone doesn't convey the role on mobile.
- ✅ The hamburger menu button is correctly shown only on `lg:hidden`.
- ⚠️ The header title `text-2xl sm:text-3xl` could be `text-xl sm:text-2xl lg:text-3xl` for very small screens.

### Implementation Ideas

```jsx
// Sidebar.jsx — add safe-area padding at the bottom
<div className="flex h-full flex-col gap-6 bg-surface px-5 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">

// Header.jsx — make sign-out accessible on mobile
// Option A: Add a "Sign Out" link inside the Sidebar nav
// Option B: Make the avatar clickable → dropdown with sign-out
```

- **Mobile drawer animation**: Currently the drawer appears/disappears instantly. Add a slide-in transition using `translate-x` and `transition-transform duration-300` for polish.
- **Overlay tap area**: The backdrop `<button>` for closing is good. Add `cursor-default` so it doesn't show a pointer cursor.

---

## 4. Dashboard View

**File:** `components/views/DashboardView.jsx`

### Current Issues
- **Recovery Twin card stats grid**: Uses `grid-cols-2 sm:grid-cols-4` — on 320px, 2-column grid items can be very narrow. Values like `+3 pts` fit, but longer labels may truncate.
- **Trend + Sentinel row**: `lg:grid-cols-2` — stacks on mobile, fine. But the `Sparkline` inside has a fixed `h-28` which is ok.
- **Medicines + side column**: `lg:grid-cols-[1.4fr_1fr]` — stacks on mobile. ✅ Good.
- **Vitals grid**: `sm:grid-cols-3 lg:grid-cols-6` — on mobile, single column. On small tablets (sm), 3 columns can be tight with 6 vitals. Consider `sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6`.
- **Recovery Twin stats border**: `lg:border-l lg:pl-8` — the border only shows on desktop. On mobile, no visual separator between the ring and the stats grid. Add a `border-t border-line pt-5 lg:border-t-0 lg:pt-0` on mobile.

### Implementation Ideas

```jsx
// Vitals grid — more gradual breakpoints
<div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">

// Recovery Twin stats — mobile separator
<div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-5 border-t border-line pt-5 sm:grid-cols-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
```

---

## 5. Hero Section

**File:** `components/Hero.jsx`

### Current Issues
- The Hero illustration area (`h-64 sm:h-60`) contains **absolute-positioned floating chips** with percentage-based positions (`left-[18%]`, `top-[4%]`, etc.). On very narrow screens (320px), chips can overlap or bleed outside.
- `FloatingChip` uses `size-11` (44px) which is correct for touch targets.
- The right photography panel uses `lg:grid-cols-[1.32fr_1fr]` — stacks on mobile. The stacked photo area has `min-h-[280px]` which is reasonable.
- **Hero heading**: `text-3xl sm:text-[2.6rem]` — jumps from 30px to ~42px. Consider `text-2xl sm:text-3xl lg:text-[2.6rem]` for smoother scaling.

### Implementation Ideas

- **Hide some floating chips on mobile** to prevent overlap:
  ```jsx
  <FloatingChip icon="chart" className="right-[4%] top-[58%] hidden sm:grid" delay="2.8s" />
  ```
- **Reduce illustration height on small mobile**: `h-48 sm:h-60 md:h-64`
- **Live BPM card**: Currently `right-[30%] top-[34%]` with fixed `w-[86px]`. On narrow screens, it can overlap the pulsing core. Consider repositioning for mobile or hiding it below `sm`.

---

## 6. Recovery Twin View

**File:** `components/views/RecoveryTwinView.jsx`

### Current Issues
- **Top card layout**: `lg:flex-row lg:items-center` — stacks on mobile. ✅ Good.
- **Score trend stats**: `grid-cols-3 gap-3` — 3 columns even on 320px. Labels like "This week" and values like "+3 pts" are short enough, but it's borderline.
- **Inputs grid**: `sm:grid-cols-2` — single column on mobile. ✅ Good.
- **Symptom Logger form**: `sm:flex-row` stacks on mobile. ✅ Good.
- **Prescribe Medication form**: `sm:grid-cols-3` — on 320px, single column is fine.
- **Vitals grid**: Same issue as Dashboard — `sm:grid-cols-3 lg:grid-cols-6`. Apply same fix.
- **Patient info summary `dl`**: Uses `sm:grid-cols-2` — each row is `flex justify-between`. On very narrow screens, long hospital names can cause layout issues. Add `truncate` on the `dd` elements.

### Implementation Ideas

```jsx
// Score trend — use 2-col on very small screens if labels are long
<div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">

// Patient summary — truncate long values
<dd className="truncate font-medium text-ink">{patient.hospital}</dd>
```

---

## 7. Sentinel View

**File:** `components/views/SentinelView.jsx`

### Current Issues
- **Escalation pipeline grid**: `lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-center` — this 5-column layout with chevron arrows is **desktop-only**. On mobile, it stacks vertically. The chevrons rotate from 0° to 90° on mobile (`lg:rotate-0`). ✅ Good.
- **Stats grid**: `sm:grid-cols-3` — fine.
- **Explainability + Model columns**: `lg:grid-cols-[1.4fr_1fr]` — stacks on mobile. ✅ Good.
- **Re-score button**: On mobile, the button and status pills stack (`flex-col`). They left-align on mobile but right-align on desktop (`sm:items-end`). ✅ Good.

### Implementation Ideas
- The escalation pipeline cards could benefit from **step numbers** on mobile (1, 2, 3) since the horizontal flow isn't obvious when stacked.
- Add `text-center` to the chevron dividers on mobile for visual centering.

---

## 8. Appointments View

**File:** `components/views/AppointmentsView.jsx`

### Current Issues
- **Appointment list items**: `flex-col sm:flex-row sm:items-center` — stacks on mobile. ✅ Good.
- **Pills row**: `flex flex-wrap items-center gap-2` — wraps on narrow screens. ✅ Good.
- **Stats**: `sm:grid-cols-3` — stacks on mobile. ✅ Good.
- **Info cards**: `lg:grid-cols-2` — stacks. ✅ Good.

### Implementation Ideas
- On mobile, appointment items could benefit from a **condensed card layout** instead of the horizontal format. Consider grouping date/time/mode pills into a sub-row.
- The icon column `size-12` could shrink to `size-10` on mobile for space savings.

---

## 9. Wearables View

**File:** `components/views/WearablesView.jsx`

### Current Issues
- **ECG trace header**: Full-bleed dark panel. `flex-col sm:flex-row sm:items-center sm:justify-between` — stacks on mobile. ✅ Good.
- **Device list + vitals/trend split**: `lg:grid-cols-[1fr_1.2fr]` — stacks on mobile. ✅ Good.
- **Vitals grid inside the right column**: `sm:grid-cols-3` — could be tight on small tablets with 6 vitals. Use `grid-cols-2 sm:grid-cols-3`.
- **ECG canvas**: `h-24 w-full` — fine. SVG scales well.

### Implementation Ideas
- Device list items have batteries/pills on the right. On 320px, long device model names can push the pills off-screen. Add `min-w-0` to the flex child and `truncate` on model names (already present ✅).

---

## 10. Care Coordinator / Chat View

**File:** `components/views/CareCoordinatorView.jsx`, `components/ChatPanel.jsx`

### Current Issues

#### CareCoordinatorView
- **Chat + abilities split**: `lg:grid-cols-[1.5fr_1fr]` — stacks on mobile. ✅ Good.
- **Chat card min-height**: `min-h-[560px]` — on mobile, this creates a very tall chat area which is fine, but could be reduced to `min-h-[400px] lg:min-h-[560px]`.

#### ChatPanel
- **Message bubbles**: Patient messages use `max-w-[78%]`, assistant messages use `max-w-[86%]`. On 320px screens, these percentages are fine.
- **Chat list max-height**: `max-h-[420px]` — This is a fixed pixel value. On short mobile screens (landscape), the chat area + input may overflow. Consider `max-h-[50vh] sm:max-h-[420px]`.
- **Quick chips**: `flex flex-wrap gap-2` — wraps well. ✅ Good.
- **Input area**: `flex items-center gap-2` — input uses `flex-1`, button uses `size-11`. ✅ Good.

### Implementation Ideas

```jsx
// ChatPanel.jsx — viewport-aware chat height
<ul className="max-h-[50dvh] sm:max-h-[420px] flex-1 space-y-4 overflow-y-auto pr-1">

// CareCoordinatorView.jsx — reduce min-height on mobile
<Card className="flex min-h-[400px] flex-col lg:min-h-[560px]">
```

---

## 11. Caregiver Portal View

**File:** `components/views/CaregiverPortalView.jsx`

### Current Issues
- **Top summary card**: `flex-col sm:flex-row sm:items-center` — stacks on mobile. ✅ Good.
- **Alerts + medicines split**: `lg:grid-cols-[1fr_1.1fr]` — stacks on mobile. ✅ Good.
- **SOS button**: Full-width `w-full` — ✅ Great touch target.
- **Alert cards**: Complex nested flex layout. On 320px, the "Mark seen" button can be tight. Consider making it full-width on mobile: `w-full sm:w-auto`.
- **Recovery summary panel (`bg-mint` or `bg-risk-high/5`)**: On mobile, it has `sm:ml-2` margin that doesn't apply. ✅ Correct.

### Implementation Ideas
- The SOS button is critical — consider making it **sticky on mobile** at the bottom of the screen with `sticky bottom-0` and safe-area padding.
- Alert items are dense. On mobile, increase `gap-4` inside each alert card to improve scannability.

---

## 12. Doctor Portal & Sub-Views

**Files:** `components/views/DoctorPortalView.jsx`, `components/doctor/*.jsx`

This is the **most complex section** and has the most responsiveness gaps.

### 12a. DoctorPortalView (Main Container)

#### Current Issues
- **Toast banner**: `fixed bottom-5 right-5` — doesn't account for safe areas. Use `bottom-5 right-5 safe-bottom`.
- ✅ Tab routing is URL-based, no mobile issues.

### 12b. DoctorPatientQueueView

#### Current Issues
- **Search/filter toolbar**: `flex flex-wrap items-center gap-2.5` — wraps on mobile. ✅ Good.
- **Search input**: Fixed `w-52` — on 320px, this plus the sort dropdown and filter buttons can overflow. Use `w-full sm:w-52`.
- **Risk filter buttons**: Inline pill group with 4 buttons. On narrow screens, they may need to wrap. Use `flex flex-wrap` on the parent.
- **Desktop table**: `hidden md:block` — great, it hides on mobile. **BUT there is NO mobile card list alternative!** The table is completely hidden below `md`, leaving **nothing visible** on mobile/small tablets. This is a **critical gap**.

#### Implementation Ideas
```jsx
// Add a mobile card list BEFORE the desktop table
<div className="space-y-3 md:hidden mt-4">
  {filteredPatients.map((row) => (
    <button
      key={row.id}
      onClick={() => setSelectedPatientId(row.id)}
      className={`w-full rounded-2xl border p-4 text-left transition ${
        currentPatient?.id === row.id ? "border-brand bg-brand-soft/30" : "border-line"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-ink">{row.name}</p>
          <p className="text-xs text-ink-faint">{row.age} yrs · {row.condition}</p>
        </div>
        <RiskPill level={row.level} />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <ProgressBar value={row.risk} tone={RISK_TONE[row.level]} />
        <span className="text-xs font-bold text-ink">{row.risk}%</span>
      </div>
      <p className="mt-2 text-xs text-ink-soft">Last check-in: {row.last_check_in}</p>
    </button>
  ))}
</div>
```

- **Search input fix**: Change `w-52` to `w-full sm:w-52`.

### 12c. DoctorSelectPatientView

#### Current Issues
- **Patient sub-navigation tabs**: `flex flex-wrap items-center gap-1.5` — 6 tab buttons. On mobile, they wrap into 2-3 rows which is functional but cluttered.
- **Overview grid**: `lg:grid-cols-3` — stacks on mobile. ✅ Good.
- **Demographics card details**: `flex justify-between` rows — long values can overflow on 320px. Add `min-w-0` and `truncate` on value spans.
- **Patient selector dropdown**: The `<select>` shows long text like `"Priya Ananthan (62 yrs) — 78% Risk (High)"`. On mobile, long option text gets truncated by the browser's select rendering — acceptable.

#### Implementation Ideas
- **Horizontal scrollable tabs** on mobile instead of wrapping:
  ```jsx
  <div className="mt-4 flex items-center gap-1.5 border-t border-line pt-4 overflow-x-auto pb-2 -mx-6 px-6 sm:mx-0 sm:px-0 sm:overflow-visible sm:flex-wrap">
  ```
  This creates a swipeable tab bar on mobile.

### 12d. DoctorAppointmentsView

**File:** `components/doctor/DoctorAppointmentsView.jsx`

- Needs review — likely uses a table or list pattern. Apply the same mobile card pattern if it uses a desktop-only table.

### 12e. DoctorSettingsView

**File:** `components/doctor/DoctorSettingsView.jsx`

- Form-based view. Forms generally respond well. Verify all inputs are `w-full` and no fixed widths cause overflow.

### 12f. All Doctor Modals (Recovery Twin, Prescription, Reschedule, SOS)

#### Current Issues (in DoctorPortalView.jsx)
- **Recovery Twin modal**: `max-w-3xl max-h-[90vh]` — fine, but the inner content uses grids (`sm:grid-cols-2`, `sm:grid-cols-4`) that stack on mobile. ✅ Good.
- **Prescription modal**: `max-w-md` — fine. Inner grid `grid-cols-2` for dosage/frequency — works on mobile as they're short labels.
- **Reschedule modal**: `max-w-md` — fine.
- **SOS modal**: `max-w-lg` — fine. Action buttons use `flex flex-wrap justify-end gap-2` — ✅ Good.
- ⚠️ **All modals**: The close/action buttons at the bottom are `flex items-center justify-between` or `justify-end`. On very small screens, long button labels can wrap awkwardly. Consider `flex-wrap`.

---

## 13. Admin Portal View

**File:** `components/views/AdminPortalView.jsx`

### Current Issues
- **Stats grid**: `sm:grid-cols-2 lg:grid-cols-4` — ✅ Good progressive breakpoints.
- **Model + Why cards**: `lg:grid-cols-2` — stacks. ✅ Good.
- **Administrative tools grid**: `sm:grid-cols-3` — 3 large action buttons. On mobile, they stack to single column. ✅ Good.

### Implementation Ideas
- The action buttons (`size-8 icon + text`) have generous padding (`p-6`). On mobile, reduce to `p-4` for space efficiency: `p-4 sm:p-6`.

---

## 14. Users View

**File:** `components/views/UsersView.jsx`

### Current Issues
- **Main grid**: `lg:grid-cols-3` with user list spanning `lg:col-span-2` and create form in `col-span-1`. On mobile, the form stacks below the list — could be long scroll.
- **User list items**: `flex items-center justify-between` — role pill and delete button on the right. On very narrow screens, long names/emails can push buttons off-screen.

### Implementation Ideas
- Add `min-w-0` on the user info `<div>` and `truncate` on email text.
- Consider reordering on mobile: show the create form first (it's the action) and the user list below, using `order-last lg:order-none` on the user list.
- Each user row could benefit from `flex-wrap` for the right-side controls on very narrow screens:
  ```jsx
  <div className="flex flex-wrap items-center gap-2 sm:gap-4">
  ```

---

## 15. Government Portal View

**File:** `components/views/GovPortalView.jsx`

### Current Issues
- **Schemes grid**: `sm:grid-cols-2` — single column on mobile. ✅ Good.
- **Coverage + Analytics**: `lg:grid-cols-2` — stacks. ✅ Good.
- **Sync button**: Centered layout, no issues.

### Implementation Ideas
- On mobile, scheme cards could show the status pill on a separate line instead of `justify-between` to avoid cramped layouts with long scheme names.

---

## 16. Settings View

**File:** `components/views/SettingsView.jsx`

### Current Issues
- **Profile card**: `flex-col sm:flex-row sm:items-center` — ✅ Good.
- **Language + Notifications**: `lg:grid-cols-2` — stacks. ✅ Good.
- **System + Schemes**: `lg:grid-cols-[1fr_1.1fr]` — stacks. ✅ Good.
- **Sign out card**: `flex-col sm:flex-row sm:items-center sm:justify-between` — ✅ Good.
- **API endpoint `dd`**: Uses `truncate font-mono` — ✅ Handles long URLs.

### Implementation Ideas
- The Toggle component rows are compact. Verify the toggle switch itself meets 44px minimum touch target. The Toggle component file should be checked for `min-h-[44px]`.

---

## 17. UI Primitives (ui.jsx)

**File:** `components/ui.jsx`

### Current Issues
- **Card**: `p-6 sm:p-7` — ✅ Good responsive padding.
- **Pill**: Uses `text-xs` and `px-3 py-1` — 28px height approx. Acceptable as informational elements (not primary touch targets).
- **StatTile**: Uses `text-2xl` for values. On mobile in multi-column grids, the value + unit can overflow. Consider `text-xl sm:text-2xl`.
- **ProgressBar**: `h-2` — fine, purely visual.
- **CardTitle header**: `flex items-start justify-between gap-4` — if the `action` slot contains a wide element, it can push the title too narrow. Add `min-w-0` on the title `<div>`.

### Implementation Ideas

```jsx
// CardTitle — prevent title from being squished
<header className="mb-5 flex items-start justify-between gap-4">
  <div className="min-w-0">  {/* Add min-w-0 */}
    ...
  </div>
  {action}
</header>
```

---

## 18. Charts (charts.jsx)

**File:** `components/charts.jsx`

### Current Issues
- Charts use inline SVG with `viewBox` and `width="100%"` / `height` props. SVGs are inherently responsive.
- **RecoveryRing**: Has a `size` prop (default seems to be a fixed pixel value). Ensure the component respects `max-w-full` so it doesn't overflow its container on mobile.
- **Sparkline**: Uses `className="h-28 w-full"` — ✅ Responsive.
- **EcgLine**: Uses `className="h-24 w-full"` or similar — ✅ Responsive.

### Implementation Ideas
- Wrap the RecoveryRing in a container with `max-w-[120px] mx-auto sm:max-w-none` if it's used in contexts where it might overflow.

---

## 19. Modals (Global Pattern)

**All modal patterns across the codebase**

### Current Issues
- Modals use `fixed inset-0 z-50 flex items-center justify-center p-4` — the `p-4` gives 16px margin from edges. ✅ Good.
- Modal bodies use `max-w-md`, `max-w-lg`, or `max-w-3xl` with `w-full` — ✅ Good.
- `max-h-[90vh] overflow-y-auto` is used on the Recovery Twin modal but **NOT on other modals** (Prescription, Reschedule, SOS). On mobile, long modals could overflow the viewport.

### Implementation Ideas

**Apply max-height + scroll to ALL modals:**
```jsx
// Standard modal inner pattern
<div className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-2xl bg-surface p-6 shadow-xl border border-line">
```

- Use `dvh` instead of `vh` for better mobile browser support (accounts for mobile browser chrome).
- Add `overscroll-contain` to prevent scroll chaining to the body when the modal content is scrolled.

---

## 20. Typography & Touch Target Audit

### Font Sizes That Need Attention

| Location | Current | Recommended | Why |
|----------|---------|-------------|-----|
| Sidebar nav labels | `text-xs` (12px) | `text-[13px] sm:text-xs` | Too small for comfortable touch navigation |
| Eyebrow labels | `text-[11px]` | Keep (informational only) | — |
| Doctor portal tab labels | `text-xs` | `text-xs sm:text-[13px]` | Small but acceptable as there are icons too |
| Form labels in modals | `text-xs` (some unlabelled) | `text-sm` | Accessibility guideline: labels should be ≥14px |

### Touch Target Audit

| Element | Current Size | Minimum Required | Fix Needed? |
|---------|-------------|-----------------|-------------|
| Sidebar nav items | ~40px height | 44px | ⚠️ Add `min-h-[44px]` |
| Risk filter buttons | ~28px height | 44px | ⚠️ Add `min-h-[44px] px-4` |
| Quick chips (chat) | ~30px height | 44px | ⚠️ Add `min-h-[44px]` |
| Modal close buttons | ~32px (p-2) | 44px | ⚠️ Increase to `p-2.5` or `size-10` |
| Alert "Mark seen" buttons | ~28px | 44px | ⚠️ Add `min-h-[44px] px-4` |
| Table rows (Doctor Queue) | ~52px | 44px | ✅ Good |

---

## 21. Testing Checklist

Use this checklist to verify responsiveness across all breakpoints:

### Devices to Test
- [ ] **iPhone SE (375×667)** — Smallest common smartphone
- [ ] **iPhone 14 (390×844)** — Standard smartphone
- [ ] **iPhone 14 Pro Max (430×932)** — Large smartphone
- [ ] **iPad Mini (768×1024)** — Small tablet
- [ ] **iPad Pro 11" (834×1194)** — Medium tablet
- [ ] **iPad Pro 12.9" (1024×1366)** — Large tablet (at `lg` breakpoint boundary)
- [ ] **Laptop (1280×800)** — Standard laptop
- [ ] **Desktop (1920×1080)** — Full desktop

### Critical Flows to Test at Each Size
- [ ] Login page renders both panels without horizontal scroll
- [ ] Mobile sidebar drawer opens, navigates, and closes
- [ ] Dashboard cards don't overflow horizontally
- [ ] Hero floating chips don't overlap on mobile
- [ ] Doctor patient queue shows content on mobile (currently broken — no mobile cards)
- [ ] Doctor sub-tabs are navigable on mobile
- [ ] All modals fit within the viewport and scroll internally
- [ ] Chat panel input is accessible at the bottom (not below fold)
- [ ] Emergency SOS button is easily tappable on mobile
- [ ] All form inputs are full-width on mobile
- [ ] No horizontal scroll on any page

### Browser Testing
- [ ] Chrome (Windows / macOS / Android)
- [ ] Safari (iOS — critical for safe-area insets)
- [ ] Firefox (Desktop)
- [ ] Samsung Internet (Android)

---

## Summary of Priority Fixes

### 🔴 Critical (Functionality Broken)
1. **DoctorPatientQueueView** — No mobile card list. Table is `hidden md:block` with no mobile alternative. Patients cannot see the roster on mobile.

### 🟡 High Priority (UX Issues)
2. **No sign-out on mobile** — Header hides the sign-out button below `sm`. Add it to sidebar.
3. **All modals lack `max-h-[90dvh] overflow-y-auto`** — Long modals overflow on mobile.
4. **Chat panel `max-h-[420px]` is viewport-unaware** — Use `max-h-[50dvh]` on mobile.
5. **Hero floating chips overlap** on 320px screens — Hide some on mobile.
6. **Search input `w-52` in Doctor Queue** — Fixed width overflows on narrow screens.

### 🟢 Polish (Improvements)
7. Add mobile drawer slide-in animation.
8. Add safe-area padding for notched devices.
9. Increase touch target sizes for filter buttons, quick chips, and modal close buttons.
10. Add `overflow-x: hidden` on body to prevent accidental horizontal scroll.
11. Use `dvh` units for dynamic viewport height (better mobile browser support).
12. Add horizontal scrollable tabs for Doctor sub-navigation on mobile.
13. Adjust font scaling for headings (use more gradual `text-xl → text-2xl → text-3xl`).

---

> **Next step**: Start implementing from the 🔴 Critical fixes, then 🟡 High Priority, then 🟢 Polish. Each fix can be done independently per component file.
