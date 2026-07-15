# UI Consistency Audit — Buttons & Actions

_Hardware POS · design-system review. Scope: every button, icon button, link-as-button,
dialog footer, and action group in `apps/web/src`._

This is a living document. Section 6 tracks what has been fixed vs. what remains.

---

## 1. Problems found

### 1.1 The shared `Button` was under-powered
`components/ui/button.tsx` had `primary | secondary | outline | ghost | danger` and
`default | sm | lg | icon`. It lacked:

- **Loading state** — every busy button hand-rolled `"Saving…"` text or an inline
  `<Loader2 className="animate-spin" />` (e.g. `product-form.tsx`, POS sync).
- **Left/right icon props** — icons were passed as children; spacing relied on `gap-2`.
- **`fullWidth`** — done ad-hoc via `className="w-full"` / `flex-1`.
- **`asChild` / link rendering** — no way to render an `<a>`/`<Link>` that looks like a
  button, forcing two divergent idioms (see 1.4).
- **Compact icon sizes** — `size="icon"` is fixed 44px; compact icon buttons override
  with `h-9 w-9` (36px) or `h-8 w-8` (32px), inconsistently.
- **Default `type="button"`** — inside a `<form>` a `Button` defaulted to `submit`;
  callers had to remember `type="button"`.
- `danger` was **dead code** — no `Button` used it; destructive actions were `ghost` +
  a `text-danger` className. `secondary` was defined but unused.

### 1.2 Destructive actions were not visually differentiated
No destructive action used a red button. They were `ghost` + `text-danger`, or raw
`<button>`. Worst offenders: POS **Clear cart** (raw `<button>`), **Cancel quotation**
(`ghost`, no red at all — read as a low-emphasis neutral action).

### 1.3 Icon-button size / touch-target inconsistency
The same round icon action rendered at **44 / 36 / 32 px** across POS, categories,
returns and sales. Several controls fell below the 44px touch minimum for a tablet POS
(32px category/sales actions; 24px clear-search "x"; ~30px payment quick-amount chips).

### 1.4 Two competing "link that looks like a button" idioms
- Pattern A: `<Link className={buttonVariants(...)}>` (customers, products, quickbooks…).
- Pattern B: `<Link><Button/></Link>` — a `<button>` nested inside an `<a>` (invalid
  nesting; quotations, sales, returns).

### 1.5 Inconsistent modal-footer Cancel variant
Cancel was `ghost` in 9 dialogs but `outline` in the 2 quotation dialogs. The Convert
dialog crowded **three** competing actions (two low-contrast outlines + a primary) into
one row, unlike every other dialog's clean Cancel + Primary pair.

### 1.6 Same operation, three different treatments
Row "open/edit" was a text link (customers), an icon Button (products), and a
`ghost sm` Button (sales) — three treatments for one job.

### 1.7 Ad-hoc controls re-implementing primitives
Date-range trigger, customer combobox trigger, "Add order discount", payment-method
tiles, refund-method tiles, discount-type toggles, and pill/chip filter rows each
re-created bordered/active styling by hand in 3+ places.

---

## 2. Screens / components affected

- **POS** `app/(app)/pos/page.tsx` — Clear cart (raw), clear-search (24px), category/
  subcategory chips, order-discount toggle, cart icon buttons (36px).
- **Payment** `app/(app)/pos/payment/page.tsx` — quick-amount chips, method tiles,
  off-pattern success footer, numpad.
- **Products** `products/page.tsx`, `product-form.tsx`, `products/categories/page.tsx` —
  destructive as ghost+text-danger, 32px icon actions, raw expand chevron.
- **Quotations** `quotations/[id]/page.tsx`, `quotation-builder.tsx` — Cancel quotation
  not red, Convert dialog triple-primary, raw remove-line icon.
- **Sales / Returns / Customers** — pagination 36px, row actions inconsistent, Link/Button
  nesting.
- **Settings / QuickBooks** — disabled "Save" on simulated forms.
- **Dialog primitive** `ui/dialog.tsx` — fixed footer bar; raw close button.

---

## 3. Proposed design-system rules

