-- actress テーブル 取得効率化用インデックス
-- Supabase (PostgreSQL) 用

-- 1. 文字検索・並び替え: name (ilike検索 + ORDER BY name)
CREATE INDEX IF NOT EXISTS idx_actress_name ON actress (name);

-- 2. ふりがな検索: ruby (ilike検索)
CREATE INDEX IF NOT EXISTS idx_actress_ruby ON actress (ruby);

-- 3. 等価フィルタ: cup
CREATE INDEX IF NOT EXISTS idx_actress_cup ON actress (cup);

-- 4. 等価フィルタ: prefecture
CREATE INDEX IF NOT EXISTS idx_actress_prefecture ON actress (prefecture);

-- 5. 範囲フィルタ: birthday (gte/lte)
CREATE INDEX IF NOT EXISTS idx_actress_birthday ON actress (birthday);

-- 6. 範囲フィルタ: bust, waist, hip, height
CREATE INDEX IF NOT EXISTS idx_actress_bust ON actress (bust);
CREATE INDEX IF NOT EXISTS idx_actress_waist ON actress (waist);
CREATE INDEX IF NOT EXISTS idx_actress_hip ON actress (hip);
CREATE INDEX IF NOT EXISTS idx_actress_height ON actress (height);

-- 7. 並び替え: count DESC (searchActressesAdvanced)
CREATE INDEX IF NOT EXISTS idx_actress_count_desc ON actress (count DESC NULLS LAST);

-- 8. (オプション) ilike 前方一致/部分一致を高速化する場合は三重奏インデックス
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX IF NOT EXISTS idx_actress_name_trgm ON actress USING gin (name gin_trgm_ops);
-- CREATE INDEX IF NOT EXISTS idx_actress_ruby_trgm ON actress USING gin (ruby gin_trgm_ops);
