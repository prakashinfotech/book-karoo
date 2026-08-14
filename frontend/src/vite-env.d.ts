/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_PAYMENT_PROVIDER: string;
  readonly VITE_ENABLE_VOICE_SEARCH: string;
  readonly VITE_ENABLE_RECOMMENDATIONS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
