// aux-prompts.mjs — shared visual canon for Chronoscope image generation.
//
// AUX_DESIGN and LAB_SCENE are prepended to lab-phase prompts via the
// `--preset lab` flag on aux-image.mjs. Keeping them here as the single
// source of truth so the probe and the lab look consistent across every
// generated image. The narrative versions live on the program page
// (src/content/art/the-chronoscope-program.md) — these are the tighter,
// visual-only versions tuned for the image model.

export const AUX_DESIGN = `
PROBE DESIGN — XR-Auspex-001 ("Aux"):

A hovering observation drone, roughly basketball-sized, slightly flattened
sphere. Cyberdeck-prototype aesthetic — bespoke, otherworldly, deliberately
ugly, durable rather than sleek. Every feature is machined or 3D-printed
hardware that the team built themselves. NO fragile parts: no thin
protruding wires, no whippy antennas, no exposed delicate elements. If it
sticks out from the hull, it is short, armored, and ridged.

CRITICAL — the probe must NOT read as a face or a head. NO eye-pair, NO
symmetric round optics on the front.

Shell composition: paneled construction, multiple surface finishes mixed
panel-to-panel. Base is non-reflective matte-black ablative composite.
Some panels are darker satin black, a couple are olive-drab textured
material, one or two are dark brushed aluminum or oxidized brass — giving
a patchwork industrial look. Panel seams trace IRREGULAR geometric
patterns, not a uniform grid. Each panel ringed by visible hex-head bolt
arrays. The upper hemisphere has a faint hexagonal adaptive-camo tile
field, tiles slightly different shades neighbor-to-neighbor, mottled and
alive even when "off."

Optics: a single recessed multi-aperture sensor pod on the upper-front-
RIGHT quadrant (off-center). Inside the pod, behind flush smoked-glass,
three small dark lens elements of varying size in an irregular triangular
cluster. Clearly an instrument cluster, not eyes. The pod is one feature
among many, not the dominant front feature.

Front face: center dominated by a hex-bolted access hatch with a small
embossed plate (text unreadable, just shapes). Small flush comm-antenna
ports near the equator (FLUSH, not protruding). A recessed grab-handle on
the lower front. Multiple panel seams of varied geometry.

Equator: six small gimbal-mounted thruster vents evenly spaced, each
recessed into a small armored housing with a shaped grill cover.

Upper hemisphere: one short stubby armored antenna HOUSING on the dorsal
surface — a ridged cylindrical block roughly 2 cm tall, not a thin whip.
A second smaller antenna housing offset asymmetrically beside it.
Recessed vent slits across the upper rear quadrant.

Underside: a small recessed pinpoint spotlight near the forward edge.
Three folding landing-foot bays (currently retracted, only panel seams
visible). A downward-facing landing-array sensor slightly recessed at
the center.

Surface details: small embossed legend markings near features (text
illegible, just shapes), an etched serial-number plate on one panel,
tiny pinpoint LED holes in clusters of 2-3 (unlit), a small radioisotope
trefoil decal on the lower aft hull, occasional mismatched repair plates
where an engineering retrofit happened. Bolt heads vary in head style
(some hex, some torx) suggesting field repairs.

Overall: alien-feeling industrial hardware that has been through testing.
A cyberdeck-style instrument built for survival, patched in the field,
slightly menacing in its functional-ugliness. NOT a mascot. NOT sleek.
NOT a face.
`.trim()

export const LAB_SCENE = `
LAB SETTING — The Chronoscope program prototype facility, mid-2020s:
A working, lived-in lab — not staged, not clean. Concrete floor with
painted yellow guideline markings, scuff marks, occasional rubber-tire
streaks. Olive-green or dingy beige institutional walls, paint peeling at
the corners. Overhead fluorescent strip lighting throws a slightly
greenish cool cast into the shadows.

The room is in active use. Visible in the background or middle distance:
two or three lab technicians wearing matching charcoal-grey jumpsuits or
slightly-worn lab coats. Faces softened, partly out of frame, or covered
with thin black redaction bars; ID badges on lanyards pixelated. One tech
might be at a workbench with a soldering iron, another at a CRT-and-LCD
monitor stack, another walking through the background carrying a part.

Equipment clutter: open red tool chests, coiled cables snaking across the
floor, rack-mounted electronics on rolling carts, oscilloscopes with
illegible waveform displays, a tall pegboard wall hung with tools, a
corkboard with pinned schematic printouts (text blurred), three-ring
binders open on counters, coffee mugs leaving rings on surfaces, a dented
metal trash bin with crumpled paper. Lab coats hung on hooks. A bank of
CRT-and-LCD monitor stacks along one wall showing blurred technical
readouts.

The aesthetic is "real prototype shop in a windowless basement," not
"Apple product launch."
`.trim()

export const DOCUMENT_AESTHETIC = `
IMAGE TREATMENT — leaked/archive look:
The photograph has been printed on office paper and then re-scanned at
low resolution. Visible halftone dot pattern, slight skew rotation as if
placed crookedly on the scanner glass, white paper margin along one or
two edges, faint photocopier-fold crease across the lower third or in a
visible band, a small piece of yellowed tape at one corner. Cool
fluorescent overhead lighting in the scene; greenish cast in the
shadows.

Composition feels like someone took the picture quickly with a
phone-camera in an environment where photography was not encouraged,
printed it for a closed briefing, and the print was later scanned for
inclusion in the archive by someone who didn't care about alignment.

Slightly off-axis framing. Phone-camera grain in the original capture.
NO press-photography composition, NO crisp studio lighting, NO clean
product shot.
`.trim()

export const PRESETS = {
  lab: [AUX_DESIGN, LAB_SCENE, DOCUMENT_AESTHETIC],
}
