alter table public.appointment_requests
add column message text not null default ''
check (char_length(message) <= 2000);

