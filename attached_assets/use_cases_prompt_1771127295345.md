# REPLIT PROMPT: Implement Pennsylvania Special Needs Use Cases

## CONTEXT

You are continuing to build **The Steward** (working title — may be renamed to **Deciduity**), a System 2 Governance & Decision Hygiene iOS application for non-profit organizations. The app enforces 12 Constitutional Laws drawn from Kahneman's decision science (MSE = Bias² + Noise²), Taleb's anti-fragility principles, and Flyvbjerg's Reference Class Forecasting.

The existing codebase includes: React Native + Expo frontend, Express.js backend, FastAPI Python statistical microservice, Supabase (PostgreSQL + pgvector), 5 LLM provider adapters, Shadow Layer bias detection middleware, blind input workflows, Monte Carlo simulation engine, and a daily bias heat map dashboard.

Review `/docs/constitution.md` before proceeding. All implementation must be traceable to a specific Constitutional Law.

---

## MISSION

Implement **8 real-world use case scenarios** as seed data, demo workflows, and reference class datasets targeting **Pennsylvania non-profit organizations that serve adults with intellectual disabilities and autism**. These use cases should be usable as:

1. **Onboarding tutorials** — walk a new Executive Director through the app using scenarios they immediately recognize
2. **Reference Class data** — pre-populated historical data for the Outside View calculator (Law 3)
3. **Demo decision workflows** — complete decision objects with blind inputs, bias detections, and simulation results
4. **Bias heat map examples** — realistic audit_log entries that populate the Board's daily heat map (Law 12)

---

## THE 8 USE CASES

### USE CASE 1: Waiver Slot Allocation (Who Gets Off the Waitlist?)

**Decision Category:** `GRANT_ALLOCATION`
**Scenario:** Your organization has been notified that 3 Consolidated Waiver slots have opened in your county. You have 14 adults on your internal priority list. The county requires you to recommend candidates based on urgency. Your board committee of 5 must independently score each candidate.

**Biases to detect (Law 4 — Shadow Layer):**
- **Recency Bias:** Committee members over-weighting the family who called yesterday in tears vs. the family who has been quietly waiting 4 years
- **Halo Effect:** Favoring the candidate whose parent is a major donor to the organization
- **Anchoring:** The first candidate discussed in previous meetings becoming the default "most urgent"

**Constitutional Laws exercised:**
- **Law 2 (Blind Input):** Each committee member scores all 14 candidates independently. SHA-256 hashed. No one sees peer scores until all 5 submit.
- **Law 3 (Outside View):** Reference class data from PA DHS showing median waitlist time of 2.6 years, emergency category outcomes, and historical slot allocation patterns across PA counties.
- **Law 6 (Cognitive Sovereignty):** App presents the variance analysis and bias flags but does NOT rank the candidates. The committee must write a synthesis justification.

**Reference Class Seed Data:**
```json
{
  "reference_class": "PA_HCBS_Waiver_Slot_Allocation",
  "source": "PA DHS Office of Developmental Programs",
  "n": 847,
  "avg_wait_months": 31.2,
  "median_wait_months": 26,
  "pct_emergency_category": 0.38,
  "avg_cost_per_person_community": 119500,
  "avg_cost_per_person_institutional": 602000,
  "historical_appeal_rate": 0.12,
  "avg_time_slot_to_service_start_days": 74
}
```

---

### USE CASE 2: DSP Wage vs. Caseload Tradeoff

**Decision Category:** `BUDGET_APPROVAL`
**Scenario:** Your Direct Support Professional (DSP) starting wage is $15.76/hr. Turnover is 47% annually. The state just raised the floor to $17.85/hr. Your board must decide: (A) raise all DSP wages to $18.50/hr and reduce caseload capacity by 8 adults, (B) raise to $17.85/hr (state minimum) and maintain current capacity, or (C) create a tiered wage structure tied to credentialed training ($17.85 base, $19.50 with DSP-I certification, $21.00 with DSP-II).

