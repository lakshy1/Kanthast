import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

// Plain-language policy pages. Every statement describes what the product
// does today (see PRODUCT.md and the backend models); nothing here invents a
// commercial term. Have them reviewed before relying on them legally.
const UPDATED = "29 September 2026";

const DOCS = {
  terms: {
    title: "Terms of Use",
    intro:
      "These terms describe how Kanthast works and what we expect from people who use it. By creating an account you agree to them.",
    sections: [
      {
        heading: "What Kanthast is",
        body: [
          "Kanthast is an online study platform with animated video lectures for NEET-PG, INI-CET and USMLE preparation, and a School track for Class I–X.",
          "The medical syllabus is mapped and lectures are being produced and released subject by subject. The library shows every planned lecture; a lecture can be watched once its video is published.",
        ],
      },
      {
        heading: "Your account",
        body: [
          "You need an account to watch lectures. Keep your password private. Signing in on a new device ends your other active sessions.",
          "You can change your details, sign out other sessions and delete your account from Settings.",
        ],
      },
      {
        heading: "Using the content",
        body: [
          "Lectures, images and summaries are for your personal study. Do not copy, re-upload, resell or share access to them.",
        ],
      },
      {
        heading: "The assistant",
        body: [
          "The Kanthast Assistant uses AI models to answer questions. Its answers can be wrong. It is a study aid, not medical advice, and must never be used to make decisions about a real patient.",
        ],
      },
      {
        heading: "Plans and payments",
        body: [
          "Plan prices are shown on the Pricing section of the homepage. See the Refund Policy for how payments are handled today.",
        ],
      },
      {
        heading: "Changes",
        body: ["If these terms change, the date at the top of this page changes with them."],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    intro: "This page lists the information Kanthast stores, why, and who else processes it.",
    sections: [
      {
        heading: "Information you give us",
        body: [
          "Account details: your name, email address and password (stored only as a one-way hash), your learning track and, for School, your class.",
          "Profile details you choose to add: gender, date of birth, a short bio and a contact number.",
          "Your settings, such as appearance, playback speed and email preferences.",
          "Messages you send to the assistant and files you upload to it, and messages sent through the contact form.",
        ],
      },
      {
        heading: "Information collected when you sign in",
        body: [
          "For each signed-in session: device, browser and operating system, IP address, and the time the session was last active. This lets you see and sign out your sessions from Settings.",
          "If you allow it in your browser, the approximate or precise location of the device for that session.",
        ],
      },
      {
        heading: "Information kept on your device",
        body: [
          "Your sign-in token, settings, watch progress and resume positions are stored in your browser. Watch progress is not currently synced between devices.",
        ],
      },
      {
        heading: "Who processes it",
        body: [
          "The website is hosted on Vercel and the server on Render. Data is stored in MongoDB Atlas.",
          "Emails (one-time codes, password resets and contact replies) are sent through Brevo.",
          "Assistant messages are processed by Google Gemini, with OpenAI as a fallback. Uploaded files are stored on Cloudinary.",
        ],
      },
      {
        heading: "Your choices",
        body: [
          "You can edit your profile, sign out other sessions, and delete your account from Settings. Deleting your account removes your account, profile, sign-in sessions and assistant history from our database.",
          "For any other request about your data, use the Contact page.",
        ],
      },
    ],
  },
  refunds: {
    title: "Refund Policy",
    intro: "How payments and refunds work on Kanthast today.",
    sections: [
      {
        heading: "Payments today",
        body: [
          "Kanthast does not currently charge cards. The checkout on the Subscription page is a demonstration, and no money is taken when a plan is activated there.",
        ],
      },
      {
        heading: "Before paid plans start charging",
        body: [
          "A full refund policy will be published on this page before any real payment is taken.",
          "Questions in the meantime can be sent through the Contact page.",
        ],
      },
    ],
  },
};

export default function Legal({ doc }) {
  const page = DOCS[doc];

  return (
    <div className="min-h-screen bg-surface text-ink">
      <Helmet>
        <title>{`${page.title} | Kanthast`}</title>
      </Helmet>
      <article className="mx-auto max-w-3xl px-6 py-16 md:px-8 md:py-24">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{page.title}</h1>
        <p className="mt-3 text-sm text-ink-subtle">Last updated {UPDATED}</p>
        <p className="mt-6 text-lg leading-relaxed text-ink-muted">{page.intro}</p>

        {page.sections.map((section) => (
          <section key={section.heading} className="mt-12">
            <h2 className="text-2xl font-bold tracking-tight">{section.heading}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph} className="mt-4 leading-relaxed text-ink-muted">
                {paragraph}
              </p>
            ))}
          </section>
        ))}

        <nav aria-label="Policies" className="mt-16 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-6 text-sm">
          <Link to="/terms" className="font-semibold text-brand underline-offset-4 hover:underline">Terms of Use</Link>
          <Link to="/privacy" className="font-semibold text-brand underline-offset-4 hover:underline">Privacy Policy</Link>
          <Link to="/refunds" className="font-semibold text-brand underline-offset-4 hover:underline">Refund Policy</Link>
          <Link to="/contact" className="font-semibold text-brand underline-offset-4 hover:underline">Contact</Link>
        </nav>
      </article>
    </div>
  );
}
