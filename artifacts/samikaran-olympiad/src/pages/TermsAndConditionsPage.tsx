import { Helmet } from "react-helmet";
import { ScrollText, Users, CreditCard, Monitor, Award, AlertTriangle, Scale, Mail } from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";
import { LegalPageLayout } from "./PrivacyPolicyPage";

const sections = [
  {
    id: "acceptance",
    icon: ScrollText,
    title: "Acceptance of Terms",
    content: [
      { type: "p", text: "By accessing or using the Samikaran Olympiad platform (samikaranolympiad.com), you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you may not use our services." },
      { type: "p", text: "These Terms apply to all users of the platform including students, parents, school coordinators, and partner organisations. Use of the platform by a minor requires consent from a parent or legal guardian." },
    ],
  },
  {
    id: "eligibility",
    icon: Users,
    title: "Eligibility & Registration",
    content: [
      { type: "p", text: "To participate in Samikaran Olympiad examinations, you must:" },
      { type: "ul", items: [
        "Be a student enrolled in Class 1 to Class 12 in a recognised school (CBSE, ICSE, State Board, IGCSE, or equivalent).",
        "Provide accurate and truthful information during registration.",
        "Have a valid email address and mobile number for communication.",
        "Register within the specified registration window for each olympiad.",
        "Possess the required device (laptop/desktop with webcam) for appearing in the AI-proctored exam.",
      ]},
      { type: "p", text: "Samikaran Olympiad reserves the right to verify eligibility and reject or cancel any registration that provides false information." },
    ],
  },
  {
    id: "payments",
    icon: CreditCard,
    title: "Fees & Payment Policy",
    content: [
      { type: "p", text: "The following payment terms apply to all olympiad registrations:" },
      { type: "ul", items: [
        "Registration fees are clearly displayed on each olympiad's listing page before payment.",
        "All fees are inclusive of applicable taxes unless stated otherwise.",
        "Payments must be completed through our official payment gateway. We do not accept cash or direct bank transfers.",
        "Exam fees are non-refundable once registration is confirmed, except in the event of cancellation by Samikaran Olympiad.",
        "In case of a double charge or payment failure, please contact support@samikaranolympiad.com within 7 days for resolution.",
        "School and group registrations may be eligible for bulk discounts as communicated through official channels.",
      ]},
    ],
  },
  {
    id: "exam-conduct",
    icon: Monitor,
    title: "Exam Conduct & Integrity",
    content: [
      { type: "p", text: "All candidates must adhere to the following exam conduct rules:" },
      { type: "ul", items: [
        "You must appear in the exam from a quiet, well-lit room using your registered account only.",
        "Your face must be clearly visible to the webcam throughout the exam.",
        "You must not use any external resources, notes, textbooks, or electronic devices other than the exam device.",
        "Tab switching, minimising the browser window, or navigating away from the exam will be flagged as violations.",
        "Multiple faces in the webcam frame will trigger automatic violation alerts.",
        "Any form of cheating, impersonation, or assistance from others will result in immediate disqualification.",
        "Samikaran Olympiad's AI proctoring decisions are final and binding.",
      ]},
      { type: "p", text: "Violation of exam conduct rules may result in cancellation of results, banning from future olympiads, and forfeiture of any prizes or certificates." },
    ],
  },
  {
    id: "results-awards",
    icon: Award,
    title: "Results, Certificates & Awards",
    content: [
      { type: "p", text: "The following terms apply to results and certificates:" },
      { type: "ul", items: [
        "Results are declared based on correct answers. There is no negative marking unless explicitly stated for a specific olympiad.",
        "Rankings are calculated based on scores and, in case of a tie, by time taken to complete the exam.",
        "Digital certificates are issued to all eligible participants within 24 hours of result declaration.",
        "Physical medals, trophies, and prizes are dispatched within 30 days of result declaration to the registered address.",
        "Certificates can be verified at samikaranolympiad.com/verify using the unique certificate number.",
        "Any error in the certificate must be reported within 30 days of issuance.",
        "Prize money, if applicable, will be transferred via bank transfer or UPI within 30 days of result declaration.",
      ]},
    ],
  },
  {
    id: "prohibited",
    icon: AlertTriangle,
    title: "Prohibited Activities",
    content: [
      { type: "p", text: "The following activities are strictly prohibited on the Samikaran Olympiad platform:" },
      { type: "ul", items: [
        "Creating multiple accounts for the same individual.",
        "Attempting to reverse-engineer, hack, or disrupt platform services.",
        "Sharing exam questions or answer keys on any medium.",
        "Using automated tools, bots, or scripts to interact with the platform.",
        "Posting defamatory, abusive, or false content about Samikaran Olympiad.",
        "Registering on behalf of another student without their/parent's consent.",
        "Commercially using our content, logos, or question bank without written permission.",
      ]},
    ],
  },
  {
    id: "liability",
    icon: Scale,
    title: "Limitation of Liability",
    content: [
      { type: "p", text: "Samikaran Olympiad provides the platform and services on an 'as-is' basis. We strive for 100% uptime and accuracy but cannot guarantee:" },
      { type: "ul", items: [
        "Uninterrupted access to the platform at all times.",
        "Complete accuracy of all content, questions, or answers (errors will be corrected upon identification).",
        "Specific outcomes from participating in olympiad exams.",
      ]},
      { type: "p", text: "Our liability in any event is limited to the exam fee paid for the specific olympiad in question. We are not liable for indirect, incidental, or consequential damages." },
    ],
  },
  {
    id: "contact-terms",
    icon: Mail,
    title: "Contact & Grievances",
    content: [
      { type: "p", text: "For any questions, clarifications, or grievances related to these Terms and Conditions, please contact us:" },
      { type: "ul", items: [
        "Email: support@samikaranolympiad.com",
        "Grievance Officer: grievance@samikaranolympiad.com",
        "Response time: Within 7 business days",
      ]},
      { type: "p", text: "These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in India." },
    ],
  },
];

export default function TermsAndConditionsPage() {
  return (
    <PublicLayout showNotificationBar={false}>
      <Helmet>
        <title>Terms & Conditions | Samikaran Olympiad</title>
        <meta name="description" content="Read the Terms and Conditions for using the Samikaran Olympiad platform — registration, exams, payments, and conduct rules." />
      </Helmet>
      <LegalPageLayout
        icon={ScrollText}
        title="Terms & Conditions"
        subtitle="Please read these terms carefully before using the Samikaran Olympiad platform."
        effectiveDate="Effective: 1 January 2026 · Last updated: May 2026"
        sections={sections}
      />
    </PublicLayout>
  );
}
