-- ========== FOUNDING 100 ==========

CREATE TABLE founding_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('visit', 'branch', 'reaction')),
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, activity_type, activity_date)
);

CREATE INDEX idx_founding_activity_user ON founding_activity(user_id);
CREATE INDEX idx_founding_activity_date ON founding_activity(user_id, activity_date);

ALTER TABLE founding_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "founding_activity_read" ON founding_activity FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "founding_activity_insert" ON founding_activity FOR INSERT WITH CHECK (user_id = auth.uid());

-- Founding 100 배지 테이블
CREATE TABLE founding_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  rank INT NOT NULL, -- 1~100
  qualified_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE founding_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "founding_members_read" ON founding_members FOR SELECT USING (true);

-- 현재 자격 현황을 쉽게 조회하는 뷰
CREATE OR REPLACE VIEW founding_progress AS
SELECT
  u.id AS user_id,
  -- 출석일수 (30일 내, 하루 1회 visit만 카운트)
  COUNT(DISTINCT CASE
    WHEN fa.activity_type = 'visit'
    AND fa.activity_date >= CURRENT_DATE - INTERVAL '30 days'
    THEN fa.activity_date
  END) AS visit_days,
  -- 브랜치 작성수
  COUNT(DISTINCT CASE WHEN fa.activity_type = 'branch' THEN fa.id END) AS branch_count,
  -- 반응/댓글수
  COUNT(DISTINCT CASE WHEN fa.activity_type = 'reaction' THEN fa.id END) AS reaction_count,
  -- 자격 여부
  CASE
    WHEN COUNT(DISTINCT CASE
      WHEN fa.activity_type = 'visit'
      AND fa.activity_date >= CURRENT_DATE - INTERVAL '30 days'
      THEN fa.activity_date END) >= 10
    AND COUNT(DISTINCT CASE WHEN fa.activity_type = 'branch' THEN fa.id END) >= 1
    AND COUNT(DISTINCT CASE WHEN fa.activity_type = 'reaction' THEN fa.id END) >= 3
    THEN true ELSE false
  END AS qualified,
  -- 이미 배지 받았는지
  EXISTS (SELECT 1 FROM founding_members fm WHERE fm.user_id = u.id) AS badge_granted
FROM users u
LEFT JOIN founding_activity fa ON fa.user_id = u.id
GROUP BY u.id;
