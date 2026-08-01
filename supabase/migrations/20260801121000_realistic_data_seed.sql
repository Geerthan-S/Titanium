begin;

-- Seed highly realistic doctor profiles
insert into public.doctors (
  name,
  slug,
  designation,
  qualification,
  additional_qualifications,
  specialization,
  specialties,
  experience_years,
  languages,
  registration_number,
  biography,
  philosophy,
  consultation,
  availability,
  featured,
  status,
  sort_order
) values
  (
    'Dr. Vikram Seth',
    'dr-vikram-seth',
    'Lead General Dentist',
    'BDS',
    'FAGE, Certificate in Advanced Endodontics',
    'General Dentistry',
    array['Endodontics', 'Restorative Dentistry']::text[],
    15,
    array['English', 'Tamil', 'Hindi']::text[],
    'DCI-12345',
    'Dr. Vikram Seth brings over 15 years of comprehensive dental experience to Titanium Roots. Having treated thousands of patients across Chennai, he leads our clinical team with a focus on comfortable, pain-free restorative care and precise diagnostics.',
    'I believe that dentistry should never be intimidating. A calm environment and a clear explanation of options empower our patients to make the right choices for their dental health.',
    'Available for new patient examinations, second opinions, and complex restorative treatment planning.',
    'Mon - Fri: 9:00 AM - 6:00 PM',
    true,
    'published',
    1
  ),
  (
    'Dr. Ananya Sharma',
    'dr-ananya-sharma',
    'Consultant Orthodontist',
    'BDS, MDS',
    'Invisalign Certified Provider',
    'Orthodontics',
    array['Clear Aligners', 'Pediatric Orthodontics', 'Surgical Orthodontics']::text[],
    8,
    array['English', 'Tamil']::text[],
    'DCI-54321',
    'Dr. Ananya Sharma is a specialist in orthodontics with a deep passion for smile alignment. She blends the latest digital dentistry workflows with traditional orthodontic principles to deliver predictable, stunning results for both teenagers and adults.',
    'A confident smile is life-changing. My goal is to make the alignment journey as seamless and discreet as possible, tailoring treatments to each patient’s lifestyle.',
    'Available for aligner consultations and interceptive orthodontic assessments.',
    'Tue, Thu, Sat: 10:00 AM - 7:00 PM',
    true,
    'published',
    2
  ),
  (
    'Dr. Rajesh Iyer',
    'dr-rajesh-iyer',
    'Implantologist & Oral Surgeon',
    'BDS, MDS (Oral & Maxillofacial Surgery)',
    'Fellowship in Oral Implantology',
    'Implantology',
    array['Dental Implants', 'Bone Grafting', 'Impacted Extractions']::text[],
    12,
    array['English', 'Tamil', 'Malayalam']::text[],
    'DCI-98765',
    'With a dual focus on oral surgery and implantology, Dr. Rajesh Iyer handles the most complex dental rehabilitations at the clinic. He is renowned for his meticulous surgical technique and dedication to long-term implant success.',
    'Surgical excellence is built on precise planning. By utilizing advanced 3D imaging, we can ensure every implant procedure is safe, predictable, and minimally invasive.',
    'Available for implant evaluations, full-mouth rehabilitations, and surgical consultations.',
    'Wed, Fri: 9:00 AM - 5:00 PM',
    true,
    'published',
    3
  ),
  (
    'Dr. Priya Desai',
    'dr-priya-desai',
    'Cosmetic Dentist',
    'BDS',
    'Advanced Certification in Aesthetic Dentistry',
    'Cosmetic Dentistry',
    array['Veneers', 'Smile Makeovers', 'Teeth Whitening']::text[],
    6,
    array['English', 'Tamil']::text[],
    'DCI-11223',
    'Dr. Priya Desai focuses entirely on the art and science of aesthetic dentistry. She works closely with our master ceramists to design bespoke porcelain veneers and composite restorations that look entirely natural.',
    'Aesthetic dentistry is not about creating a "perfect" copy, but about enhancing your natural features. Every smile we design must look like it belongs to you.',
    'Available for smile makeover consultations and aesthetic reviews.',
    'Mon, Wed, Sat: 10:00 AM - 6:00 PM',
    false,
    'published',
    4
  )
