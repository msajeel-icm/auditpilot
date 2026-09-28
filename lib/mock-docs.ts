import type { AuditCase, MockDocument } from "@/lib/types";

export const mockCases: AuditCase[] = [
  {
    id: "case-riverbend-2026",
    name: "Riverbend Supported Living",
    program: "HCBS Waiver — Residential Habilitation",
    reviewPeriod: "January–June 2026",
    status: "in-review",
    risk: "high",
    description:
      "Audit-prep case for a fictional supported-living program serving adults with intellectual and developmental disabilities.",
  },
  {
    id: "case-harbor-2026",
    name: "Harbor Day Services",
    program: "HCBS Waiver — Day Habilitation",
    reviewPeriod: "April–September 2026",
    status: "action-required",
    risk: "medium",
    description:
      "Audit-prep case for a fictional community day program, focused on service-plan alignment and staff qualifications.",
  },
  {
    id: "case-meadow-2026",
    name: "Meadow Community Supports",
    program: "State Plan — Personal Care",
    reviewPeriod: "July–September 2026",
    status: "audit-ready",
    risk: "low",
    description:
      "Audit-prep case for a fictional personal-care provider, focused on claims support and service documentation.",
  },
];

export const mockDocuments: MockDocument[] = [
  {
    id: "doc-isp-001",
    caseId: "case-riverbend-2026",
    title: "Individual Support Plan — Jordan Example",
    docType: "individual-support-plan",
    status: "ready",
    risk: "low",
    updatedAt: "2026-06-18T14:30:00.000Z",
    excerpt:
      "Annual ISP lists residential-habilitation goals, assessed support needs, responsible staff, and review cadence.",
    body: `Participant: Jordan Example (fictional). Plan period: July 1, 2025 through June 30, 2026. The interdisciplinary team confirmed goals for meal preparation, community navigation, and medication self-advocacy. Each goal includes observable measures, staff support steps, and monthly review expectations.

The plan documents informed choice, rights restrictions, risk supports, emergency contacts, and signatures from the participant, guardian, case manager, and provider representative. The June review notes progress and recommends continuing the existing support intensity.`,
  },
  {
    id: "doc-progress-002",
    caseId: "case-riverbend-2026",
    title: "Residential Progress Notes — June 2026",
    docType: "progress-note",
    status: "needs-review",
    risk: "medium",
    updatedAt: "2026-07-02T09:15:00.000Z",
    excerpt:
      "Daily notes record supports delivered, but four entries use generic language without linking activities to ISP goals.",
    body: `The June log contains one entry per service day for Jordan Example (fictional). Most entries describe the participant's response to meal-planning and transit practice, including the level of prompting used and progress toward the relevant ISP objective.

Four entries state only that the participant “had a good day” and “completed goals.” They do not identify the goal addressed, the staff intervention, or an observable outcome. Supervisor follow-up is requested before the audit packet is finalized.`,
  },
  {
    id: "doc-mar-003",
    caseId: "case-riverbend-2026",
    title: "Medication Administration Record — June 2026",
    docType: "medication-administration-record",
    status: "needs-review",
    risk: "high",
    updatedAt: "2026-07-01T16:45:00.000Z",
    excerpt:
      "MAR is mostly complete; one evening dose lacks initials and a corresponding exception note.",
    body: `The June MAR for Jordan Example (fictional) lists scheduled medication name, dosage, route, administration time, prescriber, and staff initials. Controlled-count reconciliation and pharmacy delivery records are attached.

The 8:00 p.m. entry on June 14 is blank for one routine medication. The shift narrative does not document a refusal, hold, omission, or late administration. This discrepancy should be reconciled with the medication error and notification policy.`,
  },
  {
    id: "doc-incident-004",
    caseId: "case-harbor-2026",
    title: "Incident Report — Transportation Fall",
    docType: "incident-report",
    status: "ready",
    risk: "medium",
    updatedAt: "2026-08-12T11:20:00.000Z",
    excerpt:
      "Report documents a minor fall, assessment, notifications, corrective action, and timely state submission.",
    body: `Participant: Casey Sample (fictional). On August 10, 2026, the participant lost balance while stepping from the program van with staff nearby. Staff completed an immediate injury assessment, contacted the on-call nurse, notified the guardian and case manager, and offered medical evaluation.

The supervisor reviewed the event within one business day. Corrective actions included refresher training on van-exit positioning and an update to the transportation risk plan. The state incident submission timestamp is included in the packet.`,
  },
  {
    id: "doc-training-005",
    caseId: "case-harbor-2026",
    title: "Staff Training Matrix — Q3 2026",
    docType: "staff-training",
    status: "missing",
    risk: "high",
    updatedAt: "2026-09-20T08:00:00.000Z",
    excerpt:
      "Matrix identifies one direct-support worker whose annual rights training certificate is not in the personnel file.",
    body: `The Q3 training matrix covers CPR and first aid, abuse and neglect reporting, participant rights, medication awareness, emergency procedures, and person-centered practices for active Harbor Day Services staff.

One fictional employee, Staff Member DS-104, is marked complete for annual participant-rights training, but the supporting certificate is absent from the personnel file. The learning-system export should be obtained or the course repeated before the audit response is submitted.`,
  },
  {
    id: "doc-claim-006",
    caseId: "case-meadow-2026",
    title: "Billing Claim Sample — September 2026",
    docType: "billing-claim",
    status: "ready",
    risk: "low",
    updatedAt: "2026-09-24T13:10:00.000Z",
    excerpt:
      "Claim units, authorization, attendance, and signed service note reconcile for the sampled date.",
    body: `Participant: Taylor Test (fictional). Date of service: September 9, 2026. The claim reports six units of personal-care service under the authorized procedure code. The authorization was active and had sufficient remaining units on the service date.

The visit record, signed service note, staff schedule, and electronic visit verification timestamps support the billed units. No overlapping claim or excluded location was identified in the sample.`,
  },
];
