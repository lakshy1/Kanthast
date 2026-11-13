// Single source for the Medicine/USMLE plans, shared by the homepage pricing
// section and the subscription page so the two can never quote different
// prices. INR pricing for NEET-PG / INI-CET is undecided (see PRODUCT.md).
// Lectures are still in production, so plan copy promises access to lectures
// as they are released, never a complete library.
const MEDICAL_PLANS = [
  {
    id: "usmle-1y",
    title: "USMLE / Medicine",
    durationLabel: "1 Year Plan",
    durationYears: 1,
    amountUsd: 110,
    priceLabel: "110 USD",
    highlight: false,
    desc: "One year of access to every locked lecture and image in the Medicine library, including lectures as they are released.",
  },
  {
    id: "usmle-2y",
    title: "USMLE / Medicine",
    durationLabel: "2 Year Plan",
    durationYears: 2,
    amountUsd: 200,
    priceLabel: "200 USD",
    highlight: true,
    desc: "$100 a year for two years, $20 less than two 1-year plans. Covers a full preparation cycle, including lectures as they are released.",
  },
];

export default MEDICAL_PLANS;
