/**
 * Project intake integration layer — the only place the form talks to a backend.
 *
 * Requests are delivered by EmailJS when it is configured (see ./emailjs), which needs no server
 * of its own. A server endpoint can be used instead, or as well, by setting
 * VITE_PROJECT_REQUEST_ENDPOINT — it takes priority, because only a server can receive the files.
 * That endpoint must:
 *   - re-validate every field and each file's type/size server-side,
 *   - store files in private storage (never a public bucket or public URL),
 *   - scan uploads for malware before anyone opens them,
 *   - apply rate limiting / spam protection,
 *   - respond with JSON `{ "reference": "..." }` (optional) on success.
 *
 * Files are sent only to that endpoint; nothing is uploaded elsewhere or previewed via third parties.
 */
import type { IntakeValues } from '../validation/projectRequest';
import { isEmailjsConfigured, sendWithEmailjs } from './emailjs';

export type ProjectRequestFields = Omit<IntakeValues, 'website'>;

export interface ProjectRequest {
  fields: ProjectRequestFields;
  files: File[];
}

export interface ProjectRequestResult {
  reference?: string;
}

export class IntakeNotConfiguredError extends Error {
  constructor() {
    super('Project intake delivery is not configured (EmailJS keys or VITE_PROJECT_REQUEST_ENDPOINT).');
    this.name = 'IntakeNotConfiguredError';
  }
}

export class IntakeSubmitError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'IntakeSubmitError';
  }
}

const endpoint = import.meta.env.VITE_PROJECT_REQUEST_ENDPOINT;

export function toRequestFields(values: IntakeValues): ProjectRequestFields {
  return {
    fullName: values.fullName.trim(),
    company: values.company.trim(),
    email: values.email.trim(),
    projectType: values.projectType,
    service: values.service,
    description: values.description.trim(),
    timeline: values.timeline,
    message: values.message.trim(),
  };
}

export async function submitProjectRequest(
  request: ProjectRequest,
  signal?: AbortSignal,
): Promise<ProjectRequestResult> {
  // EmailJS delivers to the mailbox set on its template, with no backend to run.
  if (!endpoint && isEmailjsConfigured) return sendWithEmailjs(request);

  if (!endpoint) {
    if (import.meta.env.DEV) {
      // Development preview only: lets the full form flow be exercised without a backend.
      await new Promise((resolve) => setTimeout(resolve, 900));
      console.info('[intake] No endpoint configured — simulated submission.', {
        ...request.fields,
        files: request.files.map((f) => `${f.name} (${f.size} bytes)`),
      });
      return { reference: 'DEV-PREVIEW' };
    }
    throw new IntakeNotConfiguredError();
  }

  const body = new FormData();
  for (const [key, value] of Object.entries(request.fields)) body.append(key, value);
  for (const file of request.files) body.append('files', file, file.name);

  const response = await fetch(endpoint, {
    method: 'POST',
    body,
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new IntakeSubmitError(`Submission failed with status ${response.status}`, response.status);

  const data: unknown = await response.json().catch(() => null);
  const reference =
    data && typeof data === 'object' && 'reference' in data && typeof data.reference === 'string'
      ? data.reference
      : undefined;
  return { reference };
}
