/*
  # Create Community Bulletin Board

  1. New Tables
    - `community_posts`
      - `id` (uuid, primary key)
      - `senior_id` (uuid, references profiles) - Author of the post
      - `title` (text) - Post title
      - `content` (text) - Post content
      - `category` (text) - Type: question, story, recurring_help, announcement
      - `is_recurring` (boolean) - Whether this is a recurring help request
      - `recurrence_pattern` (text) - e.g., "weekly", "daily", "monthly"
      - `tags` (text array) - Related topics/keywords
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `community_comments`
      - `id` (uuid, primary key)
      - `post_id` (uuid, references community_posts)
      - `user_id` (uuid, references profiles) - Can be student or senior
      - `content` (text) - Comment text
      - `created_at` (timestamptz)

    - `community_reactions`
      - `id` (uuid, primary key)
      - `post_id` (uuid, references community_posts)
      - `user_id` (uuid, references profiles)
      - `reaction_type` (text) - e.g., "helpful", "heart", "thanks"
      - `created_at` (timestamptz)
      - Unique constraint on (post_id, user_id, reaction_type)

  2. Security
    - Enable RLS on all tables
    - Community posts viewable by all authenticated users
    - Only post authors can update/delete their posts
    - Comments can be added by anyone, deleted by author
    - Reactions can be added/removed by anyone
*/

-- Create community_posts table
CREATE TABLE IF NOT EXISTS community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL CHECK (category IN ('question', 'story', 'recurring_help', 'announcement')),
  is_recurring boolean DEFAULT false,
  recurrence_pattern text,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create community_comments table
CREATE TABLE IF NOT EXISTS community_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create community_reactions table
CREATE TABLE IF NOT EXISTS community_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reaction_type text NOT NULL CHECK (reaction_type IN ('helpful', 'heart', 'thanks')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id, reaction_type)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_community_posts_senior_id ON community_posts(senior_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_category ON community_posts(category);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_reactions_post_id ON community_reactions(post_id);

-- Enable RLS
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_posts

-- Anyone can view posts
CREATE POLICY "Anyone authenticated can view community posts"
  ON community_posts FOR SELECT
  TO authenticated
  USING (true);

-- Only seniors can create posts
CREATE POLICY "Seniors can create community posts"
  ON community_posts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'senior'
    )
    AND senior_id = auth.uid()
  );

-- Post authors can update their posts
CREATE POLICY "Post authors can update their posts"
  ON community_posts FOR UPDATE
  TO authenticated
  USING (senior_id = auth.uid())
  WITH CHECK (senior_id = auth.uid());

-- Post authors can delete their posts
CREATE POLICY "Post authors can delete their posts"
  ON community_posts FOR DELETE
  TO authenticated
  USING (senior_id = auth.uid());

-- RLS Policies for community_comments

-- Anyone can view comments
CREATE POLICY "Anyone authenticated can view comments"
  ON community_comments FOR SELECT
  TO authenticated
  USING (true);

-- Anyone can create comments
CREATE POLICY "Authenticated users can create comments"
  ON community_comments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Comment authors can delete their comments
CREATE POLICY "Comment authors can delete their comments"
  ON community_comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for community_reactions

-- Anyone can view reactions
CREATE POLICY "Anyone authenticated can view reactions"
  ON community_reactions FOR SELECT
  TO authenticated
  USING (true);

-- Anyone can add reactions
CREATE POLICY "Authenticated users can add reactions"
  ON community_reactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can remove their own reactions
CREATE POLICY "Users can remove their reactions"
  ON community_reactions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_community_post_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_community_posts_updated_at ON community_posts;
CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON community_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_community_post_updated_at();

GRANT ALL ON community_posts TO authenticated;
GRANT ALL ON community_comments TO authenticated;
GRANT ALL ON community_reactions TO authenticated;