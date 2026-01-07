-- Índices para tabelas com MUITOS seq_scans (causando lentidão)

-- monitored_channels: 40.341 seq_scans (CRÍTICO!)
CREATE INDEX IF NOT EXISTS idx_monitored_channels_user_id ON public.monitored_channels(user_id);
CREATE INDEX IF NOT EXISTS idx_monitored_channels_last_checked ON public.monitored_channels(last_checked DESC);

-- user_credits: 17.754 seq_scans (CRÍTICO!)
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON public.user_credits(user_id);

-- saved_prompts: 824 seq_scans
CREATE INDEX IF NOT EXISTS idx_saved_prompts_user_id ON public.saved_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_prompts_folder_id ON public.saved_prompts(folder_id);

-- generated_audios: 751 seq_scans
CREATE INDEX IF NOT EXISTS idx_generated_audios_user_id ON public.generated_audios(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_audios_created_at ON public.generated_audios(created_at DESC);

-- generated_scripts: 749 seq_scans
CREATE INDEX IF NOT EXISTS idx_generated_scripts_user_id ON public.generated_scripts(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_scripts_created_at ON public.generated_scripts(created_at DESC);

-- generated_images: 672 seq_scans
CREATE INDEX IF NOT EXISTS idx_generated_images_user_id ON public.generated_images(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_images_created_at ON public.generated_images(created_at DESC);

-- folders: 607 seq_scans
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON public.folders(user_id);

-- profiles: 458 seq_scans
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- activity_logs: 417 seq_scans
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- channel_goals: 402 seq_scans
CREATE INDEX IF NOT EXISTS idx_channel_goals_user_id ON public.channel_goals(user_id);

-- reference_thumbnails: 230 seq_scans
CREATE INDEX IF NOT EXISTS idx_reference_thumbnails_user_id ON public.reference_thumbnails(user_id);
CREATE INDEX IF NOT EXISTS idx_reference_thumbnails_folder_id ON public.reference_thumbnails(folder_id);

-- credit_transactions: 227 seq_scans
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);

-- script_agents: 224 seq_scans
CREATE INDEX IF NOT EXISTS idx_script_agents_user_id ON public.script_agents(user_id);

-- plan_permissions: 204 seq_scans (lookup por plan_name)
CREATE INDEX IF NOT EXISTS idx_plan_permissions_plan_name ON public.plan_permissions(plan_name);

-- credit_usage: 97 seq_scans
CREATE INDEX IF NOT EXISTS idx_credit_usage_user_id ON public.credit_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_created_at ON public.credit_usage(created_at DESC);

-- video_analyses: 80 seq_scans
CREATE INDEX IF NOT EXISTS idx_video_analyses_user_id ON public.video_analyses(user_id);

-- user_roles: já tem idx, mas adicionar composto
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON public.user_roles(user_id, role);

-- imagefx_monthly_usage
CREATE INDEX IF NOT EXISTS idx_imagefx_usage_user_month ON public.imagefx_monthly_usage(user_id, month_year);

-- user_api_settings
CREATE INDEX IF NOT EXISTS idx_user_api_settings_user_id ON public.user_api_settings(user_id);

-- saved_analytics_channels
CREATE INDEX IF NOT EXISTS idx_saved_analytics_channels_user_id ON public.saved_analytics_channels(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_analytics_channels_channel_id ON public.saved_analytics_channels(channel_id);