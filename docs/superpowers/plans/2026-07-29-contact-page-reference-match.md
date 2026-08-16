# Contact Page Reference Match Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Titanium Roots contact page to closely match the supplied reference while preserving the existing shared navigation, modal, banner, footer, and app bootstrap.

**Architecture:** Keep the site’s static Vite structure and make the page self-contained through `contact.html`, `assets/css/pages/contact.css`, and `assets/js/pages/contact.js`. Shared components continue to load through `assets/js/app.js`; page JavaScript only owns contact-form modes, validation, clinic-hours status, and FAQ behavior.

**Tech Stack:** Semantic HTML, responsive CSS, vanilla JavaScript, Lucide icons, Node’s built-in test runner, Vite.

---

### Task 1: Lock the reference structure and clinic details with tests

**Files:**
- Create: `tests/contact-page.test.mjs`

- [ ] **Step 1: Write failing structural tests**

Add tests that read `contact.html` and assert the presence of `contact-hero`, `contact-workspace`, `contact-form-card`, `contact-sidebar`, `contact-map`, and `contact-faq`; assert the five request modes and the exact address, phone, and email values from the approved spec.

- [ ] **Step 2: Write failing behavior tests**

Import `getClinicStatus` from `assets/js/pages/contact.js` and assert open/closed output for weekday, Saturday, and Sunday times in `Asia/Kolkata`.

- [ ] **Step 3: Run the tests to verify failure**

Run: `npm test`

Expected: the new tests fail because the reference structure and exported hours helper do not exist yet.

### Task 2: Replace the contact-page markup

**Files:**
- Modify: `contact.html`

- [ ] **Step 1: Build the compact hero**

Use the approved eyebrow, “Get in Touch With Us” heading, support copy, and an accessible decorative tooth composition.

- [ ] **Step 2: Build the form and sidebar workspace**

Add the five `aria-pressed` request-mode buttons; labeled name, phone, email, service, doctor, date, message, and consent controls; a live status region; contact-information, clinic-hours, and CTA cards.

- [ ] **Step 3: Add the map and FAQ**

Embed the Anna Nagar map, include a Google Maps external link, and add six accessible FAQ buttons and controlled answer panels.

- [ ] **Step 4: Preserve shared components**

Keep the shared navbar, consultation banner, footer, appointment modal, floating contact component, and `/assets/js/app.js` bootstrap.

### Task 3: Match the reference visual system responsively

**Files:**
- Replace: `assets/css/pages/contact.css`

- [ ] **Step 1: Define page-local tokens and layout**

Create the warm ivory canvas, white bordered cards, dental-green actions, gold eyebrow, compact hero, 2:1 desktop workspace, and restrained shadows shown in the reference.

- [ ] **Step 2: Style all interactive states**

Provide visible hover and keyboard-focus states for pills, inputs, buttons, map link, and FAQ controls. Keep all text at readable contrast.

- [ ] **Step 3: Add responsive rules**

At tablet widths stack the main workspace and simplify the hero art; at mobile widths make form fields single-column, allow request pills to wrap, and remove all horizontal overflow.

- [ ] **Step 4: Respect reduced motion**

Disable non-essential transitions for `prefers-reduced-motion: reduce`.

### Task 4: Implement contact interactions

**Files:**
- Replace: `assets/js/pages/contact.js`

- [ ] **Step 1: Export clinic-hours calculation**

Implement `getClinicStatus(date, timeZone = 'Asia/Kolkata')` using `Intl.DateTimeFormat`; return the day label, opening range, and whether the clinic is currently open.

- [ ] **Step 2: Render current clinic status**

Update the “Today” row and status badge on initialization.

- [ ] **Step 3: Bind request modes and validation**

Keep one active `aria-pressed` mode, update the hidden `requestType` value, validate required fields and consent, and show clear messages in the live status region.

- [ ] **Step 4: Bind the FAQ accordion**

Toggle `aria-expanded` and panel visibility while preserving keyboard-native button behavior.

- [ ] **Step 5: Run tests**

Run: `npm test`

Expected: all contact-page tests and existing tests pass.

### Task 5: Verify the finished page

**Files:**
- Modify if needed: `contact.html`
- Modify if needed: `assets/css/pages/contact.css`
- Modify if needed: `assets/js/pages/contact.js`

- [ ] **Step 1: Run a production build**

Run: `npm run build`

Expected: Vite completes without errors.

- [ ] **Step 2: Inspect desktop and mobile screenshots**

Open the local page at approximately 1440 px and 390 px widths. Confirm the reference hierarchy, balanced spacing, stacked mobile layout, map visibility, and absence of horizontal overflow.

- [ ] **Step 3: Exercise interactions**

Check request-mode selection, native form validation, simulated success feedback, FAQ expansion, phone/email/WhatsApp links, appointment modal, and the current-hours badge.

- [ ] **Step 4: Final regression run**

Run: `npm test && npm run build`

Expected: all tests pass and the production build succeeds.
