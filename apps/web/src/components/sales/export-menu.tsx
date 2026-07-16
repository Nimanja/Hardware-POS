'use client';

import * as React from 'react';
import { ChevronDown, Download, FileDown, FileSpreadsheet } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { ReportFormat } from '@/lib/sales';
import { cn } from '@/lib/utils';

const OPTIONS: { format: ReportFormat; label: string; hint: string; Icon: typeof FileDown }[] = [
  { format: 'pdf', label: 'PDF document', hint: '.pdf', Icon: FileDown },
  { format: 'xlsx', label: 'Excel workbook', hint: '.xlsx', Icon: FileSpreadsheet },
];

/** Single "Export" button opening a menu of report formats. */
export function ExportMenu({
  disabled,
  exporting,
  onExport,
}: {
  disabled?: boolean;
  /** Format currently being generated, if any (shows busy state). */
  exporting: ReportFormat | null;
  onExport: (format: ReportFormat) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <Button
        variant="outline"
        size="sm"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled || exporting !== null}
        onClick={() => setOpen((o) => !o)}
      >
        <Download className="h-4 w-4" />
        {exporting ? 'Exporting…' : 'Export'}
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
      </Button>

      {open ? (
        <div
          role="menu"
          aria-label="Export report"
          className="absolute right-0 top-full z-40 mt-2 w-56 rounded-2xl border border-border bg-surface p-2 shadow-xl"
        >
          {OPTIONS.map(({ format, label, hint, Icon }) => (
            <button
              key={format}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onExport(format);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
            >
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              {label}
              <span className="ml-auto text-xs text-muted-foreground">{hint}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
