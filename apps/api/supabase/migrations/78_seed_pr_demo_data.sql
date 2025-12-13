/**
 * Migration 78: Seed PR Demo Data (Sprint S97)
 *
 * Populates initial PR Intelligence data for demo organizations:
 * - Media outlets (real publications)
 * - Journalist profiles (realistic contacts)
 * - Media monitoring articles (coverage records)
 * - Earned mentions (brand mentions in articles)
 *
 * This data enables the PR pillar to function as a real PR system.
 */

-- =============================================
-- Helper function to get demo org ID
-- Creates demo org if it doesn't exist
-- =============================================
DO $$
DECLARE
  v_demo_org_id UUID;
  v_techcrunch_id UUID;
  v_forbes_id UUID;
  v_wsj_id UUID;
  v_bloomberg_id UUID;
  v_reuters_id UUID;
  v_theverge_id UUID;
  v_wired_id UUID;
  v_venturebeat_id UUID;
  v_techradar_id UUID;
  v_zdnet_id UUID;
  v_source_tc_id UUID;
  v_source_forbes_id UUID;
  v_source_verge_id UUID;
  v_article_1_id UUID;
  v_article_2_id UUID;
  v_article_3_id UUID;
  v_article_4_id UUID;
  v_article_5_id UUID;
  v_journalist_1_id UUID;
  v_journalist_2_id UUID;
  v_journalist_3_id UUID;
  v_journalist_4_id UUID;
  v_journalist_5_id UUID;
  v_journalist_6_id UUID;
  v_journalist_7_id UUID;
  v_journalist_8_id UUID;
  v_journalist_9_id UUID;
  v_journalist_10_id UUID;
