# Humora HR — Design System & UI Guidelines

Reference for the visual language of the admin web app (`hr_website/`). Everything below was measured
from the shipped screens — `app/layout.tsx`, `components/Sidebar.tsx`, `components/Header.tsx`,
`app/globals.css` and the nine screens under `app/*/page.tsx` — so new work stays visually consistent
with what already exists.

Scope: presentation only. For architecture, layering and API rules see `AGENTS.md`.

---

## 1. Design principles

| Principle | How it shows up in the code |
| --- | --- |
| **Calm, data-dense admin** | Thin `border-slate-200` hairlines, `shadow-sm` only, no gradients, no heavy shadows. Colour is reserved for state, never decoration. |
| **One accent, many tints** | A single brand blue `#0C66E4`, used with `blue-50`/`blue-100` tints for emphasis and active states. |
| **Micro-labels over big type** | Metadata is `text-[10px]` / `text-[9px]` uppercase `tracking-wide text-slate-400`; the biggest text on a page is the `text-2xl` H1. |
| **State must be unmissable** | Every status is a coloured pill (emerald / amber / rose / blue / slate). Meaning is never carried by text alone. |
| **Numbers are scannable** | Currency via `new Intl.NumberFormat("vi-VN")`, amounts in `tabular-nums`, right-aligned in tables. |
| **Vietnamese-first copy** | All user-facing strings are Vietnamese; code, identifiers and comments stay English. |

---

## 2. Colour tokens

Defined in `app/globals.css`:

```css
:root {
  --background: #f8f9ff;  /* app canvas */
  --foreground: #172033;  /* default text */
  --primary: #0c66e4;     /* brand blue */
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-be-vietnam-pro);
}
```

> **Note / possible cleanup:** `--primary` exists but is **not** mapped in `@theme inline` (there is no
> `--color-primary`), so `bg-primary` does not resolve. Shipping code hardcodes the hex instead.
> Until that is mapped, write `bg-[#0C66E4]` / `text-[#0C66E4]` exactly as the existing screens do.

### 2.1 Brand & surfaces (measured usage)

| Token | Value | Utility as written | Uses |
| --- | --- | --- | --- |
| Primary | `#0C66E4` | `bg-[#0C66E4]`, `text-[#0C66E4]`, `border-[#0C66E4]` | 79 |
| Canvas | `#F8F9FF` | `bg-[#F8F9FF]` (body + input wells) | 7 |
| Inset / muted panel | `#F3F6FC` | `bg-[#F3F6FC]` (table head, segmented control, totals rows) | 10 |
| Chat canvas | `#FBFCFF` | `bg-[#FBFCFF]` (AI transcript + nested step cards) | 2 |
| Sidebar promo panel | `#F1F5FF` | `bg-[#F1F5FF]` | 1 |
| Surface | white | `bg-white` | — |
| Hairline (strong) | — | `border-slate-200/80` | 15 |
| Hairline (default) | — | `border-slate-200` | 64 |
| Hairline (inside cards) | — | `border-slate-100` | 27 |
| Accent hairline | — | `border-blue-100` | 5 |

### 2.2 Semantic tones

Only these pairings are used. Reuse them rather than inventing new ones.

| Meaning | Background | Text | Border | Seen in |
| --- | --- | --- | --- | --- |
| Active / info / brand | `bg-blue-50` (34 uses), `bg-blue-100` | `text-[#0C66E4]`, `text-blue-700`, `text-blue-800` | `border-blue-100/200` | nav active, chips, KPI icon chips |
| Success / valid / on-time | `bg-emerald-50` | `text-emerald-600/700` | `border-emerald-200` | approved, working, khớp |
| Warning / pending / late | `bg-amber-50` (`amber-50/50`, `/60`, `/70`) | `text-amber-600/700/800` | `border-amber-200` | pending, late, lệch nhẹ |
| Danger / rejected / mismatch | `bg-rose-50` | `text-rose-600/700` | `border-rose-200` | rejected, early leave, error banner |
| Neutral / inactive / resigned | `bg-slate-50`, `bg-slate-100` | `text-slate-500`, `text-slate-400` | `border-slate-200` | disabled states, "Nghỉ việc" |
| Extra KPIs | `bg-teal-50/teal-600` | — | — | 4th metric card tone ("mint") |

