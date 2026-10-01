import { services } from '../../config/services';

export interface IntakeValues {
  fullName: string;
  company: string;
  email: string;
  projectType: string;
  service: string;
  description: string;
  timeline: string;
  message: string;
  /** Honeypot — must stay empty. Never sent. */
  website: string;
}

export type IntakeField = keyof IntakeValues;
export type IntakeErrors = Partial<Record<IntakeField | 'files', string>>;

export const emptyIntake: IntakeValues = {
  fullName: '',
  company: '',
  email: '',
  projectType: '',
  service: '',
  description: '',
  timeline: '',
  message: '',
  website: '',
};

export const intakeOptions = {
  projectTypes: [
    'New product development',
    'Redesign of an existing product',
    'Prototype to production',
    'Documentation for an existing design',
    'Legacy part or CAD conversion',
    'Other',
  ],
  services: [...services.map((s) => ({ value: s.id, label: s.title })), { value: 'not-sure', label: 'Not sure yet' }],
  timelines: ['As soon as possible', 'Within 1 month', '1–3 months', '3–6 months', 'Not yet defined'],
};

export const FILE_RULES = {
  maxFiles: 10,
  maxFileBytes: 50 * 1024 * 1024,
  maxTotalBytes: 150 * 1024 * 1024,
  /** Checked by extension: browsers rarely report reliable MIME types for CAD formats. */
  extensions: ['pdf', 'dwg', 'dxf', 'step', 'stp', 'stl', 'iges', 'igs', 'zip', 'png', 'jpg', 'jpeg', 'webp'],
} as const;

export const formatBytes = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const REQUIRED: IntakeField[] = ['fullName', 'email', 'projectType', 'service', 'description'];
export const isRequired = (field: IntakeField) => REQUIRED.includes(field);

export function validateField(field: IntakeField, values: IntakeValues): string | undefined {
  const v = values[field].trim();
  switch (field) {
    case 'fullName':
      if (!v) return 'Enter your full name.';
      if (v.length > 120) return 'Name must be 120 characters or fewer.';
      return undefined;
    case 'company':
      return v.length > 160 ? 'Company must be 160 characters or fewer.' : undefined;
    case 'email':
      if (!v) return 'Enter your email address.';
      if (!EMAIL.test(v)) return 'Enter a valid email address, like name@company.com.';
      return undefined;
    case 'projectType':
      return v ? undefined : 'Select a project type.';
    case 'service':
      return v ? undefined : 'Select the service you need, or “Not sure yet”.';
    case 'description':
      if (!v) return 'Describe your project.';
      if (v.length < 30) return `Add a little more detail — at least 30 characters (${v.length} so far).`;
      if (v.length > 5000) return 'Description must be 5,000 characters or fewer.';
      return undefined;
    case 'message':
      return v.length > 3000 ? 'Message must be 3,000 characters or fewer.' : undefined;
    default:
      return undefined;
  }
}

const extensionOf = (name: string) => name.split('.').pop()?.toLowerCase() ?? '';

/** Splits newly chosen files into accepted and rejected, respecting limits against files already attached. */
export function screenFiles(existing: File[], incoming: File[]) {
  const accepted: File[] = [];
  const rejected: string[] = [];
  let count = existing.length;
  let total = existing.reduce((sum, f) => sum + f.size, 0);
  const allowed: readonly string[] = FILE_RULES.extensions;

  for (const file of incoming) {
    if (existing.some((f) => f.name === file.name && f.size === file.size)) continue;
    if (!allowed.includes(extensionOf(file.name))) {
      rejected.push(`${file.name}: file type not accepted.`);
    } else if (file.size === 0) {
      rejected.push(`${file.name}: file is empty.`);
    } else if (file.size > FILE_RULES.maxFileBytes) {
      rejected.push(`${file.name}: larger than ${formatBytes(FILE_RULES.maxFileBytes)}.`);
    } else if (count >= FILE_RULES.maxFiles) {
      rejected.push(`${file.name}: maximum of ${FILE_RULES.maxFiles} files reached.`);
    } else if (total + file.size > FILE_RULES.maxTotalBytes) {
      rejected.push(`${file.name}: total upload would exceed ${formatBytes(FILE_RULES.maxTotalBytes)}.`);
    } else {
      accepted.push(file);
      count += 1;
      total += file.size;
    }
  }
  return { accepted, rejected };
}

export function validateAll(values: IntakeValues): IntakeErrors {
  const errors: IntakeErrors = {};
  for (const field of Object.keys(values) as IntakeField[]) {
    const error = validateField(field, values);
    if (error) errors[field] = error;
  }
  return errors;
}
