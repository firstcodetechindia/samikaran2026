import { db } from "../db";
import { chatbotFlows } from "@workspace/db";
import { eq } from "drizzle-orm";

interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    nodeType: string;
    message?: string;
    options?: { id: string; label: string; value: string }[];
    fields?: { id: string; label: string; type: string; required: boolean }[];
    condition?: { field: string; operator: string; value: string };
    aiPrompt?: string;
    handoffReason?: string;
    endMessage?: string;
  };
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
  animated?: boolean;
  style?: { stroke: string };
}

const createMainWelcomeFlow = (): { nodes: FlowNode[]; edges: FlowEdge[] } => {
  const nodes: FlowNode[] = [
    {
      id: "start_1",
      type: "start",
      position: { x: 400, y: 50 },
      data: { label: "Start", nodeType: "start" }
    },
    {
      id: "welcome_msg",
      type: "message",
      position: { x: 400, y: 150 },
      data: {
        label: "Welcome Message",
        nodeType: "message",
        message: "Namaste! Welcome to Samikaran Olympiad. I'm here to help you with any questions about our olympiad exams, registration, and more. To serve you better, please tell me who you are:"
      }
    },
    {
      id: "user_type_menu",
      type: "options",
      position: { x: 400, y: 280 },
      data: {
        label: "User Type Selection",
        nodeType: "options",
        message: "Please select your role:",
        options: [
          { id: "opt_student", label: "I'm a Student", value: "student" },
          { id: "opt_parent", label: "I'm a Parent/Guardian", value: "parent" },
          { id: "opt_school", label: "I represent a School", value: "school" },
          { id: "opt_partner", label: "I want to be a Partner", value: "partner" },
          { id: "opt_general", label: "Just exploring", value: "general" }
        ]
      }
    },
    {
      id: "student_redirect",
      type: "message",
      position: { x: 50, y: 450 },
      data: {
        label: "Student Redirect",
        nodeType: "message",
        message: "Great! As a student, I can help you with:\n• Registering for olympiad exams\n• Checking exam schedules\n• Practice tests and preparation\n• Viewing your results\n• Certificates and achievements\n\nWhat would you like to know?"
      }
    },
    {
      id: "parent_redirect",
      type: "message",
      position: { x: 250, y: 450 },
      data: {
        label: "Parent Redirect",
        nodeType: "message",
        message: "Welcome, Parent! I can assist you with:\n• Registering your child for olympiads\n• Payment and fee information\n• Tracking your child's progress\n• Understanding exam patterns\n• Result certificates\n\nHow can I help you today?"
      }
    },
    {
      id: "school_redirect",
      type: "message",
      position: { x: 450, y: 450 },
      data: {
        label: "School Redirect",
        nodeType: "message",
        message: "Welcome, School Representative! We offer:\n• Bulk student registration\n• School partnership programs\n• On-campus exam centers\n• School-wise result analysis\n• Teacher training workshops\n\nWhat interests you?"
      }
    },
    {
      id: "partner_redirect",
      type: "message",
      position: { x: 650, y: 450 },
      data: {
        label: "Partner Redirect",
        nodeType: "message",
        message: "Interested in partnering with us? Great choice!\n• Referral commission up to 30%\n• Marketing materials provided\n• Dedicated partner dashboard\n• Training and support\n• Monthly payouts\n\nLet me explain our partnership program!"
      }
    },
    {
      id: "general_redirect",
      type: "message",
      position: { x: 850, y: 450 },
      data: {
        label: "General Redirect",
        nodeType: "message",
        message: "Welcome to Samikaran Olympiad!\n\nWe conduct nationwide olympiad exams for students from Grade 1-12 in:\n• Mathematics\n• Science\n• English\n• Computer Science\n• Reasoning & Aptitude\n\nThese exams help students compete nationally and win exciting prizes!"
      }
    },
    {
      id: "ai_followup",
      type: "aiResponse",
      position: { x: 400, y: 600 },
      data: {
        label: "AI Follow-up",
        nodeType: "aiResponse",
        aiPrompt: "Based on the user's selection and query, provide helpful information about Samikaran Olympiad. Be friendly, use simple language, and guide them towards registration or their specific need. If they need human assistance, let them know."
      }
    }
  ];

  const edges: FlowEdge[] = [
    { id: "e1", source: "start_1", target: "welcome_msg", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e2", source: "welcome_msg", target: "user_type_menu", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e3", source: "user_type_menu", target: "student_redirect", sourceHandle: "opt_student", type: "smoothstep", animated: true, style: { stroke: "#22c55e" } },
    { id: "e4", source: "user_type_menu", target: "parent_redirect", sourceHandle: "opt_parent", type: "smoothstep", animated: true, style: { stroke: "#22c55e" } },
    { id: "e5", source: "user_type_menu", target: "school_redirect", sourceHandle: "opt_school", type: "smoothstep", animated: true, style: { stroke: "#22c55e" } },
    { id: "e6", source: "user_type_menu", target: "partner_redirect", sourceHandle: "opt_partner", type: "smoothstep", animated: true, style: { stroke: "#22c55e" } },
    { id: "e7", source: "user_type_menu", target: "general_redirect", sourceHandle: "opt_general", type: "smoothstep", animated: true, style: { stroke: "#22c55e" } },
    { id: "e8", source: "student_redirect", target: "ai_followup", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e9", source: "parent_redirect", target: "ai_followup", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e10", source: "school_redirect", target: "ai_followup", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e11", source: "partner_redirect", target: "ai_followup", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e12", source: "general_redirect", target: "ai_followup", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } }
  ];

  return { nodes, edges };
};

