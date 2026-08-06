-- Fix: Add 'archive' to the allowed actions in cms_audit_log
-- This action is used when soft-deleting records (doctors, treatments, blogs, etc.)

begin;

-- Drop the existing check constraint
alter table public.cms_audit_log
drop constraint if exists cms_audit_log_action_check;

-- Add the updated check constraint with 'archive' included
alter table public.cms_audit_log
add constraint cms_audit_log_action_check
check (action in ('insert', 'update', 'delete', 'archive', 'publish', 'unpublish', 'approve', 'reject'));

commit;
