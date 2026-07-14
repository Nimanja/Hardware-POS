/**
 * Reusable A4 document renderer. ONE layout (header + bill-to + item table +
 * summary + footer/signatures) drives every A4 document — quotations, invoices,
 * bills, and return receipts — so layout code is not duplicated (spec §10).
 *
 * Callers pass a fully-formatted model (money strings already run through
 * formatCurrency); this module only escapes + lays out. The output is a
 * self-contained HTML document with A4 print CSS and an on-screen Print button,
 * printable via window.print() or convertible to a PDF byte stream by PdfService.
 */

export interface A4Seller {
  name: string;
  addressLine?: string | null;
  phone?: string | null;
  email?: string | null;
  taxNumber?: string | null;
  logoUrl?: string | null;
}

export interface A4Party {
  label: string;
  name: string;
  company?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  taxNumber?: string | null;
}

export interface A4MetaLine {
  label: string;
  value: string;
}

export interface A4Column {
  label: string;
  align?: 'left' | 'right' | 'center';
  width?: string;
}

export interface A4Row {
  cells: string[];
}

export interface A4SummaryLine {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
}

export interface A4Document {
  seller: A4Seller;
  title: string;
  number: string;
  meta: A4MetaLine[];
  party?: A4Party | null;
  columns: A4Column[];
  rows: A4Row[];
  summary: A4SummaryLine[];
  notes?: string | null;
  terms?: string | null;
  footerText?: string | null;
  signatures?: boolean;
  statusBadge?: string | null;
  watermark?: string | null;
}

export function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Preserve author line breaks in free-text blocks (notes / terms). */
function multiline(value: string): string {
  return esc(value).replace(/\n/g, '<br />');
}

const A4_STYLES = `
  :root { --ink:#0f172a; --muted:#64748b; --line:#e2e8f0; --brand:#1d4ed8; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; color: var(--ink); font-size: 12px; background: #f1f5f9; }
  .no-print { text-align: center; padding: 12px; }
  .print-btn { background: var(--brand); color: #fff; border: 0; border-radius: 8px; padding: 10px 20px; font-size: 14px; cursor: pointer; }
  .sheet {
    width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff; color: var(--ink);
    padding: 16mm 15mm; position: relative;
  }
  .watermark {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    font-size: 90px; font-weight: 800; color: rgba(15,23,42,0.05); transform: rotate(-30deg);
    pointer-events: none; letter-spacing: 6px;
  }
  .doc-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; border-bottom: 2px solid var(--brand); padding-bottom: 12px; }
  .seller { display: flex; gap: 12px; align-items: flex-start; }
  .seller img { max-height: 56px; max-width: 160px; object-fit: contain; }
  .seller h1 { font-size: 18px; margin: 0 0 2px; }
  .seller .muted { color: var(--muted); font-size: 11px; line-height: 1.5; }
  .doc-title { text-align: right; }
  .doc-title h2 { margin: 0; font-size: 22px; letter-spacing: 1px; color: var(--brand); text-transform: uppercase; }
  .doc-title .num { font-size: 13px; font-weight: 700; margin-top: 4px; }
  .badge { display: inline-block; margin-top: 6px; padding: 2px 8px; border-radius: 999px; background: #eff6ff; color: var(--brand); font-size: 10px; font-weight: 700; text-transform: uppercase; }
  .meta-parties { display: flex; justify-content: space-between; gap: 24px; margin-top: 14px; }
  .party h3 { margin: 0 0 4px; font-size: 11px; text-transform: uppercase; color: var(--muted); letter-spacing: 0.5px; }
  .party .name { font-weight: 700; font-size: 13px; }
  .party .muted { color: var(--muted); font-size: 11px; line-height: 1.5; }
  .meta-list { text-align: right; font-size: 11px; }
  .meta-list div { margin-bottom: 2px; }
  .meta-list .k { color: var(--muted); margin-right: 6px; }
  table.items { width: 100%; border-collapse: collapse; margin-top: 16px; }
  table.items thead th { background: #f8fafc; border-bottom: 1.5px solid var(--line); text-align: left; padding: 8px 8px; font-size: 10.5px; text-transform: uppercase; color: var(--muted); letter-spacing: 0.3px; }
  table.items tbody td { padding: 8px 8px; border-bottom: 1px solid var(--line); vertical-align: top; }
  table.items tbody tr { page-break-inside: avoid; }
  .r { text-align: right; }
  .c { text-align: center; }
  .totals { display: flex; justify-content: flex-end; margin-top: 14px; }
  .totals table { width: 300px; border-collapse: collapse; }
  .totals td { padding: 4px 8px; font-size: 12px; }
  .totals td.k { color: var(--muted); }
  .totals td.v { text-align: right; }
  .totals tr.grand td { border-top: 2px solid var(--brand); font-size: 15px; font-weight: 800; padding-top: 8px; }
  .blocks { margin-top: 18px; display: grid; gap: 12px; }
  .block h4 { margin: 0 0 3px; font-size: 11px; text-transform: uppercase; color: var(--muted); }
  .block p { margin: 0; font-size: 11px; line-height: 1.55; white-space: normal; }
  .signs { display: flex; justify-content: space-between; gap: 40px; margin-top: 40px; }
  .sign { flex: 1; border-top: 1px solid var(--ink); padding-top: 6px; font-size: 11px; color: var(--muted); }
  .foot { margin-top: 22px; text-align: center; color: var(--muted); font-size: 11px; border-top: 1px solid var(--line); padding-top: 10px; }
  @page { size: A4 portrait; margin: 12mm; }
  @media print {
    body { background: #fff; }
    .no-print { display: none; }
    .sheet { width: auto; min-height: auto; margin: 0; padding: 0; box-shadow: none; }
    table.items thead { display: table-header-group; }
    table.items tfoot { display: table-footer-group; }
  }
`;