**Biases to detect:**
- **Status Quo Bias:** Defaulting to Option B because it requires the least change
- **Loss Aversion:** Disproportionate fear of losing 8 adults from the program vs. the compounding cost of 47% annual turnover
- **Optimism Bias:** Assuming credentialed training (Option C) will reduce turnover without historical evidence

**Constitutional Laws exercised:**
- **Law 1 (Epistemic Rigor):** Monte Carlo simulation of all 3 options over 3 years, with uncertainty ranges on turnover rates, state funding changes, and recruitment costs. CI < 70% rendered in Uncertainty Orange.
- **Law 3 (Outside View):** Reference class from national DSP workforce studies and PA-specific data.
- **Guardrail 3 (Noise Injection):** Simulate funding perturbations (±10% state reimbursement, ±15% turnover rate, ±5% regulatory changes).

**Reference Class Seed Data:**
```json
{
  "reference_class": "DSP_Wage_Impact_Studies",
  "source": "National Core Indicators / ANCOR / PHI National",
  "n": 312,
  "avg_annual_turnover_below_17": 0.51,
  "avg_annual_turnover_17_to_19": 0.34,
  "avg_annual_turnover_above_19": 0.22,
  "avg_cost_to_replace_one_dsp": 4872,
  "avg_training_weeks_new_dsp": 6.2,
  "pct_orgs_tiered_wage": 0.28,
  "tiered_wage_turnover_reduction": 0.18
}
```

---

### USE CASE 3: Aging Caregiver Emergency — Residential Placement Decision

**Decision Category:** `GRANT_ALLOCATION`
**Scenario:** A 72-year-old single mother has been the sole caregiver for her 48-year-old son with Down syndrome. She has been hospitalized and can no longer provide care. The son has never lived outside the family home. Your organization must decide between: (A) emergency group home placement (available slot, but 45 minutes from his community), (B) temporary respite care while pursuing a closer placement (6-month estimated wait), or (C) a Lifesharing arrangement with a trained host family (available in 2 weeks, but untested for this individual).

**Biases to detect:**
- **Availability Bias:** Over-weighting the one group home slot that's available now because it's concrete and visible
- **Sunk Cost Fallacy:** Resistance to Lifesharing because "we've always done group homes"
- **Anchoring:** Fixating on the 45-minute distance metric without weighting quality-of-life factors

**Constitutional Laws exercised:**
- **Law 2 (Blind Input):** Case managers, residential coordinator, and family advocate each submit independent placement recommendations without seeing each other's input.
- **Law 4 (Shadow Layer):** Bias engine flags if all 3 reviewers chose the same option (potential groupthink / information cascade).
- **Law 8 (Radical Transparency):** Decision rationale must be exportable to the family and to the county Administrative Entity.

**Pre-Mortem Requirement:** Decision exceeds $50K annual cost threshold → Pre-Mortem screen is mandatory. Each reviewer must describe a scenario in which their recommended option fails catastrophically.

---

### USE CASE 4: Day Program vs. Competitive Integrated Employment

**Decision Category:** `STRATEGIC_PLANNING`
**Scenario:** Federal policy (WIOA / CMS HCBS Final Rule) is pushing toward Competitive Integrated Employment (CIE) and away from facility-based day programs (sheltered workshops). 62% of your participants' families prefer the day program for safety and social reasons. Your board must decide the 3-year strategic direction: (A) fully transition to CIE model, (B) maintain hybrid (60% day program / 40% CIE), or (C) expand day program while adding a small CIE pilot.

**Biases to detect:**
- **Confirmation Bias:** Board members selectively citing family surveys that support their pre-existing position
- **Groupthink:** Board defaulting to the hybrid option to avoid conflict
- **Loss Aversion:** Disproportionate fear of losing the 62% of families who prefer day programs vs. the opportunity cost of not building CIE capacity

**Constitutional Laws exercised:**
- **Law 1 (Epistemic Rigor):** Display confidence intervals on projected employment outcomes, family satisfaction scores, and regulatory compliance risk for each option.
- **Law 3 (Outside View):** Reference class from other PA providers who transitioned, national CIE outcome data, and CMS enforcement patterns.
- **Law 6 (Cognitive Sovereignty):** The LLM coaching module (Law 9) may present arguments for each position, but must never recommend one. The board writes the synthesis.

