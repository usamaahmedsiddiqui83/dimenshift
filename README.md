# DIMENSHIFT — website

From Dimension to Reality. Marketing site for mechanical product design and 3D CAD engineering.
React 19 · TypeScript · Vite 6 · Tailwind CSS 4 · three.js via React Three Fiber.

## Quick start (Windows)

1. Install **Node.js LTS** from https://nodejs.org (one time only).
2. Double-click **`Start Website.bat`** in this folder.
   - The first run installs dependencies (about a minute).
   - Your browser opens the site automatically, usually at http://localhost:5173.
3. Keep the black window open while you use the site. Close it to stop the website.

## Commands (for developers)

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # type-check, production build, robots/sitemap
```

## Before launch — client inputs

Nothing below may be invented. Values left empty are simply not rendered.

| Input | Where |
| --- | --- |
| Business name, logo file | `src/config/site.ts` → `brand` (logo goes in `public/brand/`) |
| Email, phone, address, hours, social links | `src/config/site.ts` → `contactDetails`, `socialLinks` |
| Confirm offered services (esp. reverse engineering) | `src/config/services.ts` |
| CAD software, manufacturing processes | `src/config/content.ts` → `toolStack`, `manufacturingProcesses` |
| Real projects (with permission) | `src/config/showcase.ts` |
| Site URL, EmailJS keys (or a form endpoint) | `.env` (see `.env.example`) |
| Brand palette re-derived from logo | `src/styles/index.css` → `@theme` tokens (and `scenePalette` in `src/components/three/materials.ts`) |

## Contact form email (EmailJS)

The intake form is delivered by [EmailJS](https://dashboard.emailjs.com) straight from the
visitor's browser, so no server is needed. Set it up once:

1. Create an EmailJS account and, under **Email Services**, connect the mailbox that should
   receive requests. Note the **Service ID**.
2. Under **Email Templates**, create a template, set **To email** to `contact@dimenshift.com`,
   and set **Reply To** to `{{reply_to}}` so replying answers the sender. Note the **Template ID**.
3. Copy the **Public Key** from **Account → General**.
4. Put all three in `.env` (see `.env.example`), then run `npm run build` — the values are
   baked into the build, so rebuild and redeploy after changing them.
5. Under **Account → Security**, restrict sending to your own domain.

Template variables available: `{{reference}}`, `{{full_name}}`, `{{company}}`, `{{email}}`,
`{{reply_to}}`, `{{project_type}}`, `{{service}}`, `{{description}}`, `{{timeline}}`,
`{{message}}`, `{{files}}`, `{{file_count}}`, `{{sent_at}}`.

EmailJS sends text, not attachments: uploaded files are listed by name and size in the email, and
the sender still has them. To receive the files themselves, point
`VITE_PROJECT_REQUEST_ENDPOINT` at a server endpoint — it takes priority over EmailJS.

## Architecture

- `src/config/` — all content, navigation, CTAs, SEO, motion settings, 3D stage states.
- `src/components/three/` — the 3D layer. `assembly.ts` holds every component's assembled/exploded
  transform, timing and gear ratio; `visualState.ts` is the numeric contract sections use to drive the
  scene (explode, wireframe, section, finish, …). Geometry is procedural (no downloads). To use a real
  GLB later, map its node names to the part ids in `assembly.ts`.
- The three.js bundle is code-split and only loads when a 3D view nears the viewport; canvases stop
  rendering when off-screen, use a lower-detail mesh on phones and adapt pixel ratio to frame rate.
  A static line drawing is shown while loading and permanently when WebGL is unavailable.
- `src/lib/api/projectRequest.ts` — the only backend touchpoint for the intake form. Read its header
  for server-side requirements (re-validation, private file storage, malware scanning, rate limiting).

## Deployment notes

- It is a single-page app: configure the host to rewrite unknown paths (e.g. `/contact`) to `index.html`.
- For best SEO, add prerendering of `/` and `/contact` at deploy time.
- `npm run build` writes `robots.txt`, and `sitemap.xml` when `VITE_SITE_URL` is set in the build environment.
