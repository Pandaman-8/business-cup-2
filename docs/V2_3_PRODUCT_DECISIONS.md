# V2.3 — product decisions

November 14, 2026. Baseline: verified main `5b407e5`, application `cdd8587`. Scope: focused trust/conversion improvements and recurring planning; no optimizer rewrite, billing integration, dependency change or pitch deck.

## Problems verified and fixed

1. **Unchanged Free saves opened replacement/upgrade.** Save now compares validated plan contents and the illustrative-example flag. Object property order and save metadata do not affect equality. An identical save shows “This week is already saved.” The stored timestamp and record are untouched. A different plan still needs explicit replacement or Plus. Corrupt stored data is preserved until explicit replacement.
2. **Opening another plan could discard current work.** A shared navigation guard now checks current inputs against actual persisted Free and Plus snapshots at action time. It protects library open/reuse, Free restore, starting a new comparison, example reset, next-week planning and calendar-week changes. Save / Discard / Cancel are explicit. Moving between form steps or returning home keeps inputs and needs no warning.
3. **Save-before-open needed a complete path.** A pending transition resumes only after a successful Free write, confirmed replacement or Plus save. Cancelling an upgrade cancels the pending transition. Invalid inputs cannot be saved; Cancel retains the literal money draft. Storage failures preserve current work. Target records and Demo access are rechecked before a delayed library open.
4. **Five records offered a short history.** Plus now holds up to **12 named plans**, still bounded by 100,000 characters per record and 500,000 per library. Existing v1 Free/library/Demo data remain readable. There is no destructive migration or unlimited-storage claim. Library saves deduplicate matching plan contents, including the illustrative flag.
5. **Repeat planning required extra navigation.** Each library record now has “Use this plan for next week,” calling the unchanged `nextWeekSettings` transformation. Household/cost assumptions remain, care windows move seven days, offers clear, and a visible reminder requires users to reconfirm care before accepting work. DST/invalid transformations fail without replacing current inputs. Reuse remains available from the current Free plan too.
6. **Plus value was framed around file capacity.** Pricing now leads with “Keep your options. Skip starting over.” Three benefits describe history, reuse and actual comparison. Cards show week, offer count, work limit and withholding assumption. A small wrapping layout adjustment accommodates the added action on narrow screens; the existing visual system remains.

## Free and Plus contract

Free forever ($0) retains the full weekly calculation, care/travel/withholding input, recommendation, breakdown, feasible alternatives, current-week what-if edits, one explicit saved week and next-week reuse. No recommendation paywall or forced upgrade.

Plus Demo adds up to 12 named local plans, open/rename/delete, two-plan recalculation and faster next-week reuse from history. The proposed future subscription price remains **$5.99/month**. The extra value is less repeated entry and clearer recurring decisions, not guaranteed savings.

The contextual offer appears when saving a **different** plan into an occupied Free slot. Users can replace the Free plan, keep both with Plus or cancel. Separate library/save-extra intents and the quiet Free & Plus link still explain Plus. An identical Free save never opens this offer. A repeated library save never creates a duplicate.

## Seven-day preview: NO-GO for this release

The directive explicitly permits retaining Demo if timed expiry would create a dead end. There is no account, payment provider or purchasable subscription. Expiring useful history and then offering a second demonstration unlock would add friction without validating billing or willingness to pay. We therefore keep **explicitly activated, non-expiring Plus Demo**.

The UI states no card, no payment or automatic charge, a proposed future price, browser-local storage and the ability to turn Demo off. Turning it off preserves records. There is no trial timer, automatic renewal, fake receipt or Subscribe button. A seven-day no-card preview remains a future business hypothesis to evaluate alongside real subscription infrastructure and an honest post-preview route. No claim that a trial shipped or converted users is justified.

## Draft recovery: deferred

Automatic draft storage was optional. Money controls retain raw text locally, including incomplete/invalid values; serializing the numeric domain object can convert nonfinite values into null and cannot faithfully restore that text. A correct draft contract needs explicit raw-field state and recovery UX. We did not add a partial, misleading implementation.

A native `beforeunload` warning now requests protection when meaningful unsaved work exists. This is best-effort: browsers control whether it appears, especially on mobile. It is **not autosave or crash recovery**. Explicit Free/Plus saves remain the persistence contract. Current inputs survive in-app Cancel and failed save attempts.

## Storage, capacity and rollback

The storage envelope remains version 1 because its fields and validation semantics are unchanged; the accepted record count increases. The existing five-record fixture still round-trips. A new supported-size stress case uses 12 records, each with ten offers and 28 windows in every care source: 121,004 serialized characters. The observed serialize+parse timing was 155 ms during a local test run; this is not a low-end-device benchmark or a universal quota guarantee. Existing quota/size/conflict guards remain; a write failure never marks navigation as saved.

V2.2 commit `cdd8587` and audited main `5b407e5` remain rollback references. **Compatibility caveat:** V2.2's old reader rejects libraries with more than five records. It does not delete them. A rollback after users create larger histories must preserve their raw library data and retain/backport the 12-record reader; do not clear user history to make old code load it. Free storage is unchanged. Cross-tab conflict detection remains best effort, not an atomic database transaction.

## Research applied, without importing unsupported claims

The supplied `ShiftMargin_Monetization_Trial_UX_Research_2026-11-14.md` was read in full. The six requested official references were opened on November 14:

- [YNAB pricing](https://www.ynab.com/pricing): clear no-card trial terms informed our no-surprise access wording; its product/customer savings claims are not ours.
- [Rocket Money plans](https://help.rocketmoney.com/en/articles/2217739-how-much-does-rocket-money-cost): useful Free tools plus optional advanced functionality support the chosen boundary.
- [Cozi FAQ](https://www.cozi.com/faq/): recurring family organization is relevant to reuse convenience, not evidence of ShiftMargin demand.
- [RevenueCat report](https://www.revenuecat.com/state-of-subscription-apps): in-app subscription benchmarks cannot forecast this web prototype's conversion. No benchmark percentage is used as a business result.
- [Baymard SaaS UX](https://baymard.com/research-articles/saas-website-ux-best-practices): the pricing comparison stays short and understandable.
- [NN/g perceived value](https://www.nngroup.com/articles/perceived-value/): reducing interaction effort informs the targeted fixes.

Pricing, willingness to pay, retention and reduced repeated work as a purchase motivation remain hypotheses. No analytics, customer interviews, testimonials, subscriber counts or revenue were invented or added. Competition rules are user-supplied context, not independently certified by this release.