### 3.1 Button variants (semantic, one job each)
| Variant | Use |
| --- | --- |
| `primary` | The single dominant action of a section. Blue, white text. |
| `secondary` | Lower-priority filled action. Neutral/`bg-muted`. |
| `outline` | Neutral supporting action incl. **dialog Cancel**. Border + white. |
| `ghost` | Low-emphasis / inline icon actions. |
| `destructive` | Delete / void / cancel-transaction / remove. Red. (`danger` = alias.) |
| `success` | Rare final-approval confirmation. Green. Never the default primary. |
| `warning` | Needs-attention action. Amber. |
| `link` | Inline text action that behaves like a link. |

**One dominant primary per section.** Destructive actions are always red (or ghost+red
for inline icons). Never two equal-weight primaries in a footer.

### 3.2 Sizes / touch targets
| Size | Height | Use |
| --- | --- | --- |
| `sm` | 36px | Dense desktop tables, pagination. |
| `md` (default) | 44px | Standard actions (touch minimum). |
| `lg` | 56px | Page-level / dialog primary on tablet. |
| `xl` | 60px | POS/Payment main action. |
| `icon-sm` | 36px | Dense inline icon action. |
| `icon-md` (`icon`) | 44px | Standard icon action. |
| `icon-lg` | 56px | Prominent icon action. |

### 3.3 Consistency
Radius `rounded-xl` for all buttons/inputs; icon 16–20px; icon-to-label gap `gap-2`;
`isLoading` shows a spinner and disables; icon-only buttons require `aria-label`;
`type="button"` by default; links use `asChild` (`<Button asChild><Link/></Button>`).

### 3.4 Dialog footers
Always `outline` Cancel + one `primary` (or `destructive`) confirm, right-aligned. A
tertiary destructive action (e.g. "Remove discount") sits left via `mr-auto`.

---

## 4. Components to refactor

1. `components/ui/button.tsx` — the upgrade (variants, sizes, loading, icons, fullWidth,
   `asChild`, default type). **Foundational — done first.**
2. Dialog Cancel buttons → `outline` (9 files).
3. POS Clear cart + clear-search → shared Button.
4. Destructive actions → `destructive` variant (Cancel quotation) / ghost+destructive
   for inline icons (delete/remove/deactivate).
5. Icon-button sizes → `icon-sm`/`icon-md` instead of ad-hoc `h-8`/`h-9`.
6. Link-as-button → `<Button asChild><Link/></Button>`.

---

## 5. Migration approach

- **Backward-compatible first.** Keep `danger`, `default`, `icon` as aliases so no
  existing call site breaks; add the new variants/sizes/props alongside.
- **Refactor in safe passes**, verifying typecheck + lint + build after each: (a) upgrade
  Button, (b) standardize dialog Cancel, (c) POS raw buttons, (d) destructive adoption,
  (e) icon-size normalization, (f) link-as-button.
- **No behavioural change** — only presentation/props. Existing handlers, state and
  permissions are untouched.

---

## 6. Before / after status

| Area | Before | After (this pass) |
| --- | --- | --- |
| Button variants | 5 (2 unused) | 8 semantic + aliases |
| Button sizes | 4 | 7 (incl. compact/ prominent icon sizes, `xl`) |
| Loading state | hand-rolled per call | `isLoading` prop + spinner |
| Icon/label spacing | manual children | `leftIcon`/`rightIcon` props |
| Full width | ad-hoc `w-full` | `fullWidth` prop |
| Link-as-button | 2 divergent idioms | `asChild` |
| Default type | `submit` in forms | `button` |
| Destructive actions | ghost + text-danger | `destructive` variant / ghost+destructive |
| Dialog Cancel | 9 ghost / 2 outline | `outline` everywhere |
| POS Clear cart / clear search | raw `<button>` | shared Button |

Remaining (tracked as follow-ups, non-blocking): tile/chip/segmented-control patterns
(payment methods, refund methods, discount-type toggles, filter pills) should graduate
into dedicated `SegmentedControl` / `Chip` primitives; row-action treatment should be
unified to one idiom; combobox/date-range triggers should share an `InputTrigger`
primitive. These are presentational-only and do not affect behaviour.