**Reference Class Seed Data:**
```json
{
  "reference_class": "Sheltered_Workshop_to_CIE_Transitions",
  "source": "APSE / StateData.info / PA ODP Employment Data",
  "n": 178,
  "avg_transition_timeline_months": 36,
  "pct_family_satisfaction_post_transition": 0.71,
  "pct_participants_employed_12mo_post": 0.43,
  "avg_hourly_wage_cie": 11.85,
  "avg_cost_overrun_vs_plan": 1.22,
  "avg_time_overrun_vs_plan": 1.41,
  "pct_orgs_reverted_to_hybrid": 0.31
}
```

---

### USE CASE 5: Federal Medicaid Funding Risk — Contingency Planning

**Decision Category:** `BUDGET_APPROVAL`
**Scenario:** Congressional proposals threaten to convert Medicaid to a block grant or impose per-capita caps. Your organization receives 73% of revenue through Medicaid waiver reimbursements. The board must approve a contingency budget. Options: (A) build a 6-month cash reserve by reducing services now, (B) launch a diversified fundraising campaign targeting private donors and foundations, (C) form a regional coalition with 4 other providers for collective bargaining and shared services, or (D) do nothing and plan to respond if cuts materialize.

**Biases to detect:**
- **Optimism Bias:** "The cuts won't actually happen" (Option D)
- **Anchoring:** Fixating on the 73% number without modeling the actual probability and magnitude of various cut scenarios
- **Status Quo Bias:** Resistance to coalition-building because "we've always operated independently"

**Constitutional Laws exercised:**
- **Guardrail 3 (Noise Injection):** Monte Carlo simulation with funding perturbation scenarios: 5% cut, 10% cut, 15% cut, 25% cut. Each with probability weights.
- **Law 1 (Epistemic Rigor):** All probability estimates must carry confidence intervals. If the board's estimate of "likelihood of 10% cut" has CI < 70%, it renders in Uncertainty Orange.
- **Law 7 (Data Sovereignty):** All financial models must be exportable in CSV/JSON for the board to take to external financial advisors.

**Reference Class Seed Data:**
```json
{
  "reference_class": "Medicaid_Funding_Disruption_Historical",
  "source": "KFF / MACPAC / PA Budget & Policy Center",
  "n": 23,
  "avg_cut_when_cuts_occur_pct": 0.08,
  "max_cut_observed_pct": 0.17,
  "avg_implementation_delay_months": 14,
  "pct_providers_closed_after_10pct_cut": 0.09,
  "pct_providers_merged_after_10pct_cut": 0.14,
  "avg_months_to_stabilize_post_cut": 18
}
```

---

### USE CASE 6: Supported Decision-Making vs. Guardianship Policy

**Decision Category:** `STRATEGIC_PLANNING`
**Scenario:** PA's Supported Decision-Making movement is growing. Your organization currently requires full legal guardianship for adults in your residential programs. Families and self-advocates are requesting you adopt a Supported Decision-Making (SDM) policy. Your board must decide: (A) adopt SDM as default, requiring guardianship only when specifically indicated, (B) pilot SDM with 10 participants while maintaining guardianship requirement for others, or (C) maintain current guardianship-first policy pending more state guidance.

**Biases to detect:**
- **Status Quo Bias:** Defaulting to Option C because it's the current policy
- **Risk Aversion as Disguised Paternalism:** Framing guardianship as "safety" when it may reflect organizational liability concerns rather than individual welfare
- **Confirmation Bias:** Selectively citing the one incident where lack of guardianship led to harm while ignoring data on guardianship restricting rights

**Constitutional Laws exercised:**
- **Law 2 (Blind Input):** Board members, self-advocate representatives, and family representatives all submit independent assessments.
- **Law 4 (Shadow Layer):** Flag if rationales use language patterns associated with paternalism bias or liability-driven reasoning vs. person-centered reasoning.
- **Law 8 (Radical Transparency):** The decision rationale must be shareable with the self-advocates and families affected.

