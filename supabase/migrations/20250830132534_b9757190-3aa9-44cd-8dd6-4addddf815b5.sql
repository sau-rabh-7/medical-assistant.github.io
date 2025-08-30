-- Fix security warnings by updating function search path
DROP FUNCTION IF EXISTS public.generate_patient_id();

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