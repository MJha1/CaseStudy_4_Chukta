# Chukta — Build Spec (for Claude Code)

> Paste this whole file into a Claude Code session (or save it as `SPEC.md` at the repo root and say "build this"). It is the buildable version of the Chukta PRD: what to build, how, and in what order.

**Product one-liner:** Chukta finds every traffic challan on your vehicles, flags the wrong ones, and helps you dispute or clear them before your licence is at risk.

**Case-study framing:** Government / Public Sector — redesigning the *citizen's side* of India's traffic-enforcement loop (`notify → understand → contest → pay`), which today is undesigned (India issues ~8 cr e-challans/yr; ~75% go unpaid; wrong challans are common).

**Visual reference (build to match this):** the working prototype → https://claude.ai/code/artifact/8cbbedfe-f88a-4d61-b7fc-49e2c90bc8cf
Treat it as the source of truth for flows, copy, and look-and-feel. This spec is the authority for data, logic, and acceptance criteria.

---

## 0. Golden rules (read first)

1. **The dispute drafter is the real, shippable core.** It needs NO government/protected data — the user already has their challan. Build it fully.
2. **Do NOT scrape or auto-submit to any government portal** (echallan.parivahan.gov.in, VAHAN, mParivahan, Virtual Courts). It violates ToS and has anti-bot walls. Auto-fetch and live alerts are **clearly-labelled simulated previews** until an official API / licensed data partner exists.
3. **Ethics = pro-compliance.** Surface what's legitimately owed; fight only errors. Never build pay-to-skip, dark patterns, or fine "evasion." Never take a cut of a fine.
4. **Privacy:** in the MVP, all user data stays **on-device** (localStorage/IndexedDB). No PII leaves the browser except anonymous analytics events. Be DPDP-minded.
5. **Mobile-first.** It must look and feel like a phone app (the prototype uses a phone frame; a deployed PWA should be full-bleed mobile).

---

## 1. Tech stack (recommended — swap only with reason)

- **Framework:** Next.js 14 (App Router) + TypeScript. (Vite + React is fine if you prefer SPA.)
- **Styling:** Tailwind CSS. Mobile-first. Support light + dark via `prefers-color-scheme`.
- **State/persistence:** React state + `localStorage` (wrap in a typed `storage.ts`; guard every read/write in try/catch). No backend required for MVP.
- **Analytics:** Mixpanel (`mixpanel-browser`). Read token from `NEXT_PUBLIC_MIXPANEL_TOKEN`; no-op + `console.log` if unset.
- **PWA:** add a manifest + installable meta so testers can "Add to Home Screen".
- **Deploy:** Vercel (free). This unblocks real Mixpanel + real users.
- **Fonts:** Manrope (UI) + Space Mono (numbers, vehicle plates) via Google Fonts.
- **Icons:** inline SVG or `lucide-react`.

**Brand tokens:**
```
--brand      #0E8C6E   (teal-green = "cleared")
--brand-dark #0A6E56
--ink        #16211D   --muted #5D6B65
--bg/paper   #F3F6F4 / #FFFFFF
--danger     #C43A2B (overdue)   --warn #B4720F (due soon)   --ok #0E8C6E
```
The app's job is turning red (fines) → green (cleared); use danger/warn only for state, brand-green for the promise.

---

## 2. MVP scope — REAL vs SIMULATED

| Feature | Status in MVP |
|---|---|
| Dispute drafter (enter challan → letter) | **REAL — build fully** |
| Deadline guardian (60-day tracker + calendar) | **REAL** |
| Dispute tracker (saved, on-device) | **REAL** |
| Wrong-challan heuristics (flags) | **REAL logic on entered data** |
| Manual vehicle + challan entry | **REAL** |
| Analytics events | **REAL** |
| Auto-fetch all challans by vehicle no. | **SIMULATED — labelled "preview"** |
| Real-time new-challan push alerts | **SIMULATED — labelled** |
| Pro / paywall & payment | **Display only — no real payment** |

---

## 3. Features (epics + acceptance criteria)

### F1 — Dispute Drafter *(core, real)*
Multi-step flow to turn a user's own challan into a ready-to-file grievance.
- **Step 1 — Enter challan:** fields → vehicle no.* (uppercased, ≥6 chars), challan no., fine amount ₹* (numeric), challan date* (date), city/state, offence text, location. Optional: attach screenshot (stored as data URL, on-device only). Validate required (*) fields.
- **Step 2 — Ground + details:** pick one of 5 grounds (see §5). Show that ground's **evidence checklist**. Conditional extra field (e.g. sale date for "sold", receipt/txn id for "already paid"). Capture user name + mobile for the letter. Optional free-text note.
- **Step 3 — Output:** generate the **grievance letter** (see §5 template) in a read-only, copyable text area (copy-to-clipboard with fallback); show the **5-step "how to file it"** checklist (official portal steps — links but the user files manually); show the **deadline timeline** (F2); "Save & track" (F3) and "Add to Google Calendar" (F2).
- **AC:** entering a real challan produces a correct, personalized, copy-pasteable letter in ≤3 steps with no backend call; screenshot never leaves the device.