Accent hexes that appear once or twice (`#F4B740`, `#11A879`, `#E6ECF5`, `#e8edf5`) are one-off
artwork colours — do not promote them into the palette.

---

## 3. Typography

Family: **Be Vietnam Pro**, loaded once in `app/layout.tsx` via `next/font/google`
(`variable: "--font-be-vietnam-pro"`, `subsets: ["latin"]`, `weight: ["400","500","600","700"]`) and
wired to Tailwind through `--font-sans` in `@theme inline`. Body also sets
`font-family: var(--font-be-vietnam-pro), sans-serif`. **Never add a second font.**

| Role | Classes | Notes |
| --- | --- | --- |
| Page title (H1) | `text-2xl font-bold tracking-tight text-slate-900` | 10 uses of `text-2xl` |
| Card title | `text-lg font-semibold text-slate-800` | |
| Body / table cell | `text-xs` (80 uses) | The default size for almost all UI text |
| Comfortable body | `text-sm` (27 uses) | Dialogs, chat, prose |
| Metadata eyebrow | `text-[10px] font-semibold uppercase tracking-wide text-slate-400` | 14 uses of `tracking-wide`; always above the H1 |
| Micro label | `text-[11px]`, `text-[10px]`, `text-[9px]` | Chips, timestamps, table heads |
| Money / metrics | `text-2xl font-bold tabular-nums tracking-tight text-slate-900` | `tabular-nums` is required for aligned figures |

Weights actually used: `font-semibold` (107) > `font-bold` (42) > `font-medium` (28). `font-semibold`
is the workhorse for labels and buttons.

---

## 4. Layout, spacing & rhythm

### 4.1 App shell (`app/layout.tsx`)

```tsx
<body className="... flex h-dvh overflow-hidden bg-[#F8F9FF] font-sans text-slate-900 antialiased
                 selection:bg-blue-100 selection:text-blue-900">
  <Sidebar />
  <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
    <Header />
    <main className="min-h-0 flex-1 overflow-y-auto bg-[#F8F9FF] p-4 md:p-6">
      <div className="mx-auto w-full max-w-[1440px]">{children}</div>
    </main>
  </div>
</body>
```

- Fixed-height shell: `h-dvh` + `overflow-hidden`; only `<main>` scrolls (`overflow-y-auto`).
- Content is capped at `max-w-[1440px]` and centred; gutters `p-4` → `md:p-6`.
- Sidebar `w-56`, hidden below `md`. Header `h-16`, `sticky top-0 z-10`, `border-b border-slate-200/80`.

### 4.2 Page rhythm

- Page root is always `<div className="space-y-5">` (9 uses) — sections stack with 20px gaps.
- Section header block: eyebrow (`text-[10px] uppercase text-slate-400`) → H1 (`text-2xl font-bold
  tracking-tight`) → `mt-1 text-xs text-slate-500` description, with the action buttons in a
  `flex flex-col ... lg:flex-row lg:items-end` sibling.
- Card interiors: `p-4` (compact) or `p-5`/`p-6` (comfortable); table heads `px-4 py-3` / `px-5 py-4`.
- Field groups inside dialogs: `grid gap-4 sm:grid-cols-2`.

### 4.3 Grid recipes

| Purpose | Classes |
| --- | --- |
| Filter / stat row | `grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4` |
| Two-up panels | `grid grid-cols-1 gap-6 lg:grid-cols-2` |
| Content + rail | `grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_290px]` |
| Dashboard tiles | `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6` |

Tables always live inside a horizontally scrolling wrapper on the section, with the table itself
carrying `w-full min-w-[540px]` (compact) or `min-w-[920px]` (full report) so mobile scrolls sideways.

---

## 5. Radii, borders & elevation

| Radius | Uses | Applied to |
| --- | --- | --- |
| `rounded-lg` | 84 | Buttons, inputs, selects, filter pills, timeline blocks — the default |
| `rounded-full` | 33 | Avatars, badges, search field, kbd hint, step counters |
| `rounded-xl` | 28 | Cards and panels (the standard container radius) |
| `rounded-md` | 28 | Tab buttons, small icon buttons, micro chips |
| `rounded-2xl` | 6 | Modals, dashboard tiles |
| `rounded-tr-sm` / `rounded-tl-sm` | — | Chat bubble tails only |

