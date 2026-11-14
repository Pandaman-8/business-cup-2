import type { FormProps } from "./ShiftOffersForm";
import { MoneyField, NumberField } from "./Fields";
export default function CostsForm({
  plan,
  change,
  issues,
}: Omit<FormProps, "advanced">) {
  const error = (path: string) => issues.find((i) => i.path === path)?.message;
  return (
    <>
      <header className="page-heading">
        <h1>What will these shifts cost you?</h1>
        <p>A few estimates turn hourly pay into money you could keep.</p>
      </header>
      <section className="form-section">
        <h2>Getting to work</h2>
        <p className="hint">
          Round-trip expenses for each shift, such as gas, parking or transit.
          Leave $0 if there’s no added cost.
        </p>
        <div className="grid-two">
          {plan.offers.map((s, i) => (
            <MoneyField
              key={s.id}
              label={`${s.title} travel ($)`}
              value={s.travelCostCents}
              issue={error(`offers.${i}.travelCostCents`)}
              onChange={(travelCostCents) =>
                change({
                  ...plan,
                  offers: plan.offers.map((x) =>
                    x.id === s.id ? { ...x, travelCostCents } : x,
                  ),
                })
              }
            />
          ))}
        </div>
      </section>
      {plan.paidCare && (
        <section className="form-section">
          <h2>Paid childcare</h2>
          <MoneyField
            label="Sitter hourly rate ($)"
            value={plan.paidCare.hourlyCostCents}
            issue={error("paidCare.hourlyCostCents")}
            onChange={(hourlyCostCents) =>
              change({
                ...plan,
                paidCare: { ...plan.paidCare!, hourlyCostCents },
              })
            }
          />
          <p className="hint">
            One total rate for your household. Already-arranged care is not
            charged again.
          </p>
        </section>
      )}
      <section className="form-section">
        <h2>Estimated withholding</h2>
        <NumberField
          label="Estimated withholding (%)"
          min="0"
          max="60"
          step="0.01"
          value={plan.withholdingPercent}
          issue={error("withholdingPercent")}
          onChange={(withholdingPercent) =>
            change({ ...plan, withholdingPercent })
          }
        />
        <p className="hint">
          An editable assumption, not an exact tax calculation. Use the
          approximate percentage withheld from your extra pay.
        </p>
        <details>
          <summary>What isn’t included?</summary>
          <p>
            Overtime rates, benefit changes, subsidies and regular household
            expenses are outside this estimate.
          </p>
        </details>
      </section>
    </>
  );
}
