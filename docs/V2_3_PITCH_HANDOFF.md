# V2.3 — factual pitch handoff

This document supports a separately prepared presentation. No deck was created in this task.

## What can be demonstrated

ShiftMargin compares optional work after entered childcare, travel and withholding assumptions. The optimizer remains unchanged and runs real calculations. Free provides the complete weekly decision. Plus Demo adds history, two-plan comparison and faster reuse from a saved plan.

The trust improvements are concrete: unchanged saves do not trigger an upgrade, duplicate history saves do not add records, and meaningful unsaved work is protected by Save / Discard / Cancel before destructive navigation. Invalid input and failed storage writes do not silently advance to a different plan.

| Free forever — $0 | Plus — proposed $5.99/month |
| --- | --- |
| Full optimizer, costs, recommendation and alternatives | Same full engine |
| One explicit saved week | Up to 12 named local plans, separate from Free |
| Current-week what-if changes and next-week reuse | Compare two archived scenarios, restore/rename/delete, reuse any saved plan for its following week |

**Actual released access: Plus Demo, activated explicitly, no card, no payment, no automatic charge, no expiry.** A seven-day preview is a future proposal, not an implemented trial or subscription. The NO-GO decision avoids locking history behind a subscription that cannot be purchased. Plans stay in this browser; there is no cross-device sync or cloud backup.

## Verified numbers

- Sunday: $138 gross − $27.60 assumed withholding − $12 travel = **$98.40**.
- Saturday: $224 gross − $44.80 assumed withholding − $144 sitter − $12 travel = **$23.20**.
- With two shifts allowed: **$121.60**. Saved-plan comparison difference: **$23.20**.
- At a one-shift limit, Sunday's advantage over Saturday: **$75.20**.
- Independent custom: 4 hours × $31.75 = $127; 12.5% withholding rounds to $15.88; sitter 4 × $14 = $56; $0 travel gives **$55.12**. Without explicit care availability this shift is rejected.

These are estimates from fictional/user-entered scenarios, not realized household savings. Selecting a care provider does not establish their availability. Nothing books or verifies a sitter.

## Suggested demonstration

1. Try an example: show Sunday $98.40 and Saturday $23.20.
2. Save this week twice: the second press calmly says it is already saved.
3. Change the shift cap to two: show $121.60. Reset, then Cancel the unsaved-change dialog to show the edited work is protected.
4. Save this different week → Keep both with Plus. Explain Free versus Plus and the proposed $5.99 price; activate the clearly labelled no-payment Demo.
5. Save a named scenario with the Free copy, select both, and compare actual $98.40/$121.60 results.
6. Reload, open the library, and choose “Use this plan for next week.” Show the new week, cleared offers and reconfirm-care reminder.

Prepare only your own demo records; do not clear someone else's data. The library has a 12-record ceiling. Keep a normal browser ready for judging. Explicitly save before refreshing; the browser warning is not autosave.

## Screenshots and evidence

**Fresh screenshots are unavailable:** the browser capture transport timed out. Do not present V2.2 images as V2.3 screens. New local functional evidence is recorded as DOM transcripts in [QA](V2_3_QA.md). The existing [V2.2 desktop result](screenshots/v2-2-free-desktop.jpg) and [V2.2 comparison](screenshots/v2-2-comparison-desktop.jpg) illustrate unchanged financial outputs only; they are historical captures, not proof of the new interface.

For the final deck, capture these released screens in a normal browser: unchanged-save confirmation; unsaved guard; revised pricing; 12-plan library with reuse action; real comparison; missing-care rejection. [QA](V2_3_QA.md) links the successful CI/deployment and separates local checks from post-deployment browser evidence. The released application commit is `63308f68a83fc53fc7d5610a9cc9dd5353db1893` at [production](https://pandaman-8.github.io/business-cup-2/).

## Safe claims and claims to avoid

Safe: “A working browser product for comparing optional shifts, with full Free calculation and a functional Plus Demo for returning to previous decisions. The proposed paid value is less repeated entry and clearer recurring planning.”

Do not claim paying users, subscriptions, revenue, tested willingness to pay, measured retention/conversion, guaranteed savings, AI, cloud sync, automatic billing, a shipped seven-day trial, secure paid entitlements, confirmed childcare, tax accuracy, automatic draft recovery, complete accessibility certification or fresh screenshots that were not captured. Repeat-use convenience and $5.99/month remain business hypotheses. No analytics or user study was fabricated.
