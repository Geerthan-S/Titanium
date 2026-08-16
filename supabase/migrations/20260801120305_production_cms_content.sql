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
  (
    'Preventive Dental Care',
    'preventive-dental-care',
    'Preventive dentistry',
    'General examinations, preventive guidance and fluoride or home-care advice tailored after assessment.',
    'Preventive dental care begins with a general examination and a discussion of current concerns and routines. Where clinically appropriate, the visit may include preventive guidance, fluoride advice and practical home-care recommendations. Any next steps are explained after the assessment.',
    'Varies according to assessment',
    'Review interval is individual',
    'consultation_required',
    'Supports early discussion of dental concerns and an individual preventive care plan.',
    'For patients seeking a general examination, prevention advice or a review of home-care routines.',
    'Discuss concerns and history; examine the teeth and gums; review relevant findings; agree appropriate preventive guidance and follow-up.',
    'Most routine assessments do not require recovery time. Individual advice is provided when an additional procedure is recommended.',
    true,
    'published',
    7
  ),
  (
    'Gum Health Care',
    'gum-health-care',
    'Periodontal care',
    'Assessment of the teeth, gums and supporting tissues with cleaning, home-care and follow-up guidance.',
    'Gum health care includes an assessment of the teeth, gums and supporting tissues. Findings guide any appropriate cleaning, tailored home-care advice and follow-up planning. The type and timing of care depend on individual clinical needs.',
    'Varies according to assessment',
    'May require review visits',
    'consultation_required',
    'Helps patients understand gum health findings and the care options that may support ongoing maintenance.',
    'For patients with gum concerns or those advised to have their periodontal health reviewed.',
    'Discuss symptoms and history; assess the teeth, gums and supporting tissues; explain findings; plan suitable cleaning, home care and follow-up.',
    'Some temporary tenderness may occur after cleaning. The clinical team provides advice based on the care performed.',
    false,
    'published',
    8
  ),
  (
    'Urgent Dental Assessment',
    'urgent-dental-assessment',
    'Urgent dentistry',
    'Prompt assessment of dental pain, swelling or a damaged tooth, with advice based on the findings.',
    'An urgent dental assessment focuses on dental pain, swelling, a damaged tooth or another immediate concern. The clinician reviews symptoms, examines the area and explains appropriate next steps. This service is not a substitute for hospital emergency services; severe swelling affecting breathing or swallowing, major facial injury or other life-threatening symptoms require emergency medical care.',
    'Depends on the urgent concern',
    'Further visits may be needed',
    'consultation_required',
    'Provides a focused clinical assessment and a clear discussion of suitable next steps.',
    'For patients with dental pain, swelling, a damaged tooth or another concern that needs prompt assessment.',
    'Review symptoms and relevant history; examine the affected area; use diagnostic tests only when useful; discuss immediate advice and further care.',
    'Recovery depends on the condition identified and any care provided. Follow the individual instructions given after assessment.',
    false,
    'published',
    9
  )
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
where
  public.treatments.updated_by is null
  and (
    public.treatments.name is distinct from excluded.name
    or public.treatments.short_description is distinct from excluded.short_description
    or public.treatments.full_description is distinct from excluded.full_description
    or public.treatments.status is distinct from excluded.status
  );

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
  (
    'What to Expect at a Routine Dental Check-up',
    'what-to-expect-at-a-routine-dental-check-up',
    'Patient Guides',
    array['dental check-up', 'patient guide', 'preventive care']::text[],
    'A practical guide to sharing concerns, having a dental examination and understanding possible next steps.',
    '<h2>Start with your concerns and history</h2><p>A routine check-up usually begins with a conversation about symptoms, changes you have noticed, previous dental care and relevant health information. Sharing what matters to you helps the clinical team focus the visit and understand your priorities.</p><h2>The examination</h2><p>The clinician will examine your teeth, gums and mouth. Imaging or other diagnostic checks may be suggested when they are useful for answering a clinical question; they are not automatically required at every visit. Findings should be explained in clear language, including areas that can be monitored.</p><h2>Discussing the plan</h2><p>If care is recommended, you can discuss reasonable options, expected timelines and likely costs before deciding how to proceed. The appropriate approach depends on the examination and your circumstances, and you can ask questions or request time to consider the information.</p>',
    'Titanium Roots Clinical Team',
    '2026-08-01T03:30:00Z'::timestamptz,
    'published',
    true,
    false,
    'What to Expect at a Routine Dental Check-up',
    'Learn how concerns, examination findings and care options are discussed during a routine dental check-up.',
    1
  ),
  (
    'Daily Habits That Support Healthy Teeth and Gums',
    'daily-habits-for-healthy-teeth-and-gums',
    'Oral Health',
    array['oral health', 'home care', 'healthy habits']::text[],
    'Everyday brushing, interdental care and awareness can support teeth and gums between dental visits.',
    '<h2>Build a consistent brushing routine</h2><p>Brush carefully with fluoride toothpaste as advised for your age and individual needs. A consistent technique matters more than rushing, and your dental team can demonstrate how to reach areas that are easy to miss.</p><h2>Clean between the teeth</h2><p>Interdental brushes, floss or another recommended aid can help clean surfaces a toothbrush may not reach. The most suitable method and size vary, so ask for individual guidance if you are unsure or if cleaning causes persistent discomfort.</p><h2>Notice changes</h2><p>Pay attention to bleeding, soreness, swelling, persistent bad breath, sensitivity or changes in a tooth or restoration. Arrange an assessment when something is new, persistent or worsening rather than relying on home care alone.</p><h2>Plan reviews around your needs</h2><p>Dental review intervals are individual. Your clinician may suggest timing based on oral health, risk factors, previous findings and current care needs rather than using the same schedule for everyone.</p>',
    'Titanium Roots Clinical Team',
    '2026-08-02T03:30:00Z'::timestamptz,
    'published',
    true,
    true,
    'Daily Habits for Healthy Teeth and Gums',
    'Explore practical brushing, interdental care and monitoring habits that can support oral health between reviews.',
    2
  ),
  (
    'Understanding Tooth Sensitivity',
    'understanding-tooth-sensitivity',
    'Dental Education',
    array['tooth sensitivity', 'dental symptoms', 'patient education']::text[],
    'Understand common sensitivity triggers, why assessment matters and which symptoms need urgent attention.',
    '<h2>Common triggers</h2><p>Tooth sensitivity may feel like a brief sharp sensation with cold, heat, sweet foods, touch or brushing. Keeping a note of the trigger, location, duration and any recent dental changes can help during an assessment.</p><h2>Possible causes vary</h2><p>Sensitivity can be associated with exposed tooth surfaces, wear, decay, a crack, gum changes or a recent dental procedure, among other causes. Similar symptoms can have different explanations, so a clinical assessment is needed to identify appropriate care.</p><h2>When to seek help</h2><p>Arrange a dental assessment if sensitivity persists, worsens, interrupts sleep or is linked with pain on biting. Seek urgent help for facial swelling, fever, difficulty breathing or swallowing, significant injury or uncontrolled bleeding.</p><h2>Avoid unsafe home remedies</h2><p>Do not place medication directly on a tooth or gum, because it may irritate or damage the tissues. Until you are assessed, avoid known triggers where practical and use oral-care products only as directed.</p>',
    'Titanium Roots Clinical Team',
    '2026-08-03T03:30:00Z'::timestamptz,
    'published',
    false,
    true,
    'Understanding Tooth Sensitivity',
    'Learn about sensitivity triggers, possible causes, assessment and symptoms that may require urgent dental care.',
    3
  )
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
where
  public.blog_posts.updated_by is null
  and (
    public.blog_posts.title is distinct from excluded.title
    or public.blog_posts.content_html is distinct from excluded.content_html
    or public.blog_posts.status is distinct from excluded.status
  );

