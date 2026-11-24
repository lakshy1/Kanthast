// Single source for the Medicine plans, shared by the homepage pricing section,
// the pricing page and the subscription page so they can never quote different
// prices. One library serves NEET PG, INI CET and USMLE, priced in rupees.
// Lectures are still being released, so plan copy promises access to lectures
// as they are released, never a complete library.
const MEDICAL_PLANS = [
  {
    id: "medicine-1y",
    title: "Medicine library",
    durationLabel: "1 Year Plan",
    durationYears: 1,
    amountInr: 10000,
    priceLabel: "Rs 10,000",
    highlight: false,
    desc: "One year of access to every locked lecture and image in the Medicine library, including lectures as they are released.",
  },
  {
    id: "medicine-2y",
    title: "Medicine library",
    durationLabel: "2 Year Plan",
    durationYears: 2,
    amountInr: 18000,
    priceLabel: "Rs 18,000",
    highlight: true,
    desc: "Rs 9,000 a year for two years, Rs 2,000 less than two 1 year plans. Covers a full preparation cycle, including lectures as they are released.",
  },
];

export default MEDICAL_PLANS;