const createStudentRegistrationFlow = (): { nodes: FlowNode[]; edges: FlowEdge[] } => {
  const nodes: FlowNode[] = [
    {
      id: "start_1",
      type: "start",
      position: { x: 400, y: 50 },
      data: { label: "Start", nodeType: "start" }
    },
    {
      id: "student_welcome",
      type: "message",
      position: { x: 400, y: 150 },
      data: {
        label: "Student Welcome",
        nodeType: "message",
        message: "Hi there, future champion! Ready to register for Samikaran Olympiad? I'll guide you through the process step by step."
      }
    },
    {
      id: "student_options",
      type: "options",
      position: { x: 400, y: 280 },
      data: {
        label: "Student Actions",
        nodeType: "options",
        message: "What would you like to do?",
        options: [
          { id: "opt_register", label: "Register for an Exam", value: "register" },
          { id: "opt_schedule", label: "View Exam Schedule", value: "schedule" },
          { id: "opt_practice", label: "Practice Tests", value: "practice" },
          { id: "opt_results", label: "Check My Results", value: "results" },
          { id: "opt_help", label: "Need Help", value: "help" }
        ]
      }
    },
    {
      id: "register_info",
      type: "message",
      position: { x: 50, y: 450 },
      data: {
        label: "Registration Info",
        nodeType: "message",
        message: "To register for an olympiad exam:\n\n1. Visit our registration page\n2. Fill in your personal details\n3. Select your grade and subjects\n4. Complete payment (starts from ₹100)\n5. Get your admit card via email\n\nRegistration is open for Grade 1-12 students!"
      }
    },
    {
      id: "collect_grade",
      type: "dataRequest",
      position: { x: 50, y: 620 },
      data: {
        label: "Collect Grade",
        nodeType: "dataRequest",
        message: "Which grade are you studying in?",
        fields: [
          { id: "grade", label: "Your Grade (1-12)", type: "number", required: true }
        ]
      }
    },
    {
      id: "schedule_info",
      type: "message",
      position: { x: 250, y: 450 },
      data: {
        label: "Schedule Info",
        nodeType: "message",
        message: "Samikaran Olympiad 2025 Schedule:\n\n📅 Level 1: January - March 2025\n📅 Level 2: April - May 2025\n📅 Finals: June 2025\n\nExams are conducted online from your home. You can choose your preferred date within the exam window!"
      }
    },
    {
      id: "practice_info",
      type: "message",
      position: { x: 450, y: 450 },
      data: {
        label: "Practice Info",
        nodeType: "message",
        message: "Prepare well with our resources:\n\n📚 Free sample papers available\n🎯 Topic-wise practice tests\n📝 Previous year questions\n🏆 Mock tests with rankings\n\nLogin to your student dashboard to access all practice materials!"
      }
    },
    {
      id: "results_info",
      type: "message",
      position: { x: 650, y: 450 },
      data: {
        label: "Results Info",
        nodeType: "message",
        message: "To check your results:\n\n1. Login to your student account\n2. Go to 'My Results' section\n3. View detailed scorecard\n4. Download certificates\n\nResults are typically declared within 15 days of exam completion."
      }
    },
    {
      id: "help_handoff",
      type: "humanHandoff",
      position: { x: 850, y: 450 },
      data: {
        label: "Need Help",
        nodeType: "humanHandoff",
        handoffReason: "Student needs personal assistance",
        message: "I'm connecting you with our support team. A representative will assist you shortly. Please share your query in detail."
      }
    },
    {
      id: "ai_assist",
      type: "aiResponse",
      position: { x: 300, y: 750 },
      data: {
        label: "AI Assistance",
        nodeType: "aiResponse",
        aiPrompt: "Help the student with their olympiad-related query. Provide accurate information about registration, exams, or results. Be encouraging and supportive. Guide them to the registration page if they're ready to register."
      }
    },
    {
      id: "end_positive",
      type: "endChat",
      position: { x: 500, y: 850 },
      data: {
        label: "End Chat",
        nodeType: "endChat",
        endMessage: "All the best for your olympiad journey! Remember, every champion was once a beginner. You've got this! 🌟"
      }
    }
  ];

  const edges: FlowEdge[] = [
    { id: "e1", source: "start_1", target: "student_welcome", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e2", source: "student_welcome", target: "student_options", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e3", source: "student_options", target: "register_info", sourceHandle: "opt_register", type: "smoothstep", animated: true, style: { stroke: "#22c55e" } },
    { id: "e4", source: "student_options", target: "schedule_info", sourceHandle: "opt_schedule", type: "smoothstep", animated: true, style: { stroke: "#22c55e" } },
    { id: "e5", source: "student_options", target: "practice_info", sourceHandle: "opt_practice", type: "smoothstep", animated: true, style: { stroke: "#22c55e" } },
    { id: "e6", source: "student_options", target: "results_info", sourceHandle: "opt_results", type: "smoothstep", animated: true, style: { stroke: "#22c55e" } },
    { id: "e7", source: "student_options", target: "help_handoff", sourceHandle: "opt_help", type: "smoothstep", animated: true, style: { stroke: "#ef4444" } },
    { id: "e8", source: "register_info", target: "collect_grade", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e9", source: "collect_grade", target: "ai_assist", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e10", source: "schedule_info", target: "ai_assist", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e11", source: "practice_info", target: "ai_assist", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e12", source: "results_info", target: "ai_assist", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e13", source: "ai_assist", target: "end_positive", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } }
  ];

  return { nodes, edges };
};

const createParentGuardianFlow = (): { nodes: FlowNode[]; edges: FlowEdge[] } => {
  const nodes: FlowNode[] = [
    {
      id: "start_1",
      type: "start",
      position: { x: 400, y: 50 },
      data: { label: "Start", nodeType: "start" }
    },
    {
      id: "parent_welcome",
      type: "message",
      position: { x: 400, y: 150 },
      data: {
        label: "Parent Welcome",
        nodeType: "message",
        message: "Namaste! Thank you for choosing Samikaran Olympiad for your child's academic growth. How can I assist you today?"
      }
    },
    {
      id: "parent_options",
      type: "options",
      position: { x: 400, y: 280 },
      data: {
        label: "Parent Options",
        nodeType: "options",
        message: "Please select what you need help with:",
        options: [
          { id: "opt_enroll", label: "Enroll My Child", value: "enroll" },
          { id: "opt_fees", label: "Fees & Payment", value: "fees" },
          { id: "opt_progress", label: "Track Progress", value: "progress" },
          { id: "opt_benefits", label: "Benefits of Olympiad", value: "benefits" },
          { id: "opt_support", label: "Talk to Support", value: "support" }
        ]
      }
    },
    {
      id: "enroll_child",
      type: "message",
      position: { x: 50, y: 450 },
      data: {
        label: "Enrollment Info",
        nodeType: "message",
        message: "Enrolling your child is simple:\n\n1. Create a parent account\n2. Add your child's details\n3. Select grade and subjects\n4. Choose exam dates\n5. Complete payment\n\nYou can register multiple children under one account!"
      }
    },
    {
      id: "collect_child_info",
      type: "dataRequest",
      position: { x: 50, y: 620 },
      data: {
        label: "Child Details",
        nodeType: "dataRequest",
        message: "Please share your child's details:",
        fields: [
          { id: "child_name", label: "Child's Name", type: "text", required: true },
          { id: "child_grade", label: "Grade (1-12)", type: "number", required: true },
          { id: "parent_phone", label: "Your Phone Number", type: "phone", required: true }
        ]
      }
    },
    {
      id: "fees_info",
      type: "message",
      position: { x: 250, y: 450 },
      data: {
        label: "Fees Information",
        nodeType: "message",
        message: "Samikaran Olympiad Fee Structure:\n\n💰 Single Subject: ₹100-150\n💰 Combo (2 subjects): ₹180-250\n💰 All Subjects Pack: ₹400-500\n\n✅ GST included\n✅ Secure payment gateway\n✅ Instant confirmation\n✅ Refund available before exam"
      }
    },
    {
      id: "payment_options",
      type: "options",
      position: { x: 250, y: 620 },
      data: {
        label: "Payment Methods",
        nodeType: "options",
        message: "We accept multiple payment methods:",
        options: [
          { id: "opt_upi", label: "UPI (GPay, PhonePe)", value: "upi" },
          { id: "opt_card", label: "Credit/Debit Card", value: "card" },
          { id: "opt_netbanking", label: "Net Banking", value: "netbanking" }
        ]
      }
    },
    {
      id: "progress_info",
      type: "message",
      position: { x: 450, y: 450 },
      data: {
        label: "Progress Tracking",
        nodeType: "message",
        message: "Track your child's olympiad journey:\n\n📊 Practice test scores\n📈 Performance analytics\n🏅 Rank among peers\n📋 Detailed answer analysis\n📜 Certificates & awards\n\nLogin to parent dashboard to view all details!"
      }
    },
    {
      id: "benefits_info",
      type: "message",
      position: { x: 650, y: 450 },
      data: {
        label: "Benefits",
        nodeType: "message",
        message: "Why Samikaran Olympiad?\n\n🎯 National level competition\n🧠 Develops analytical thinking\n📚 Aligns with school curriculum\n🏆 Exciting prizes & scholarships\n📜 Participation certificates\n🎓 Helps in competitive exam prep\n\nInvest in your child's future today!"
      }
    },
    {
      id: "support_handoff",
      type: "humanHandoff",
      position: { x: 850, y: 450 },
      data: {
        label: "Support Handoff",
        nodeType: "humanHandoff",
        handoffReason: "Parent needs human support",
        message: "Connecting you with our parent support team. They'll help you with any concerns about your child's registration or exams."
      }
    },
    {
      id: "ai_parent_assist",
      type: "aiResponse",
      position: { x: 400, y: 780 },
      data: {
        label: "AI Assistance",
        nodeType: "aiResponse",
        aiPrompt: "Assist the parent with their query about child enrollment, fees, or progress. Be professional, reassuring, and helpful. Encourage enrollment by highlighting benefits. Address any concerns they may have."
      }
    },
    {
      id: "end_parent",
      type: "endChat",
      position: { x: 400, y: 900 },
      data: {
        label: "End Chat",
        nodeType: "endChat",
        endMessage: "Thank you for your interest in Samikaran Olympiad! Your child's bright future starts here. Feel free to reach out anytime."
      }
    }
  ];

  const edges: FlowEdge[] = [
    { id: "e1", source: "start_1", target: "parent_welcome", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e2", source: "parent_welcome", target: "parent_options", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e3", source: "parent_options", target: "enroll_child", sourceHandle: "opt_enroll", type: "smoothstep", animated: true, style: { stroke: "#22c55e" } },
    { id: "e4", source: "parent_options", target: "fees_info", sourceHandle: "opt_fees", type: "smoothstep", animated: true, style: { stroke: "#22c55e" } },
    { id: "e5", source: "parent_options", target: "progress_info", sourceHandle: "opt_progress", type: "smoothstep", animated: true, style: { stroke: "#22c55e" } },
    { id: "e6", source: "parent_options", target: "benefits_info", sourceHandle: "opt_benefits", type: "smoothstep", animated: true, style: { stroke: "#22c55e" } },
    { id: "e7", source: "parent_options", target: "support_handoff", sourceHandle: "opt_support", type: "smoothstep", animated: true, style: { stroke: "#ef4444" } },
    { id: "e8", source: "enroll_child", target: "collect_child_info", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e9", source: "collect_child_info", target: "ai_parent_assist", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e10", source: "fees_info", target: "payment_options", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e11", source: "payment_options", target: "ai_parent_assist", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e12", source: "progress_info", target: "ai_parent_assist", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e13", source: "benefits_info", target: "ai_parent_assist", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e14", source: "ai_parent_assist", target: "end_parent", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } }
  ];

  return { nodes, edges };
};