BEGIN
  -- Get or create demo org
  SELECT id INTO v_demo_org_id FROM orgs WHERE slug = 'demo' LIMIT 1;

  IF v_demo_org_id IS NULL THEN
    INSERT INTO orgs (name, slug)
    VALUES ('Demo Organization', 'demo')
    RETURNING id INTO v_demo_org_id;
  END IF;

  -- =============================================
  -- MEDIA OUTLETS (Real Publications)
  -- =============================================

  -- Insert media outlets (skip if already exists)
  INSERT INTO media_outlets (id, org_id, name, domain, outlet_type, tier, reach_estimate, metadata)
  VALUES
    (gen_random_uuid(), v_demo_org_id, 'TechCrunch', 'techcrunch.com', 'blog', 'tier1', 18000000, '{"category": "technology", "headquarters": "San Francisco"}'),
    (gen_random_uuid(), v_demo_org_id, 'Forbes', 'forbes.com', 'magazine', 'tier1', 140000000, '{"category": "business", "headquarters": "Jersey City"}'),
    (gen_random_uuid(), v_demo_org_id, 'Wall Street Journal', 'wsj.com', 'newspaper', 'tier1', 45000000, '{"category": "finance", "headquarters": "New York"}'),
    (gen_random_uuid(), v_demo_org_id, 'Bloomberg', 'bloomberg.com', 'newspaper', 'tier1', 96000000, '{"category": "finance", "headquarters": "New York"}'),
    (gen_random_uuid(), v_demo_org_id, 'Reuters', 'reuters.com', 'newspaper', 'tier1', 200000000, '{"category": "news", "headquarters": "London"}'),
    (gen_random_uuid(), v_demo_org_id, 'The Verge', 'theverge.com', 'blog', 'tier2', 10000000, '{"category": "technology", "headquarters": "New York"}'),
    (gen_random_uuid(), v_demo_org_id, 'Wired', 'wired.com', 'magazine', 'tier2', 25000000, '{"category": "technology", "headquarters": "San Francisco"}'),
    (gen_random_uuid(), v_demo_org_id, 'VentureBeat', 'venturebeat.com', 'blog', 'tier2', 8000000, '{"category": "technology", "headquarters": "San Francisco"}'),
    (gen_random_uuid(), v_demo_org_id, 'TechRadar', 'techradar.com', 'blog', 'tier2', 70000000, '{"category": "technology", "headquarters": "Bath, UK"}'),
    (gen_random_uuid(), v_demo_org_id, 'ZDNet', 'zdnet.com', 'blog', 'tier2', 30000000, '{"category": "technology", "headquarters": "San Francisco"}')
  ON CONFLICT DO NOTHING;

  -- Get outlet IDs for journalist association
  SELECT id INTO v_techcrunch_id FROM media_outlets WHERE org_id = v_demo_org_id AND domain = 'techcrunch.com' LIMIT 1;
  SELECT id INTO v_forbes_id FROM media_outlets WHERE org_id = v_demo_org_id AND domain = 'forbes.com' LIMIT 1;
  SELECT id INTO v_wsj_id FROM media_outlets WHERE org_id = v_demo_org_id AND domain = 'wsj.com' LIMIT 1;
  SELECT id INTO v_bloomberg_id FROM media_outlets WHERE org_id = v_demo_org_id AND domain = 'bloomberg.com' LIMIT 1;
  SELECT id INTO v_reuters_id FROM media_outlets WHERE org_id = v_demo_org_id AND domain = 'reuters.com' LIMIT 1;
  SELECT id INTO v_theverge_id FROM media_outlets WHERE org_id = v_demo_org_id AND domain = 'theverge.com' LIMIT 1;
  SELECT id INTO v_wired_id FROM media_outlets WHERE org_id = v_demo_org_id AND domain = 'wired.com' LIMIT 1;
  SELECT id INTO v_venturebeat_id FROM media_outlets WHERE org_id = v_demo_org_id AND domain = 'venturebeat.com' LIMIT 1;
  SELECT id INTO v_techradar_id FROM media_outlets WHERE org_id = v_demo_org_id AND domain = 'techradar.com' LIMIT 1;
  SELECT id INTO v_zdnet_id FROM media_outlets WHERE org_id = v_demo_org_id AND domain = 'zdnet.com' LIMIT 1;

  -- =============================================
  -- JOURNALIST PROFILES (Realistic Contacts)
  -- =============================================

  -- Insert journalist profiles
  INSERT INTO journalist_profiles (id, org_id, full_name, primary_email, primary_outlet, beat, twitter_handle, engagement_score, responsiveness_score, relevance_score, last_activity_at, metadata)
  VALUES
    (gen_random_uuid(), v_demo_org_id, 'Maria Rodriguez', 'maria.rodriguez@techcrunch.com', 'TechCrunch', 'Enterprise', '@mariarodriguez', 0.85, 0.72, 0.91, NOW() - INTERVAL '2 days', '{"topics": ["SaaS", "Cloud", "AI"], "articles_count": 342}'),
    (gen_random_uuid(), v_demo_org_id, 'James Chen', 'james.chen@forbes.com', 'Forbes', 'Technology', '@jameschen_tech', 0.78, 0.65, 0.88, NOW() - INTERVAL '5 days', '{"topics": ["Startups", "VC", "IPOs"], "articles_count": 567}'),
    (gen_random_uuid(), v_demo_org_id, 'Emily Watson', 'emily.watson@wsj.com', 'Wall Street Journal', 'Tech & Finance', '@emilywatson_wsj', 0.92, 0.58, 0.95, NOW() - INTERVAL '1 day', '{"topics": ["Tech Stocks", "M&A", "Earnings"], "articles_count": 891}'),
    (gen_random_uuid(), v_demo_org_id, 'David Kim', 'david.kim@bloomberg.com', 'Bloomberg', 'AI & Machine Learning', '@davidkim_ai', 0.88, 0.81, 0.93, NOW() - INTERVAL '3 days', '{"topics": ["AI", "ML", "Automation"], "articles_count": 234}'),
    (gen_random_uuid(), v_demo_org_id, 'Sarah Thompson', 'sarah.thompson@reuters.com', 'Reuters', 'Technology', '@sthompson_reuters', 0.75, 0.70, 0.82, NOW() - INTERVAL '4 days', '{"topics": ["Big Tech", "Regulation", "Privacy"], "articles_count": 678}'),
    (gen_random_uuid(), v_demo_org_id, 'Alex Morgan', 'alex.morgan@theverge.com', 'The Verge', 'Consumer Tech', '@alexmorgan_verge', 0.82, 0.88, 0.79, NOW() - INTERVAL '1 day', '{"topics": ["Gadgets", "Reviews", "Apple"], "articles_count": 445}'),
    (gen_random_uuid(), v_demo_org_id, 'Michael Park', 'michael.park@wired.com', 'Wired', 'Cybersecurity', '@mpark_wired', 0.79, 0.62, 0.86, NOW() - INTERVAL '6 days', '{"topics": ["Security", "Hacking", "Privacy"], "articles_count": 312}'),
    (gen_random_uuid(), v_demo_org_id, 'Jessica Lee', 'jessica.lee@venturebeat.com', 'VentureBeat', 'AI & Startups', '@jesslee_vb', 0.84, 0.77, 0.90, NOW() - INTERVAL '2 days', '{"topics": ["AI Startups", "Funding", "Enterprise AI"], "articles_count": 523}'),
    (gen_random_uuid(), v_demo_org_id, 'Robert Davis', 'robert.davis@techradar.com', 'TechRadar', 'Enterprise Software', '@rdavis_techradar', 0.71, 0.69, 0.75, NOW() - INTERVAL '7 days', '{"topics": ["Software Reviews", "Productivity", "Cloud"], "articles_count": 867}'),
    (gen_random_uuid(), v_demo_org_id, 'Amanda Wilson', 'amanda.wilson@zdnet.com', 'ZDNet', 'Cloud & Infrastructure', '@awilson_zdnet', 0.76, 0.73, 0.84, NOW() - INTERVAL '3 days', '{"topics": ["AWS", "Azure", "DevOps"], "articles_count": 432}')
  ON CONFLICT (org_id, primary_email) DO NOTHING;

  -- Get journalist IDs for article references
  SELECT id INTO v_journalist_1_id FROM journalist_profiles WHERE org_id = v_demo_org_id AND primary_email = 'maria.rodriguez@techcrunch.com' LIMIT 1;
  SELECT id INTO v_journalist_2_id FROM journalist_profiles WHERE org_id = v_demo_org_id AND primary_email = 'james.chen@forbes.com' LIMIT 1;
  SELECT id INTO v_journalist_3_id FROM journalist_profiles WHERE org_id = v_demo_org_id AND primary_email = 'emily.watson@wsj.com' LIMIT 1;
  SELECT id INTO v_journalist_4_id FROM journalist_profiles WHERE org_id = v_demo_org_id AND primary_email = 'david.kim@bloomberg.com' LIMIT 1;
  SELECT id INTO v_journalist_5_id FROM journalist_profiles WHERE org_id = v_demo_org_id AND primary_email = 'sarah.thompson@reuters.com' LIMIT 1;
  SELECT id INTO v_journalist_6_id FROM journalist_profiles WHERE org_id = v_demo_org_id AND primary_email = 'alex.morgan@theverge.com' LIMIT 1;

  -- =============================================
  -- MEDIA MONITORING SOURCES
  -- =============================================

  INSERT INTO media_monitoring_sources (id, org_id, name, url, description, active, source_type, crawl_frequency_hours, metadata)
  VALUES
    (gen_random_uuid(), v_demo_org_id, 'TechCrunch RSS', 'https://techcrunch.com/feed/', 'TechCrunch main feed', true, 'rss', 1, '{"category": "tech"}'),
    (gen_random_uuid(), v_demo_org_id, 'Forbes Tech', 'https://www.forbes.com/technology/feed/', 'Forbes technology section', true, 'rss', 2, '{"category": "tech"}'),
    (gen_random_uuid(), v_demo_org_id, 'The Verge', 'https://www.theverge.com/rss/index.xml', 'The Verge main feed', true, 'rss', 1, '{"category": "tech"}')
  ON CONFLICT DO NOTHING;

  -- Get source IDs
  SELECT id INTO v_source_tc_id FROM media_monitoring_sources WHERE org_id = v_demo_org_id AND name = 'TechCrunch RSS' LIMIT 1;
  SELECT id INTO v_source_forbes_id FROM media_monitoring_sources WHERE org_id = v_demo_org_id AND name = 'Forbes Tech' LIMIT 1;
  SELECT id INTO v_source_verge_id FROM media_monitoring_sources WHERE org_id = v_demo_org_id AND name = 'The Verge' LIMIT 1;

  -- =============================================
  -- MEDIA MONITORING ARTICLES (Coverage Records)
  -- =============================================

  INSERT INTO media_monitoring_articles (id, org_id, source_id, url, title, author, published_at, content, summary, relevance_score, keywords, domain_authority, word_count, metadata)
  VALUES
    (gen_random_uuid(), v_demo_org_id, v_source_tc_id, 'https://techcrunch.com/2024/12/10/enterprise-ai-adoption-accelerates/', 'Enterprise AI Adoption Accelerates in 2024', 'Maria Rodriguez', NOW() - INTERVAL '2 days', 'Enterprise companies are rapidly adopting AI solutions, with deployment rates up 45% year-over-year. Leading the charge are cloud-native platforms that offer seamless integration with existing workflows. Industry analysts predict this trend will continue through 2025 as organizations seek competitive advantages through automation and intelligent decision-making.', 'AI adoption in enterprise continues strong growth trajectory with 45% YoY increase.', 0.92, ARRAY['AI', 'Enterprise', 'Automation', 'Cloud'], 92, 1250, '{"sentiment": "positive", "reach_estimate": 450000}'),
    (gen_random_uuid(), v_demo_org_id, v_source_forbes_id, 'https://forbes.com/sites/technology/2024/12/09/startup-funding-q4-report/', 'Q4 2024 Startup Funding: AI Dominates', 'James Chen', NOW() - INTERVAL '3 days', 'Venture capital investment in Q4 2024 shows AI startups capturing 62% of total funding. Series B rounds saw particular strength, with average deal sizes increasing 28% from Q3. Late-stage companies preparing for 2025 IPOs are drawing significant investor attention.', 'AI startups dominate Q4 2024 VC funding with 62% of total investment.', 0.88, ARRAY['VC', 'Startups', 'Funding', 'AI'], 95, 980, '{"sentiment": "positive", "reach_estimate": 2100000}'),
    (gen_random_uuid(), v_demo_org_id, v_source_tc_id, 'https://techcrunch.com/2024/12/08/saas-market-consolidation/', 'SaaS Market Sees Major Consolidation Wave', 'Maria Rodriguez', NOW() - INTERVAL '4 days', 'The SaaS industry is experiencing unprecedented consolidation as larger players acquire smaller competitors. This week alone saw three major acquisitions totaling over $2 billion in combined deal value. Analysts suggest this trend reflects maturation of the cloud software market.', 'SaaS market consolidation accelerates with $2B+ in weekly acquisitions.', 0.85, ARRAY['SaaS', 'M&A', 'Cloud', 'Acquisitions'], 92, 1100, '{"sentiment": "neutral", "reach_estimate": 380000}'),
    (gen_random_uuid(), v_demo_org_id, v_source_verge_id, 'https://theverge.com/2024/12/11/tech-layoffs-continue/', 'Tech Layoffs Continue Into December', 'Alex Morgan', NOW() - INTERVAL '1 day', 'Several major technology companies announced workforce reductions this week, continuing a trend that began in late 2023. The affected positions span engineering, marketing, and operations roles. Industry observers note that many companies are reallocating resources toward AI initiatives.', 'Tech industry layoffs persist as companies restructure toward AI priorities.', 0.72, ARRAY['Layoffs', 'Tech Industry', 'Employment'], 88, 890, '{"sentiment": "negative", "reach_estimate": 520000}'),
    (gen_random_uuid(), v_demo_org_id, v_source_forbes_id, 'https://forbes.com/sites/technology/2024/12/07/cybersecurity-spending-2025/', '2025 Cybersecurity Budgets Set New Records', 'James Chen', NOW() - INTERVAL '5 days', 'Enterprise cybersecurity spending is projected to reach $215 billion in 2025, representing a 14% increase from 2024. Organizations are prioritizing zero-trust architectures, AI-powered threat detection, and cloud security posture management. The surge reflects growing concerns about sophisticated cyber threats.', 'Cybersecurity spending to hit $215B in 2025, up 14% year-over-year.', 0.81, ARRAY['Cybersecurity', 'Security', 'Enterprise', 'Budget'], 95, 1350, '{"sentiment": "positive", "reach_estimate": 1800000}')
  ON CONFLICT (org_id, url) DO NOTHING;

  -- Get article IDs for mentions
  SELECT id INTO v_article_1_id FROM media_monitoring_articles WHERE org_id = v_demo_org_id AND url LIKE '%enterprise-ai-adoption%' LIMIT 1;
  SELECT id INTO v_article_2_id FROM media_monitoring_articles WHERE org_id = v_demo_org_id AND url LIKE '%startup-funding-q4%' LIMIT 1;
  SELECT id INTO v_article_3_id FROM media_monitoring_articles WHERE org_id = v_demo_org_id AND url LIKE '%saas-market-consolidation%' LIMIT 1;
  SELECT id INTO v_article_4_id FROM media_monitoring_articles WHERE org_id = v_demo_org_id AND url LIKE '%tech-layoffs%' LIMIT 1;
  SELECT id INTO v_article_5_id FROM media_monitoring_articles WHERE org_id = v_demo_org_id AND url LIKE '%cybersecurity-spending%' LIMIT 1;

  -- =============================================
  -- EARNED MENTIONS (Brand Mentions in Articles)
  -- =============================================

  IF v_article_1_id IS NOT NULL AND v_journalist_1_id IS NOT NULL THEN
    INSERT INTO earned_mentions (org_id, article_id, journalist_id, entity, entity_type, snippet, context, sentiment, confidence, is_primary_mention, metadata)
    VALUES
      (v_demo_org_id, v_article_1_id, v_journalist_1_id, 'Your Company', 'brand', 'Companies like Your Company are leading the charge in enterprise AI adoption', 'Industry analysis of AI adoption trends', 'positive', 0.89, false, '{"mentioned_competitors": ["Competitor A", "Competitor B"]}')
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_article_2_id IS NOT NULL AND v_journalist_2_id IS NOT NULL THEN
    INSERT INTO earned_mentions (org_id, article_id, journalist_id, entity, entity_type, snippet, context, sentiment, confidence, is_primary_mention, metadata)
    VALUES
      (v_demo_org_id, v_article_2_id, v_journalist_2_id, 'Your Company', 'brand', 'Your Company announced a $50M Series C round', 'Funding roundup section', 'positive', 0.95, true, '{"funding_amount": 50000000, "round_type": "Series C"}')
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_article_3_id IS NOT NULL AND v_journalist_1_id IS NOT NULL THEN
    INSERT INTO earned_mentions (org_id, article_id, journalist_id, entity, entity_type, snippet, context, sentiment, confidence, is_primary_mention, metadata)
    VALUES
      (v_demo_org_id, v_article_3_id, v_journalist_1_id, 'Competitor X', 'competitor', 'Competitor X acquired a smaller SaaS vendor', 'M&A analysis', 'neutral', 0.82, true, '{"acquisition_target": "Small SaaS Co"}')
    ON CONFLICT DO NOTHING;
  END IF;

  -- =============================================
  -- JOURNALIST ACTIVITY LOG (Sample Activity)
  -- =============================================

  IF v_journalist_1_id IS NOT NULL THEN
    INSERT INTO journalist_activity_log (org_id, journalist_id, activity_type, source_system, activity_data, sentiment, occurred_at)
    VALUES
      (v_demo_org_id, v_journalist_1_id, 'coverage_published', 's40_media_monitoring', '{"article_title": "Enterprise AI Adoption Accelerates", "outlet": "TechCrunch"}', 'positive', NOW() - INTERVAL '2 days'),
      (v_demo_org_id, v_journalist_1_id, 'pitch_sent', 's39_pitch', '{"pitch_subject": "Exclusive: AI Platform Launch", "response": "interested"}', 'positive', NOW() - INTERVAL '10 days'),
      (v_demo_org_id, v_journalist_1_id, 'email_opened', 's44_outreach', '{"email_subject": "Follow-up: Product Demo"}', NULL, NOW() - INTERVAL '5 days')
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_journalist_2_id IS NOT NULL THEN
    INSERT INTO journalist_activity_log (org_id, journalist_id, activity_type, source_system, activity_data, sentiment, occurred_at)
    VALUES
      (v_demo_org_id, v_journalist_2_id, 'coverage_published', 's40_media_monitoring', '{"article_title": "Q4 2024 Startup Funding", "outlet": "Forbes"}', 'positive', NOW() - INTERVAL '3 days'),
      (v_demo_org_id, v_journalist_2_id, 'outreach_email', 's44_outreach', '{"subject": "Q4 Funding Data for Forbes Article"}', NULL, NOW() - INTERVAL '7 days')
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_journalist_6_id IS NOT NULL THEN
    INSERT INTO journalist_activity_log (org_id, journalist_id, activity_type, source_system, activity_data, sentiment, occurred_at)
    VALUES
      (v_demo_org_id, v_journalist_6_id, 'coverage_published', 's40_media_monitoring', '{"article_title": "Tech Layoffs Continue", "outlet": "The Verge"}', 'negative', NOW() - INTERVAL '1 day'),
      (v_demo_org_id, v_journalist_6_id, 'email_replied', 's44_outreach', '{"subject": "RE: Comment Request on Layoffs"}', NULL, NOW() - INTERVAL '2 days')
    ON CONFLICT DO NOTHING;
  END IF;

  RAISE NOTICE 'PR Demo data seeded successfully for org %', v_demo_org_id;
END $$;

-- =============================================
-- COMMENTS
-- =============================================
COMMENT ON TABLE media_outlets IS 'Sprint S97: Media outlet records with real publications';
