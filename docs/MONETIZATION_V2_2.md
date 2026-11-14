# ShiftMargin V2.2 monetization

## Product contract

| Capability                                                         | Free — $0                          | Plus Demo                                         |
| ------------------------------------------------------------------ | ---------------------------------- | ------------------------------------------------- |
| Exact weekly optimizer, feasible alternatives, financial breakdown | Full access                        | Same engine                                       |
| What-if inputs and next-week reuse                                 | Full access                        | Same flow                                         |
| Free saved week                                                    | One, with replacement confirmation | Remains available separately                      |
| Named scenario library                                             | Upgrade prompt                     | Up to five valid input snapshots                  |
| Open, rename, delete library plans                                 | Upgrade prompt                     | Functional                                        |
| Compare two saved plans                                            | Upgrade prompt                     | Fresh worker calculation and estimated difference |

**$5.99/month is a proposed future price, not an active subscription.** The action is “Try Plus Demo — No payment required”; the active state says “Plus demo active · No payment processed.” No payment provider, card form, account, trial expiration, charge, receipt or recurring billing exists. No paid customers, revenue, conversion, willingness to pay, retention or CAC/LTV have been measured by this implementation.

## Actual upgrade and return path

Save a Free week, change the allowed shifts or costs, then save again. The confirmation offers replacing the Free slot or keeping both with Plus. Unlocking Demo opens the save form. When the prior Free snapshot differs, a checked, visible option copies it into the library alongside the new scenario in a single library write. The Free slot stays untouched. The capacity is five library records plus the independent Free slot.

Returning users can reload, open Plan library, compare two saved scenarios, reopen one and plan the following week. This supports a **retention hypothesis**: new shift offers, changing care and household work limits may make weekly reuse valuable. It does not demonstrate actual return frequency or subscription renewal. Suggested future validation: interviews, observed completion of a second-week task, consented retention measurement and willingness-to-pay experiments. No analytics or tracking was added.

Gates appear at a second saved scenario, the library/history and a quiet Free & Plus link. The calculation itself is never gated. Turning Demo off leaves all library records in place and Free usable. Unlocking it again restores access. Deletion remains possible from pricing’s Stored plans & privacy disclosure while access is locked.

## Storage and trust boundaries

- Existing `shiftmargin.saved-week.v1` remains compatible and separate.
- `shiftmargin.plus-library.v1` stores a versioned envelope with at most five records: ID, trimmed name (1–60 characters), validated PlanInput, illustrative flag and save timestamp. Week and zone come from PlanInput. Computed results are not persisted.
- `shiftmargin.plus-demo.v1` contains the versioned local demo flag. It is intentionally user-controlled local state, **not secure entitlement enforcement**.
- Reads validate schema, domain inputs, record sizes, version and unique IDs. Writes validate before storage and compare the last-read raw value to detect another tab’s edits. This is best-effort conflict detection, not a transactional database across simultaneous tabs.
- Corrupt or unsupported data is preserved until an explicit clear/replace confirmation. Quota and blocked-storage errors do not show false save success. Clearing Plus never clears Free or unrelated keys. Names are rendered as React text.
- Comparison recalculates each plan independently with the existing worker. It shows periods, selected shifts, gross, assumed withholding, care, travel, net and estimated difference. Different weeks are explicitly separate scenarios, never evidence of realized savings.

Browser data can be lost through storage clearing, private-session expiry or device changes. There is no cloud backup, encryption feature, cross-device sync or account recovery. Plans and financial inputs are not sent to an application server; static hosting still serves the app normally. Unsaved drafts are not automatically persisted. A production paid subscription would require separately designed billing, verified entitlements, privacy/security work and support; none is implied by this demo.