const createSchoolPartnershipFlow = (): { nodes: FlowNode[]; edges: FlowEdge[] } => {
  const nodes: FlowNode[] = [
    {
      id: "start_1",
      type: "start",
      position: { x: 400, y: 50 },
      data: { label: "Start", nodeType: "start" }
    },
    {
      id: "school_welcome",
      type: "message",
      position: { x: 400, y: 150 },
      data: {
        label: "School Welcome",
        nodeType: "message",
        message: "Welcome! Samikaran Olympiad partners with 5000+ schools across India. We'd love to collaborate with your institution for academic excellence."
      }
    },
    {
      id: "school_options",
      type: "options",
      position: { x: 400, y: 280 },
      data: {
        label: "School Options",
        nodeType: "options",
        message: "How can we assist your school?",
        options: [
          { id: "opt_bulk", label: "Bulk Registration", value: "bulk" },
          { id: "opt_partnership", label: "School Partnership", value: "partnership" },
          { id: "opt_center", label: "Become Exam Center", value: "center" },
          { id: "opt_training", label: "Teacher Training", value: "training" },
          { id: "opt_speak", label: "Speak to Representative", value: "speak" }
        ]
      }
    },
    {
      id: "bulk_info",
      type: "message",
      position: { x: 50, y: 450 },
      data: {
        label: "Bulk Registration",
        nodeType: "message",
        message: "Bulk Registration Benefits:\n\n📦 Minimum 20 students\n💰 Up to 40% discount\n📊 School-wise dashboard\n📋 Excel upload facility\n🏷️ Custom exam scheduling\n📜 School appreciation certificate\n\nOur coordinator will help with the entire process!"
      }
    },
    {
      id: "collect_school_info",
      type: "dataRequest",
      position: { x: 50, y: 620 },
      data: {
        label: "School Details",
        nodeType: "dataRequest",
        message: "Please share your school details:",
        fields: [
          { id: "school_name", label: "School Name", type: "text", required: true },
          { id: "coordinator_name", label: "Coordinator Name", type: "text", required: true },
          { id: "phone", label: "Contact Number", type: "phone", required: true },
          { id: "approx_students", label: "Approx. No. of Students", type: "number", required: true }
        ]
      }
    },
    {
      id: "partnership_info",
      type: "message",
      position: { x: 250, y: 450 },
      data: {
        label: "Partnership Info",
        nodeType: "message",
        message: "School Partnership Program:\n\n🤝 Official Partner School status\n📢 Your school on our website\n🎓 Free teacher orientation\n📊 Analytics & insights\n🏆 School ranking awards\n💼 Revenue sharing model\n\nJoin 5000+ partner schools!"
      }
    },
    {
      id: "center_info",
      type: "message",
      position: { x: 450, y: 450 },
      data: {
        label: "Exam Center Info",
        nodeType: "message",
        message: "Become an Exam Center:\n\n🏫 Host olympiad exams\n💻 Computer lab utilization\n💰 Per-student compensation\n📜 Center recognition\n🔒 Proctoring support provided\n\nRequirements:\n• Computer lab (20+ systems)\n• Internet connectivity\n• Dedicated coordinator"
      }
    },
    {
      id: "training_info",
      type: "message",
      position: { x: 650, y: 450 },
      data: {
        label: "Teacher Training",
        nodeType: "message",
        message: "Teacher Development Programs:\n\n📚 Olympiad pattern training\n🧠 Analytical teaching methods\n💻 Online & offline workshops\n📜 Certificates for teachers\n🆓 Free for partner schools\n\nEmpower your teachers to prepare olympiad champions!"
      }
    },
    {
      id: "representative_handoff",
      type: "humanHandoff",
      position: { x: 850, y: 450 },
      data: {
        label: "Representative",
        nodeType: "humanHandoff",
        handoffReason: "School wants to speak with representative",
        message: "Connecting you with our School Partnership Manager. They'll discuss customized solutions for your institution."
      }
    },
    {
      id: "ai_school_assist",
      type: "aiResponse",
      position: { x: 400, y: 780 },
      data: {
        label: "AI Assistance",
        nodeType: "aiResponse",
        aiPrompt: "Assist the school representative with partnership, bulk registration, or exam center queries. Highlight benefits and encourage partnership. Collect school details if they're interested in proceeding."
      }
    },
    {
      id: "end_school",
      type: "endChat",
      position: { x: 400, y: 900 },
      data: {
        label: "End Chat",
        nodeType: "endChat",
        endMessage: "Thank you for considering Samikaran Olympiad! Together, we can nurture future champions. Our team will contact you soon!"
      }
    }
  ];

  const edges: FlowEdge[] = [
    { id: "e1", source: "start_1", target: "school_welcome", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e2", source: "school_welcome", target: "school_options", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e3", source: "school_options", target: "bulk_info", sourceHandle: "opt_bulk", type: "smoothstep", animated: true, style: { stroke: "#22c55e" } },
    { id: "e4", source: "school_options", target: "partnership_info", sourceHandle: "opt_partnership", type: "smoothstep", animated: true, style: { stroke: "#22c55e" } },
    { id: "e5", source: "school_options", target: "center_info", sourceHandle: "opt_center", type: "smoothstep", animated: true, style: { stroke: "#22c55e" } },
    { id: "e6", source: "school_options", target: "training_info", sourceHandle: "opt_training", type: "smoothstep", animated: true, style: { stroke: "#22c55e" } },
    { id: "e7", source: "school_options", target: "representative_handoff", sourceHandle: "opt_speak", type: "smoothstep", animated: true, style: { stroke: "#ef4444" } },
    { id: "e8", source: "bulk_info", target: "collect_school_info", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e9", source: "collect_school_info", target: "ai_school_assist", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e10", source: "partnership_info", target: "ai_school_assist", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e11", source: "center_info", target: "ai_school_assist", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e12", source: "training_info", target: "ai_school_assist", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e13", source: "ai_school_assist", target: "end_school", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } }
  ];

  return { nodes, edges };
};

const createPartnerReferralFlow = (): { nodes: FlowNode[]; edges: FlowEdge[] } => {
  const nodes: FlowNode[] = [
    {
      id: "start_1",
      type: "start",
      position: { x: 400, y: 50 },
      data: { label: "Start", nodeType: "start" }
    },
    {
      id: "partner_welcome",
      type: "message",
      position: { x: 400, y: 150 },
      data: {
        label: "Partner Welcome",
        nodeType: "message",
        message: "Welcome to Samikaran Olympiad Partner Program! Earn while you help students excel. Our partners earn up to ₹50,000/month!"
      }
    },
    {
      id: "partner_options",
      type: "options",
      position: { x: 400, y: 280 },
      data: {
        label: "Partner Options",
        nodeType: "options",
        message: "What interests you?",
        options: [
          { id: "opt_program", label: "About Partner Program", value: "program" },
          { id: "opt_commission", label: "Commission Structure", value: "commission" },
          { id: "opt_join", label: "Join as Partner", value: "join" },
          { id: "opt_dashboard", label: "Partner Dashboard", value: "dashboard" },
          { id: "opt_call", label: "Request Callback", value: "call" }
        ]
      }
    },
    {
      id: "program_info",
      type: "message",
      position: { x: 50, y: 450 },
      data: {
        label: "Program Info",
        nodeType: "message",
        message: "Samikaran Partner Program:\n\n👥 Who can join:\n• Teachers & tutors\n• Education consultants\n• Coaching centers\n• Freelancers\n• Anyone passionate about education!\n\n✅ Free to join\n✅ No targets or pressure\n✅ Work from anywhere"
      }
    },
    {
      id: "commission_info",
      type: "message",
      position: { x: 250, y: 450 },
      data: {
        label: "Commission Structure",
        nodeType: "message",
        message: "Attractive Commission Structure:\n\n💰 Individual Registration: 20% commission\n💰 School/Bulk: 15% commission\n💰 Bonus: 5% extra on 50+ registrations\n\n🎁 Additional Benefits:\n• Performance bonuses\n• Top partner rewards\n• Training support\n• Marketing materials\n\nPayouts every month via UPI/Bank!"
      }
    },
    {
      id: "join_partner",
      type: "message",
      position: { x: 450, y: 450 },
      data: {
        label: "Join Partner",
        nodeType: "message",
        message: "Becoming a partner is easy:\n\n1. Fill the partner application\n2. Get verified (24-48 hours)\n3. Receive your unique referral code\n4. Share with students & schools\n5. Earn on every registration!\n\nNo investment required. Start earning today!"
      }
    },
    {
      id: "collect_partner_info",
      type: "dataRequest",
      position: { x: 450, y: 620 },
      data: {
        label: "Partner Details",
        nodeType: "dataRequest",
        message: "Please share your details to join:",
        fields: [
          { id: "name", label: "Full Name", type: "text", required: true },
          { id: "phone", label: "Phone Number", type: "phone", required: true },
          { id: "email", label: "Email Address", type: "email", required: true },
          { id: "city", label: "City", type: "text", required: true }
        ]
      }
    },
    {
      id: "dashboard_info",
      type: "message",
      position: { x: 650, y: 450 },
      data: {
        label: "Dashboard Info",
        nodeType: "message",
        message: "Partner Dashboard Features:\n\n📊 Track all referrals\n💰 View earnings & payouts\n📈 Performance analytics\n🔗 Generate referral links\n📦 Marketing material downloads\n📱 Mobile-friendly access\n\nLogin at partner.samikaranolympiad.com"
      }
    },
    {
      id: "callback_request",
      type: "dataRequest",
      position: { x: 850, y: 450 },
      data: {
        label: "Callback Request",
        nodeType: "dataRequest",
        message: "We'll call you back! Share your details:",
        fields: [
          { id: "name", label: "Your Name", type: "text", required: true },
          { id: "phone", label: "Phone Number", type: "phone", required: true },
          { id: "preferred_time", label: "Preferred Time", type: "text", required: false }
        ]
      }
    },
    {
      id: "ai_partner_assist",
      type: "aiResponse",
      position: { x: 400, y: 780 },
      data: {
        label: "AI Assistance",
        nodeType: "aiResponse",
        aiPrompt: "Help the potential partner understand our referral program. Answer questions about commission, payouts, and benefits. Encourage them to join by highlighting success stories and earning potential. Collect their details if they're ready to sign up."
      }
    },
    {
      id: "end_partner",
      type: "endChat",
      position: { x: 400, y: 900 },
      data: {
        label: "End Chat",
        nodeType: "endChat",
        endMessage: "Welcome to the Samikaran family! Your journey to earning while making a difference starts now. We'll be in touch soon!"
      }
    }
  ];

  const edges: FlowEdge[] = [
    { id: "e1", source: "start_1", target: "partner_welcome", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e2", source: "partner_welcome", target: "partner_options", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e3", source: "partner_options", target: "program_info", sourceHandle: "opt_program", type: "smoothstep", animated: true, style: { stroke: "#22c55e" } },
    { id: "e4", source: "partner_options", target: "commission_info", sourceHandle: "opt_commission", type: "smoothstep", animated: true, style: { stroke: "#22c55e" } },
    { id: "e5", source: "partner_options", target: "join_partner", sourceHandle: "opt_join", type: "smoothstep", animated: true, style: { stroke: "#22c55e" } },
    { id: "e6", source: "partner_options", target: "dashboard_info", sourceHandle: "opt_dashboard", type: "smoothstep", animated: true, style: { stroke: "#22c55e" } },
    { id: "e7", source: "partner_options", target: "callback_request", sourceHandle: "opt_call", type: "smoothstep", animated: true, style: { stroke: "#f59e0b" } },
    { id: "e8", source: "program_info", target: "ai_partner_assist", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e9", source: "commission_info", target: "ai_partner_assist", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e10", source: "join_partner", target: "collect_partner_info", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e11", source: "collect_partner_info", target: "ai_partner_assist", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e12", source: "dashboard_info", target: "ai_partner_assist", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e13", source: "callback_request", target: "ai_partner_assist", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e14", source: "ai_partner_assist", target: "end_partner", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } }
  ];

  return { nodes, edges };
};