Borders & shadows:

- Container: `rounded-xl border border-slate-200/80 bg-white shadow-sm`.
- Modal: `rounded-2xl bg-white p-6 shadow-2xl` over a `bg-slate-900/40` scrim.
- `shadow-sm` is the only shadow used on surfaces (30 uses); `shadow-md` appears once as hover.
  `shadow-lg` is not used at all.
- Metric cards add a one-off accent rule: `border-b-2 border-b-blue-200`.
- Dashed placeholders / empty slots: `border-2 border-dashed border-slate-100 rounded-xl text-slate-400`.

---

## 6. Iconography

- `lucide-react` only, imported individually as named imports.
- Inline with text: `size={13}`–`size={17}`, coloured `text-slate-400` (neutral) or the semantic tone.
- Inside icon chips: `size={14}`–`size={16}` in an `h-8 w-8` / `h-9 w-9` chip
  (`flex items-center justify-center rounded-lg bg-blue-50 text-[#0C66E4]`).
- Brand mark: `h-8 w-8 rounded-lg bg-[#0C66E4] text-sm font-bold text-white` (Sidebar + Chat header).
- Loading is always `Loader2` with `className="animate-spin"`.
- Decorative icons that carry meaning (bell indicator, statuses) are paired with text or `aria-label`.

---

## 7. Component recipes

Copy these verbatim; they are lifted from shipped screens.

### 7.1 Page header

```tsx
<div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
  <div>
    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
      Nhân sự / Bảng công
    </p>
    <h1 className="text-2xl font-bold tracking-tight">Xem bảng công</h1>
    <p className="mt-1 text-xs text-slate-500">Đối chiếu công, giờ làm…</p>
  </div>
  <div className="flex flex-wrap gap-2">{/* actions */}</div>
</div>
```

The eyebrow names the module (and the SCRUM ticket where the screen maps to one, e.g.
`Tài chính & thu / SCRUM-44`). Variant: the header can be a white card instead —
`rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm` — as in Báo cáo.

### 7.2 Surface / panel

```tsx
<section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
  <div className="flex flex-col gap-3 border-b border-slate-100 p-3">{/* toolbar */}</div>
  {/* content */}
</section>
```

### 7.3 KPI / metric card

```tsx
<article className="rounded-xl border border-slate-200/80 border-b-2 border-b-blue-200 bg-white p-4 shadow-sm">
  <div className="flex items-start justify-between gap-3">
    <p className="max-w-44 text-[10px] font-semibold uppercase leading-relaxed tracking-wide text-slate-500">
      Tổng tiền đầu ca
    </p>
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#0C66E4]">
      <Wallet size={16} />
    </span>
  </div>
  <p className="mt-5 text-2xl font-bold tabular-nums tracking-tight text-slate-900">45.200.000 ₫</p>
  <p className="mt-1 text-[10px] text-emerald-600">+4,2% · so với tháng trước</p>
</article>
```

Tones for the icon chip: blue (`bg-blue-50 text-[#0C66E4]`), green (`bg-emerald-50 text-emerald-600`),
mint (`bg-teal-50 text-teal-600`), amber (`bg-amber-50 text-amber-600`). Deltas: emerald for up,
rose for down, amber for needs-attention.

### 7.4 Tabs & filter bar

Two tab styles coexist — pick by context:

```tsx
{/* Segmented tabs (Đơn từ, Thông báo): active = solid brand fill */}
<button className={`rounded-md px-3 py-2 text-xs font-semibold ${active
  ? "bg-[#0C66E4] text-white"
  : "text-slate-600 hover:bg-slate-100"}`}>Chờ duyệt</button>

{/* Compact segmented control (Chat): track + white thumb */}
<div className="flex gap-1 rounded-lg bg-[#F3F6FC] p-1 text-[10px] font-medium text-slate-500">
  <button className="rounded-md bg-white px-3 py-1.5 text-[#0C66E4] shadow-sm">Trang tổng quan</button>
  <button className="rounded-md px-3 py-1.5 hover:text-slate-800">Hội thoại</button>
</div>
```

Filter controls are label-wrapped selects with a leading icon and a transparent control inside:

