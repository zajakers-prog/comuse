-- ========== LIKES ==========
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, project_id)
);

CREATE INDEX idx_likes_project ON likes(project_id);
CREATE INDEX idx_likes_user ON likes(user_id);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "likes_read" ON likes FOR SELECT USING (true);
CREATE POLICY "likes_insert" ON likes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "likes_delete" ON likes FOR DELETE USING (user_id = auth.uid());

-- ========== IP SALES ==========
CREATE TYPE ip_sale_status AS ENUM ('open', 'negotiating', 'sold', 'closed');

CREATE TABLE ip_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  listed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asking_price REAL,
  currency TEXT NOT NULL DEFAULT 'USD',
  description TEXT,
  status ip_sale_status NOT NULL DEFAULT 'open',
  buyer_name TEXT,
  sold_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ip_sales_project ON ip_sales(project_id);
CREATE INDEX idx_ip_sales_status ON ip_sales(status);

ALTER TABLE ip_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ip_sales_read" ON ip_sales FOR SELECT USING (true);
CREATE POLICY "ip_sales_insert" ON ip_sales FOR INSERT WITH CHECK (listed_by = auth.uid());
CREATE POLICY "ip_sales_update" ON ip_sales FOR UPDATE USING (listed_by = auth.uid());
CREATE POLICY "ip_sales_delete" ON ip_sales FOR DELETE USING (listed_by = auth.uid());
