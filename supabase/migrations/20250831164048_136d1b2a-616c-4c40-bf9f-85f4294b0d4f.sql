-- Make patient_id have a default value so inserts work without specifying it
ALTER TABLE public.patients 
ALTER COLUMN patient_id SET DEFAULT ('P' || LPAD(EXTRACT(EPOCH FROM NOW())::bigint::text, 10, '0') || SUBSTR(gen_random_uuid()::text, 1, 4));