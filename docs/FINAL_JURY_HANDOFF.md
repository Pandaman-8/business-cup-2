# ShiftMargin — final jury handoff

Audit date: **November 14, 2026**. [Production](https://pandaman-8.github.io/business-cup-2/) · [Source](https://github.com/Pandaman-8/business-cup-2).

**Release decision: preserve V2.2.** No CRITICAL or HIGH defect was demonstrated in the checks below. No application, engine, styling, dependency or workflow change was made. This is a documentation/evidence release, not a new product version. Verification has explicit gaps; this document is not an unconditional accessibility or device certification.

Application/deployment SHA: `cdd85873771b01e466fbcbf559edd860a2dd3c22`. Starting documentation SHA: `9d4b7f499942d7a4f26bec9525b0009c76dd86f3`. The commit containing this handoff is the final audit revision; obtain its full SHA with `git log -1 --format=%H -- docs/FINAL_JURY_HANDOFF.md`.

## 1. What the product demonstrably does

- Compares optional shifts using entered pay, withholding assumptions, travel costs, explicit childcare availability and work limits. Includes taking no extra shifts as an option.
- Computes recommendations in a Web Worker using the existing optimizer; the sample is fictional input passed through that engine.
- Rejects missing care, displays the uncovered interval and ranks covered alternatives. Selecting a care provider alone does not create availability.
- Supports a full Free calculation, one explicitly saved Free week, and next-week reuse.
- Offers a working no-payment Plus Demo with a five-plan local library and fresh two-plan calculations.
- Runs without an account or backend. Plans are stored in this browser; the app does not send plan inputs to a server. Hosting still receives ordinary page/asset requests.

### Production jury simulation actually performed

Tests used the public URL in the in-app Chromium browser. Prior QA records were removed through the app's own controls, Demo was turned off, and a fresh tab was opened. **This was not a new incognito/browser profile**; the available browser API does not create one.

| Scenario | Observed in this audit | Scope/qualification |
| --- | --- | --- |
| A — Free | Sample Sunday $98.40; Saturday $23.20; cap two $121.60. Removing partner availability rejects Sunday and selects Saturday $23.20. | Desktop interaction; missing-care rejection repeated at configured mobile width 390 px. |
| B — Custom | Independently entered Saturday 10:00–14:00, $31.75/hour, sitter $14/hour, withholding 12.5%; $0 travel retained. No confirmed care gives $0 and a missing-care interval. Explicit sitter coverage gives $55.12. | Desktop only. The custom travel field was left at its valid $0 default; nonzero travel is exercised by the sample and automated custom test. A complete independent mobile input replay was not performed. |
| B — Validation | Malformed pay blocked continuation and displayed validation. | Actual submitted malformed text is preserved in the transcript; do not describe this as a completed three-decimal-only browser test. |
| C — Plus | Saved Free plan, changed cap to two, second save offered replacement or Plus; chose Plus, activated without payment, saved the second plan and a Free copy. Compared $98.40/$121.60, difference $23.20. | Upgrade/save interaction on desktop; comparison inspected at configured 1440 px and 390 px. |
| C — Return | Reload retained Demo and both records. Opening the first restored $98.40. After a care edit, next-week reuse moved to Nov 23, cleared offers and displayed the reconfirmation reminder. | Reload, library, restore and reuse exercised at 390 px. No physical phone/device test. |

The exercised core controls responded; no stale financial result was observed after settled recalculation. Automated tests additionally cover late worker results, cancellation and comparison failure/retry. This is not a claim that every possible button/state was manually tested.

## 2. Real tested financial outputs

All figures are **estimated additional money kept**, compared with taking no extra shifts, not actual earnings or customer savings. Sample week: Nov 16–22, 2026, America/Chicago.

| Plan | Gross | Assumed withholding | Added care | Travel | Net kept |
| --- | ---: | ---: | ---: | ---: | ---: |
| Sunday, 09:00–15:00 at $23/hour; entered partner coverage | $138.00 | $27.60 (20%) | $0.00 | $12.00 | **$98.40** |
| Saturday, 09:00–17:00 at $28/hour; sitter $18/hour | $224.00 | $44.80 (20%) | $144.00 | $12.00 | **$23.20** |
| Both, when two shifts are allowed | $362.00 | $72.40 (20%) | $144.00 | $24.00 | **$121.60** |
| Independent custom Saturday, 10:00–14:00 at $31.75/hour; sitter $14/hour | $127.00 | $15.88 (12.5%) | $56.00 | $0.00 | **$55.12** |
| No extra shifts | $0.00 | $0.00 | $0.00 | $0.00 | **$0.00** |

The independent result checks half-up cent rounding: $127 × 12.5% = $15.875 → $15.88; $127 − $15.88 − $56 = $55.12. With the sitter selected but no window confirmed, that same custom shift is rejected for missing Saturday 10:00–14:00 care.

**Main recommendation:** with a one-shift limit, Sunday leaves $75.20 more than Saturday despite lower gross pay. **Alternative:** permitting two shifts adds Saturday's $23.20 to Sunday's $98.40. This is a scenario comparison, not evidence that a household actually saved money.

**Missing-care demonstration:** remove My partner from the sample. Sunday is rejected for Nov 22, 09:00–15:00; Saturday remains feasible at $23.20. The app does not invent Sunday sitter availability.

The retained automated independent custom case also passes: Monday 09:00–13:00 at $25.50/hour, $6.25 travel, 10% withholding and explicit free care gives **$85.55**. That is automated evidence, not this audit's manually entered browser scenario.

## 3. Free and Plus differences

| Capability | Free | Plus Demo |
| --- | --- | --- |
| Price displayed | $0 | **$5.99/month proposed**, for a future subscription |
| Full calculation, breakdown, feasible alternatives, what-if edits | Yes | Yes |
| One Free saved week and next-week planning | Yes | Yes |
| Named library | No | Up to five plans, separate from the Free slot |
| Open, rename and delete library records | No | Implemented |
| Compare two saved plans using fresh calculations | No | Implemented and verified |
| Payment, subscription or card collection | None | **None** |

The visible activation is “Try Plus Demo — No payment required.” Active state says “Plus demo active · No payment processed.” The price is an unvalidated business hypothesis, not revenue or an active subscription offer. The local Demo flag is not a secure paid entitlement system.

## 4. Retention features actually implemented

Explicit Free save/load, a named local library, restore, rename/delete, fresh two-plan comparison, and next-week reuse provide reasons to return. Next-week reuse preserves household assumptions, shifts care windows seven days, clears old shift offers and asks users to reconfirm care. Demo deactivation retains library records; clearing the Plus library requires confirmation and leaves the Free slot separate.

This audit verified save, upgrade, two-record comparison, reload, restore, next-week transition and the initial Demo-off/library-clear flow. Rename/delete, capacity, storage corruption/quota failures and conflicting changes are covered by the retained automated tests and the earlier [V2.2 QA record](QA_V2_2.md). These are implemented repeat-use mechanisms; **retention has not been measured**.

## 5. Verified CI, tests and deployment

### Commands actually run locally

| Command | Result |
| --- | --- |
| `npm ci` | Passed; clean dependency installation |
| `npm run typecheck` | Passed |
| `npm test` | **75 tests passed in 8 files** |
| `npm run build` | Passed |

No tests were added to inflate the count. Existing coverage includes the independent 1,536-case care oracle, shift subset selection, money rounding, care/commute constraints, stale worker responses, Free/Plus flows and persistence failure handling. Test suites use the real optimizer; the comparison lifecycle tests control transport timing.

### GitHub evidence checked through the API

- [Application main CI — 43593990322](https://github.com/Pandaman-8/business-cup-2/actions/runs/43593990322): success, application SHA `cdd8587`.
- [Pages deployment — 43593990387](https://github.com/Pandaman-8/business-cup-2/actions/runs/43593990387): success, application SHA `cdd8587`.
- [Baseline documentation main CI — 43594466537](https://github.com/Pandaman-8/business-cup-2/actions/runs/43594466537): success, SHA `9d4b7f4`.
- Pages API reports workflow-based deployment and the expected public URL. Its `status` field was null; deployment success is established by the workflow plus live HTTP/browser checks, not that field.

The public root, favicon, JS, CSS and worker all returned HTTP 200 and matched the freshly built local files byte for byte. Public asset names are `index-CUmY9ICS.js`, `index-CVf5cSEx.css`, and `optimizer.worker-B-rFU836.js`. The browser produced the financial outputs recorded above. No app error appeared in the returned console log; it contained two Electron host CSP warnings, preserved in [browser-console.json](jury-evidence/browser-console.json).

The Pages workflow ignores `docs/**` and `README.md` changes. This documentation-only freeze does not require redeploying or changing the application SHA. CI still runs for documentation pushes. Final audit publication status is reported with the delivered commit; the application deployment evidence above remains applicable.

### Release red-team checks

| Check | Actual finding |
| --- | --- |
| Critical/high defects | None demonstrated within the tested scope; no code fix warranted. |
| Secrets | Targeted credential/private-key patterns found no matches in working files or 143 reachable Git blobs. No credential-style files found. This is a bounded pattern scan, not a comprehensive security certification. |
| Links/assets | No missing local Markdown targets in the 14 baseline documents. Of 27 external URLs, 26 returned HTTP 200; the historical Care.com reference returned 403. This is access-restricted/unverified, not proof of a dead product link. HTTP status does not validate historical research claims. [Raw URL results](jury-evidence/link-results.json). |
| Core actions | Sample, edit limit/care/costs, save, upgrade, library, comparison, reload, open and next-week actions exercised. No dead core action demonstrated. |
| Accessibility | DOM/source inspection found named controls, labelled inputs/errors, heading focus, a labelled native dialog, skip link and async status. Existing automated focus/cancellation tests passed. No critical blocker demonstrated in this scope. Physical keyboard, screen reader and fresh pixel/contrast checks remain unverified. |
| Stale results | Edited inputs produced the expected new recommendations; retained tests cover late/cancelled worker messages. |

## 6. Known limitations and unresolved verification gaps

- **Fresh screenshot capture failed:** the browser transport timed out on `Page.captureScreenshot`; locator/evaluation CDP calls also timed out. Native DOM controls and snapshots remained usable. No new screenshots are represented as successfully captured. Missing-care evidence is a fresh text transcript, not an image.
- **Mobile scope is partial:** configured 390 px interaction covered comparison, reload/library, restore, missing-care rejection and next-week transition. Full independent custom-input entry and a complete mobile upgrade replay were not rerun. Prior V2.2 responsive evidence is linked below, clearly distinguished from this audit. No physical phone or cross-browser certification.
- No fresh isolated browser profile, complete physical-keyboard traversal, screen-reader audit or formal low-end-device benchmark was available. Earlier V2.2 measurements at 375/390/768/1280/1440 px are historical evidence, not freshly repeated overflow measurements.
- Unsaved inputs are lost on reload; save explicitly before closing or opening another plan. Saved plans are local only and disappear if browser data is cleared. No account, backup, cloud sync or automatic draft recovery.
- Storage conflict checks are best-effort safeguards, not transactional cross-tab storage. Browser storage can be unavailable or full; retained automated tests exercise those errors.
- One Monday–Sunday week, 15-minute precision, at most ten offers, up to 28 windows per care source, one sitter charging a household rate. Supported US zones; DST transition weeks are rejected. No complex taxes, overtime rules, benefits/subsidies, multi-provider booking or child-specific care requirements.
- Entered availability is an assumption, never a childcare booking or third-party confirmation. Withholding is an estimate, not tax advice. Confirm care directly before accepting work.
- The $5.99 price, willingness to pay and repeat-use value remain hypotheses. There are no verified customer, revenue or retention results in this evidence pack.

No MEDIUM UX issue was treated as a reason to change frozen code. The screenshot/browser limitations are verification-tool failures, not demonstrated product failures. Before judging, use an ordinary browser for a short physical-keyboard/mobile check and capture the missing-care state if a new screenshot is required.

## 7. Exact screenshots, transcripts and demo walkthrough

The five existing images below were reopened and visually inspected during this audit. **They were captured during V2.2 release QA, not during this final audit.** Production assets still match the released build. Comparison images came from the tested local production build before a final singular/plural copy correction; their numbers/layout match the separately reverified live comparison. They must not be relabelled as fresh production captures.

| Evidence | Exact repository path | Provenance |
| --- | --- | --- |
| Main $98.40 recommendation and $75.20 advantage | [docs/screenshots/v2-2-free-desktop.jpg](screenshots/v2-2-free-desktop.jpg) | Earlier V2.2 production desktop capture |
| Free $0 / proposed Plus $5.99 | [docs/screenshots/v2-2-pricing-desktop.jpg](screenshots/v2-2-pricing-desktop.jpg) | Earlier V2.2 production desktop capture; Saturday alternative visible behind dialog |
| Mobile price and no-payment activation | [docs/screenshots/v2-2-pricing-mobile.jpg](screenshots/v2-2-pricing-mobile.jpg) | Earlier V2.2 production capture, 390 px |
| Itemized two-plan comparison | [docs/screenshots/v2-2-comparison-desktop.jpg](screenshots/v2-2-comparison-desktop.jpg) | Earlier local production-build capture |
| Mobile comparison | [docs/screenshots/v2-2-comparison-mobile.jpg](screenshots/v2-2-comparison-mobile.jpg) | Earlier local production-build capture, 375 px; second record below the fold |

Fresh public-page DOM transcripts, November 14:

- [Missing-care rejection, desktop](jury-evidence/missing-care-production.txt) and [mobile](jury-evidence/missing-care-mobile-production.txt).
- [Custom shift without coverage](jury-evidence/custom-no-care-production.txt), [covered custom calculation](jury-evidence/custom-covered-production.txt), and [malformed-pay validation](jury-evidence/invalid-pay-production.txt).
- [Pricing and two-shift alternatives](jury-evidence/pricing-production.txt).
- [Desktop saved-plan comparison](jury-evidence/comparison-desktop-production.txt) and [mobile comparison](jury-evidence/comparison-mobile-production.txt).
- [Mobile library after reload](jury-evidence/reloaded-library-mobile-production.txt), [restored $98.40 result](jury-evidence/restored-mobile-production.txt), and [next-week transition](jury-evidence/next-week-mobile-production.txt).

### Reproducible 60–90-second demo

Prepare in a normal browser: open production, turn Demo off if necessary and clear **only your own demo records** with the visible confirmation controls. Leave one Free slot and library capacity available. Do not clear someone else's plans. Keep the screenshot pack available if venue internet fails; label it as recorded evidence.

1. **0–15 s:** Try an example. “Sunday leaves an estimated $98.40 after entered costs; Saturday leaves $23.20. Lower gross pay can still leave more.”
2. **15–30 s:** Childcare → remove My partner → Your result. Show Sunday missing 09:00–15:00 and Saturday $23.20. “Choosing a provider does not invent availability.”
3. **30–40 s:** Reset the example. Save this week. Change limit → Up to two → Your result: $121.60.
4. **40–55 s:** Save this week again → Keep both with Plus. Show Free $0, proposed $5.99/month, then Try Plus Demo — No payment required.
5. **55–70 s:** Name the second plan, keep the copy-Free option checked and save. Select both records → Compare selected plans. Show $98.40 versus $121.60, difference $23.20.
6. **70–90 s:** Reload → Plan library → open the first record. Show restored $98.40. “Explicit saves stay on this browser. Plan next week reuses care assumptions and clears old offers; care must be reconfirmed.”

This is a walkthrough timing target, not a measured live rehearsal duration. If running short, omit expanded breakdowns; never omit the no-payment and estimate qualifications. For independent arithmetic questions, use the $55.12 custom case in section 2.

## 8. Claims that must NOT be made in the pitch

- Paying customers, actual subscriptions, revenue, recurring revenue, proven willingness to pay or validated demand.
- Measured retention, conversion uplift, acquisition cost, lifetime value or subscription renewals.
- Guaranteed savings, actual realized household savings, or “we saved a family $98.40.” These are fictional scenario estimates.
- Confirmed/booked childcare, automatic partner availability, childcare safety screening or a marketplace.
- Accurate final tax liability, benefits optimization, overtime compliance or complete household budgeting.
- Cloud backup, cross-device sync, secure paid entitlements or automatic recovery of unsaved inputs.
- WCAG certification, exhaustive security assurance, complete mobile/cross-browser coverage, or fresh production screenshots for every state.
- Organizer endorsement or verified Business Cup judging rules; this audit verifies the product, not the competition's policies.

Safe pitch statement: **“ShiftMargin is a working browser prototype that compares optional shifts after entered childcare, travel and withholding assumptions. Free provides the calculation; a functional Plus Demo explores local plan history and comparison at a proposed $5.99/month. We have verified the illustrated calculations and 75 automated tests, while customer demand and retention remain unvalidated.”**
