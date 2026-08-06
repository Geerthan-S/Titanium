begin;

insert into public.treatments (
  name,
  slug,
  category,
  short_description,
  full_description,
  duration,
  visits,
  pricing_status,
  benefits,
  suitability,
  procedure_steps,
  recovery,
  featured,
  status,
  sort_order
)
values
  ('Clear Aligners', 'clear-aligners', 'Orthodontics', 'Removable clear trays planned digitally for selected alignment and bite concerns.', 'Clear aligners are removable trays designed to move teeth gradually according to a digital orthodontic plan. Suitability depends on alignment, bite, gum health, age and cooperation.', 'Timeline discussed after consultation', 'Monitoring visits vary', 'consultation_required', 'Nearly transparent, removable for meals and cleaning, digital planning, fewer wire irritation points, suitable for selected cases', 'Crowding or overlapping, gaps, selected bite problems, orthodontic relapse, preference for a removable option', 'Assessment and records; digital scan or impressions; simulation and approval; aligner delivery; monitoring and refinements; retention', 'Retention and review guidance are provided after active treatment.', true, 'published', 10),
  ('Braces & Orthodontics', 'braces-orthodontics', 'Orthodontics', 'Orthodontic treatment for alignment, cleaning access, appearance, function and bite concerns.', 'Orthodontic treatment guides teeth into improved positions to support appearance, cleaning, function and bite. Appliance choice depends on age, movement needed and complexity.', 'Timeline discussed after consultation', 'Regular adjustment visits', 'consultation_required', 'Improved alignment, easier cleaning support, selected bite relationship improvement, controlled movement for many cases', 'Crowded, rotated or spaced teeth, overbite, underbite, crossbite, cleaning difficulty, jaw or bite concerns, relapse', 'Examination and records; diagnosis and objectives; appliance selection; regular adjustments; completion; retention', 'Retention planning is needed to maintain the result after treatment.', true, 'published', 11),
  ('Smile Makeover', 'smile-makeover', 'Cosmetic dentistry', 'A coordinated plan for patients with multiple cosmetic concerns and oral-health priorities.', 'A smile makeover is a coordinated plan rather than one procedure. It considers tooth health, gums, bite, facial proportions and personal goals.', 'Timeline discussed after consultation', 'Visits depend on plan', 'consultation_required', 'Coordinates multiple concerns, prioritises oral health, compares conservative and comprehensive options, provides a staged timeline', 'Multiple cosmetic concerns, discoloured teeth, worn or chipped teeth, gaps, shape concerns, visible old restorations, need for coordinated planning', 'Goals and health assessment; photographs and records; options and limitations; preview where appropriate; phased care; final review', 'Aftercare depends on the treatments included in the agreed plan.', false, 'published', 12),
  ('Professional Teeth Whitening', 'professional-teeth-whitening', 'Cosmetic dentistry', 'Supervised whitening for selected discolouration after dental assessment.', 'Professional whitening uses dental bleaching agents to lighten selected types of discolouration. Assessment identifies the cause of staining, restorations and sensitivity.', 'Timeline discussed after consultation', 'Protocol varies', 'consultation_required', 'Assessment before treatment, controlled product selection, professional instructions, sensitivity monitoring, cosmetic planning support', 'General yellowing, food or drink stains, smoking stains, cosmetic goal, uneven colour requiring assessment, preference for supervised treatment', 'Health and shade assessment; treat active disease if needed; select protocol; apply or use trays; manage sensitivity; review and maintenance', 'Sensitivity guidance and maintenance advice are provided for the selected protocol.', true, 'published', 13),
  ('Dental Veneers', 'dental-veneers', 'Cosmetic dentistry', 'Thin restorations for selected front teeth after enamel, bite and gum assessment.', 'Veneers are thin restorations placed on selected front teeth. Suitability depends on enamel, bite, gums and whether conservative alternatives can meet the goal.', 'Timeline discussed after consultation', 'Usually staged visits', 'consultation_required', 'Improves shape and proportion, can complement facial features, may require less preparation than a crown, natural-looking material options', 'Chipped or worn front teeth, selected colour concerns, uneven shape or proportion, small gaps, replacement of failing veneers', 'Assessment and analysis; discuss alternatives and preparation; records and scan; preview where appropriate; preparation and temporary stage; final placement', 'Maintenance and bite protection advice are provided after placement.', false, 'published', 14),
  ('Crowns & Bridges', 'crowns-bridges', 'Restorative dentistry', 'Fixed restorations for selected damaged teeth or missing-tooth gaps after assessment.', 'A crown covers a damaged tooth; a bridge replaces selected missing teeth using supporting teeth or implants. Design depends on location, bite and remaining structure.', 'Timeline discussed after consultation', 'Usually staged visits', 'consultation_required', 'Protects selected weakened teeth, restores shape and chewing surface, provides a fixed replacement option, balances strength and appearance', 'Heavily restored or cracked tooth, protection after root canal where indicated, worn tooth, selected missing-tooth gap, old crown or bridge failure', 'Assess tooth, gums and bite; discuss material and alternatives; prepare or plan implant support; scan or impression; temporary stage; final fit and placement', 'Care and maintenance instructions depend on the final design.', false, 'published', 15),
  ('Gum Care & Periodontics', 'gum-care-periodontics', 'Periodontal care', 'Gum assessment, cleaning, risk guidance and maintenance planning for periodontal health.', 'Gum care ranges from prevention and professional cleaning to deeper periodontal treatment based on inflammation, pocket depth, bone support and risk factors.', 'Varies by assessment', 'May require review visits', 'consultation_required', 'Controls inflammation, supports teeth and implants, improves cleaning access, can reduce bleeding, creates a risk-based maintenance plan', 'Bleeding during cleaning, swollen or tender gums, persistent bad breath, recession or sensitivity, loose teeth, history of periodontal disease', 'Gum and plaque assessment; measurements and imaging; home-care instruction; cleaning or deep cleaning; risk-factor management; healing review; maintenance', 'Maintenance intervals are based on periodontal risk and healing response.', false, 'published', 16),
  ('Wisdom Tooth Assessment & Removal', 'wisdom-tooth-assessment-removal', 'Surgical dentistry', 'Assessment and selected removal planning for painful, partly erupted or impacted wisdom teeth.', 'Wisdom teeth may erupt normally, partly erupt or remain impacted. Assessment considers symptoms, position, cleaning access, nearby structures and future risk.', 'Depends on assessment', 'Further review may be needed', 'consultation_required', 'Addresses selected recurrent problems, can protect an adjacent tooth, uses imaging-based planning, includes aftercare and review', 'Pain or swelling behind the last molar, repeated gum infection, food trapping and decay, damage to adjacent tooth, pathology, surgical planning', 'Examination and history; imaging; discuss monitoring, removal or referral; anaesthesia plan; removal; aftercare and review', 'Aftercare is individual and urgent medical symptoms require emergency care.', false, 'published', 17),
  ('Pediatric Dentistry', 'pediatric-dentistry', 'Family dentistry', 'Age-appropriate children’s dental care focused on prevention and positive early visits.', 'Children’s dentistry focuses on healthy development, prevention, early diagnosis and positive experiences adapted to age, comfort and cooperation.', 'Varies by child and care need', 'Risk-based recall', 'consultation_required', 'Positive early experiences, early detection, brushing and diet guidance, fluoride guidance, parent education, timely referral when required', 'First dental visit, decay or sensitivity, pain or swelling, trauma, eruption concerns, oral habits, bite or alignment concerns', 'Welcome parent and child; age-appropriate examination; child-friendly explanation; preventive or restorative care; home guidance; risk-based recall', 'Parents receive home-care and review guidance based on the child’s needs.', false, 'published', 18),
  ('Preventive & General Dentistry', 'preventive-general-dentistry', 'Preventive dentistry', 'Routine assessment, cleaning, early detection and practical home-care guidance.', 'Preventive dentistry aims to identify concerns early, reduce disease risk and support healthy teeth and gums through assessment, professional care and home routines.', 'Varies by assessment', 'Recall interval is individual', 'consultation_required', 'Early detection, plaque and gum control, personalised home-care advice, monitoring of restorations, risk-based review schedule', 'Routine examination, professional cleaning, sensitivity or early decay, cavities or damaged fillings, bad breath or plaque concerns, family preventive care', 'History update; clinical examination; imaging when indicated; gum and hygiene assessment; cleaning or restorative care; recall plan', 'Most routine assessments do not require recovery time. Individual advice is provided when additional care is completed.', true, 'published', 19)
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  short_description = excluded.short_description,
  full_description = excluded.full_description,
  duration = excluded.duration,
  visits = excluded.visits,
  pricing_status = excluded.pricing_status,
  benefits = excluded.benefits,
  suitability = excluded.suitability,
  procedure_steps = excluded.procedure_steps,
  recovery = excluded.recovery,
  featured = excluded.featured,
  status = excluded.status,
  sort_order = excluded.sort_order
