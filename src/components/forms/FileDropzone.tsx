import { useRef, useState, type DragEvent } from 'react';
import { cn } from '../../lib/cn';
import { FILE_RULES, formatBytes } from '../../lib/validation/projectRequest';

interface Props {
  id: string;
  files: File[];
  notes: string[];
  error?: string;
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
}

const accept = FILE_RULES.extensions.map((e) => `.${e}`).join(',');

export function FileDropzone({ id, files, notes, error, onAdd, onRemove }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const hintId = `${id}-hint`;
  const notesId = `${id}-notes`;

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) onAdd(Array.from(e.dataTransfer.files));
  };

  return (
    <div>
      <div className="field-label flex items-baseline justify-between gap-3">
        <span id={`${id}-label`}>Files</span>
        <span className="font-mono text-[0.6875rem] tracking-[0.12em] text-steel-500 uppercase sm:text-[0.625rem]">
          Optional
        </span>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'relative flex flex-col items-center justify-center gap-3 rounded-[var(--radius-part)] border border-dashed px-6 py-8 text-center transition-colors',
          dragging ? 'border-datum-300 bg-datum-400/5' : 'border-[var(--line-strong)] bg-ink-800',
        )}
      >
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true" className="text-steel-400">
          <path d="M14 18V5M9 10l5-5 5 5M5 17v6h18v-6" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <p className="text-sm text-steel-200">
          Drag files here, or{' '}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="font-medium text-steel-50 underline decoration-brand-500 underline-offset-4"
            aria-describedby={hintId}
          >
            browse your computer
          </button>
        </p>
        <p id={hintId} className="font-mono text-[0.6875rem] tracking-[0.06em] text-steel-400 uppercase">
          PDF · DWG · DXF · STEP/STP · STL · IGES/IGS · ZIP · images — up to {FILE_RULES.maxFiles} files,{' '}
          {formatBytes(FILE_RULES.maxFileBytes)} each
        </p>
        <input
          ref={inputRef}
          id={id}
          type="file"
          multiple
          accept={accept}
          tabIndex={-1}
          aria-labelledby={`${id}-label`}
          className="sr-only"
          onChange={(e) => {
            if (e.target.files?.length) onAdd(Array.from(e.target.files));
            e.target.value = '';
          }}
        />
      </div>

      {files.length > 0 && (
        <ul className="mt-3 grid gap-2" aria-label="Attached files">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${file.size}`}
              className="flex items-center justify-between gap-3 rounded-[var(--radius-part)] border border-[var(--line)] bg-ink-850 px-3 py-2 text-sm"
            >
              <span className="min-w-0 truncate text-steel-100">{file.name}</span>
              <span className="flex shrink-0 items-center gap-3">
                <span className="font-mono text-xs text-steel-400">{formatBytes(file.size)}</span>
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  className="flex h-8 w-8 items-center justify-center rounded-[2px] text-steel-300 hover:bg-ink-700 hover:text-steel-50"
                  aria-label={`Remove ${file.name}`}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                    <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div id={notesId} aria-live="polite">
        {(notes.length > 0 || error) && (
          <ul className="mt-3 grid gap-1 text-sm text-signal-error">
            {error && <li>{error}</li>}
            {notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
