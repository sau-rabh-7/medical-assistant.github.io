-- Fix the trigger and function properly
DROP TRIGGER IF EXISTS set_patient_id ON public.patients;
DROP FUNCTION IF EXISTS public.generate_patient_id() CASCADE;

CREATE OR REPLACE FUNCTION public.generate_patient_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.patient_id IS NULL THEN
    NEW.patient_id := 'P' || LPAD(EXTRACT(EPOCH FROM NOW())::bigint::text, 10, '0') || SUBSTR(NEW.id::text, 1, 4);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_patient_id
  BEFORE INSERT ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_patient_id();