insert into public.seo_pages (
  route,
  meta_title,
  meta_description,
  canonical_url,
  og_title,
  og_description,
  should_index,
  should_follow,
  include_in_sitemap
)
values
  (
    '/testimonials.html',
    'Patient Testimonials | Titanium Roots',
    'Read consent-approved patient feedback published by Titanium Roots Dental Clinic.',
    'https://titaniumroots.com/testimonials.html',
    'Patient Testimonials | Titanium Roots',
    'Patient feedback appears after consent and clinic approval.',
    true,
    true,
    true
  ),
  (
    '/blog.html',
    'Dental Care Articles | Titanium Roots',
    'Read practical dental-care guidance and patient education from the Titanium Roots Clinical Team.',
    'https://titaniumroots.com/blog.html',
    'Dental Care Articles | Titanium Roots',
    'Practical dental-care guidance and patient education from the Titanium Roots Clinical Team.',
    true,
    true,
    true
  )
on conflict (route) do update set
  meta_title = excluded.meta_title,
  meta_description = excluded.meta_description,
  canonical_url = excluded.canonical_url,
  og_title = excluded.og_title,
  og_description = excluded.og_description,
  should_index = excluded.should_index,
  should_follow = excluded.should_follow,
  include_in_sitemap = excluded.include_in_sitemap
where
  public.seo_pages.updated_by is null
  and (
    public.seo_pages.meta_title is distinct from excluded.meta_title
    or public.seo_pages.meta_description is distinct from excluded.meta_description
    or public.seo_pages.canonical_url is distinct from excluded.canonical_url
  );

update public.site_settings
set
  homepage = homepage || '{"ctaText":"Book a dental consultation","featuredTreatmentCount":6,"featuredDoctorCount":4}'::jsonb,
  footer = footer || '{"description":"Clear dental guidance, considered treatment planning and patient-focused care.","newsletterText":"Occasional oral-health guidance and clinic updates."}'::jsonb,
  message_templates = message_templates || '{"appointmentMessage":"Hello, I would like to request a dental appointment.","enquiryMessage":"Hello, I have a question about dental care."}'::jsonb
where id = 'primary';

commit;
