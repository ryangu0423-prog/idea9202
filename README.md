# Keep the Horses Safe

Sound-responsive classroom installation study for Moore Park / Allianz Stadium Gate 1.

## Run

Node.js 22 or 24, no package installation required:

```sh
npm run check
npm test
npm run dev
```

The server uses port 3000 (override with `PORT`). Microphone input requires HTTPS or a browser's trusted local development origin. No audio is recorded, stored or uploaded.

## Present and record

- Select Passive, Individual or Group manually. These are photographic audience composites; people are not detected or counted through the microphone.
- Click **Enable microphone**, grant access, then open **Settings** to set a two-second quiet baseline and sensitivity.
- Without microphone access, use **Settings → Manual sound level**. The input label always identifies manual, live or simulated input.
- **Start simulated demonstration** cycles from quiet to loud and back; it is explicitly labelled **Simulated demonstration**.
- Use **Close-up** to inspect the projection on the wall, and **Full screen** for presentation.
- Estimated dB uses an arbitrary offset from digital amplitude. It is uncalibrated and is not dB SPL. Baseline and sensitivity adjust the horse's response, not physical sound calibration.

The meter responds quickly. The horse uses additional smoothing, hysteresis and sustained dwell. Clips 1–6 loop; quiet after a high state plays 7 to Alert, then 8 to Calm when appropriate. Renewed sustained noise can interrupt recovery. Lower-volume feedback appears before the recovery clip starts.

## Download and run on a Mac

The repository stays private. Sign in to GitHub with an account that can access this repository, then use **Code → Download ZIP** (or https://github.com/ryangu0423-prog/idea9202/archive/refs/heads/main.zip). The ZIP includes the complete project, all eight source videos, reference scene, three audience composites and screenshots. Extract it in Downloads.

1. Install the current Node.js LTS release for macOS from https://nodejs.org/ (Node.js 22 or 24 recommended).
2. In Terminal, run:

   ```sh
   cd ~/Downloads/idea9202-main
   node --version
   npm run check
   npm test
   npm run dev
   ```

3. On that same Mac, open http://localhost:3000 in Chrome or Safari. This is your own Mac's server, not a cloud address. Keep Terminal open while presenting; press Control-C to stop.
4. Click **Enable microphone** and allow access. On macOS, allow your browser under **System Settings → Privacy & Security → Microphone** if needed. Under Settings, set a quiet baseline or use the manual slider. If macOS/browser permission was changed, reload and enable the microphone again.
5. If port 3000 is occupied, use `PORT=3002 npm run dev` and open http://localhost:3002 instead.

No `npm install`, API keys, cloud services or hosting account is needed. Open the app through the local server rather than double-clicking `index.html`, because browser modules and microphone access require a suitable origin.

This cloud environment does not provide an externally accessible preview endpoint. GitHub Pages is not used; do not change repository visibility or enable Pages to run this project.

## Validation

`npm test` covers all six states, boundary hysteresis, short spikes, both one-shot recovery clips, recovery to Alert, and renewed-noise interruption.

Browser validation used Chromium: all eight videos decoded and played, recovery completed in order, three scene switches, manual fallback, baseline collection, labelled simulation, close-up, full screen, and microphone unavailable/denied handling. Microphone acquisition was exercised using a browser synthetic audio device; physical microphone hardware in your browser still needs a live check.

The supplied horse videos and original reference are unchanged. Photorealistic audience composites are generated scene assets.