const createGeneralExplorerFlow = (): { nodes: FlowNode[]; edges: FlowEdge[] } => {
  const nodes: FlowNode[] = [
    {
      id: "start_1",
      type: "start",
      position: { x: 400, y: 50 },
      data: { label: "Start", nodeType: "start" }
    },
    {
      id: "general_welcome",
      type: "message",
      position: { x: 400, y: 150 },
      data: {
        label: "General Welcome",
        nodeType: "message",
        message: "Hello! Welcome to Samikaran Olympiad - India's growing platform for olympiad examinations. Let me tell you about what we do!"
      }
    },
    {
      id: "general_options",
      type: "options",
      position: { x: 400, y: 280 },
      data: {
        label: "Explorer Options",
        nodeType: "options",
        message: "What would you like to know?",
        options: [
          { id: "opt_what", label: "What is Olympiad?", value: "what" },
          { id: "opt_why", label: "Why Participate?", value: "why" },
          { id: "opt_subjects", label: "Available Subjects", value: "subjects" },
          { id: "opt_how", label: "How to Register", value: "how" },
          { id: "opt_faq", label: "Common Questions", value: "faq" }
        ]
      }
    },
    {
      id: "what_olympiad",
      type: "message",
      position: { x: 50, y: 450 },
      data: {
        label: "What is Olympiad",
        nodeType: "message",
        message: "What is an Olympiad Exam?\n\nOlympiad exams are competitive exams that test students beyond their regular curriculum. They:\n\n• Encourage deeper understanding\n• Develop problem-solving skills\n• Prepare for competitive exams\n• Provide national/international exposure\n• Help identify academic strengths\n\nSamikaran Olympiad is conducted for Grade 1-12 students across India!"
      }
    },
    {
      id: "why_participate",
      type: "message",
      position: { x: 250, y: 450 },
      data: {
        label: "Why Participate",
        nodeType: "message",
        message: "Benefits of Olympiad Participation:\n\n🏆 Win medals, certificates & cash prizes\n🧠 Develop critical thinking\n📚 Better academic performance\n🎓 College application advantage\n💡 Identify areas for improvement\n🌟 Boost confidence\n📊 National ranking & comparison\n\nStart from just ₹100 per subject!"
      }
    },
    {
      id: "subjects_info",
      type: "message",
      position: { x: 450, y: 450 },
      data: {
        label: "Subjects Info",
        nodeType: "message",
        message: "Samikaran Olympiad Subjects:\n\n🔢 Mathematics Olympiad (IMO)\n🔬 Science Olympiad (NSO)\n📖 English Olympiad (IEO)\n💻 Cyber/Computer Olympiad (NCO)\n🧩 Reasoning & Aptitude\n🌍 General Knowledge\n📐 Mental Maths\n\nChoose one or all - it's up to you!"
      }
    },
    {
      id: "how_register",
      type: "message",
      position: { x: 650, y: 450 },
      data: {
        label: "How to Register",
        nodeType: "message",
        message: "Registration is Simple:\n\n1️⃣ Visit samikaranolympiad.com/register\n2️⃣ Enter student details\n3️⃣ Select grade & subjects\n4️⃣ Choose exam date\n5️⃣ Pay online (₹100-500)\n6️⃣ Receive confirmation\n\n⏰ Registrations open now!\n📱 Can register via mobile too"
      }
    },
    {
      id: "faq_info",
      type: "message",
      position: { x: 850, y: 450 },
      data: {
        label: "FAQ",
        nodeType: "message",
        message: "Frequently Asked Questions:\n\n❓ Is it online? Yes, from home!\n❓ Syllabus? Based on CBSE/ICSE\n❓ Duration? 60 minutes\n❓ Results? Within 15 days\n❓ Refund? Yes, before exam date\n❓ Certificate? For all participants\n\nHave more questions? Just ask!"
      }
    },
    {
      id: "interest_check",
      type: "options",
      position: { x: 400, y: 620 },
      data: {
        label: "Interest Check",
        nodeType: "options",
        message: "Would you like to proceed with registration?",
        options: [
          { id: "opt_yes", label: "Yes, Register Now", value: "yes" },
          { id: "opt_student", label: "I'm a Student", value: "student" },
          { id: "opt_parent", label: "I'm a Parent", value: "parent" },
          { id: "opt_later", label: "Maybe Later", value: "later" }
        ]
      }
    },
    {
      id: "redirect_register",
      type: "message",
      position: { x: 200, y: 780 },
      data: {
        label: "Redirect Register",
        nodeType: "message",
        message: "Great choice! You can register at:\n\n🔗 samikaranolympiad.com/register\n\nOr continue chatting, and I'll guide you through the process!"
      }
    },
    {
      id: "maybe_later",
      type: "message",
      position: { x: 600, y: 780 },
      data: {
        label: "Maybe Later",
        nodeType: "message",
        message: "No problem! Take your time to decide. Remember:\n\n• Early bird discounts available\n• Limited seats in some centers\n• Practice materials accessible after registration\n\nFeel free to visit us anytime at samikaranolympiad.com!"
      }
    },
    {
      id: "ai_general_assist",
      type: "aiResponse",
      position: { x: 400, y: 900 },
      data: {
        label: "AI Assistance",
        nodeType: "aiResponse",
        aiPrompt: "Help the visitor understand Samikaran Olympiad. Answer any questions about olympiad exams, benefits, registration, or subjects. Be informative and encouraging. If they show interest, guide them towards registration."
      }
    },
    {
      id: "end_general",
      type: "endChat",
      position: { x: 400, y: 1020 },
      data: {
        label: "End Chat",
        nodeType: "endChat",
        endMessage: "Thank you for exploring Samikaran Olympiad! We hope to see you as a participant soon. Good luck with your learning journey!"
      }
    }
  ];

  const edges: FlowEdge[] = [
    { id: "e1", source: "start_1", target: "general_welcome", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e2", source: "general_welcome", target: "general_options", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e3", source: "general_options", target: "what_olympiad", sourceHandle: "opt_what", type: "smoothstep", animated: true, style: { stroke: "#22c55e" } },
    { id: "e4", source: "general_options", target: "why_participate", sourceHandle: "opt_why", type: "smoothstep", animated: true, style: { stroke: "#22c55e" } },
    { id: "e5", source: "general_options", target: "subjects_info", sourceHandle: "opt_subjects", type: "smoothstep", animated: true, style: { stroke: "#22c55e" } },
    { id: "e6", source: "general_options", target: "how_register", sourceHandle: "opt_how", type: "smoothstep", animated: true, style: { stroke: "#22c55e" } },
    { id: "e7", source: "general_options", target: "faq_info", sourceHandle: "opt_faq", type: "smoothstep", animated: true, style: { stroke: "#22c55e" } },
    { id: "e8", source: "what_olympiad", target: "interest_check", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e9", source: "why_participate", target: "interest_check", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e10", source: "subjects_info", target: "interest_check", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e11", source: "how_register", target: "interest_check", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e12", source: "faq_info", target: "interest_check", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e13", source: "interest_check", target: "redirect_register", sourceHandle: "opt_yes", type: "smoothstep", animated: true, style: { stroke: "#22c55e" } },
    { id: "e14", source: "interest_check", target: "redirect_register", sourceHandle: "opt_student", type: "smoothstep", animated: true, style: { stroke: "#22c55e" } },
    { id: "e15", source: "interest_check", target: "redirect_register", sourceHandle: "opt_parent", type: "smoothstep", animated: true, style: { stroke: "#22c55e" } },
    { id: "e16", source: "interest_check", target: "maybe_later", sourceHandle: "opt_later", type: "smoothstep", animated: true, style: { stroke: "#f59e0b" } },
    { id: "e17", source: "redirect_register", target: "ai_general_assist", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e18", source: "maybe_later", target: "ai_general_assist", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e19", source: "ai_general_assist", target: "end_general", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } }
  ];

  return { nodes, edges };
};

