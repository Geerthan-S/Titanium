export const SITE_CONFIG = Object.freeze({
  clinicName: 'Titanium Roots Dental Clinic',
  phone: '+91 98765 43210',
  whatsapp: '+919876543210',
  whatsappMessage: 'Hello Titanium Roots Dental Clinic,\n\nI would like to enquire about booking a dental consultation.\n\nPlease contact me with the available appointment timings.',
  email: 'info@titaniumroots.com',
  address: '123, Dental Care Street, Anna Nagar, Chennai, Tamil Nadu – 600001',
  timings: 'Mon – Fri: 9:00 AM – 8:00 PM · Sat: 9:00 AM – 6:00 PM · Sun: 10:00 AM – 4:00 PM',
  footerDescription: 'Thoughtful dental care shaped around comfort, clarity, and every patient visit.',
  social: { instagram: '#', facebook: '#', linkedin: '#' },
  navigation: [
    { label: 'Home', href: '/', page: 'home' },
    { label: 'About', href: '/about/', page: 'about' },
    { label: 'Treatments', href: '/treatments/', page: 'treatments' },
    { label: 'Doctors', href: '/doctors/', page: 'doctors' },
    { label: 'Testimonials', href: '/testimonials/', page: 'testimonials' },
    { label: 'Knowledge Center', href: '/blog/', page: 'blog' },
    { label: 'Contact', href: '/contact/', page: 'contact' },
  ],
});

export const TREATMENT_CATEGORIES = Object.freeze([
  'General Dentistry',
  'Preventive Dentistry',
  'Restorative Dentistry',
  'Root Canal Treatment',
  'Cosmetic Dentistry',
  'Dental Implants',
  'Crowns and Bridges',
  'Orthodontics',
  'Gum Treatments',
  'Oral Surgery',
  'Dentures and Prosthodontics',
  'Paediatric Dentistry',
  'Full-Mouth Rehabilitation',
  'TMJ and Bite Treatments',
  'Laser Dentistry',
  'Digital Dentistry',
]);

export const BLOG_CATEGORIES = Object.freeze([
  'Patient Guides',
  'Dental Education',
  'Clinic News',
  'Treatments',
  'Oral Health',
]);

export const GALLERY_CATEGORIES = Object.freeze([
  'Clinic Interiors',
  'Equipment',
  'Treatments',
  'Doctors',
  'Testimonials',
  'Blog',
  'Branding',
  'Other',
]);