---

### USE CASE 7: Accessible Housing Investment

**Decision Category:** `BUDGET_APPROVAL`
**Scenario:** A property has become available that could be converted into a 6-person community living arrangement. Total acquisition + renovation: $1.2M. Your organization has $400K in reserves and would need to raise $800K through a capital campaign and/or PHFA grant. Alternatively, you could use the $400K to fund 3 additional years of community-based supports for 12 adults currently on your waitlist. The board must decide between housing investment and direct service expansion.

**Biases to detect:**
- **Concrete vs. Abstract Bias:** The building is tangible and photogenic (good for fundraising); community-based supports are invisible but serve more people
- **Anchoring:** Fixating on the $1.2M price tag rather than the per-person-per-year cost comparison
- **Sunk Cost (Prospective):** "If we don't buy it now, we'll lose the opportunity forever"

**Constitutional Laws exercised:**
- **Law 1 (Epistemic Rigor):** 10-year cost model with Monte Carlo perturbation on construction overruns, occupancy rates, maintenance costs, and reimbursement rates.
- **Law 3 (Outside View):** Reference class from PA non-profit housing projects showing historical cost overruns and timeline delays.
- **Guardrail 3 (Noise Injection):** What happens if the capital campaign raises only 60% of goal? 40%? What if PHFA denies the grant?

**Reference Class Seed Data:**
```json
{
  "reference_class": "PA_Nonprofit_Housing_Development",
  "source": "PHFA / PA Housing Alliance / UCP Housing Reports",
  "n": 94,
  "avg_cost_overrun_pct": 1.28,
  "avg_time_overrun_pct": 1.45,
  "avg_capital_campaign_attainment_pct": 0.82,
  "pct_phfa_grants_approved": 0.34,
  "avg_time_to_occupancy_months": 22,
  "avg_annual_maintenance_per_bed": 8400
}
```

---

### USE CASE 8: Transportation Program — Build vs. Partner

**Decision Category:** `STRATEGIC_PLANNING`
**Scenario:** Transportation is the #1 barrier to employment and community participation for your adults. Options: (A) purchase 3 accessible vehicles and hire drivers ($285K year 1, ~$140K/yr ongoing), (B) partner with the county shared-ride program and subsidize rides ($95K/yr but unreliable scheduling), or (C) contract with a specialized transport vendor ($165K/yr with guaranteed scheduling). The board must decide.

**Biases to detect:**
- **Endowment Effect:** Over-valuing Option A because "owning vehicles means we control our destiny"
- **Recency Bias:** One bad experience with the county shared-ride program disproportionately influencing the decision
- **Optimism Bias:** Underestimating vehicle maintenance, insurance, driver turnover, and fuel cost volatility

**Constitutional Laws exercised:**
- **Law 1 (Epistemic Rigor):** 5-year TCO model with confidence intervals on fuel prices, maintenance, driver wages, ridership growth.
- **Law 3 (Outside View):** Reference class from PA disability service providers who operate their own fleets vs. those who contract out.
- **Law 2 (Blind Input):** Program staff, finance director, and participants each submit independent preference and rationale before group discussion.

**Reference Class Seed Data:**
```json
{
  "reference_class": "Disability_Transport_Program_Models",
  "source": "Community Transportation Association / PA Rural Transit",
  "n": 156,
  "avg_year1_cost_own_fleet": 291000,
  "avg_ongoing_annual_cost_own_fleet": 152000,
  "avg_annual_cost_contracted": 158000,
  "avg_vehicle_useful_life_years": 7,
  "pct_orgs_switched_from_own_to_contract": 0.29,
  "avg_rides_per_participant_per_month": 22,
  "avg_no_show_rate_shared_ride": 0.18,
  "avg_no_show_rate_contracted": 0.06
}
```

---

## IMPLEMENTATION INSTRUCTIONS

