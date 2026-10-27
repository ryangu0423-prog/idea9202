# Keep the Horses Safe

Sound-responsive classroom installation study for Moore Park / Allianz Stadium Gate 1.

## Run

Node.js 20 or newer, no package installation required:

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

## GitHub Pages

All browser assets use relative paths; the project works under a repository subpath without a build. In repository **Settings → Pages**, select **Deploy from a branch**, branch **main**, folder **/(root)**, and save. GitHub displays the published address after deployment. GitHub API/Pages connectivity is restricted in the onboarding machine, so publication must be confirmed in GitHub.

## Validation

`npm test` covers all six states, boundary hysteresis, short spikes, both one-shot recovery clips, recovery to Alert, and renewed-noise interruption.

Browser validation used Chromium: all eight videos decoded and played, recovery completed in order, three scene switches, manual fallback, baseline collection, labelled simulation, close-up, full screen, and microphone unavailable/denied handling. Microphone acquisition was exercised using a browser synthetic audio device; physical microphone hardware in your browser still needs a live check.

The supplied horse videos and original reference are unchanged. Photorealistic audience composites are generated scene assets.
