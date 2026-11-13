// Real proof for the medical homepage. Each homepage section renders ONLY when
// its list has entries, so an empty list hides the section instead of showing
// placeholder people or numbers. Add only verified, consented data.
//
// faculty:      { name, credentials, subject, photo }  photo = imported image
// testimonials: { quote, name, detail }                detail = "NEET-PG 2026, AIIMS Delhi"
// stats:        { value, label }                       value = "12,400", label = "students enrolled"

const LANDING_PROOF = {
  faculty: [],
  testimonials: [],
  stats: [],
};

export default LANDING_PROOF;