### F2 — Deadline Guardian *(real)*
- Compute `daysSince(challanDate)` and a **60-day pay window**. Show an escalation timeline: `Issued → Pay by 60 → Fine ↑ → Virtual Court → DL suspended`, marking passed milestones and the imminent one.
- Show "N days left" (warn styling under 15, danger past 60).
- **Google Calendar reminder:** build a `calendar.google.com/calendar/render?action=TEMPLATE&...` link with an all-day event ~5 days before day 60 (clamp to future); title `Challan deadline — <plate> (Chukta)`.
- **AC:** timeline state and days-left are correct for any date; calendar link opens a prefilled event.

### F3 — Dispute Tracker *(real, on-device)*
- Persist saved disputes (see §4) in localStorage. Disputes tab lists them with days-left / filed chips and actions: **View letter**, **Reminder**, **Mark filed** (toggle), **Delete**.
- **AC:** disputes survive reload; statuses update live; empty state prompts drafting the first dispute.

### F4 — Wrong-Challan Heuristics *(real logic)*
Auto-flag likely-wrong challans from entered/known data:
- **Class mismatch:** offence implies a different vehicle class than the registered one (e.g. "goods-vehicle overloading" on a 2-wheeler/hatchback) → likely cloned plate / OCR error.
- **Sold vehicle:** challan date > recorded sale date.
- **Duplicate:** same offence + location + date/time as another challan on the vehicle.
- Surface flags on challan cards and pre-select the matching dispute ground in F1.
- **AC:** each rule triggers on crafted sample data and pre-fills the ground.

### F5 — Vehicles & Challans (manual + sample) *(real entry; sample data allowed)*
- Add a vehicle by registration number. Ship 2–3 **clearly-labelled "sample" vehicles** with seeded challans so the app demos instantly (overdue / disputable / duplicate / sold cases per the prototype).
- Home dashboard: total outstanding (red if any overdue), DL-risk banner, per-vehicle cards, "disputable ₹" callout. Label sample data as **sample**.
- **AC:** sample data is visibly labelled; real user challans (via F1) are kept separate from samples.

### F6 — Auto-fetch preview *(simulated, labelled)*
- "Add vehicle → fetch challans" that returns simulated results, with a visible note: *"Demo — a live version fetches from VAHAN/mParivahan with your consent."* Do not call any real endpoint.

### F7 — Analytics *(real)*
Fire these events (Mixpanel if token set, else console): `vehicle_added`, `drafter_opened`, `dispute_drafted` (`{ground}`), `reminder_clicked`, `dispute_saved`, `dispute_filed`, `challan_viewed`. Also keep a local per-event counter for offline demo.
- **AC:** each event fires once per action; app works with no token.

### F8 — Pro / Revenue screens *(display only)*
- A "Pro" screen presenting the revenue model (see §6). Buttons show a toast "Demo — payments simulated". No real billing.

---

## 4. Data model (TypeScript)

```ts
type Vehicle = {
  id: string; plate: string; model?: string;
  vehicleClass?: 'LMV' | '2W' | 'GOODS' | 'TRANSPORT';
  soldDate?: string;        // ISO; presence => "sold" checks apply
  isSample?: boolean;
};

type Challan = {
  id: string; vehicleId: string;
  offence: string; section?: string;
  amount: number; date: string;      // ISO
  location?: string; city?: string;
  evidenceNote?: string;             // e.g. "ANPR camera capture"
  status: 'pending' | 'due' | 'overdue' | 'paid';
  flag?: 'classMismatch' | 'sold' | 'duplicate' | null;
  isSample?: boolean;
};

type Dispute = {                     // a real, user-created dispute
  id: string; plate: string; challanNo?: string;
  offence: string; amount: number; date: string; city?: string;
  ground: GroundKey; note?: string; saleDate?: string; receipt?: string;
  letter: string;                    // generated text
  filed: boolean; createdAt: number;
};

type GroundKey = 'wrongvehicle' | 'sold' | 'duplicate' | 'paid' | 'notthere';
```
Derive status from date: `days>60 → overdue`, `days>35 → due`, else `pending`.

---

## 5. Dispute grounds + letter (the core IP — implement exactly)

**Grounds** (`key → {title, evidence[], optional extra field, paragraph}`):

