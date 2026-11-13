// Thin progress bar at the top of the screen, shown while the next page's code
// is downloading (used as the <Suspense> fallback after the first load).
export default function TopProgress() {
  return (
    <div className="top-progress" role="progressbar" aria-label="Loading page" aria-busy="true">
      <span />
    </div>
  );
}
