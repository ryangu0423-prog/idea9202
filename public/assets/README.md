# Keep the Horses Safe — source assets

Only the three user-supplied backgrounds from upstream commit 9c7e4be are used:

- Passive: `passive.png`
- Individual: `individual mode.png`
- Group: `group mode.png`

All three are 1672 × 941. Preserve these files byte-for-byte, including the existing people, wall artwork and projector. The deployed site must not contain any legacy `scene-*.png` files or fall back to them. `scene-projection.js` maps each mode to its exact uploaded file and stores wall corners and foreground silhouettes in native image pixels. The wall plane clips the projection; matching overlays from that mode's same image restore the foreground columns and, in Group, the two spectators in front of the wall. Resizing and Close-up move all layers together.

horse-1.mp4: Calm
horse-2.mp4: Aware
horse-3.mp4: Alert
horse-4.mp4: Nervous
horse-5.mp4: Distressed
horse-6.mp4: Highly agitated
horse-7.mp4: Recovery from agitation to alert (one-shot)
horse-8.mp4: Recovery from alert to calm (one-shot)
horse-9.mp4: Group-only sustained-severe-noise response; the horse is startled and disperses (one-shot, hold the final frame)
horse-10.mp4: Group-only recovery after the horse has dispersed and sound remains at the quiet threshold (one-shot, then horse-1 calm loop)

Keep the original video files and red dotted artwork. Treat clips 1–6 as state loops and clips 7–10 as one-way transitions. Group uses explicit loop, dispersal-playing, dispersal-hold and recovery-playing stages: after entering Highly agitated, severe noise must persist for 1.2 seconds before clip 9 plays once. The last decoded frame is held after its natural end. Only a continuously Calm target for 2 seconds in the hold stage starts clip 10. Clip 10 returns to the Calm loop when it naturally ends; sustained sound at Nervous or higher for 1 second interrupts it back to the saved hold frame. A new completed recovery clears the stage so later severe noise can trigger clip 9 again. Passive and Individual use clips 7–8 only for matching recovery endpoints; Nervous and Distressed fall directly to the appropriate lower state loop. Clips use their source aspect ratio when drawn. Source animations have white backgrounds; composite their red dotted artwork onto the wall without an opaque rectangular panel.

The projection mutes all source audio tracks locally; the microphone audio path is analyzed separately and is never recorded or uploaded. Clips 1–9 are 1280×720; clip 10 is 1916×1080 with a muted AAC track. Keep source dimensions and encoding unchanged.

Use real browser microphone input with explicit permission, smoothing and hysteresis. Any dB display is an uncalibrated estimate, not measured SPL. Passive / individual / group are manually selected scenarios, not automatic speaker counting.