### 1. Database Seed Data
Create a new migration file `002_use_case_seed_data.sql` that inserts:
- 8 reference class entries in the `reference_classes` table (one per use case)
- 8 decision objects in the `decisions` table with status `DEMO`
- 24 sample blind judgments (3 per decision) in the `judgments` table with realistic SHA-256 hashes
- 40+ audit_log entries with bias detections spread across all 8 bias types and 4 decision categories for the bias heat map
- 8 simulation result records with realistic Monte Carlo outputs (p5, p50, p95)

### 2. Onboarding Tutorial Flow
Create a new screen `OnboardingTutorialScreen.tsx` that:
- Presents each use case as a card with a title, one-sentence summary, and the Constitutional Laws it exercises
- Allows the user to tap into any use case to see a read-only walkthrough of the full decision workflow
- Highlights the bias detections that were flagged (with explanations)
- Shows the Monte Carlo simulation results with Future Cones visualization
- Ends each walkthrough with: "Ready to run your own decision? Start here."

### 3. Reference Class Data Integration
Update the `OutsideViewCalculator` component to:
- Allow the user to select from the 8 pre-loaded reference classes when starting a new decision
- Auto-populate the historical averages (cost overrun, time overrun, etc.)
- Calculate the adjusted budget/timeline and require the 200-character Divergence Justification per Law 3

### 4. Bias Heat Map Demo Data
Populate the `bias_heatmap_cache` table with 7 days of realistic demo data so that when a Board Member first opens the heat map, they see a meaningful visualization rather than an empty screen. The demo data should show:
- Higher bias concentration in `GRANT_ALLOCATION` decisions (reflecting the waiver slot and housing use cases)
- Moderate bias in `BUDGET_APPROVAL` (DSP wages, transportation)
- Sunk Cost and Status Quo Bias as the most frequently detected bias types
- A visible "hot spot" on Day 3 corresponding to the guardianship policy discussion (Use Case 6)

### 5. Coaching Context Enhancement
Update the coaching system prompt (used in the LLM router) to include Pennsylvania-specific context:
- PA HCBS waiver structure (Consolidated, Community Living, P/FDS, Adult Autism Waiver)
- DSP workforce crisis and current wage floor ($17.85/hr)
- The aging-out cliff (IDEA entitlements ending at 21)
- Supported Decision-Making vs. guardianship landscape in PA
- Federal Medicaid restructuring risks
- The institutional cost ($600K+/person/year) vs. community cost (~$120K/person/year) differential

### 6. File Manifest
After implementation, the following new or modified files should exist:

```
NEW FILES:
  server/src/db/migrations/002_use_case_seed_data.sql
  src/screens/OnboardingTutorialScreen.tsx
  src/components/tutorials/UseCaseCard.tsx
  src/components/tutorials/UseCaseWalkthrough.tsx
  src/data/referenceClasses.ts
  src/data/demoDecisions.ts
  src/data/paContextPrompt.ts

MODIFIED FILES:
  src/components/decisions/OutsideViewCalculator.tsx  (reference class selector)
  src/navigation/RootNavigator.tsx  (add tutorial route)
  server/src/services/llmRouter.ts  (inject PA context into coaching prompts)
  server/src/jobs/dailyHeatmapJob.ts  (handle demo data on first run)
```

---

## VALIDATION CHECKLIST

Before marking this task DONE, verify:

- [ ] All 8 reference classes load in the OutsideViewCalculator dropdown
- [ ] All 8 demo decisions appear in the OnboardingTutorialScreen
- [ ] Blind input walkthrough shows SHA-256 hashes and the pending → complete reveal flow
- [ ] Bias heat map shows 7 days of demo data with visible hot spots
- [ ] Monte Carlo simulations run for at least Use Cases 2, 5, and 7 with p5/p50/p95 outputs
- [ ] Pre-Mortem screen triggers for Use Cases 3 and 7 (exceeds $50K threshold)
- [ ] Coaching context includes PA-specific waiver and workforce data
- [ ] All demo data is flagged with `is_demo: true` so it can be purged when the org goes live
- [ ] No Constitutional Law is violated in the implementation
- [ ] The Shadow Layer intercepts and logs bias detections for all demo decision submissions