```tsx
<label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs">
  <Filter size={14} />
  <select className="bg-transparent outline-none" value={branch} onChange={…}>
    <option value="all">Tất cả chi nhánh</option>
  </select>
</label>
```

Search inputs reuse the same pill: `rounded-lg border border-slate-200 bg-[#F8F9FF] px-3 py-2` with
`placeholder:text-slate-400`.

### 7.5 Buttons

| Variant | Classes |
| --- | --- |
| Primary | `inline-flex items-center gap-2 rounded-lg bg-[#0C66E4] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50` |
| Secondary | `inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50` |
| Tinted / soft | `rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-[#0C66E4] hover:bg-blue-100` |
| Destructive (outline) | `inline-flex items-center gap-2 rounded-lg border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50` |
| Destructive (solid, confirm) | `rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50` |
| Success (approve) | `inline-flex items-center gap-1 rounded-md bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100` |
| Icon-only | `rounded-md p-2 text-slate-500 hover:bg-slate-100` |
| Cancel (in dialog) | `rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold` |

Always `inline-flex items-center gap-1…2` with a `size={13}`–`size={14}` icon; the loading state swaps
the label for `Đang lưu...` / `Đang xử lý...` and sets `disabled`.

### 7.6 Status badges

```tsx
<span className="rounded-full px-2.5 py-1 text-[11px] font-semibold bg-amber-50 text-amber-700">Chờ duyệt</span>
```