where public.treatments.updated_by is null;

insert into public.blog_posts (
  title,
  slug,
  category,
  tags,
  excerpt,
  content_html,
  author_name,
  publish_at,
  status,
  featured,
  trending,
  seo_title,
  seo_description,
  sort_order
)
values
  ('Why Does My Tooth Hurt? Common Causes and When to See a Dentist', 'why-does-my-tooth-hurt', 'Tooth Pain & Emergencies', array['tooth pain','assessment']::text[], 'A practical guide to common tooth pain patterns and when dental assessment is sensible.', '<h2>Tooth pain needs context</h2><p>Tooth pain can come from decay, cracks, gum inflammation, bite stress, trauma or other causes. A dental assessment helps identify the source and suitable next steps.</p>', 'Titanium Roots Clinical Team', '2026-08-04T03:30:00Z'::timestamptz, 'published', false, true, 'Why Does My Tooth Hurt? | Titanium Roots', 'Common tooth pain causes and when to seek dental assessment.', 10),
  ('Dental Implants: Suitability and Planning', 'dental-implants-suitability-planning', 'Implants', array['implants','planning']::text[], 'How implant suitability is reviewed through oral health, bone, bite and medical history.', '<h2>Suitability is individual</h2><p>Implant planning considers oral health, bone, bite, medical history and restorative goals before any recommendation is made.</p>', 'Titanium Roots Clinical Team', '2026-08-05T03:30:00Z'::timestamptz, 'published', false, false, 'Dental Implants Suitability and Planning', 'Learn how dental implant suitability and planning are assessed.', 11),
  ('Dental Implant Recovery: General Guide', 'dental-implant-recovery-guide', 'Implants', array['implants','recovery']::text[], 'General recovery themes after implant treatment and why personal instructions matter.', '<h2>Recovery varies</h2><p>Healing depends on the procedure, oral health and individual factors. Follow the dentist’s specific instructions and attend reviews as advised.</p>', 'Titanium Roots Clinical Team', '2026-08-06T03:30:00Z'::timestamptz, 'published', false, false, 'Dental Implant Recovery Guide', 'General implant recovery guidance and review expectations.', 12),
  ('Root Canal vs Extraction: How Options Are Compared', 'root-canal-vs-extraction', 'Root Canal', array['root canal','extraction']::text[], 'How dentists compare tooth preservation and removal options after assessment.', '<h2>Options depend on findings</h2><p>Root canal treatment and extraction are compared using tooth structure, infection, restorability, gum support and patient priorities.</p>', 'Titanium Roots Clinical Team', '2026-08-07T03:30:00Z'::timestamptz, 'published', false, false, 'Root Canal vs Extraction | Titanium Roots', 'Understand how root canal and extraction options are compared.', 13),
  ('Clear Aligners vs Braces', 'clear-aligners-vs-braces', 'Orthodontics', array['aligners','braces']::text[], 'A comparison of removable aligners and fixed braces for selected orthodontic needs.', '<h2>Both options have roles</h2><p>Aligners and braces move teeth differently. The right choice depends on bite, movement complexity, cooperation and clinical goals.</p>', 'Titanium Roots Clinical Team', '2026-08-08T03:30:00Z'::timestamptz, 'published', false, true, 'Clear Aligners vs Braces | Titanium Roots', 'Compare clear aligners and braces for selected orthodontic concerns.', 14),
  ('Whitening for Sensitive Teeth', 'teeth-whitening-sensitive-teeth', 'Cosmetic', array['whitening','sensitivity']::text[], 'Why sensitivity should be assessed before whitening and how expectations are discussed.', '<h2>Assessment comes first</h2><p>Sensitivity, restorations and causes of discolouration should be reviewed before selecting a whitening protocol.</p>', 'Titanium Roots Clinical Team', '2026-08-09T03:30:00Z'::timestamptz, 'published', false, false, 'Whitening for Sensitive Teeth', 'Learn why sensitivity assessment matters before teeth whitening.', 15),
  ('Veneers, Bonding or Whitening?', 'veneers-bonding-whitening', 'Cosmetic', array['veneers','bonding','whitening']::text[], 'How cosmetic dental options are compared around health, bite and smile goals.', '<h2>Cosmetic choices vary</h2><p>Veneers, bonding and whitening solve different concerns. A consultation compares conservative and comprehensive options.</p>', 'Titanium Roots Clinical Team', '2026-08-10T03:30:00Z'::timestamptz, 'published', false, false, 'Veneers, Bonding or Whitening?', 'Compare cosmetic dental options after oral-health assessment.', 16),
  ('Why Do Gums Bleed While Brushing?', 'why-do-gums-bleed', 'Gum Health', array['gum health','bleeding gums']::text[], 'Common reasons gums bleed and why persistent bleeding should be assessed.', '<h2>Bleeding is a sign to review</h2><p>Bleeding gums may relate to plaque, inflammation, brushing technique, periodontal disease or other factors. Persistent bleeding deserves assessment.</p>', 'Titanium Roots Clinical Team', '2026-08-11T03:30:00Z'::timestamptz, 'published', false, false, 'Why Do Gums Bleed While Brushing?', 'Understand gum bleeding and when assessment may be useful.', 17),
  ('A Parent’s Guide to the First Dental Visit', 'child-first-dental-visit', 'Children', array['children','first dental visit']::text[], 'How parents can prepare children for a calm first dental visit.', '<h2>Keep the first visit positive</h2><p>A first dental visit focuses on familiarity, prevention and age-appropriate guidance for parents and children.</p>', 'Titanium Roots Clinical Team', '2026-08-12T03:30:00Z'::timestamptz, 'published', false, false, 'Child First Dental Visit Guide', 'A parent guide to preparing for a child’s first dental visit.', 18),
  ('Wisdom Tooth Pain: When Assessment Is Needed', 'wisdom-tooth-pain', 'Wisdom Teeth', array['wisdom tooth','pain']::text[], 'Symptoms that suggest wisdom tooth assessment may be useful.', '<h2>Position and symptoms matter</h2><p>Wisdom tooth pain may relate to eruption, gum infection, decay, food trapping or nearby structures. Imaging may be recommended.</p>', 'Titanium Roots Clinical Team', '2026-08-13T03:30:00Z'::timestamptz, 'published', false, false, 'Wisdom Tooth Pain Assessment', 'Learn when wisdom tooth pain may need dental assessment.', 19),
  ('How Often Should You Have a Dental Check-up?', 'how-often-dental-check-up', 'Preventive', array['check-up','preventive care']::text[], 'Why dental review intervals are individual rather than one-size-fits-all.', '<h2>Review timing is personal</h2><p>Check-up frequency depends on oral health, risk factors, previous findings and current care needs.</p>', 'Titanium Roots Clinical Team', '2026-08-14T03:30:00Z'::timestamptz, 'published', false, false, 'How Often Dental Check-up?', 'Understand how dental review intervals are planned.', 20),
  ('Preparing for Your First Titanium Roots Appointment', 'prepare-first-appointment', 'Clinic Guides', array['appointment','clinic guide']::text[], 'What to bring, what to expect and how appointment requests are confirmed.', '<h2>Plan your visit</h2><p>Bring relevant dental records if available, share current concerns and wait for the clinic to confirm your requested appointment time.</p>', 'Titanium Roots Clinical Team', '2026-08-15T03:30:00Z'::timestamptz, 'published', false, false, 'Prepare for Your First Appointment', 'Prepare for your first Titanium Roots appointment.', 21)
on conflict (slug) do update set
  title = excluded.title,
  category = excluded.category,
  tags = excluded.tags,
  excerpt = excluded.excerpt,
  content_html = excluded.content_html,
  author_name = excluded.author_name,
  publish_at = excluded.publish_at,
  status = excluded.status,
  featured = excluded.featured,
  trending = excluded.trending,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  sort_order = excluded.sort_order
where public.blog_posts.updated_by is null;

commit;
