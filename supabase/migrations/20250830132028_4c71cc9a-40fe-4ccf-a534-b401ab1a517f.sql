-- Add patient_id field to patients table and update chat_sessions for better history
ALTER TABLE public.patients 
ADD COLUMN patient_id TEXT UNIQUE;

-- Create a unique patient ID for existing patients
UPDATE public.patients 
SET patient_id = 'P' || LPAD(EXTRACT(EPOCH FROM created_at)::bigint::text, 10, '0') || SUBSTR(id::text, 1, 4)
WHERE patient_id IS NULL;

-- Make patient_id required going forward
ALTER TABLE public.patients 
ALTER COLUMN patient_id SET NOT NULL;

-- Create an index for faster patient searches
CREATE INDEX idx_patients_search ON public.patients (name, patient_id);
CREATE INDEX idx_patients_user_id ON public.patients (user_id);

-- Update chat_sessions to properly reference patients by UUID
-- Add index for better performance
CREATE INDEX idx_chat_sessions_patient_user ON public.chat_sessions (patient_id, user_id);
CREATE INDEX idx_messages_session_created ON public.messages (chat_session_id, created_at);

-- Add trigger to auto-generate patient_id for new patients
CREATE OR REPLACE FUNCTION public.generate_patient_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.patient_id IS NULL THEN
    NEW.patient_id := 'P' || LPAD(EXTRACT(EPOCH FROM NOW())::bigint::text, 10, '0') || SUBSTR(NEW.id::text, 1, 4);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_patient_id
  BEFORE INSERT ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_patient_id();