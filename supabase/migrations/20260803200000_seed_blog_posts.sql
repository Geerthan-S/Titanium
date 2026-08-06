begin;

insert into public.blog_posts (
  title,
  slug,
  category,
  excerpt,
  content_html,
  author_name,
  tags,
  featured,
  status,
  publish_at,
  sort_order,
  reading_time_minutes,
  medical_disclaimer
) values
  (
    'Why Regular Dental Check-Ups Matter More Than You Think',
    'why-regular-dental-checkups-matter',
    'Preventive Care',
    'Many patients visit a dentist only when something hurts. But regular check-ups help catch problems early, when they are easiest and least expensive to treat.',
    '<p>Many patients visit a dentist only when something hurts. This is understandable — dental visits can feel daunting, and if there is no obvious pain, it is easy to push them aside. But waiting until a problem becomes painful often means waiting until it has grown significantly more complex.</p>
<p>Regular dental check-ups — typically recommended every six to twelve months — serve several important purposes beyond simply cleaning your teeth.</p>
<h2>Early Detection of Problems</h2>
<p>Dental decay rarely causes pain in its earliest stages. By the time a cavity is painful, it has usually progressed deep enough to require more extensive treatment — sometimes a root canal rather than a simple filling. A routine check-up can catch these issues when they are much smaller and far simpler to manage.</p>
<p>The same principle applies to gum disease. Early gum inflammation (gingivitis) is reversible with professional cleaning and improved home care. But if it advances to periodontitis, the damage to the underlying bone becomes irreversible. Routine assessments mean your dentist can identify early signs and step in before lasting harm occurs.</p>
<h2>Oral Cancer Screening</h2>
<p>During a routine examination, your dentist will also screen for early signs of oral cancer — abnormal tissue changes that may not yet be causing any discomfort. Like most cancers, oral cancer responds far better to treatment when detected at an early stage.</p>
<h2>Personalised Preventive Advice</h2>
<p>Your dental health is shaped by your habits, diet, bite pattern, medications, and medical history. A regular check-up gives your dentist the opportunity to understand your individual situation and offer specific guidance — advice that goes beyond generic brushing tips to address your actual circumstances.</p>
<h2>Managing Dental Anxiety</h2>
<p>For many patients, one of the greatest benefits of regular visits is comfort. When dental visits are infrequent, small problems tend to accumulate, making each visit feel more overwhelming. Regular check-ups — where each visit tends to be shorter and less involved — often help reduce dental anxiety over time.</p>
<p>If you have been avoiding your check-up, there is no judgment here. Our team is happy to discuss any concerns you have and work at a pace that feels manageable for you.</p>',
    'Titanium Roots Editorial Team',
    array['preventive care', 'check-ups', 'oral health', 'dental hygiene']::text[],
    true,
    'published',
    '2026-08-01T09:00:00+05:30',
    1,
    5,
    'This article is intended for general informational purposes only and does not constitute professional dental advice. Please consult a qualified dentist for recommendations specific to your oral health situation.'
  ),
  (
    'Understanding Tooth Sensitivity: Causes, Management, and When to See a Dentist',
    'understanding-tooth-sensitivity',
    'Patient Education',
    'A sharp twinge when drinking something cold or hot is one of the most common dental complaints. Understanding what causes sensitivity — and what to do about it — can save you from unnecessary discomfort.',
    '<p>A sharp twinge when drinking something cold, warm, or sweet is one of the most common reasons patients visit the dentist between regular check-ups. Tooth sensitivity affects a large proportion of adults at some point, yet it is often dismissed as simply "the way things are." In most cases, it is not.</p>
<h2>What Causes Tooth Sensitivity?</h2>
<p>The outer layer of your tooth — enamel — protects the more sensitive dentine layer beneath. When enamel is worn away or when the gum tissue recedes and exposes the root surface, the dentine becomes exposed. Dentine contains tiny channels that connect to the nerve of the tooth, allowing temperature changes and sweet or acidic stimuli to trigger a pain response.</p>
<p>Common causes of exposed dentine include:</p>
<ul>
<li>Enamel erosion from acidic foods and drinks</li>
<li>Gum recession due to aggressive brushing or gum disease</li>
<li>Tooth grinding (bruxism), which gradually wears down the enamel surface</li>
<li>Cracked teeth, where dentine becomes exposed along the fracture line</li>
<li>Recently completed dental treatment, which can cause temporary sensitivity</li>
</ul>
<h2>Managing Sensitivity at Home</h2>
<p>Desensitising toothpastes containing potassium nitrate or stannous fluoride can provide meaningful relief for many patients when used consistently over several weeks. Using a soft-bristled toothbrush and avoiding acidic or very cold food immediately after brushing are also helpful steps.</p>
<p>However, managing symptoms at home is not the same as addressing the underlying cause. If the enamel loss is continuing or the gum recession is progressing, the sensitivity is likely to worsen over time without professional assessment.</p>
<h2>When Should You See a Dentist?</h2>
<p>If sensitivity is sharp and immediate, affects specific teeth rather than being generalised, persists after the trigger is removed, or has appeared recently without an obvious explanation, a professional examination is recommended. These patterns can indicate a cavity, a cracked tooth, or gum disease — all of which require clinical management rather than desensitising toothpaste alone.</p>
<p>Tooth sensitivity is your teeth communicating that something has changed. With the right assessment, the cause can almost always be identified and addressed effectively.</p>',
    'Titanium Roots Editorial Team',
    array['tooth sensitivity', 'enamel', 'gum health', 'patient education', 'oral care']::text[],
    true,
    'published',
    '2026-08-03T09:00:00+05:30',
    2,
    6,
    'This article is intended for general informational purposes only and does not constitute professional dental advice. Please consult a qualified dentist for recommendations specific to your oral health situation.'
  )
on conflict (slug) do update set
  title       = excluded.title,
  category    = excluded.category,
  excerpt     = excluded.excerpt,
  content_html= excluded.content_html,
  featured    = excluded.featured,
  status      = excluded.status,
  publish_at  = excluded.publish_at,
  sort_order  = excluded.sort_order;

commit;
