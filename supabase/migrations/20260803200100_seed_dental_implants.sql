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
values (
  'Dental Implants',
  'dental-implants',
  'Restorative dentistry',
  'A treatment option for replacing missing teeth with a stable, natural-looking result.',
  'Dental implants are discussed after a clinical assessment to understand your oral health, treatment goals and suitable restorative options.',
  'Timeline discussed after consultation',
  'Visits depend on treatment plan',
  'consultation_required',
  'Supports replacement of missing teeth, individual planning and clearly explained restorative options',
  'Suitability is confirmed after a clinical examination and treatment planning discussion.',
  'Assessment, planning, treatment stages and restoration are discussed with your dentist.',
  'Aftercare and recovery guidance depend on the treatment plan and are explained during consultation.',
  true,
  'published',
  20
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
where public.treatments.updated_by is null;

commit;
