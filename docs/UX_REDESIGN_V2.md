# ShiftMargin V2 — UX rebuild

## Baseline and audit

V1 preserved at `d7ba231`; implementation branch `codex/shiftmargin-v2`. Baseline: 30 passing tests. The engine and integer-cent rules are retained.

V1 journey: marketing hero → family/time-zone/withholding → four care sources → offers → sidebar recommendation. The same page exposes administration, scheduling and financial explanation. Dates repeat for every interval; the comparative benefit is left to the reader. Week edits invalidate dependent dates. Money fields initialize once and can diverge from external state.

## New journey

Entry → Your shifts → Childcare → Your costs → Your result. The example opens the computed result directly. Each screen has one primary action; previous steps preserve drafts. Quick Compare hides unusual settings. Advanced Planning uses the same screens and PlanInput, exposing commute, limits, custom names, extended care windows and time zone without a parallel model.

Care selections never imply availability. Each source requires an explicit full-shift confirmation (including commute) or a concrete day/time interval. Presets copy literal intervals; changing work later does not silently expand care. Unknown care yields honest uncovered intervals. Already-arranged care has zero incremental cost.

Week changes have a preview and explicit actions: move all shifts/care to matching weekdays, or clear the schedule. Validate the candidate before applying; reject clock-change weeks. Next-week reuse preserves the existing semantics: copy care and settings, clear offers, remind the user to reconfirm.

## Components and visual system

App owns one plan, navigation and cancellable worker. Fields provide associated error/help text; DayTimeRange replaces full-date inputs. ShiftOffersForm, FamilyCareForm, CostsForm, WeekSettings, ResultsPanel own focused UI groups. A UI-only adapter handles week moves and explicit full-shift care ranges. Result comparisons use feasible alternatives from the engine; no fixture amounts appear in presentation code.

Warm off-white #FAFBF9, white surfaces, ink #172B34, teal #16776D, pale mint #E8F6F0. Restrained borders, no decorative dashboard, 16px body, 14px supporting text, 32px page titles, large tabular financial result. One form column, up to two comparison columns, 44px minimum controls, visible focus and reduced-motion support.

## Research applied

Reviewed November 14, 2026. Principles are design interpretation, not copied branding or claimed usability results.

- [Wise](https://wise.com/): emphasize money received; put costs close to the result.
- [GOV.UK errors](https://design-system.service.gov.uk/components/error-message/): explain how to fix errors and associate them with fields.
- [Linear](https://linear.app/): restrained hierarchy and secondary actions.
- [Tally conditional logic](https://tally.so/help/conditional-form-logic): reveal relevant questions from explicit answers.
- [NN/g progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/): defer specialized controls.
- [Baymard form fields](https://baymard.com/research-articles/checkout-flow-average-form-fields): reduce actual input work, not just split the same form.

## Verification plan

Keep existing 30 tests; add adapter regressions for atomic week moves, DST rejection, explicit care, comparison correctness. Run npm ci/typecheck/test/build. Browser check 1280px and 375px, sample/custom, missing care, cap changes, save/load/reuse, invalid input, money drafts, mode switching, keyboard and console. Capture before/after and deploy only after validation.