on conflict (slug) do update set
  name = excluded.name,
  designation = excluded.designation,
  qualification = excluded.qualification,
  additional_qualifications = excluded.additional_qualifications,
  specialization = excluded.specialization,
  specialties = excluded.specialties,
  experience_years = excluded.experience_years,
  languages = excluded.languages,
  biography = excluded.biography,
  philosophy = excluded.philosophy,
  featured = excluded.featured,
  status = excluded.status,
  sort_order = excluded.sort_order
where
  public.doctors.updated_by is null
  and (
    public.doctors.name is distinct from excluded.name
    or public.doctors.biography is distinct from excluded.biography
  );


-- Seed highly realistic patient testimonials
insert into public.testimonials (
  display_name,
  treatment_label,
  rating,
  review,
  source,
  consent_status,
  consent_at,
  moderation_status,
  status,
  featured,
  sort_order
) values
  (
    'Emily R.',
    'Cosmetic Dentistry',
    5,
    'My experience at Titanium Roots was absolutely wonderful. The clinic environment is incredibly relaxing and does not feel like a typical hospital. Dr. Priya listened to exactly what I wanted for my smile makeover, and the porcelain veneers look completely natural. I am thrilled with the final results and highly recommend their cosmetic team to anyone.',
    'website',
    'confirmed',
    now(),
    'approved',
    'published',
    true,
    1
  ),
  (
    'Arjun K.',
    'Dental Implants',
    5,
    'I was extremely anxious about getting a dental implant after ignoring a missing tooth for years. Dr. Rajesh completely changed my perspective. He explained the 3D scans clearly and made sure I felt no pain during the procedure. It has been six months now, and the implant feels exactly like my natural tooth. Excellent, professional service.',
    'website',
    'confirmed',
    now(),
    'approved',
    'published',
    true,
    2
  ),
  (
    'Kavitha S.',
    'Root Canal Treatment',
    5,
    'I visited Titanium Roots on an urgent basis due to severe tooth pain. The team managed to fit me in immediately. Dr. Vikram performed a root canal the same day, and the relief was instantaneous. The equipment is state-of-the-art and the staff followed up the next day to check on my recovery. Fantastic patient care from start to finish.',
    'website',
    'confirmed',
    now(),
    'approved',
    'published',
    false,
    3
  ),
  (
    'Rahul M.',
    'Orthodontics',
    4,
    'Great experience getting clear aligners with Dr. Ananya. She is very meticulous and always takes time to adjust the treatment if something doesn’t feel right. The clinic is very clean and the appointments always start on time, which I appreciate as a working professional. Very happy with the progress of my alignment so far.',
    'website',
    'confirmed',
    now(),
    'approved',
    'published',
    false,
    4
  )
on conflict do nothing;


-- Seed realistic gallery items (placeholders without actual uploaded files)
insert into public.gallery_items (
  title,
  filename,
  storage_path,
  category,
  mime_type,
  size_bytes,
  alt_text,
  usage_description,
  status,
  sort_order
) values
  (
    'Main Reception Area',
    'reception-neutral.svg',
    'seed/reception-neutral.svg',
    'Clinic Interiors',
    'image/svg+xml',
    1500,
    'Bright and welcoming reception area of Titanium Roots Dental Clinic with warm lighting.',
    'Used on the About Us page and general clinic tours.',
    'published',
    1
  ),
  (
    'Advanced Operatory Suite',
    'operatory-neutral.svg',
    'seed/operatory-neutral.svg',
    'Clinic Interiors',
    'image/svg+xml',
    1500,
    'State-of-the-art dental operatory room featuring modern dental chairs and equipment.',
    'Used to showcase clinic facilities.',
    'published',
    2
  ),
  (
    'Sterilization Bay',
    'sterilization-neutral.svg',
    'seed/sterilization-neutral.svg',
    'Equipment',
    'image/svg+xml',
    1500,
    'Dedicated sterilization bay showcasing the clinic’s rigid hygiene protocols.',
    'Highlights safety and hygiene standards.',
    'published',
    3
  )
on conflict (storage_path) do nothing;

commit;
