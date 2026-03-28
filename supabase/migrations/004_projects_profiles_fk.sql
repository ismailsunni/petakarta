-- Add foreign key from projects.user_id to profiles.id
-- This enables Supabase PostgREST to auto-detect the join for gallery queries
ALTER TABLE projects
  ADD CONSTRAINT projects_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id);
