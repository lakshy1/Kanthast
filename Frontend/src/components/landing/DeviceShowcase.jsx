import React from "react";

// Real MacBook and iPhone cutouts (public/, transparent PNGs). Each device's
// glass is a transparent hole in its PNG — found by flood-filling that hole
// from its center and reading the fill's bounding box (see
// scratchpad/find-transparent-hole.cjs), not eyeballed or colour-thresholded.
//
// Stacking is deliberate: the product screenshot paints first (background),
// the device PNG paints on top of it (foreground). The device art is
// transparent everywhere except the opaque bezel/body/notch, so that opaque
// art always occludes the screenshot around the edges and draws the notch
// and camera island correctly on top, whatever the crop's pixel precision —
// it can't ever draw "through" the frame the way a screenshot-on-top div can.
const MACBOOK_SCREEN = { top: "12.6%", left: "12.24%", right: "12.17%", bottom: "15.63%" };
const IPHONE_SCREEN = { top: "3.12%", left: "8.33%", right: "8.56%", bottom: "3.56%" };

// True circular corners on a non-square crop need independent horizontal and
// vertical radius percentages ("H% / V%" syntax): a single percentage is
// relative to each axis separately, so on a tall rectangle it draws an oval,
// not a circle, and the screenshot's square corner pokes out past the
// phone's actual round corner. Both radii below were measured from the same
// flood-filled hole as the insets above (scratchpad/measure-corner-radius.cjs)
// and converted from an %-of-width circle to this element's own box ratio.
const MACBOOK_RADIUS = "1.47% / 2.32%";
const IPHONE_RADIUS = "14.07% / 6.11%";

// `screen` is either a static image src (string) or live JSX (any real
// product screen component) to render inside the glass — the tour's screens
// are live React, not baked images, so this stays generic.
function Device({ frameSrc, screen, screenAlt, inset, radius, frameAlt, className = "" }) {
  return (
    // `isolate` keeps each device's z-0/z-10 layers in its own stacking
    // context; without it the MacBook frame (z-10) paints over the iPhone's
    // screen (z-0) wherever the two devices overlap.
    <div className={`relative isolate ${className}`}>
      {/* Background layer: the product content, clipped to the screen area. */}
      <div className="absolute z-0 overflow-hidden bg-white" style={{ ...inset, borderRadius: radius }}>
        {typeof screen === "string" ? (
          <img src={screen} alt={screenAlt} className="h-full w-full object-cover object-top" />
        ) : (
          <div className="h-full w-full overflow-hidden">{screen}</div>
        )}
      </div>
      {/* Foreground layer: the device art. Transparent over the screen (so the
          content shows through), opaque everywhere else (bezel, hinge,
          notch/camera island), so it always sits visually on top. */}
      <img
        src={frameSrc}
        alt={frameAlt}
        className="relative z-10 block w-full select-none"
        draggable="false"
      />
    </div>
  );
}

/**
 * A MacBook frame around live product content (not a baked screenshot),
 * for placements — like the scroll-driven Product Tour — that need the
 * screen area to keep behaving like a normal DOM region (e.g. so an
 * ancestor's clip-path wipe animation still applies to the visible frame).
 */
export function MacbookFrame({ children, alt = "", className = "" }) {
  return (
    <Device
      frameSrc="/Macbook transparent.png"
      frameAlt={alt}
      screen={children}
      inset={MACBOOK_SCREEN}
      radius={MACBOOK_RADIUS}
      className={className}
    />
  );
}

/**
 * MacBook with the iPhone overlapping its right edge, placed to match the
 * approved hero mockup: the phone's visible body starts at 80.6% of the
 * laptop's visible width, its top sits 26.7% down the laptop, and its bottom
 * hangs below the laptop base. Percentages are of the MacBook PNG box.
 */
export default function DeviceShowcase({ desktopSrc, mobileSrc, desktopAlt, mobileAlt, className = "" }) {
  return (
    <div className={`relative w-full drop-shadow-[0_30px_50px_rgba(3,8,18,0.55)] ${className}`}>
      <Device
        frameSrc="/Macbook transparent.png"
        frameAlt={desktopAlt}
        screen={desktopSrc}
        screenAlt=""
        inset={MACBOOK_SCREEN}
        radius={MACBOOK_RADIUS}
      />
      <div className="absolute" style={{ left: "78.3%", top: "32.3%", width: "26.3%" }}>
        <Device
          frameSrc="/Iphone transparent.png"
          frameAlt={mobileAlt}
          screen={mobileSrc}
          screenAlt=""
          inset={IPHONE_SCREEN}
          radius={IPHONE_RADIUS}
        />
      </div>
    </div>
  );
}