const createSupportHelpFlow = (): { nodes: FlowNode[]; edges: FlowEdge[] } => {
  const nodes: FlowNode[] = [
    {
      id: "start_1",
      type: "start",
      position: { x: 400, y: 50 },
      data: { label: "Start", nodeType: "start" }
    },
    {
      id: "support_welcome",
      type: "message",
      position: { x: 400, y: 150 },
      data: {
        label: "Support Welcome",
        nodeType: "message",
        message: "Hello! I'm here to help you with any issues or questions. Let me know what's bothering you, and I'll do my best to resolve it quickly."
      }
    },
    {
      id: "support_options",
      type: "options",
      position: { x: 400, y: 280 },
      data: {
        label: "Support Options",
        nodeType: "options",
        message: "What do you need help with?",
        options: [
          { id: "opt_payment", label: "Payment Issue", value: "payment" },
          { id: "opt_technical", label: "Technical Problem", value: "technical" },
          { id: "opt_exam", label: "Exam Related", value: "exam" },
          { id: "opt_refund", label: "Refund Request", value: "refund" },
          { id: "opt_human", label: "Talk to Human Agent", value: "human" }
        ]
      }
    },
    {
      id: "payment_help",
      type: "message",
      position: { x: 50, y: 450 },
      data: {
        label: "Payment Help",
        nodeType: "message",
        message: "Payment Troubleshooting:\n\n🔄 If payment failed:\n• Wait 30 mins for auto-refund\n• Check bank statement\n• Retry with different method\n\n📧 If amount deducted but not confirmed:\n• Share transaction ID\n• We'll verify within 24 hours\n\n🧾 For invoice: Check email or download from dashboard"
      }
    },
    {
      id: "collect_payment_issue",
      type: "dataRequest",
      position: { x: 50, y: 620 },
      data: {
        label: "Payment Details",
        nodeType: "dataRequest",
        message: "Please share your payment details:",
        fields: [
          { id: "email", label: "Registered Email", type: "email", required: true },
          { id: "transaction_id", label: "Transaction ID (if available)", type: "text", required: false },
          { id: "amount", label: "Amount Paid", type: "number", required: true }
        ]
      }
    },
    {
      id: "technical_help",
      type: "message",
      position: { x: 250, y: 450 },
      data: {
        label: "Technical Help",
        nodeType: "message",
        message: "Common Technical Solutions:\n\n🖥️ Login issues:\n• Clear browser cache\n• Use Chrome/Firefox\n• Reset password\n\n📱 App not working:\n• Update to latest version\n• Reinstall app\n\n🌐 Slow loading:\n• Check internet connection\n• Disable VPN\n\n📹 Camera/Mic issues:\n• Allow browser permissions\n• Check device settings"
      }
    },
    {
      id: "exam_help",
      type: "message",
      position: { x: 450, y: 450 },
      data: {
        label: "Exam Help",
        nodeType: "message",
        message: "Exam Related Support:\n\n📅 Reschedule exam:\n• Possible up to 48 hours before\n• Login > My Exams > Reschedule\n\n❓ Wrong answer marked:\n• After submission, can't change\n• Review before final submit\n\n📊 Result queries:\n• Results in 15 days\n• Detailed analysis available\n• Contact for discrepancies"
      }
    },
    {
      id: "refund_help",
      type: "message",
      position: { x: 650, y: 450 },
      data: {
        label: "Refund Help",
        nodeType: "message",
        message: "Refund Policy:\n\n✅ Full refund if:\n• Cancelled before exam window\n• Technical issue from our side\n• Duplicate payment\n\n❌ No refund if:\n• Exam already attempted\n• No-show on exam day\n\n⏱️ Processing time: 7-10 business days"
      }
    },
    {
      id: "collect_refund_info",
      type: "dataRequest",
      position: { x: 650, y: 620 },
      data: {
        label: "Refund Details",
        nodeType: "dataRequest",
        message: "For refund request, please provide:",
        fields: [
          { id: "email", label: "Registered Email", type: "email", required: true },
          { id: "order_id", label: "Order ID", type: "text", required: true },
          { id: "reason", label: "Reason for Refund", type: "text", required: true }
        ]
      }
    },
    {
      id: "human_handoff",
      type: "humanHandoff",
      position: { x: 850, y: 450 },
      data: {
        label: "Human Agent",
        nodeType: "humanHandoff",
        handoffReason: "User requested human support",
        message: "I'm connecting you with a human support agent. Please wait while I transfer your chat. Average wait time: 2-3 minutes."
      }
    },
    {
      id: "ai_support_assist",
      type: "aiResponse",
      position: { x: 400, y: 780 },
      data: {
        label: "AI Support",
        nodeType: "aiResponse",
        aiPrompt: "Help resolve the user's support issue. Be empathetic and solution-oriented. If the issue is complex or requires manual intervention, offer to connect them with human support. Always collect relevant details to help resolve faster."
      }
    },
    {
      id: "resolved_check",
      type: "options",
      position: { x: 400, y: 900 },
      data: {
        label: "Resolved Check",
        nodeType: "options",
        message: "Was your issue resolved?",
        options: [
          { id: "opt_resolved", label: "Yes, Thanks!", value: "resolved" },
          { id: "opt_not_resolved", label: "No, Need More Help", value: "not_resolved" }
        ]
      }
    },
    {
      id: "escalate_handoff",
      type: "humanHandoff",
      position: { x: 600, y: 1020 },
      data: {
        label: "Escalate",
        nodeType: "humanHandoff",
        handoffReason: "Issue not resolved, escalating",
        message: "I'm sorry the issue persists. Let me connect you with our senior support team for priority assistance."
      }
    },
    {
      id: "end_support",
      type: "endChat",
      position: { x: 200, y: 1020 },
      data: {
        label: "End Support",
        nodeType: "endChat",
        endMessage: "Glad we could help! If you need anything else, we're just a chat away. Have a great day!"
      }
    }
  ];

  const edges: FlowEdge[] = [
    { id: "e1", source: "start_1", target: "support_welcome", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e2", source: "support_welcome", target: "support_options", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e3", source: "support_options", target: "payment_help", sourceHandle: "opt_payment", type: "smoothstep", animated: true, style: { stroke: "#f59e0b" } },
    { id: "e4", source: "support_options", target: "technical_help", sourceHandle: "opt_technical", type: "smoothstep", animated: true, style: { stroke: "#f59e0b" } },
    { id: "e5", source: "support_options", target: "exam_help", sourceHandle: "opt_exam", type: "smoothstep", animated: true, style: { stroke: "#f59e0b" } },
    { id: "e6", source: "support_options", target: "refund_help", sourceHandle: "opt_refund", type: "smoothstep", animated: true, style: { stroke: "#f59e0b" } },
    { id: "e7", source: "support_options", target: "human_handoff", sourceHandle: "opt_human", type: "smoothstep", animated: true, style: { stroke: "#ef4444" } },
    { id: "e8", source: "payment_help", target: "collect_payment_issue", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e9", source: "collect_payment_issue", target: "ai_support_assist", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e10", source: "technical_help", target: "ai_support_assist", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e11", source: "exam_help", target: "ai_support_assist", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e12", source: "refund_help", target: "collect_refund_info", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e13", source: "collect_refund_info", target: "ai_support_assist", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e14", source: "ai_support_assist", target: "resolved_check", type: "smoothstep", animated: true, style: { stroke: "#6366f1" } },
    { id: "e15", source: "resolved_check", target: "end_support", sourceHandle: "opt_resolved", type: "smoothstep", animated: true, style: { stroke: "#22c55e" } },
    { id: "e16", source: "resolved_check", target: "escalate_handoff", sourceHandle: "opt_not_resolved", type: "smoothstep", animated: true, style: { stroke: "#ef4444" } }
  ];

  return { nodes, edges };
};

