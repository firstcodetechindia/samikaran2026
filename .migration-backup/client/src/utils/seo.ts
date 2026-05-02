const BASE_URL = "https://www.samikaranolympiad.com";
const SITE_NAME = "Samikaran Olympiad";
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;
const TWITTER_HANDLE = "@SamikaranOlympiad";

export { BASE_URL, SITE_NAME, DEFAULT_IMAGE, TWITTER_HANDLE };

export function buildPageTitle(pageTitle: string): string {
  return `${pageTitle} | ${SITE_NAME}`;
}

export function buildCanonical(path: string): string {
  return `${BASE_URL}${path}`;
}

export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": SITE_NAME,
    "url": BASE_URL,
    "logo": `${BASE_URL}/favicon.png`,
    "description": "India's #1 AI-powered online olympiad examination platform for students from Class 1 to 12.",
    "sameAs": [
      "https://www.facebook.com/samikaranolympiad",
      "https://twitter.com/SamikaranOlympiad",
      "https://www.instagram.com/samikaranolympiad",
      "https://www.youtube.com/@samikaranolympiad"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "availableLanguage": ["English", "Hindi"],
      "email": "support@samikaranolympiad.com"
    },
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "IN"
    }
  };
}

export function buildWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": SITE_NAME,
    "url": BASE_URL,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${BASE_URL}/olympiads?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };
}

export function buildEducationalOrgSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": SITE_NAME,
    "url": BASE_URL,
    "description": "AI-powered global Olympiad examination platform offering Science, Math, English, Reasoning and General Knowledge olympiads for students from Class 1 to 12.",
    "areaServed": ["India", "United Kingdom", "Singapore", "UAE"],
    "educationalCredentialAwarded": [
      "Certificate of Excellence",
      "Letter of Recommendation",
      "Cash Prizes",
      "Scholarships"
    ]
  };
}

export function buildBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}

export function buildArticleSchema(options: {
  title: string;
  description: string;
  url: string;
  image: string;
  datePublished: string;
  dateModified: string;
  authorName?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": options.title,
    "description": options.description,
    "url": options.url,
    "image": options.image,
    "datePublished": options.datePublished,
    "dateModified": options.dateModified,
    "author": {
      "@type": "Organization",
      "name": options.authorName ?? SITE_NAME
    },
    "publisher": {
      "@type": "Organization",
      "name": SITE_NAME,
      "logo": {
        "@type": "ImageObject",
        "url": `${BASE_URL}/favicon.png`
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": options.url
    }
  };
}

export function buildFaqSchema(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a
      }
    }))
  };
}

export function buildEventSchema(options: {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  url: string;
  price: number | string;
  priceCurrency?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": options.name,
    "description": options.description,
    "startDate": options.startDate,
    "endDate": options.endDate,
    "url": options.url,
    "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
    "eventStatus": "https://schema.org/EventScheduled",
    "location": {
      "@type": "VirtualLocation",
      "url": options.url
    },
    "organizer": {
      "@type": "Organization",
      "name": SITE_NAME,
      "url": BASE_URL
    },
    "offers": {
      "@type": "Offer",
      "price": options.price,
      "priceCurrency": options.priceCurrency ?? "INR",
      "availability": "https://schema.org/InStock",
      "url": options.url
    },
    "image": DEFAULT_IMAGE
  };
}