Badge maps found in the code (extend, don't replace):

| Domain | Value | Label (vi) | Tone |
| --- | --- | --- | --- |
| Request | `PENDING` | Chờ duyệt | `bg-amber-50 text-amber-700` |
| Request | `APPROVED` | Đã duyệt | `bg-emerald-50 text-emerald-700` |
| Request | `REJECTED` | Từ chối | `bg-rose-50 text-rose-700` |
| Employee | `WORKING` | Đang làm | `bg-emerald-50 text-emerald-700` |
| Employee | `NOT_STARTED` | Chưa vào ca | `bg-amber-50 text-amber-700` |
| Employee | `ON_LEAVE` | Nghỉ phép | `bg-blue-50 text-blue-700` |
| Employee | `RESIGNED` | Nghỉ việc | `bg-slate-100 text-slate-500` |
| Attendance | `ON_TIME` | Đúng giờ | `bg-emerald-50 text-emerald-700` |
| Attendance | `LATE` | Trễ | `bg-amber-50 text-amber-700` |
| Attendance | `EARLY_LEAVE` | Về sớm | `bg-rose-50 text-rose-700` |
| Facility *(new, SCRUM-45/46)* | `GOOD` | Tốt | `bg-emerald-50 text-emerald-700` |
| Facility *(new, SCRUM-45/46)* | `BROKEN` | Hỏng | `bg-rose-50 text-rose-700` |
| Facility *(new, SCRUM-45/46)* | `NEEDS_MAINTENANCE` | Cần bảo trì | `bg-amber-50 text-amber-700` |

Counters use a neutral or blue pill: `inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-[10px]
font-semibold text-blue-800` ("3 thông báo chưa đọc").

### 7.7 Table

```tsx
<table className="w-full min-w-[540px] text-left text-xs">
  <thead className="bg-[#F3F6FC] text-[9px] font-semibold uppercase tracking-wide text-slate-500">
    <tr>
      <th className="px-4 py-3">Nhân sự</th>
      <th className="px-4 py-3 text-right">Doanh thu ghi nhận</th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-t border-slate-100 transition-colors hover:bg-slate-50/70">
      <td className="px-5 py-4">…</td>
    </tr>
  </tbody>
</table>
```

Rules: header `bg-[#F3F6FC]` in uppercase micro-type; numeric columns `text-right` + `tabular-nums`;
row separator `border-t border-slate-100`; money via `Intl.NumberFormat("vi-VN")`; wrap the table in an
`overflow-x-auto` container inside the section; the editable cell (shifts grid) is a
`min-h-[68px] rounded-lg border border-blue-100 bg-blue-50/60` button with a hover-only `Pencil`.

### 7.8 Modal / dialog

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
  <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
    <div className="flex items-start justify-between">
      <div>
        <h2 className="font-bold text-slate-900">Từ chối đơn nghỉ phép</h2>
        <p className="mt-1 text-xs text-slate-500">Lý do là bắt buộc theo yêu cầu nghiệp vụ.</p>
      </div>
      <button onClick={onClose}><X size={18} className="text-slate-400" /></button>
    </div>
    {/* body */}
    <div className="mt-5 flex justify-end gap-2">{/* Hủy | Xác nhận */}</div>
  </div>
</div>
```

`max-w-md` for confirm/decision dialogs, `max-w-lg` for forms, always `z-50`. Destructive confirm sits
on the right, "Hủy" to its left. Quick-choice chips inside a dialog:
`rounded-full border px-3 py-1.5 text-xs`, selected = `border-blue-200 bg-blue-50 text-blue-700`,
unselected = `border-slate-200 text-slate-600`.

### 7.9 Form controls

```tsx
<label className="text-xs font-semibold text-slate-600">
  Nhân viên
  <select className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm font-normal outline-none">
    …
  </select>
</label>
```

Labels are `text-xs font-semibold text-slate-600`; controls are `rounded-lg border border-slate-200`
with `p-2.5 text-sm font-normal`. Textarea: `mt-4 w-full rounded-lg border border-slate-200 p-3 text-sm
outline-none focus:border-blue-500`. Focus is signalled by `focus:border-blue-500` or
`focus:border-[#0C66E4] focus:ring-2 focus:ring-blue-500/15` (Header search).

### 7.10 Empty, loading, error states

```tsx
{/* Empty / placeholder */}
<div className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-slate-100 text-sm text-slate-400">
  Chưa có dữ liệu hoạt động
</div>

{/* Loading (button or inline) */}
<button disabled className="… disabled:opacity-50">Đang lưu...</button>
<Loader2 size={13} className="animate-spin text-[#0C66E4]" />

{/* Error banner (inside a form/panel) */}
<div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</div>
```

Inline page errors are reported with Vietnamese copy from the API (`data.error`) — never raw English
server messages. `last-updated` style metadata uses
`text-[10px] text-slate-400`.

### 7.11 Avatar

Initials-based, no photos anywhere in the admin UI:

```tsx
<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
  {name.split(" ").map((word) => word[0]).slice(-2).join("")}
</div>
```

### 7.12 Sidebar navigation

```tsx
<Link
  href={item.href}
  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors ${
    isActive ? "bg-blue-50 font-semibold text-[#0C66E4]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
  }`}
>
  <Icon size={17} className={isActive ? "text-[#0C66E4]" : "text-slate-400 group-hover:text-slate-600"} />
  {item.name}
</Link>
```

Section label above the list: `mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider
text-slate-400`. The brand block is the accent square + two-line name; the footer card is
`m-3 rounded-xl border border-blue-100 bg-[#F1F5FF] p-3` with the branch and shift summary. **Every new
screen must be added here** (lucide icon + Vietnamese label) so navigation stays complete.

### 7.13 Global search (Header)

Rounded search field on the header bar — `rounded-full border border-slate-200 bg-[#F8F9FF] py-2 pl-10
pr-14 text-xs` with a leading `Search size={16}` and a trailing `kbd` hint (`⌘K`). Results render in an
absolute panel: `absolute mt-2 w-full rounded-xl border border-slate-100 bg-white shadow-lg` with rows
`px-4 py-2 hover:bg-slate-50` — title `text-sm font-medium text-slate-900` and type
`text-xs uppercase text-slate-500`. The states are `Đang tìm kiếm...` (with `Loader2`) and
`Không tìm thấy kết quả nào`.

### 7.14 Chat (AI assistant)

Transcript canvas `bg-[#FBFCFF]`. User message: right-aligned bubble
`ml-auto max-w-[88%]` + `rounded-xl rounded-tr-sm bg-[#0C66E4] px-4 py-3 text-xs text-white shadow-sm`
with a `bg-blue-100 text-[#0C66E4]` avatar. Assistant message: white
`rounded-xl rounded-tl-sm border border-slate-200/70 bg-white p-4 shadow-sm` card with a brand-square
avatar, a `BookOpen` source line in `text-[10px] font-semibold text-[#0C66E4]`, numbered steps as
`rounded-lg border border-slate-100 bg-[#FBFCFF] p-3` list items, and citation chips
`rounded-md bg-blue-50 px-2 py-1 text-[9px] font-medium text-[#0C66E4]`. Thinking state:
`Loader2 animate-spin` + `Đang phân tích dữ liệu...`.

### 7.15 Alert / warning card

```tsx
<div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
  <p className="text-[10px] font-semibold uppercase text-slate-400">{label}</p>
  <p className="mt-1 text-xl font-bold text-amber-800">{value}</p>
</div>
```

Use for reconciliation mismatches (`Chênh lệch`), radius/geofence warnings and facility alerts. Neutral
variant uses `border-slate-200 bg-white text-slate-900`.

---

## 8. Content, number & i18n conventions

- **Copy is Vietnamese.** Labels are short, verb-first and sentence case except the uppercase eyebrows:
  `Xem bảng công`, `Quản lý duyệt đơn nghỉ phép`, `Đánh dấu tất cả đã đọc`, `Lưu thay đổi`.
- **Currency:** `new Intl.NumberFormat("vi-VN").format(amount)` → `24.850.000`, suffixed with ` ₫`
  (`Nghỉ`/`0 ₫` for zero variance, `+50.000 ₫` / `-150.000 ₫` with an explicit sign for deltas).
- **Dates & times:** `vi-VN` — shift labels `T2 05/10`, ranges `28/10 – 29/10`,
  clock `14:00 – 23:00`, timestamps `09:24 AM`, relative times `25 phút trước` / `Hôm qua`.
- **Percentages** use a comma decimal separator: `+4,2%`, `Đạt 108% KPI`.
- **Code, identifiers, comments and file names stay English** (see `AGENTS.md`). The only exception is
  the Chat AI module, which is documented in Vietnamese.
- **Empty states** are plain sentences, never apologetic: `Chưa có dữ liệu hoạt động`,
  `Không tìm thấy kết quả nào`.
- **Ticket traceability:** the page eyebrow often carries the SCRUM id (`Nhân sự / SCRUM-41`,
  `Tài chính & thu / SCRUM-44`, `Trung tâm điều hành thông báo / SCRUM-48`). Keep that habit for new
  screens so the UI and the backlog stay linked.

---

## 9. Interaction & accessibility conventions

| Topic | Convention in the codebase |
| --- | --- |
| Focus | `focus:border-[#0C66E4] focus:ring-2 focus:ring-blue-500/15` (search), `focus:border-blue-500 outline-none` (inputs) |
| Hover | Surfaces: `hover:shadow-md transition-shadow`; rows: `hover:bg-slate-50/70`; buttons darken one step (`hover:bg-blue-700`, `hover:bg-blue-100`) |
| Disabled | `disabled:opacity-50` plus `disabled:cursor-not-allowed` on destructive confirms |
| Selected | Solid brand fill `bg-[#0C66E4] text-white`, or `bg-blue-50 text-[#0C66E4]` for soft selection |
| Transitions | `transition-colors` on controls, `transition-shadow` on cards; nothing longer/exotic |
| Labelling | Interactive filters carry `aria-label` (`Chi nhánh`, `Kỳ báo cáo`, `Tìm thông báo`); grouped buttons use `role="group"` + `aria-label` |
| Destructive actions | Guarded with a native `confirm()` in the admin screens (e.g. deleting a shift) and a mandatory reason inside the reject dialog |
| Data refresh | Pages use `fetch(..., { cache: "no-store" })`, a manual `Làm mới` button, and — on giám sát screens — a 60s `setInterval` poll |
| Loading | Button label swap + `Loader2 animate-spin`; skeletons are not used yet |
| Feedback | Inline error banners (rose) for form failures — the review flow now uses one too, instead of the `alert()` it used while it ran on the mock store |

---

## 10. Screen inventory & navigation map

Current `Sidebar` order (module → route → icon):

| Label (vi) | Route | Icon |
| --- | --- | --- |
| Tổng quan | `/` | `LayoutDashboard` |
| Quản lý chi nhánh | `/branches` | `Building2` |
| Cơ sở vật chất | `/facilities` | `PackageSearch` |
| Doanh thu | `/revenue` | `CircleDollarSign` |
| Đơn từ | `/requests` | `FileText` |
| Lịch làm việc | `/schedules` | `CalendarRange` |
| Trạng thái nhân viên | `/employee-status` | `UserCheck` |
| Bảng công | `/attendance` | `ClipboardCheck` |
| Quản lý nhân sự | `/staff` | `UsersRound` |
| Báo cáo | `/reports` | `PieChart` |
| Thông báo | `/notifications` | `Bell` |
| Trợ lý AI | `/chat` | `Bot` |

Sibling screens outside the sidebar: `/login` (sign-in — it hides the shell), `/register`
(self-registration — hides the shell too, same card recipe with a fourth "Xác nhận mật khẩu" field),
`/api-docs` (Swagger UI). Both are listed in `lib/publicPaths.ts`, which is what `proxy.ts`, `Header`
and `Sidebar` read.

Screens required by the in-flight epics, following the same header/card/badge language:

| Feature | Ticket | Suggested route | Suggested label (vi) | Suggested icon |
| --- | --- | --- | --- | --- |
| Chi nhánh (branch + manager + radius) | SCRUM-47 | `/branches` ✅ built | Quản lý chi nhánh | `Building2` |
| Đăng ký tài khoản nội bộ | SCRUM-50 | `/register` ✅ built | Đăng ký | `UserRound` |
| Cơ sở vật chất theo chi nhánh | SCRUM-45/46 | `/facilities` ✅ built | Cơ sở vật chất | `PackageSearch` |
| Lịch làm việc (phân ca theo tuần) | SCRUM-30 | `/schedules` ✅ built | Lịch làm việc | `CalendarRange` |
| Chấm công (check-in/out + ảnh + toạ độ) | SCRUM-21/22/29 | `/attendance` ✅ built (web review side) | Bảng công | `ClipboardCheck` |
| Sửa giờ + xử lý khiếu nại | SCRUM-23 | `/attendance` ✅ built (dialog + badge, no new route) | Bảng công | `Pencil` / `Check` |
| Quản lý nhân sự (vai trò, nghỉ việc) | SCRUM-24 | `/staff` ✅ built | Quản lý nhân sự | `UsersRound` |

Check-in/check-out themselves are mobile-first (`hr_mobile_app`); the web counterpart is the review
screen (ảnh xác minh + toạ độ + trạng thái hợp lệ).

---

## 11. Do & Don't

**Do**

- Reuse `#0C66E4` + `blue-50` tints, `rounded-xl` cards, `border-slate-200/80`, `shadow-sm`.
- Keep the page rhythm: header block → toolbar/tabs → content sections, spaced with `space-y-5`.
- Express every state with a coloured badge from §7.6, next to text.
- Use `tabular-nums` for money and `Intl.NumberFormat("vi-VN")` for output.
- Add every new screen to `components/Sidebar.tsx` and give it an icon + Vietnamese label.
- Keep copy Vietnamese, identifiers English.

**Don't**

- Don't introduce a second accent colour, gradients, glassmorphism or heavy shadows (`shadow-lg`+).
- Don't add a new font; Be Vietnam Pro is the single family.
- Don't use `text-base`/`text-3xl`; the scale runs `text-[9px]…text-2xl`.
- Don't hardcode demo arrays in a screen — wire it to `/api/*` (or mark it clearly as a prototype).
- Don't widen the palette with the one-off hexes (`#F4B740`, `#11A879`, `#E6ECF5`, `#e8edf5`).
- Don't remove or bypass `@swagger` blocks when touching a route, and don't hand-edit
  `public/swagger.json`.

---

## 12. Checklist for a new screen

1. `app/<segment>/page.tsx`, default export, `"use client"` only if it has state/effects/browser APIs.
2. Root `<div className="space-y-5">` + §7.1 header (eyebrow with the SCRUM id, H1, description, actions).
3. Sections as §7.2 panels; filters as §7.4 pills; empty/loading/error states as §7.10.
4. Vietnamese copy, `vi-VN` numbers/dates, badges from §7.6.
5. Register in `components/Sidebar.tsx` (icon + label).
6. Wire to `/api/*` (never a demo array), handle `401`/`403`/`400` with a rose banner.
7. If you added a route: JSDoc `@swagger` block + shared schema in `lib/swagger.ts`.
8. Verify: `npx tsc --noEmit`, `npx eslint <files you touched>`, then open the page and `/api-docs`.

---

## 13. Where the tokens live & known gaps

| Concern | File |
| --- | --- |
| Colour tokens, font wiring | `app/globals.css` (`:root` + `@theme inline`) |
| Font loading, shell, `max-w-[1440px]` | `app/layout.tsx` |
| Navigation, brand block, branch footer card | `components/Sidebar.tsx` |
| Global search, notification bell, user card | `components/Header.tsx` |
| `text-[10px]` eyebrow convention | every `app/*/page.tsx` |

Known inconsistencies to fix when the relevant screen is next touched (do not mass-refactor):

1. `--primary` is declared but not exposed as `--color-primary`, so screens hardcode `#0C66E4`.
   Mapping it in `@theme inline` would allow `bg-primary` — a behaviour-preserving cleanup.
2. `shadow-md` is used once as a hover effect on dashboard tiles while every other card uses
   `shadow-sm`; normalise if the dashboard is reworked.
3. Every admin screen is now formatted like the rest (§4, §7) and reads a real table or RPC — the last
   minified page (`employee-status`) and the in-memory mock store went together with SCRUM-22. Keep new
   screens in that shape instead of reintroducing demo arrays.
4. The metric-card accent rule (`border-b-2 border-b-blue-200`) is currently only in Báo cáo; adopt it
   for new KPI rows so dashboards read consistently.
5. `/login` and `/register` escape the shell because `Sidebar`/`Header` return `null` for the paths in
   `lib/publicPaths.ts` (`isPublicPath(usePathname())`). Moving the nine authenticated screens into an
   `app/(dashboard)/` route group with its own layout is the cleaner long-term shape — a mechanical move,
   worth doing once no feature branch is in flight.
6. `/branches` has no branch-manager picker although `branches.manager_id` and the API field exist. The
   missing piece — a staff-list endpoint — now exists (`GET /api/users` without `id`, SCRUM-24, `OWNER`/`CHU`
   only, with the escalation rules in `UpdateStaffUseCase`), so the picker is a normal next step for that
   screen. It shows the assignment state as a badge (`Đã gán` / `Chưa gán`) in the meantime.
7. `/schedules` (SCRUM-30) replaced the old mock `/shifts` screen: the nav label changed from "Xếp ca" to
   "Lịch làm việc" and the route moved to `/schedules`, so `app/shifts/page.tsx` no longer exists. The
   schedule modal picks a person with `GET /api/search?type=users` (search-as-you-type) instead of a
   `<select>` of every employee — the same PII call as the branch-manager picker above, now answered by the
   SCRUM-24 directory endpoint. The `MockShift` helpers mentioned here are gone: SCRUM-22 deleted
   `lib/mock/adminStore.ts`.
8. `/facilities` and `/schedules` are the first screens with **pills for one dimension + `<select>`s for
   another** (facilities: condition pills + branch/category selects; schedules: status pills + branch
   select). Adopt that split on the next filter row: pills for a short closed set read at a glance, selects
   once there are more than ~5 options or the labels are long.

---

## Tóm tắt (Tiếng Việt)

- `design.md` là tài liệu tham chiếu giao diện cho web admin Humora, được tổng hợp trực tiếp từ các
  màn hình hiện có: nền `#F8F9FF`, màu thương hiệu `#0C66E4`, chữ **Be Vietnam Pro** (400–700),
  bo góc `rounded-lg` cho điều khiển và `rounded-xl` cho khung, chỉ dùng `shadow-sm`.
- Quy ước quan trọng: mỗi trang là `space-y-5` với khối tiêu đề (eyebrow `text-[10px]` in hoa → H1
  `text-2xl font-bold` → mô tả `text-xs text-slate-500`); trạng thái luôn là pill màu
  (xanh lá = hợp lệ, vàng = chờ, đỏ = lỗi, xanh dương = thông tin, xám = ngừng); số tiền định dạng
  `Intl.NumberFormat("vi-VN")` và dùng `tabular-nums`.
- Nội dung tiếng Việt, mã nguồn/định danh tiếng Anh. Màn hình mới phải khai báo trong
  `components/Sidebar.tsx` (icon lucide + nhãn tiếng Việt) và nối với `/api/*` thay vì dữ liệu mẫu.
- Mục 12 là checklist dựng màn hình mới; mục 13 liệt kê các điểm chưa nhất quán (nên sửa khi động vào
  màn hình tương ứng, không sửa hàng loạt).
