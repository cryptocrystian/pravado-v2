# Migration Run Log — 2026-03-12

## Summary
Applying missing migrations 06–79 via Supabase Pooler (aws-0-us-west-2).
Pre-applied: 33 (user_orgs view), 17 (referring_domains) as out-of-order dependencies.
Statement-by-statement fallback used for migrations with partial application.

## Results

| # | Migration | Status | Notes |
|---|-----------|--------|-------|
| 1 | `01_create_orgs.sql` | Skip | Pre-applied or confirmed |
| 2 | `02_create_users.sql` | Skip | Pre-applied or confirmed |
| 3 | `03_create_org_members.sql` | Skip | Pre-applied or confirmed |
| 4 | `04_create_org_invites.sql` | Skip | Pre-applied or confirmed |
| 5 | `05_create_roles_and_permissions.sql` | Skip | Pre-applied or confirmed |
| 6 | `06_create_tags.sql` | Skip | trigger "update_tags_updated_at" for relation "tags" already exists |
| 7 | `07_create_tag_assignments.sql` | Skip | policy "Users can view tag assignments in their org" for table "tag_assignments" |
| 8 | `08_create_pr_tables.sql` | Skip | trigger "update_media_outlets_updated_at" for relation "media_outlets" already e |
| 9 | `09_create_content_tables.sql` | Skip | Pre-applied or confirmed |
| 10 | `10_create_seo_tables.sql` | Skip | trigger "update_seo_keywords_updated_at" for relation "seo_keywords" already exi |
| 11 | `11_create_seo_keyword_metrics.sql` | Skip | relation "idx_seo_keyword_metrics_org_id" already exists |
| 12 | `12_create_seo_serp_results.sql` | Skip | relation "idx_seo_serp_results_org_id" already exists |
| 13 | `13_create_seo_keyword_intent_enum.sql` | Skip | type "seo_keyword_intent" already exists |
| 14 | `14_create_seo_page_audits.sql` | Skip | relation "idx_seo_page_audits_org_page_snapshot" already exists |
| 15 | `15_create_seo_page_issues.sql` | Skip | relation "idx_seo_page_issues_org_page" already exists |
| 16 | `16_create_seo_backlinks.sql` | Skip | relation "idx_seo_backlinks_org_page_last_seen" already exists |
| 17 | `17_create_seo_referring_domains.sql` | Skip | Pre-applied or confirmed |
| 18 | `18_extend_journalists_and_media_outlets.sql` | Applied | Success |
| 19 | `19_create_pr_beats_and_mappings.sql` | Skip | relation "idx_pr_beats_org_id" already exists |
| 20 | `20_create_pr_lists.sql` | Skip | relation "idx_pr_lists_org_id" already exists |
| 21 | `21_create_playbooks_schema.sql` | Skip | trigger "set_playbooks_updated_at" for relation "playbooks" already exists |
| 22 | `22_extend_playbook_runs_for_simulation.sql` | Applied | Success |
| 23 | `23_extend_playbook_runs_for_collaboration.sql` | Applied | Success |
| 24 | `24_create_memory_schema.sql` | Applied | Success |
| 25 | `25_create_agent_personality_schema.sql` | Applied | Success |
| 26 | `26_extend_content_schema.sql` | Applied | Success |
| 27 | `27_add_generated_briefs.sql` | Applied | Success |
| 28 | `28_content_quality_schema.sql` | Applied | Success |
| 29 | `29_content_rewrites.sql` | Applied | Success |
| 30 | `30_execution_engine_v2.sql` | Applied | Success |
| 31 | `31_playbook_versioning.sql` | Applied | Success |
| 32 | `32_playbook_branching.sql` | Applied | Success |
| 33 | `33_create_user_orgs_view.sql` | Skip | Pre-applied or confirmed |
| 34 | `34_create_llm_usage_ledger.sql` | Applied | Success |
| 35 | `35_create_billing_schema.sql` | Partial | 17 applied, 0 skipped, 2 errors: function public.set_updated_at() does not exist |
| 36 | `36_add_stripe_billing_columns.sql` | Applied | Success |
| 37 | `37_add_overage_billing.sql` | Applied | Success |
| 38 | `38_billing_usage_alerts.sql` | Applied | Success |
| 39 | `39_billing_invoice_cache.sql` | Partial | 14 applied, 0 skipped, 1 errors: relation "user_organizations" does not exist |
| 40 | `40_create_audit_log.sql` | Partial | 23 applied, 0 skipped, 1 errors: relation "user_organizations" does not exist |
| 41 | `41_create_audit_exports.sql` | Partial | 15 applied, 0 skipped, 1 errors: relation "user_organizations" does not exist |
| 42 | `42_create_audit_replay_runs.sql` | Applied | Success |
| 43 | `43_create_pr_generated_releases.sql` | Skip | policy "pr_releases_select_policy" for table "pr_generated_releases" already exi |
| 44 | `44_create_pr_pitch_schema.sql` | Partial | 38 applied, 10 skipped, 14 errors: column "press_release_id" does not exist |
| 45 | `45_create_media_monitoring_schema.sql` | Partial | 35 applied, 0 skipped, 15 errors: column "keywords" does not exist |
| 46 | `46_media_crawling_and_rss.sql` | Partial | 7 applied, 0 skipped, 29 errors: relation "public.organizations" does not exist |
| 47 | `47_create_scheduler_schema.sql` | Partial | 14 applied, 0 skipped, 3 errors: relation "public.profiles" does not exist |
| 48 | `48_create_media_alerts_schema.sql` | Partial | 4 applied, 0 skipped, 25 errors: relation "public.organizations" does not exist |
| 49 | `49_create_pr_outreach_schema.sql` | Partial | 1 applied, 0 skipped, 36 errors: relation "pr_generated_pitches" does not exist |
| 50 | `50_pr_outreach_deliverability.sql` | Partial | 10 applied, 0 skipped, 11 errors: relation "pr_outreach_runs" does not exist |
| 51 | `51_create_journalist_identity_graph.sql` | Skip | relation "idx_journalist_profiles_org_id" already exists |
| 52 | `52_create_media_lists_schema.sql` | Skip | relation "idx_media_lists_org" already exists |
| 53 | `53_create_journalist_discovery_schema.sql` | Applied | Success |
| 54 | `54_create_journalist_timeline_schema.sql` | Applied | Success |
| 55 | `55_create_journalist_enrichment_schema.sql` | Applied | Success |
| 56 | `56_create_audience_persona_schema.sql` | Applied | Success |
| 57 | `57_create_media_performance_schema.sql` | Partial | 59 applied, 0 skipped, 3 errors: syntax error at or near "GIN" |
| 58 | `58_create_competitive_intelligence_schema.sql` | Applied | Success |
| 59 | `59_create_media_briefings_schema.sql` | Applied | Success |
| 60 | `60_create_crisis_response_schema.sql` | Applied | Success |
| 61 | `61_create_brand_reputation_schema.sql` | Applied | Success |
| 62 | `62_create_brand_reputation_alerts_schema.sql` | Applied | Success |
| 63 | `63_create_governance_compliance_schema.sql` | Applied | Success |
| 64 | `64_create_risk_radar_schema.sql` | Applied | Success |
| 65 | `65_create_executive_command_center_schema.sql` | Applied | Success |
| 66 | `66_create_exec_digest_schema.sql` | Applied | Success |
| 67 | `67_create_exec_board_reports_schema.sql` | Applied | Success |
| 68 | `68_create_investor_relations_schema.sql` | Applied | Success |
| 69 | `69_create_strategic_intelligence_schema.sql` | Applied | Success |
| 70 | `70_create_unified_intelligence_graph_schema.sql` | Partial | 67 applied, 0 skipped, 17 errors: syntax error at or near "WHERE" |
| 71 | `71_create_scenario_playbook_schema.sql` | Applied | Success |
| 72 | `72_create_unified_narrative_schema.sql` | Applied | Success |
| 73 | `73_create_ai_scenario_simulation_schema.sql` | Applied | Success |
| 74 | `74_create_scenario_orchestration_schema.sql` | Applied | Success |
| 75 | `75_create_reality_maps_schema.sql` | Applied | Success |
| 76 | `76_create_conflict_resolution_schema.sql` | Applied | Success |
| 77 | `77_add_org_slug.sql` | Applied | Success |
| 78 | `78_seed_pr_demo_data.sql` | Partial | 1 applied, 0 skipped, 1 errors: column "keywords" of relation "media_monitoring_articles" does not exist |
| 79 | `79_fix_org_members_rls_recursion.sql` | Skip | policy "org_members_select_own" for table "org_members" already exists |
| 80 | `80_evi_snapshots.sql` | Skip | Pre-applied or confirmed |
| 81 | `81_sage_signals_proposals.sql` | Skip | Pre-applied or confirmed |
| 82 | `82_citemind_tables.sql` | Skip | Pre-applied or confirmed |
| 83 | `83_citation_monitor.sql` | Skip | Pre-applied or confirmed |
| 84 | `84_gsc_integration.sql` | Skip | Pre-applied or confirmed |
| 85 | `85_onboarding_activation.sql` | Skip | Pre-applied or confirmed |
| 86 | `86_beta_requests.sql` | Skip | Pre-applied or confirmed |
| 87 | `87_mfa_session_hardening.sql` | Skip | Pre-applied or confirmed |

## Totals

- Applied: 40
- Skipped: 33
- Partial: 14
- Failed: 0
