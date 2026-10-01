import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { contactDetails, cta } from '../../config/site';
import { IntakeNotConfiguredError, submitProjectRequest, toRequestFields } from '../../lib/api/projectRequest';
import { cn } from '../../lib/cn';
import {
  emptyIntake,
  intakeOptions,
  isRequired,
  screenFiles,
  validateAll,
  validateField,
  type IntakeErrors,
  type IntakeField,
  type IntakeValues,
} from '../../lib/validation/projectRequest';
import { Arrow } from '../ui/ButtonLink';
import { EmailLink } from '../ui/EmailLink';
import { Field } from './Field';
import { FileDropzone } from './FileDropzone';

type Status = 'idle' | 'submitting' | 'success' | 'error';

const fieldLabels: Partial<Record<IntakeField, string>> = {
  fullName: 'Full name',
  company: 'Company',
  email: 'Email',
  projectType: 'Project type',
  service: 'Required service',
  description: 'Project description',
  timeline: 'Timeline',
  message: 'Additional message',
};

export function ProjectIntakeForm({ initialService }: { initialService?: string }) {
  const [values, setValues] = useState<IntakeValues>(() => ({ ...emptyIntake, service: initialService ?? '' }));
  const [errors, setErrors] = useState<IntakeErrors>({});
  const [touched, setTouched] = useState<Partial<Record<IntakeField, boolean>>>({});
  const [attempted, setAttempted] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [fileNotes, setFileNotes] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [reference, setReference] = useState<string>();
  const summaryRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (initialService) setValues((v) => ({ ...v, service: initialService }));
  }, [initialService]);

  const onChange =
    (field: IntakeField) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const next = { ...values, [field]: e.target.value };
      setValues(next);
      if (touched[field] || attempted) setErrors((er) => ({ ...er, [field]: validateField(field, next) }));
    };

  const onBlur = (field: IntakeField) => () => {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors((er) => ({ ...er, [field]: validateField(field, values) }));
  };

  const bind = (field: IntakeField) => ({
    name: field,
    value: values[field],
    onChange: onChange(field),
    onBlur: onBlur(field),
  });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === 'submitting') return;
    setAttempted(true);

    if (values.website) {
      // Honeypot tripped: behave as if successful without sending anything.
      setStatus('success');
      return;
    }

    const found = validateAll(values);
    setErrors(found);
    if (Object.values(found).some(Boolean)) {
      setStatus('idle');
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }

    setStatus('submitting');
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const result = await submitProjectRequest({ fields: toRequestFields(values), files }, controller.signal);
      setReference(result.reference);
      setStatus('success');
      requestAnimationFrame(() => successRef.current?.focus());
    } catch (err) {
      if (controller.signal.aborted) return;
      console.error(err);
      setErrors(
        (er) =>
          ({
            ...er,
            submit:
              err instanceof IntakeNotConfiguredError
                ? 'Online submissions are not connected yet.'
                : 'Your request could not be sent. Check your connection and try again — your details are still here.',
          }) as IntakeErrors,
      );
      setStatus('error');
    }
  };

  const reset = () => {
    setValues(emptyIntake);
    setErrors({});
    setTouched({});
    setAttempted(false);
    setFiles([]);
    setFileNotes([]);
    setReference(undefined);
    setStatus('idle');
  };

  if (status === 'success') {
    return (
      <div className="panel brackets p-8 sm:p-10" role="status">
        <p className="tech-label text-signal-ok">Request received</p>
        <h2 ref={successRef} tabIndex={-1} className="display-md mt-4 outline-none">
          Thank you — your project request has been sent.
        </h2>
        <p className="mt-4 max-w-xl text-steel-300">
          We will review the details and files you shared and follow up by email.
        </p>
        {reference && (
          <p className="mt-6 font-mono text-sm text-steel-200">
            Reference <span className="text-steel-50">{reference}</span>
          </p>
        )}
        <button type="button" onClick={reset} className="btn btn-secondary mt-8">
          Submit another request
        </button>
      </div>
    );
  }

  const errorEntries = (Object.entries(errors) as [string, string | undefined][]).filter(
    (entry): entry is [string, string] => Boolean(entry[1]) && entry[0] !== 'submit',
  );
  const submitError = (errors as Record<string, string | undefined>).submit;
  const describedLength = values.description.trim().length;

  return (
    <form onSubmit={onSubmit} noValidate aria-describedby="intake-intro" className="grid gap-8">
      <p id="intake-intro" className="text-sm text-steel-400">
        Fields marked Required must be completed. Share as much or as little as you have — rough information is fine.
      </p>

      {attempted && errorEntries.length > 0 && (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          className="rounded-[var(--radius-panel)] border border-signal-error/50 bg-signal-error/5 p-5 outline-none"
        >
          <h2 className="font-sans text-base font-semibold tracking-normal">
            Please correct {errorEntries.length} {errorEntries.length === 1 ? 'field' : 'fields'}
          </h2>
          <ul className="mt-3 grid gap-1.5 text-sm">
            {errorEntries.map(([field, message]) => (
              <li key={field}>
                <a
                  href={`#intake-${field}`}
                  onClick={(ev) => {
                    ev.preventDefault();
                    document.getElementById(`intake-${field}`)?.focus();
                  }}
                  className="text-signal-error underline underline-offset-4"
                >
                  {fieldLabels[field as IntakeField] ?? 'Files'}: {message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <fieldset className="grid gap-6">
        <legend className="tech-label mb-6 flex w-full items-center gap-3 text-steel-100">
          <span className="text-brand-400">01</span> About you
        </legend>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field id="intake-fullName" label="Full name" required error={errors.fullName}>
            {(p) => <input {...p} {...bind('fullName')} type="text" autoComplete="name" className="field-control" />}
          </Field>
          <Field id="intake-company" label="Company" error={errors.company}>
            {(p) => (
              <input {...p} {...bind('company')} type="text" autoComplete="organization" className="field-control" />
            )}
          </Field>
          <Field id="intake-email" label="Email" required error={errors.email}>
            {(p) => (
              <input
                {...p}
                {...bind('email')}
                type="email"
                inputMode="email"
                autoComplete="email"
                className="field-control"
              />
            )}
          </Field>
        </div>
      </fieldset>

      <fieldset className="grid gap-6">
        <legend className="tech-label mb-6 flex w-full items-center gap-3 text-steel-100">
          <span className="text-brand-400">02</span> Your project
        </legend>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            id="intake-projectType"
            label="Project type"
            required={isRequired('projectType')}
            error={errors.projectType}
          >
            {(p) => (
              <select {...p} {...bind('projectType')} className="field-control">
                <option value="">Select…</option>
                {intakeOptions.projectTypes.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field id="intake-service" label="Required service" required={isRequired('service')} error={errors.service}>
            {(p) => (
              <select {...p} {...bind('service')} className="field-control">
                <option value="">Select…</option>
                {intakeOptions.services.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
        <Field
          id="intake-description"
          label="Project description"
          required
          error={errors.description}
          hint={
            <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <span>What the product does, where it is today (idea, sketch, prototype, CAD) and what you need.</span>
              {/* The 30-character minimum is a validation rule, so it is shown before it can fail. */}
              <span
                className={cn(
                  'font-mono text-xs tabular-nums',
                  describedLength > 4800 ? 'text-signal-error' : 'text-steel-400',
                )}
              >
                {describedLength < 30 ? `${30 - describedLength} more characters` : `${describedLength} / 5000`}
              </span>
            </span>
          }
        >
          {(p) => <textarea {...p} {...bind('description')} rows={6} className="field-control resize-y" />}
        </Field>
        <Field id="intake-timeline" label="Timeline" error={errors.timeline} className="sm:max-w-[calc(50%-0.75rem)]">
          {(p) => (
            <select {...p} {...bind('timeline')} className="field-control">
              <option value="">Select…</option>
              {intakeOptions.timelines.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          )}
        </Field>
      </fieldset>

      <fieldset className="grid gap-6">
        <legend className="tech-label mb-6 flex w-full items-center gap-3 text-steel-100">
          <span className="text-brand-400">03</span> Files & notes
        </legend>
        <FileDropzone
          id="intake-files"
          files={files}
          notes={fileNotes}
          error={errors.files}
          onAdd={(incoming) => {
            const { accepted, rejected } = screenFiles(files, incoming);
            setFiles((cur) => [...cur, ...accepted]);
            setFileNotes(rejected);
          }}
          onRemove={(index) => {
            setFiles((cur) => cur.filter((_, i) => i !== index));
            setFileNotes([]);
          }}
        />
        <Field id="intake-message" label="Additional message" error={errors.message}>
          {(p) => <textarea {...p} {...bind('message')} rows={3} className="field-control resize-y" />}
        </Field>
      </fieldset>

      {/* Honeypot: hidden from people and assistive tech, attractive to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="intake-website">Website</label>
        <input id="intake-website" tabIndex={-1} autoComplete="off" {...bind('website')} />
      </div>

      <p className="border-t border-[var(--line)] pt-8 text-sm text-steel-400">
        By submitting this form, you agree to our{' '}
        <Link to="/terms-and-conditions" className="underline underline-offset-4 hover:text-steel-50">
          Terms &amp; Conditions
        </Link>{' '}
        and acknowledge our{' '}
        <Link to="/privacy-policy" className="underline underline-offset-4 hover:text-steel-50">
          Privacy Policy
        </Link>
        .
      </p>

      <div className="-mt-4 grid gap-4 sm:flex sm:items-center sm:justify-between">
        <div aria-live="polite" className="text-sm">
          {status === 'submitting' && (
            <span className="text-steel-300">Sending your request{files.length ? ' and files' : ''}…</span>
          )}
          {status === 'error' && submitError && (
            <span className="text-signal-error">
              {submitError}
              {contactDetails.email && (
                <>
                  {' '}
                  You can also email{' '}
                  <EmailLink email={contactDetails.email} className="underline underline-offset-4">
                    {contactDetails.email}
                  </EmailLink>
                  .
                </>
              )}
            </span>
          )}
        </div>
        <button
          type="submit"
          disabled={status === 'submitting'}
          className={cn('btn btn-primary w-full sm:w-auto', status === 'submitting' && 'cursor-progress opacity-70')}
        >
          {status === 'submitting' ? 'Sending…' : cta.submit}
          <Arrow />
        </button>
      </div>
    </form>
  );
}