- **wrongvehicle** — "Not my vehicle / wrong vehicle class". Evidence: RC copy (shows class & model); photos of your actual vehicle; a past challan showing the correct vehicle. Para: *"The offence described pertains to a vehicle of a different class or description than my registered vehicle. My vehicle could not have committed the stated offence, which indicates a number-plate misread by the ANPR camera or a cloned/duplicate plate in circulation under my registration number."*
- **sold** — "Vehicle already sold". Extra field: **sale date**. Evidence: sale agreement/delivery note; Forms 29 & 30; buyer/transfer acknowledgement. Para: *"I sold and handed over possession of this vehicle on {saleDate} and applied for ownership transfer (Forms 29/30). The alleged offence occurred after this date, and liability therefore rests with the purchaser, not with me."*
- **duplicate** — "Duplicate challan". Evidence: screenshot of the original; payment receipt (if paid). Para: *"This challan duplicates an existing challan issued for the same offence, at the same location, on the same date and time. Two challans have been generated for a single alleged violation."*
- **paid** — "Already paid". Extra field: **receipt / txn id**. Evidence: payment receipt/txn id; bank/UPI statement entry. Para: *"The fine for this challan was already paid vide receipt/transaction ID {receipt}, yet the challan continues to reflect as pending. I request reconciliation of the payment and closure of the challan."*
- **notthere** — "My vehicle wasn't there". Evidence: Google Maps timeline export; FASTag/toll logs; parking/office/society CCTV. Para: *"My vehicle was not present at the stated location at the stated date and time. Location evidence for the vehicle's actual whereabouts on the day is enclosed."*

**Letter template** (fill placeholders; keep this structure):
```
To,
The Grievance / Notice Branch Officer,
{city} Traffic Police

Subject: Request for cancellation of e-challan {challanNo?} issued to vehicle {plate}

Respected Sir/Madam,

I am the registered owner of vehicle {plate}. I have received an e-challan {(No. X)?}
dated {prettyDate} for "{offence}" with a fine of ₹{amount}, stated to have occurred
at {location}.

I wish to contest this challan on the following ground: {ground.title}.

{ground.paragraph}
{note ? "Additional details: " + note : ""}

I request you to kindly review the enclosed evidence and cancel the above challan.
I am willing to provide any further information or appear as required.

Enclosures:
  1. {evidence[0]}
  2. {evidence[1]}
  ... (+ "Screenshot of the e-challan" if attached)

Thanking you,
{name}
Mobile: {mobile}
Date: {today}
```

**"How to file it" steps** (show as a checklist; user files manually):
1. Open echallan.parivahan.gov.in → "Complaint"
2. Select your state, enter the challan / vehicle number
3. Paste this letter in the description box
4. Upload your evidence & screenshot
5. Save the ticket ID — track it under Disputes
*(If already in court: contest at vcourts.gov.in instead.)*

---

## 6. Revenue model (for the Pro screen copy)
- **Free** — find + pay (the hook).
- **★ Dispute success-fee** — ₹199 or ~10% of the amount saved, **charged only when a wrong challan is cancelled** (aligned incentive + the moat).
- **Pro** — ₹99 / vehicle / year — real-time alerts + licence-risk guardian + family/multi-vehicle.
- **Fleet / B2B** — per-vehicle plans for taxis, trucks, delivery (highest ARPU).
- **Guardrails to state on-screen:** no cut of legitimate fines · no pay-to-skip · no selling personal data.

---

## 7. Screens / routes
`/` Home (dashboard) · `/challans` all challans · `/dispute/new` drafter (3 steps) · `/disputes` tracker · `/pro`. Bottom tab nav: Home · Challans · Disputes · Pro.

---

## 8. Non-goals (MVP)
Real government API calls · real payments · accounts/login · OCR of the screenshot (roadmap) · multi-language (roadmap) · fleet dashboard (later).

---

## 9. Definition of done
- A stranger can enter a real challan on their phone and get a correct, copyable grievance letter + a calendar reminder in under 2 minutes, offline, with nothing leaving their device.
- Sample vs real data always visibly distinguished; simulated features labelled.
- Mixpanel events fire when a token is configured; app works without one.
- Deployed to a public URL (Vercel), installable as a PWA, light+dark clean.

---

## 10. Suggested build order
1. Scaffold Next.js + Tailwind + tokens/fonts + bottom-nav shell + light/dark.
2. Data layer (`types.ts`, `storage.ts`) + seed sample vehicles/challans.
3. **F1 Dispute Drafter end-to-end** (this is the whole point — do it first and well).
4. F2 Deadline Guardian + calendar link.
5. F3 Disputes tracker (persisted).
6. Home dashboard + F4 heuristics + F5 vehicles + F6 labelled auto-fetch preview.
7. F7 analytics wrapper + F8 Pro screen.
8. PWA manifest + deploy to Vercel + wire Mixpanel token.

---

## 11. Commit convention (this project)
End commit messages with:
```
Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01MnY8ZFEHqMyLkCFYcWo7UY
```
End PR descriptions with: `🤖 Generated with [Claude Code](https://claude.com/claude-code)`