function sellerBlock(s: A4Seller): string {
  const logo = s.logoUrl ? `<img src="${esc(s.logoUrl)}" alt="${esc(s.name)}" />` : '';
  const lines = [s.addressLine, s.phone ? `Tel: ${s.phone}` : '', s.email, s.taxNumber ? `Tax/VAT: ${s.taxNumber}` : '']
    .filter(Boolean)
    .map((l) => esc(l))
    .join('<br />');
  return `<div class="seller">${logo}<div><h1>${esc(s.name)}</h1><div class="muted">${lines}</div></div></div>`;
}

function partyBlock(p: A4Party): string {
  const lines = [p.company, p.address, p.phone ? `Tel: ${p.phone}` : '', p.email, p.taxNumber ? `Tax/VAT: ${p.taxNumber}` : '']
    .filter(Boolean)
    .map((l) => esc(l))
    .join('<br />');
  return `<div class="party"><h3>${esc(p.label)}</h3><div class="name">${esc(p.name)}</div><div class="muted">${lines}</div></div>`;
}

export function renderA4Document(doc: A4Document): string {
  const alignClass = (a?: string) => (a === 'right' ? ' class="r"' : a === 'center' ? ' class="c"' : '');
  const thead = doc.columns
    .map((c) => `<th${alignClass(c.align)}${c.width ? ` style="width:${esc(c.width)}"` : ''}>${esc(c.label)}</th>`)
    .join('');
  const tbody = doc.rows
    .map(
      (row) =>
        `<tr>${row.cells
          .map((cell, i) => `<td${alignClass(doc.columns[i]?.align)}>${cell}</td>`)
          .join('')}</tr>`,
    )
    .join('');

  const summary = doc.summary
    .map(
      (s) =>
        `<tr${s.strong ? ' class="grand"' : ''}><td class="k"${s.muted ? ' style="color:#94a3b8"' : ''}>${esc(s.label)}</td><td class="v">${esc(s.value)}</td></tr>`,
    )
    .join('');

  const blocks: string[] = [];
  if (doc.notes) blocks.push(`<div class="block"><h4>Notes</h4><p>${multiline(doc.notes)}</p></div>`);
  if (doc.terms) blocks.push(`<div class="block"><h4>Terms &amp; Conditions</h4><p>${multiline(doc.terms)}</p></div>`);

  const signatures = doc.signatures
    ? `<div class="signs"><div class="sign">Authorized signature</div><div class="sign">Customer signature</div></div>`
    : '';

  const meta = doc.meta.map((m) => `<div><span class="k">${esc(m.label)}</span>${esc(m.value)}</div>`).join('');

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(doc.title)} ${esc(doc.number)}</title>
<style>${A4_STYLES}</style></head>
<body>
  <div class="no-print"><button class="print-btn" onclick="window.print()">Print / Save as PDF</button></div>
  <div class="sheet">
    ${doc.watermark ? `<div class="watermark">${esc(doc.watermark)}</div>` : ''}
    <div class="doc-head">
      ${sellerBlock(doc.seller)}
      <div class="doc-title"><h2>${esc(doc.title)}</h2><div class="num">${esc(doc.number)}</div>${doc.statusBadge ? `<div class="badge">${esc(doc.statusBadge)}</div>` : ''}</div>
    </div>
    <div class="meta-parties">
      <div>${doc.party ? partyBlock(doc.party) : ''}</div>
      <div class="meta-list">${meta}</div>
    </div>
    <table class="items">
      <thead><tr>${thead}</tr></thead>
      <tbody>${tbody}</tbody>
    </table>
    <div class="totals"><table>${summary}</table></div>
    <div class="blocks">${blocks.join('')}</div>
    ${signatures}
    ${doc.footerText ? `<div class="foot">${esc(doc.footerText)}</div>` : ''}
  </div>
</body>
</html>`;
}
