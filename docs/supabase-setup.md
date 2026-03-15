# Supabase Setup Guide

This document describes the Supabase configuration required for the PetaKarta user data upload feature.

## Prerequisites

- A Supabase project
- Environment variables configured in `.env`:
  ```
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-key
  ```

---

## 1. Database: Datasets Table

Run this SQL in the Supabase SQL Editor to create the `datasets` table:

```sql
-- Create datasets table for storing user-uploaded GeoJSON metadata
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
```

---

## 2. Storage: Create Bucket

1. Go to **Storage** in the Supabase Dashboard
2. Click **New bucket**
3. Configure:
   - **Name**: `dataset`
   - **Public bucket**: OFF (unchecked)
4. Click **Create bucket**

---

## 3. Storage: RLS Policies

Run this SQL to set up storage access policies:

```sql
-- Storage policies for the 'dataset' bucket

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'dataset' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to read their own files
CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'dataset' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'dataset' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'dataset' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## Storage Structure

Files are stored with the following path structure:

```
dataset/{user_id}/{dataset_id}.geojson
```

Example:
```
dataset/a1b2c3d4-e5f6-7890-abcd-ef1234567890/f9e8d7c6-b5a4-3210-fedc-ba0987654321.geojson
```

This structure ensures:
- Each user can only access their own folder
- Files are uniquely identified by dataset UUID
- RLS policies can verify ownership via the folder name

---

## Verification

To verify the setup is working:

1. **Check datasets table exists:**
   ```sql
   SELECT * FROM public.datasets LIMIT 1;
   ```

2. **Check storage bucket exists:**
   - Go to Storage in Dashboard
   - Verify `dataset` bucket is listed

3. **Test upload:**
   - Sign in to the app
   - Go to Datasets tab
   - Upload a GeoJSON file
   - Verify it appears in the dataset list and on the map
