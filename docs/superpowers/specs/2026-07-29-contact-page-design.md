# Contact Page Reference-Match Design

## Goal

Rebuild `contact.html` so it closely matches the supplied Titanium Roots Dental Clinic reference while remaining consistent with the existing static Vite site. The page must help a patient contact the clinic or request an appointment quickly.

## Approved Direction

Use a purpose-built contact-page structure within the existing shared site architecture. Reuse the shared navbar, appointment modal, consultation banner, footer, floating contact control, design tokens, and JavaScript bootstrapping. Replace the current contact-page layout and page-specific presentation rather than creating a duplicate standalone experience.

## Visual System

- Background: warm ivory (`#f9f7f1`) with white cards.
- Primary: muted dental green based on the existing primary tokens.
- Accent: restrained warm gold for the hero eyebrow and decorative botanical detail.
- Typography: the existing Playfair Display heading face and Inter body face.
- Shape language: softly rounded cards, pill-shaped request-type controls, fine borders, and restrained shadows.
- Signature: a compact editorial hero with a tooth-and-botanical composition flowing into an asymmetric form-and-information layout.

## Page Structure

1. Shared navigation with Contact shown as the active item.
2. Compact contact hero containing:
   - “We’re here to help” eyebrow.
   - “Get in Touch With Us” heading.
   - Short support message.
   - Decorative tooth visual on the right.
3. Main contact area:
   - Large “Send Us a Message” form card on the left.
   - Right sidebar containing contact information, clinic hours, and a green appointment/WhatsApp call-to-action card.
4. Map section with a clinic information overlay and an external Google Maps link.
5. FAQ section using an accessible accordion.
6. Existing consultation banner and shared footer.

## Form

The form includes request-type pills for Book Appointment, General Query, Treatment Info, Emergency, and Leave Feedback. It includes full name, phone number, email address, required service, preferred doctor, preferred appointment date, message, privacy consent, and a Send Message action.

Existing client-side validation and simulated submission feedback remain. Request-type selection updates the active state without removing necessary fields. The file upload, draft controls, automatic callback modal, and unrelated sections from the current page are removed because they are not present in the approved reference.

## Clinic Details

Use the values shown in the supplied reference:

- Address: 123, Dental Care Street, Anna Nagar, Chennai, Tamil Nadu – 600001
- Phone: +91 98765 43210
- Landline: +91 44 2345 6789
- Email: info@titaniumroots.com
- Appointment email: appointments@titaniumroots.com
- WhatsApp: +91 98765 43210
- Monday–Friday: 9:00 AM–8:00 PM
- Saturday: 9:00 AM–6:00 PM
- Sunday: 10:00 AM–4:00 PM

The “Open Now” label is calculated from the visitor’s current day and time in the clinic’s Asia/Kolkata timezone.

## Responsive Behavior

At desktop widths, the form occupies roughly two-thirds of the main content row and the sidebar occupies one-third. At tablet and mobile widths, the hero visual simplifies, the main row stacks, form fields become one column, and cards retain comfortable touch spacing. No horizontal overflow is permitted.

## Accessibility

- Preserve the skip link and semantic page regions.
- Associate every form control with a visible label.
- Keep visible keyboard focus states.
- Use buttons with `aria-pressed` for request type selection.
- Use `aria-expanded`, `aria-controls`, and labeled regions for FAQ items.
- Provide live status messaging for form validation and submission.
- Respect `prefers-reduced-motion`.

## Verification

- Add structural tests for the approved contact sections and exact clinic details.
- Add tests for clinic-hours status calculation.
- Run the full test suite and production build.
- Inspect desktop and mobile screenshots against the supplied reference.
- Check form mode controls, validation, FAQ expansion, map link, appointment modal, phone, email, and WhatsApp links.
