-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/pqvhwlflwodbpcmpzetk/sql/new

insert into public.blog_posts (title, slug, category, tags, excerpt, content_html, author_name, publish_at, status, featured, trending, seo_title, seo_description, sort_order)
values
  (
    'Why Regular Dental Check-Ups Matter More Than You Think',
    'why-regular-dental-checkups-matter',
    'Preventive Care',
    array['preventive care','check-ups','oral health','dental hygiene']::text[],
    'Many patients visit a dentist only when something hurts. But regular check-ups help catch problems early, when they are easiest and least expensive to treat.',
    '<p>Many patients visit a dentist only when something hurts. But waiting until a problem becomes painful often means waiting until it has grown significantly more complex.</p><h2>Early Detection of Problems</h2><p>Dental decay rarely causes pain in its earliest stages. By the time a cavity is painful, it has usually progressed enough to require more extensive treatment. A routine check-up can catch these issues when they are much smaller and simpler to manage.</p><h2>Oral Cancer Screening</h2><p>Your dentist will also screen for early signs of oral cancer — tissue changes that may not yet be causing discomfort. Like most cancers, oral cancer responds far better to treatment when detected at an early stage.</p><h2>Personalised Preventive Advice</h2><p>Your dental health is shaped by your habits, diet, bite, medications and medical history. A check-up lets your dentist offer specific guidance tailored to your actual circumstances.</p>',
    'Titanium Roots Editorial Team',
    '2026-08-01T09:00:00+05:30',
    'published',
    true,
    false,
    'Why Regular Dental Check-Ups Matter | Titanium Roots',
    'Understand the importance of regular dental check-ups — early problem detection, oral cancer screening, and personalised preventive care.',
    30
  ),
  (
    'Understanding Tooth Sensitivity: Causes, Management, and When to See a Dentist',
    'understanding-tooth-sensitivity',
    'Patient Education',
    array['tooth sensitivity','enamel','gum health','patient education']::text[],
    'A sharp twinge when drinking something cold or hot is one of the most common dental complaints. Understanding what causes it — and what to do about it — can save you from unnecessary discomfort.',
    '<p>Tooth sensitivity affects a large proportion of adults, yet it is often dismissed as simply the way things are. In most cases, it is not.</p><h2>What Causes Tooth Sensitivity?</h2><p>When enamel is worn away or gums recede, the dentine layer beneath becomes exposed. Dentine contains tiny channels that connect to the nerve of the tooth, allowing temperature changes to trigger a pain response.</p><ul><li>Enamel erosion from acidic foods and drinks</li><li>Gum recession due to aggressive brushing or gum disease</li><li>Tooth grinding (bruxism)</li><li>Cracked teeth</li><li>Recently completed dental treatment</li></ul><h2>Managing Sensitivity at Home</h2><p>Desensitising toothpastes containing potassium nitrate or stannous fluoride can provide meaningful relief when used consistently over several weeks.</p><h2>When Should You See a Dentist?</h2><p>If sensitivity is sharp, affects specific teeth, persists after the trigger is removed, or has appeared recently without explanation, a professional examination is recommended.</p>',
    'Titanium Roots Editorial Team',
    '2026-08-03T09:00:00+05:30',
    'published',
    true,
    false,
    'Understanding Tooth Sensitivity | Titanium Roots',
    'Learn what causes tooth sensitivity, how to manage it at home, and when a professional dental assessment is the right next step.',
    31
  )
on conflict (slug) do update set
  featured = excluded.featured,
  status   = excluded.status;
