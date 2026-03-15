-- Datasets table for storing user-uploaded GeoJSON metadata
-- Run this migration in your Supabase SQL Editor

-- Create datasets table
CREATE TABLE IF NOT EXISTS public.datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  geometry_type TEXT,
  bbox JSONB,
  feature_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries by owner
CREATE INDEX IF NOT EXISTS idx_datasets_owner ON public.datasets(owner);

-- Enable Row Level Security
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own datasets
CREATE POLICY "Users can view their own datasets"
  ON public.datasets
  FOR SELECT
  USING (auth.uid() = owner);

-- Policy: Users can insert their own datasets
CREATE POLICY "Users can insert their own datasets"
  ON public.datasets
  FOR INSERT
  WITH CHECK (auth.uid() = owner);

-- Policy: Users can update their own datasets
CREATE POLICY "Users can update their own datasets"
  ON public.datasets
  FOR UPDATE
  USING (auth.uid() = owner);

-- Policy: Users can delete their own datasets
CREATE POLICY "Users can delete their own datasets"
  ON public.datasets
  FOR DELETE
  USING (auth.uid() = owner);

-- Storage bucket setup (run these in Supabase Dashboard -> Storage)
-- 1. Create a bucket called "datasets"
-- 2. Add the following policies:

-- Storage policy for uploads (insert):
-- Name: "Users can upload datasets"
-- Allowed operation: INSERT
-- Target roles: authenticated
-- Policy: bucket_id = 'datasets' AND (storage.foldername(name))[1] = auth.uid()::text

-- Storage policy for downloads (select):
-- Name: "Users can download their datasets"
-- Allowed operation: SELECT
-- Target roles: authenticated
-- Policy: bucket_id = 'datasets' AND (storage.foldername(name))[1] = auth.uid()::text

-- Storage policy for delete:
-- Name: "Users can delete their datasets"
-- Allowed operation: DELETE
-- Target roles: authenticated
-- Policy: bucket_id = 'datasets' AND (storage.foldername(name))[1] = auth.uid()::text
