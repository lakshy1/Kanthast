// Shared SEO constants and schema.org builders, used with components/Seo.jsx.
export const SITE_URL = "https://kanthast.in";
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;

/** schema.org FAQPage from [{ q, a }] pairs that are shown on the page. */
export function faqSchema(items) {
  return {
    "@type": "FAQPage",
    mainEntity: items.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

/** schema.org BreadcrumbList from [{ name, path }]. */
export function breadcrumbSchema(trail) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map(({ name, path }, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name,
      item: `${SITE_URL}${path}`,
    })),
  };
}
