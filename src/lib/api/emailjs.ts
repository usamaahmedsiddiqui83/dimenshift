import emailjs from '@emailjs/browser';
import type { ProjectRequest, ProjectRequestResult } from './projectRequest';

/**
 * EmailJS delivery for the project intake form.
 *
 * EmailJS sends the request straight from the visitor's browser to the mailbox configured in the
 * EmailJS template, so the site needs no server of its own. Three values come from the EmailJS
 * dashboard and are set at build time:
 *
 *   VITE_EMAILJS_SERVICE_ID   Email Services → the service connected to the receiving mailbox
 *   VITE_EMAILJS_TEMPLATE_ID  Email Templates → the template that formats the request
 *   VITE_EMAILJS_PUBLIC_KEY   Account → General → Public Key
 *
 * The public key is meant to be visible in the browser; the account's private key is never used
 * here. Restrict the allowed domains in the EmailJS dashboard so only this site can send.
 *
 * Attachments: EmailJS sends template variables, not files. The names and sizes of anything the
 * visitor attached are listed in the email so you can ask them for the files by reply.
 */
export const emailjsConfig = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
};

export const isEmailjsConfigured = Boolean(
  emailjsConfig.serviceId && emailjsConfig.templateId && emailjsConfig.publicKey,
);

const kb = (bytes: number) => `${Math.max(1, Math.round(bytes / 1024))} KB`;

/** A short code shown to the sender and repeated in the email, so both sides can refer to it. */
function reference() {
  return `DS-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

/** Template variables. Use these names in the EmailJS template, e.g. {{full_name}}. */
export function toTemplateParams(request: ProjectRequest, ref: string) {
  const f = request.fields;
  return {
    reference: ref,
    full_name: f.fullName,
    company: f.company || '—',
    email: f.email,
    reply_to: f.email,
    project_type: f.projectType,
    service: f.service,
    description: f.description,
    timeline: f.timeline || '—',
    message: f.message || '—',
    file_count: String(request.files.length),
    files: request.files.length
      ? request.files.map((file) => `${file.name} (${kb(file.size)})`).join('\n')
      : 'No files attached',
    sent_at: new Date().toLocaleString(),
  };
}

export async function sendWithEmailjs(request: ProjectRequest): Promise<ProjectRequestResult> {
  const ref = reference();
  await emailjs.send(emailjsConfig.serviceId!, emailjsConfig.templateId!, toTemplateParams(request, ref), {
    publicKey: emailjsConfig.publicKey!,
  });
  return { reference: ref };
}
