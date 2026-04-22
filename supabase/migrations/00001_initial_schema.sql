-- Enable ltree extension for tree path management
CREATE EXTENSION IF NOT EXISTS ltree;

-- ========== ENUM TYPES ==========
CREATE TYPE project_category AS ENUM ('writing', 'music', 'comic', 'screenplay', 'lyrics');
CREATE TYPE license_type AS ENUM ('open', 'approval');
CREATE TYPE project_status AS ENUM ('draft', 'published');
CREATE TYPE branch_status AS ENUM ('draft', 'published');
CREATE TYPE contribution_role AS ENUM ('material', 'story', 'ending', 'expansion', 'edit', 'translation');
CREATE TYPE translator_type AS ENUM ('ai', 'human');
CREATE TYPE notification_type AS ENUM ('branch_added', 'comment', 'promotion', 'contribution', 'report_resolved');
CREATE TYPE report_status AS ENUM ('pending', 'resolved', 'dismissed');

-- ========== USERS ==========
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  provider TEXT NOT NULL DEFAULT 'google',
  locale TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========== PROJECTS ==========
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category project_category NOT NULL DEFAULT 'writing',
  description TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  license_type license_type NOT NULL DEFAULT 'open',
  status project_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_creator ON projects(creator_id);
CREATE INDEX idx_projects_category ON projects(category);
CREATE INDEX idx_projects_status ON projects(status);

-- ========== BRANCHES (Tree structure with ltree) ==========
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content JSONB,
  completion_percent INT NOT NULL DEFAULT 0 CHECK (completion_percent BETWEEN 0 AND 100),
  status branch_status NOT NULL DEFAULT 'draft',
  path LTREE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_branches_project ON branches(project_id);
CREATE INDEX idx_branches_parent ON branches(parent_branch_id);
CREATE INDEX idx_branches_author ON branches(author_id);
CREATE INDEX idx_branches_path ON branches USING GIST(path);

-- ========== CONTRIBUTIONS ==========
CREATE TABLE contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role contribution_role NOT NULL,
  ai_score REAL,
  confirmed_at TIMESTAMPTZ
);

CREATE INDEX idx_contributions_branch ON contributions(branch_id);
CREATE INDEX idx_contributions_user ON contributions(user_id);

-- ========== AI EVALUATIONS ==========
CREATE TABLE ai_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  commercial_score REAL,
  artistic_score REAL,
  summary_10lines TEXT,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_evaluations_branch ON ai_evaluations(branch_id);

-- ========== TRANSLATIONS ==========
CREATE TABLE translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL CHECK (source_type IN ('project', 'branch')),
  source_id UUID NOT NULL,
  language TEXT NOT NULL,
  translated_content JSONB NOT NULL,
  translator_type translator_type NOT NULL DEFAULT 'ai',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_translations_source ON translations(source_type, source_id);

-- ========== PROMOTIONS ==========
CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  payment_id TEXT,
  amount REAL NOT NULL DEFAULT 0
);

CREATE INDEX idx_promotions_branch ON promotions(branch_id);

-- ========== NOTIFICATIONS ==========
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  reference_id UUID,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE NOT read;

-- ========== REPORTS ==========
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status report_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reports_status ON reports(status);

-- ========== ROW LEVEL SECURITY ==========

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Users: read all, update own
CREATE POLICY "users_read" ON users FOR SELECT USING (true);
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update" ON users FOR UPDATE USING (auth.uid() = id);

-- Projects: read published, creator full access
CREATE POLICY "projects_read" ON projects FOR SELECT USING (status = 'published' OR creator_id = auth.uid());
CREATE POLICY "projects_insert" ON projects FOR INSERT WITH CHECK (creator_id = auth.uid());
CREATE POLICY "projects_update" ON projects FOR UPDATE USING (creator_id = auth.uid());
CREATE POLICY "projects_delete" ON projects FOR DELETE USING (creator_id = auth.uid());

-- Branches: read published, author full access
CREATE POLICY "branches_read" ON branches FOR SELECT USING (
  status = 'published' OR author_id = auth.uid()
);
CREATE POLICY "branches_insert" ON branches FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY "branches_update" ON branches FOR UPDATE USING (author_id = auth.uid());

-- Contributions: read all, insert/update by branch author or self
CREATE POLICY "contributions_read" ON contributions FOR SELECT USING (true);
CREATE POLICY "contributions_insert" ON contributions FOR INSERT WITH CHECK (user_id = auth.uid());

-- AI evaluations: read all
CREATE POLICY "ai_evaluations_read" ON ai_evaluations FOR SELECT USING (true);

-- Translations: read all
CREATE POLICY "translations_read" ON translations FOR SELECT USING (true);

-- Promotions: read all, insert own
CREATE POLICY "promotions_read" ON promotions FOR SELECT USING (true);
CREATE POLICY "promotions_insert" ON promotions FOR INSERT WITH CHECK (user_id = auth.uid());

-- Notifications: own only
CREATE POLICY "notifications_read" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Reports: insert own, read own
CREATE POLICY "reports_insert" ON reports FOR INSERT WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "reports_read" ON reports FOR SELECT USING (reporter_id = auth.uid());

-- ========== FUNCTIONS ==========

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, avatar_url, provider)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_app_meta_data->>'provider', 'google')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-set branch path on insert
CREATE OR REPLACE FUNCTION set_branch_path()
RETURNS TRIGGER AS $$
DECLARE
  parent_path LTREE;
  node_label TEXT;
BEGIN
  -- Convert UUID to valid ltree label (replace hyphens with underscores)
  node_label := replace(NEW.id::text, '-', '_');

  IF NEW.parent_branch_id IS NULL THEN
    NEW.path := node_label::LTREE;
  ELSE
    SELECT path INTO parent_path FROM branches WHERE id = NEW.parent_branch_id;
    NEW.path := parent_path || node_label::LTREE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_branch_path_trigger
  BEFORE INSERT ON branches
  FOR EACH ROW EXECUTE FUNCTION set_branch_path();

-- Auto-set author_id from auth context
CREATE OR REPLACE FUNCTION set_branch_author()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.author_id IS NULL THEN
    NEW.author_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_branch_author_trigger
  BEFORE INSERT ON branches
  FOR EACH ROW EXECUTE FUNCTION set_branch_author();

-- Notify on new branch (for realtime)
CREATE OR REPLACE FUNCTION notify_branch_added()
RETURNS TRIGGER AS $$
DECLARE
  project_creator UUID;
BEGIN
  SELECT creator_id INTO project_creator FROM projects WHERE id = NEW.project_id;

  IF project_creator IS DISTINCT FROM NEW.author_id THEN
    INSERT INTO notifications (user_id, type, reference_id)
    VALUES (project_creator, 'branch_added', NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_branch_created
  AFTER INSERT ON branches
  FOR EACH ROW EXECUTE FUNCTION notify_branch_added();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
