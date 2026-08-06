-- Add missing columns to treatments table required by the record mappers
-- This completes the blueprint alignment schema migration

begin;

alter table public.treatments
  -- Content & description
  add column if not exists card_copy text not null default '',

  -- Suitability & candidates
  add column if not exists ideal_for text[] not null default '{}',
  add column if not exists not_ideal_for text[] not null default '{}',
  add column if not exists conditions_treated text[] not null default '{}',
  add column if not exists unsuitable_candidates text not null default '',
  add column if not exists alternative_names text[] not null default '{}',

  -- Clinical information
  add column if not exists materials_used text[] not null default '{}',
  add column if not exists risks_limitations text not null default '',
  add column if not exists assessment text not null default '',
  add column if not exists process text not null default '',
  add column if not exists anaesthesia_sedation text not null default '',
  add column if not exists expected_outcome text not null default '',
  add column if not exists expected_longevity text not null default '',
  add column if not exists alternative_treatments text not null default '',

  -- Patient preparation
  add column if not exists before_preparation text not null default '',
  add column if not exists when_contact_clinic text not null default '',
  add column if not exists when_book_consultation text not null default '',

  -- Pricing
  add column if not exists pricing_display_type text not null default 'consultation_required',
  add column if not exists min_price numeric(12,2),
  add column if not exists max_price numeric(12,2),
  add column if not exists currency text not null default 'INR',
  add column if not exists pricing_note text not null default '',
  add column if not exists price_verified_date text not null default '',

  -- Media & gallery
  add column if not exists gallery_asset_ids text[] not null default '{}',
  add column if not exists focal_x numeric(3,2) default 0.5,
  add column if not exists focal_y numeric(3,2) default 0.5,
  add column if not exists additional_gallery jsonb not null default '[]'::jsonb,
  add column if not exists before_after_gallery jsonb not null default '[]'::jsonb,
  add column if not exists before_after_consent boolean not null default false,

  -- Relationships
  add column if not exists doctor_ids text[] not null default '{}',
  add column if not exists article_ids text[] not null default '{}',
  add column if not exists related_treatment_ids text[] not null default '{}',
  add column if not exists concern_tags text[] not null default '{}',

  -- Content structure
  add column if not exists faq_json jsonb not null default '[]'::jsonb,

  -- Clinical review
  add column if not exists written_by text not null default '',
  add column if not exists clinically_reviewed_by text not null default '',
  add column if not exists reviewer_credentials text not null default '',
  add column if not exists reviewer_profile_id uuid references public.doctors(id) on delete set null,
  add column if not exists clinical_references jsonb not null default '[]'::jsonb,

  -- SEO & indexing
  add column if not exists canonical_url_override text not null default '',
  add column if not exists allow_search_indexing boolean not null default true,
  add column if not exists social_title text not null default '',
  add column if not exists social_description text not null default '',
  add column if not exists social_image text not null default '',
  add column if not exists primary_search_phrase text not null default '',
  add column if not exists secondary_search_phrases text[] not null default '{}',
  add column if not exists structured_data_type text not null default 'MedicalProcedure',
  add column if not exists structured_data_status text not null default 'Pending',
  add column if not exists sitemap_status text not null default 'Included';

commit;
