-- Replace available_models with correct Ollama cloud model names
-- Ordered by popularity (pulls on ollama.com)

-- Clear old incorrect entries
DELETE FROM public.available_models;

-- Add sort_order column for popularity ordering
ALTER TABLE public.available_models
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 999;

-- Insert 35 cloud models sorted by popularity
INSERT INTO public.available_models (name, display_name, provider, context_limit, description, is_available, sort_order) VALUES
  -- Tier 1: Most popular (1M+ pulls)
  ('qwen3-vl',           'Qwen3 VL',            'ollama', 128000, 'Most powerful vision-language model in the Qwen family. Understands images and text.',                      true, 1),
  ('qwen3.5',            'Qwen 3.5',            'ollama', 128000, 'Latest Qwen multimodal model with exceptional utility and performance.',                                    true, 2),
  ('qwen3-coder-next',   'Qwen3 Coder Next',    'ollama', 128000, 'Coding-focused model optimized for agentic coding workflows.',                                              true, 3),

  -- Tier 2: Very popular (300K-999K pulls)
  ('ministral-3',        'Ministral 3',          'ollama', 128000, 'Mistral''s efficient model designed for edge deployment. Fast and capable.',                                 true, 4),
  ('qwen3-next',         'Qwen3 Next',           'ollama', 128000, 'High-parameter efficiency model with strong inference speed. 80B parameters.',                               true, 5),
  ('rnj-1',              'RNJ-1',                'ollama', 128000, '8B dense model by Essential AI, optimized for code and STEM tasks.',                                         true, 6),
  ('devstral-small-2',   'Devstral Small 2',     'ollama', 128000, 'Excels at tool usage, codebase exploration and file editing. 24B parameters.',                               true, 7),

  -- Tier 3: Popular (100K-299K pulls)
  ('nemotron-3-nano',    'Nemotron 3 Nano',      'ollama', 128000, 'NVIDIA''s efficient open agentic model. 30B parameters.',                                                   true, 8),
  ('kimi-k2.5',          'Kimi K2.5',            'ollama', 128000, 'Native multimodal agentic model with vision and language understanding.',                                    true, 9),
  ('devstral-2',         'Devstral 2',           'ollama', 128000, 'Advanced 123B model for software engineering agents.',                                                       true, 10),
  ('minimax-m2.5',       'MiniMax M2.5',         'ollama', 128000, 'State-of-the-art model for real-world productivity and coding tasks.',                                       true, 11),

  -- Tier 4: Growing (50K-99K pulls)
  ('glm-5',              'GLM-5',                'ollama', 128000, 'Strong reasoning model with 744B total parameters (40B active). Systems engineering.',                        true, 12),
  ('cogito-2.1',         'Cogito v2.1',          'ollama', 128000, 'Instruction-tuned generative model. MIT licensed. 671B parameters.',                                         true, 13),
  ('glm-4.6',            'GLM-4.6',              'ollama', 128000, 'Advanced agentic, reasoning and coding capabilities.',                                                       true, 14),
  ('gemini-3-flash-preview', 'Gemini 3 Flash',   'ollama', 128000, 'Google''s frontier intelligence built for speed at a fraction of the cost.',                                 true, 15),
  ('minimax-m2',         'MiniMax M2',           'ollama', 128000, 'High-efficiency model built for coding and agentic workflows.',                                              true, 16),
  ('glm-4.7',            'GLM-4.7',              'ollama', 128000, 'Advanced coding capabilities from Zhipu AI.',                                                                true, 17),

  -- Tier 5: Notable (20K-49K pulls)
  ('deepseek-v3.2',      'DeepSeek V3.2',        'ollama', 128000, 'Harmonizes computational efficiency with superior reasoning and agent performance.',                         true, 18),
  ('kimi-k2-thinking',   'Kimi K2 Thinking',     'ollama', 128000, 'Moonshot AI''s best open-source thinking model with step-by-step reasoning.',                                true, 19),
  ('minimax-m2.1',       'MiniMax M2.1',         'ollama', 128000, 'Exceptional multilingual capabilities for code engineering.',                                                true, 20),

  -- Popular local models also available as cloud
  ('deepseek-r1',        'DeepSeek R1',          'ollama', 128000, 'Advanced reasoning model with chain-of-thought. Up to 671B parameters.',                                     true, 21),
  ('qwen3',              'Qwen 3',               'ollama', 128000, 'Versatile open model family. Strong reasoning and multilingual support.',                                    true, 22),
  ('llama3.3',           'Llama 3.3 70B',        'ollama', 128000, 'Meta''s powerful 70B parameter model with strong general capabilities.',                                     true, 23),
  ('gemma3',             'Gemma 3',              'ollama', 128000, 'Google''s open model family. Efficient and capable across tasks.',                                            true, 24),
  ('qwen2.5',            'Qwen 2.5',             'ollama', 128000, 'Alibaba''s versatile reasoning model. Up to 72B parameters.',                                                true, 25),
  ('phi4',               'Phi-4',                'ollama', 128000, 'Microsoft''s compact 14B model with strong reasoning capabilities.',                                          true, 26),
  ('mistral',            'Mistral 7B',           'ollama',  32000, 'Mistral''s foundational 7B model. Fast and efficient.',                                                      true, 27),
  ('codestral',          'Codestral',            'ollama', 128000, 'Mistral''s dedicated code generation model. 22B parameters.',                                                true, 28),
  ('command-r',          'Command R',            'ollama', 128000, 'Cohere''s 35B model optimized for RAG and tool use.',                                                        true, 29),
  ('mixtral',            'Mixtral 8x7B',         'ollama',  32000, 'Mistral''s mixture-of-experts model. Strong performance at lower cost.',                                     true, 30),
  ('llama3.1',           'Llama 3.1',            'ollama', 128000, 'Meta''s widely-used model family. Up to 405B parameters.',                                                   true, 31),
  ('deepseek-coder',     'DeepSeek Coder',       'ollama', 128000, 'Specialized code generation model. Up to 33B parameters.',                                                   true, 32),
  ('qwen2.5-coder',      'Qwen 2.5 Coder',      'ollama', 128000, 'Alibaba''s dedicated code generation model with strong benchmarks.',                                          true, 33),
  ('llava',              'LLaVA',                'ollama',   4096, 'Vision-language model. Understands and describes images.',                                                    true, 34),
  ('granite3.1-dense',   'Granite 3.1',          'ollama', 128000, 'IBM''s enterprise-ready model. Available in 2B and 8B sizes.',                                               true, 35);

-- Update any users whose current_model uses old names
UPDATE public.models SET current_model = 'llama3.3', context_limit = 128000 WHERE current_model = 'llama-3.3-70b';
UPDATE public.models SET current_model = 'qwen2.5', context_limit = 128000 WHERE current_model = 'qwen-2.5-72b';
UPDATE public.models SET current_model = 'mistral', context_limit = 32000 WHERE current_model = 'mistral-large';
