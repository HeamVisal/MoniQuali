# MonitorCheck — Secondhand Monitor Inspection Guide

MonitorCheck is a free, mobile-friendly checklist for inspecting a **secondhand computer monitor before you buy it**. Open it on your phone at the shop or seller's place, then follow the steps while you test the monitor with your laptop.

> MonitorCheck is **not** a monitor testing application. It explains what to check, links to free external test pages (EIZO Monitor Test, TestUFO), and records your results in an interactive checklist.

## Features

- **10 guided steps**: physical condition, dead/stuck pixels, display quality, resolution & refresh rate, motion, color & text, connectivity, power adapter, stability & temperature, and seller questions.
- **Quick Inspection Mode** (15 essential checks, about 9 minutes) and **Full Inspection Mode** (all 76 checks).
- Every check can be marked **Not tested / Pass / Warning / Fail**, and features a monitor may not have can be marked **N/A**. N/A never counts as a failure.
- **Final recommendation**: PASS, CAUTION, FAIL or INCOMPLETE. Critical failures (screen lines, panel damage, blackouts, severe flicker, electrical safety problems, refresh/resolution not supported) **always** produce FAIL, whatever the overall score.
- **Monitor reference database** with official specifications for the MSI PRO MP251, MP251 E2, MP251W E2, MP242A E2, MP242 E14A, ViewSonic VA240A-H and AOC 24G4. Entries can be edited and you can add your own models. Unknown values are shown as "Unknown", never guessed.
- Progress, notes and monitor details are **saved automatically** in your browser's `localStorage`.
- Copy a plain-text summary, or **Print / Save as PDF** with the browser's print dialog.
- Light and dark themes (dark by default), keyboard accessible, and responsive from 360 px phones up to desktops.
- **Private**: no backend, no accounts, no analytics, no cookies. Nothing you type leaves your device.

## Project structure

```
index.html      Page layout and icon sprite
style.css       All styles (mobile-first, light/dark themes, print styles)
data.js         Inspection content and reference monitor specifications
script.js       App logic: rendering, saving, progress, recommendation
assets/
  favicon.svg
  img/          Original SVG illustrations of defects and the adapter label
README.md
```

There are no build steps and no dependencies. Every path is relative, so the site works from any folder or URL.

## 1. Run the website locally

**Option A: open the file.** Double-click `index.html`, or drag it into your browser.

**Option B: run a local web server** (recommended because it behaves the same as GitHub Pages):

```bash
# from the project folder
python3 -m http.server 8000
```

Then open <http://localhost:8000> in your browser. Press `Ctrl + C` in the terminal to stop the server.

To use it on your phone over the same Wi-Fi, run `python3 -m http.server 8000 --bind 0.0.0.0` and open `http://<your-computer-ip>:8000` on the phone. Saved progress is stored per browser and per address. Progress saved on `localhost` will not appear on the published site.

## 2. Upload the project to a GitHub repository

1. Sign in at <https://github.com> (a free account is enough).
2. Click **+** (top right) → **New repository**.
3. Name it, for example `monitorcheck`, choose **Public**, and click **Create repository**.
4. Upload the files using **one** of these methods:

   **In the browser:** on the new repository page click **uploading an existing file**. Drag in `index.html`, `style.css`, `script.js`, `data.js`, `README.md` and the whole `assets` folder, then click **Commit changes**.

   **With Git on the command line:**

   ```bash
   cd path/to/monitorcheck
   git init
   git add .
   git commit -m "Initial version of MonitorCheck"
   git branch -M main
   git remote add origin https://github.com/<your-username>/monitorcheck.git
   git push -u origin main
   ```

Make sure `index.html` is in the **root** of the repository, not inside a subfolder.

## 3. Enable GitHub Pages

1. In your repository, open **Settings → Pages** (in the left sidebar under "Code and automation").
2. Under **Build and deployment → Source**, choose **Deploy from a branch**.
3. Under **Branch**, select **`main`** and the folder **`/ (root)`**, then click **Save**.

GitHub Pages is free for **public** repositories, so no paid subscription is needed.

## 4. Deploy from the main branch and root directory

After you click Save, GitHub builds and publishes the site automatically from the `main` branch's root folder. This usually takes 1–2 minutes. You can watch the progress in the repository's **Actions** tab ("pages build and deployment").

## 5. Access the published website

When it is ready, **Settings → Pages** shows the link at the top:

```
https://<your-username>.github.io/monitorcheck/
```

Open it on your phone and bookmark it, or use the browser's **Add to Home Screen** option.

## 6. Update the website later

- **In the browser:** open a file in the repository, click the pencil icon (**Edit**), make your change, and click **Commit changes**. To replace files, use **Add file → Upload files**.
- **With Git:**

  ```bash
  git add .
  git commit -m "Describe your change"
  git push
  ```

GitHub Pages republishes automatically after every push to `main`. If you don't see your change, wait a minute and reload with `Ctrl + F5` (or `Cmd + Shift + R` on a Mac) to bypass the browser cache.

### Editing content

- Inspection steps, checks and explanations are in **`data.js`** (`steps` array). Each check has an `id`. Do not rename existing ids after publishing, because saved progress is linked to them.
  - `q: true`: the check is included in Quick Inspection Mode
  - `c: true`: the check is critical (a Fail forces a FAIL recommendation)
  - `na: true`: the check can be marked "Not applicable"
- Reference monitors are in the `models` array of `data.js`. Leave a value as `null` or omit it when the manufacturer does not publish it, and the site will show "Unknown".

## Browser support

Current versions of Chrome, Brave, Edge, Firefox and Safari (desktop and mobile). The site uses only standard HTML, CSS and JavaScript.

## Specification sources

Reference specs were taken from the manufacturers' official pages and datasheets:

- MSI global product datasheets: `https://storage-asset.msi.com/datasheet/pro-monitors/global/<MODEL>.pdf`, plus the MSI product pages
- ViewSonic VA240A-H: <https://www.viewsonic.com/global/products/lcd/VA240A-H>
- AOC 24G4: <https://www.aoc.com/au/gaming/monitors/24g4>

Specifications can differ between regions and revisions. Always confirm on the official page for your country.

## Privacy

MonitorCheck does not collect, store on a server, or transmit any information. All data stays in your browser's `localStorage` and can be cleared at any time with **New inspection** or by clearing site data in your browser.

## Disclaimer

Passing this inspection cannot guarantee future reliability. Some faults only appear after days or weeks of use. Whenever possible, buy with a return or replacement period of at least 7 days (preferably one month).