export async function seedChatbotFlows() {
  console.log("Starting chatbot flows seeding...");
  
  const existingFlows = await db.select().from(chatbotFlows);
  if (existingFlows.length > 0) {
    console.log(`Chatbot flows already exist (${existingFlows.length} flows found). Skipping seed.`);
    return;
  }

  const flowsToSeed = [
    {
      name: "Main Welcome Flow",
      description: "Primary greeting flow with user type detection menu. Routes visitors to appropriate flows based on their role (student, parent, school, partner, or general visitor).",
      triggerType: "greeting",
      triggerValue: "default",
      status: "active",
      ...createMainWelcomeFlow()
    },
    {
      name: "Student Registration Flow",
      description: "Dedicated flow for students - covers exam registration, schedule, practice tests, results, and support with conversion-focused guidance.",
      triggerType: "keyword",
      triggerValue: "student,register,exam,olympiad",
      status: "active",
      ...createStudentRegistrationFlow()
    },
    {
      name: "Parent/Guardian Flow",
      description: "Flow for parents - handles child enrollment, fee inquiries, progress tracking, benefits explanation, and payment support.",
      triggerType: "keyword",
      triggerValue: "parent,guardian,child,enroll,my kid",
      status: "active",
      ...createParentGuardianFlow()
    },
    {
      name: "School Partnership Flow",
      description: "B2B flow for schools - bulk registration, partnership programs, exam center setup, and teacher training information.",
      triggerType: "keyword",
      triggerValue: "school,institution,bulk,partnership,principal",
      status: "active",
      ...createSchoolPartnershipFlow()
    },
    {
      name: "Partner Referral Flow",
      description: "Flow for potential partners - commission structure, joining process, dashboard access, and callback scheduling.",
      triggerType: "keyword",
      triggerValue: "partner,referral,earn,commission,agent",
      status: "active",
      ...createPartnerReferralFlow()
    },
    {
      name: "General Explorer Flow",
      description: "Educational flow for first-time visitors - explains olympiads, benefits, subjects, registration process, and FAQs.",
      triggerType: "keyword",
      triggerValue: "what,why,how,about,learn",
      status: "active",
      ...createGeneralExplorerFlow()
    },
    {
      name: "Support & Help Flow",
      description: "Comprehensive support flow - payment issues, technical problems, exam queries, refund requests, and human agent handoff.",
      triggerType: "keyword",
      triggerValue: "help,support,issue,problem,refund,payment failed",
      status: "active",
      ...createSupportHelpFlow()
    }
  ];

  for (const flow of flowsToSeed) {
    await db.insert(chatbotFlows).values({
      name: flow.name,
      description: flow.description,
      triggerType: flow.triggerType,
      triggerValue: flow.triggerValue,
      status: flow.status,
      nodes: flow.nodes,
      edges: flow.edges,
      version: 1
    });
    console.log(`Created flow: ${flow.name}`);
  }

  console.log(`Successfully seeded ${flowsToSeed.length} chatbot flows.`);
}
