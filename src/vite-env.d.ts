/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public site origin, e.g. https://www.example.com — used for canonical URLs, OG and the sitemap. */
  readonly VITE_SITE_URL?: string;
  /** Server endpoint accepting multipart project requests. See src/lib/api/projectRequest.ts. */
  readonly VITE_PROJECT_REQUEST_ENDPOINT?: string;
  /** EmailJS delivery for the project intake form (see src/lib/api/emailjs.ts). */
  readonly VITE_EMAILJS_SERVICE_ID?: string;
  readonly VITE_EMAILJS_TEMPLATE_ID?: string;
  readonly VITE_EMAILJS_PUBLIC_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
