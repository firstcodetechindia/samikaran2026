import { Helmet } from "react-helmet";
import { RefreshCw, XCircle, CheckCircle, Clock, CreditCard, AlertTriangle, Mail } from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";
import { LegalPageLayout } from "./PrivacyPolicyPage";

const sections = [
  {
    id: "overview",
    icon: RefreshCw,
    title: "Refund Policy Overview",
    content: [
      { type: "p", text: "At Samikaran Olympiad, we strive to deliver the best possible examination experience. This Refund Policy outlines the conditions under which refunds are issued and the process to request one." },
      { type: "p", text: "Please read this policy carefully before completing your registration payment. By paying the registration fee, you acknowledge and agree to this Refund Policy." },
    ],
  },
  {
    id: "non-refundable",
    icon: XCircle,
    title: "Non-Refundable Situations",
    content: [
      { type: "p", text: "Exam registration fees are generally non-refundable in the following cases:" },
      { type: "ul", items: [
        "The student voluntarily withdraws from a registered olympiad after confirmation.",
        "The student fails to appear for the exam within the scheduled exam window.",
        "The student's registration is cancelled due to violation of exam conduct rules or providing false information.",
        "Technical issues on the student's end (poor internet connection, device failure, power outage) that prevent exam participation.",
        "The student is unable to complete the exam due to proctoring violations on their end.",
        "Change of mind after the registration confirmation has been sent.",
      ]},
    ],
  },
  {
    id: "eligible-refunds",
    icon: CheckCircle,
    title: "Eligible Refund Situations",
    content: [
      { type: "p", text: "A full refund will be processed in the following circumstances:" },
      { type: "ul", items: [
        "The olympiad is cancelled by Samikaran Olympiad and not rescheduled.",
        "The olympiad is postponed significantly (more than 30 days) and the student is unable to appear on the new date.",
        "A duplicate payment has been made for the same registration due to a technical error.",
        "Payment has been successfully deducted but registration confirmation was not received within 24 hours.",
        "An incorrect exam fee was charged due to a pricing error on our platform.",
      ]},
      { type: "p", text: "In all eligible cases, refunds will be credited to the original payment source within 5–10 working days." },
    ],
  },
  {
    id: "partial-refunds",
    icon: RefreshCw,
    title: "Partial Refunds",
    content: [
      { type: "p", text: "Partial refunds (50% of the registration fee) may be considered in exceptional circumstances:" },
      { type: "ul", items: [
        "A medical emergency is documented with a valid doctor's certificate and submitted within 48 hours of the missed exam.",
        "A bereavement in the immediate family, documented with appropriate evidence.",
        "A natural disaster or government-declared emergency affecting the student's region on the exam date.",
      ]},
      { type: "p", text: "Partial refund requests are reviewed on a case-by-case basis. Submission of documentation does not guarantee approval." },
    ],
  },
  {
    id: "refund-process",
    icon: Clock,
    title: "How to Request a Refund",
    content: [
      { type: "p", text: "To request a refund, follow these steps:" },
      { type: "ul", items: [
        "Email refund@samikaranolympiad.com within 7 days of the qualifying event.",
        "Include your registered email address, full name, olympiad name, and transaction/payment ID.",
        "Attach any supporting documents (for medical/bereavement/force majeure cases).",
        "Our team will acknowledge your request within 2 business days.",
        "Eligible refunds will be processed within 5–10 working days after approval.",
      ]},
    ],
  },
  {
    id: "payment-methods",
    icon: CreditCard,
    title: "Refund to Payment Source",
    content: [
      { type: "p", text: "Approved refunds are always processed back to the original payment source:" },
      { type: "ul", items: [
        "UPI payments: Refunded to the same UPI ID within 5 working days.",
        "Credit/Debit Cards: Refunded to the card within 7–10 working days (depending on bank processing time).",
        "Net Banking: Refunded to the same bank account within 5–7 working days.",
        "Wallet payments: Refunded to the same wallet within 3–5 working days.",
      ]},
      { type: "p", text: "Samikaran Olympiad does not issue refunds via cash, cheque, or to a different payment instrument than the original." },
    ],
  },
  {
    id: "cancellation-policy",
    icon: AlertTriangle,
    title: "Olympiad Cancellation by Samikaran",
    content: [
      { type: "p", text: "In the unlikely event that Samikaran Olympiad cancels an olympiad:" },
      { type: "ul", items: [
        "All registered students will be notified via email and SMS at least 72 hours in advance (except in cases of force majeure).",
        "Full refunds will be automatically initiated within 3 business days of the cancellation announcement.",
        "Students may also choose to transfer their registration to another olympiad of equal or lesser value.",
        "If the olympiad is rescheduled, students may opt for a refund or retain their registration for the new date.",
      ]},
    ],
  },
  {
    id: "contact-refund",
    icon: Mail,
    title: "Contact for Refund Queries",
    content: [
      { type: "p", text: "For all refund-related queries, please reach out to our support team:" },
      { type: "ul", items: [
        "Refund requests: refund@samikaranolympiad.com",
        "General support: support@samikaranolympiad.com",
        "Response time: Within 2 business days",
        "Resolution time: Within 5–10 working days for approved refunds",
      ]},
      { type: "p", text: "We are committed to resolving all refund requests fairly and transparently. Your satisfaction is our priority." },
    ],
  },
];

export default function RefundPolicyPage() {
  return (
    <PublicLayout showNotificationBar={false}>
      <Helmet>
        <title>Refund Policy | Samikaran Olympiad</title>
        <meta name="description" content="Understand Samikaran Olympiad's refund policy — when refunds are issued, how to request one, and the refund timeline." />
      </Helmet>
      <LegalPageLayout
        icon={RefreshCw}
        title="Refund Policy"
        subtitle="Transparent and fair refund guidelines for all Samikaran Olympiad registrations."
        effectiveDate="Effective: 1 January 2026 · Last updated: May 2026"
        sections={sections}
      />
    </PublicLayout>
  );
}
