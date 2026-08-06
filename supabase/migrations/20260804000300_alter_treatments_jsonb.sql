-- Migration to convert structured fields in public.treatments to jsonb and uuid[]
alter table public.treatments
  alter column benefits drop default,
  alter column benefits type jsonb using (
    case 
      when benefits is null or benefits = '' then '[]'::jsonb
      when jsonb_typeof(to_jsonb(benefits)) = 'array' then to_jsonb(benefits)
      when benefits ~ '^\[.*\]$' then benefits::jsonb
      else to_jsonb(string_to_array(benefits, ','))
    end
  ),
  alter column benefits set default '[]'::jsonb;

alter table public.treatments
  alter column procedure_steps drop default,
  alter column procedure_steps type jsonb using (
    case 
      when procedure_steps is null or procedure_steps = '' then '[]'::jsonb
      when procedure_steps ~ '^\[.*\]$' then procedure_steps::jsonb
      else jsonb_build_array(jsonb_build_object('title', 'Procedure Step', 'description', procedure_steps, 'duration', '', 'sortOrder', 1))
    end
  ),
  alter column procedure_steps set default '[]'::jsonb;

alter table public.treatments
  alter column clinical_references drop default,
  alter column clinical_references type jsonb using (
    case 
      when clinical_references is null or clinical_references = '{}' then '[]'::jsonb
      else to_jsonb(clinical_references)
    end
  ),
  alter column clinical_references set default '[]'::jsonb;

alter table public.treatments
  alter column additional_gallery drop default,
  alter column additional_gallery type jsonb using (
    case 
      when additional_gallery is null or additional_gallery = '{}' then '[]'::jsonb
      else to_jsonb(additional_gallery)
    end
  ),
  alter column additional_gallery set default '[]'::jsonb;

alter table public.treatments
  alter column related_treatment_ids drop default,
  alter column related_treatment_ids type uuid[] using (
    case
      when related_treatment_ids is null or related_treatment_ids = '{}' then '{}'::uuid[]
      else related_treatment_ids::uuid[]
    end
  ),
  alter column related_treatment_ids set default '{}'::uuid[];
