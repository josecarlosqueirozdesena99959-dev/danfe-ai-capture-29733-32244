-- Create table to store extracted DANFE data with access codes
CREATE TABLE public.danfe_extractions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  access_code TEXT NOT NULL UNIQUE,
  chave TEXT NOT NULL,
  empresa TEXT,
  numero TEXT,
  data_emissao TEXT,
  valor_total TEXT,
  image_data TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Enable Row Level Security
ALTER TABLE public.danfe_extractions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert (for mobile uploads)
CREATE POLICY "Anyone can insert extractions" 
ON public.danfe_extractions 
FOR INSERT 
WITH CHECK (true);

-- Create policy to allow anyone to read (for desktop access with code)
CREATE POLICY "Anyone can read extractions" 
ON public.danfe_extractions 
FOR SELECT 
USING (true);

-- Create index for faster code lookups
CREATE INDEX idx_danfe_extractions_access_code ON public.danfe_extractions(access_code);

-- Create index for cleanup of expired records
CREATE INDEX idx_danfe_extractions_expires_at ON public.danfe_extractions(expires_at);

-- Function to clean up expired records
CREATE OR REPLACE FUNCTION public.cleanup_expired_extractions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.danfe_extractions
  WHERE expires_at < now();
END;
$$;