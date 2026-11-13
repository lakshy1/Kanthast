// After `vite build`: write dist/<page>.html for each landing sub-page with its
// own <head> (title, description, canonical, Open Graph, Twitter, JSON-LD)
// baked into the HTML, so crawlers see correct tags before any JavaScript runs.
// The React app still renders the page body and keeps the tags in sync.
import { readFileSync, writeFileSync } from "node:fs";

const SITE = "https://kanthast.in";
const base = readFileSync("dist/index.html", "utf8");

const PAGES = [
  {
    file: "about.html",
    path: "/about",
    title: "About Kanthast | Animated lessons that make hard ideas click",
    description:
      "Kanthast teaches through short animated lessons, one idea at a time. Learn why we started, how lessons are made, and our two products: Kanthast Professional and Kanthast School.",
    type: "AboutPage",
    crumb: "About",
  },
  {
    file: "contact.html",
    path: "/contact",
    title: "Contact Kanthast | Questions about Professional or School",
    description:
      "Get in touch with Kanthast about Kanthast Professional, Kanthast School or a partnership. Email support@kanthast.in or send us a message.",
    type: "ContactPage",
    crumb: "Contact",
  },
];

const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const setMeta = (html, attr, key, value) =>
  html.replace(new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")[^"]*(")`), `$1${esc(value)}$2`);

for (const p of PAGES) {
  const url = `${SITE}${p.path}`;
  let html = base;
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(p.title)}</title>`);
  html = setMeta(html, "name", "description", p.description);
  html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`);
  html = setMeta(html, "property", "og:title", p.title);
  html = setMeta(html, "property", "og:description", p.description);
  html = setMeta(html, "property", "og:url", url);
  html = setMeta(html, "name", "twitter:title", p.title);
  html = setMeta(html, "name", "twitter:description", p.description);
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": p.type,
        "@id": `${url}#webpage`,
        url,
        name: p.title.split(" | ")[0],
        description: p.description,
        isPartOf: { "@id": `${SITE}/#website` },
        about: { "@id": `${SITE}/#organization` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Kanthast", item: `${SITE}/` },
          { "@type": "ListItem", position: 2, name: p.crumb, item: url },
        ],
      },
    ],
  };
  html = html.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script type="application/ld+json">${JSON.stringify(ld)}</script>`
  );
  writeFileSync(`dist/${p.file}`, html);
  console.log(`route head: ${p.path} -> dist/${p.file}`);
}
