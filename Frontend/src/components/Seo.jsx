import { Helmet } from "react-helmet-async";

import { SITE_URL } from "../utils/seo";

const DEFAULT_IMAGE = `${SITE_URL}/Banner.png`;

/**
 * One place for every page's search and share tags, so titles, canonical
 * URLs, Open Graph and Twitter cards never drift apart between pages.
 * `jsonLd` takes one schema.org object or an array of them.
 */
export default function Seo({ title, description, path = "/", image = DEFAULT_IMAGE, jsonLd, noindex = false }) {
  const url = `${SITE_URL}${path}`;
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, follow" />}

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Kanthast" />
      <meta property="og:locale" content="en_IN" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {blocks.map((block, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify({ "@context": "https://schema.org", ...block })}
        </script>
      ))}
    </Helmet>
  );
}
