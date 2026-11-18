/* MonitorCheck — inspection content and reference data.
 * Everything here is static text. No data is fetched from or sent to any server.
 *
 * Check fields:
 *   id    unique key (used for saved progress — do not rename once published)
 *   t     title
 *   q     true = included in Quick Inspection Mode
 *   c     true = critical: a "Fail" here makes the final verdict FAIL, whatever the score
 *   na    true = the item may be marked "Not applicable" (feature not supported / not included)
 *   sec   estimated seconds the check takes
 *   note  "always" = always show the notes box (used for seller answers)
 *   Guidance: what, how, ok (normal), bad (unacceptable), why
 *   Defect fields (Step 3): img, def, sev, accept, rec
 */
'use strict';

window.MC_DATA = (function () {
  const LINKS = {
    eizo: { url: 'https://www.eizo.eu/monitor-test/', label: 'EIZO Monitor Test', desc: 'Free full-screen test patterns: solid colors, gradients, uniformity and more.' },
    ufo: { url: 'https://www.testufo.com/', label: 'TestUFO — Refresh rate', desc: 'Shows the refresh rate your browser is actually running at on this screen.' },
    ufoGhost: { url: 'https://www.testufo.com/ghosting', label: 'TestUFO — Ghosting', desc: 'Moving UFOs for checking motion blur, ghosting and overdrive halos.' },
    ufoSkip: { url: 'https://www.testufo.com/frameskipping', label: 'TestUFO — Frame skipping', desc: 'Optional: checks that no frames are skipped at a high refresh rate.' }
  };

  const steps = [
    /* ---------------------------------------------------------------- 1 */
    {
      id: 'physical', num: 1, title: 'Physical condition', icon: 'search', time: '3 min',
      intro: 'Before you plug anything in, look at the monitor itself. Damage on the outside often explains problems on the inside. Use your phone flashlight.',
      checks: [
        { id: 'phys-model', t: 'Verify the exact model number', q: true, sec: 30,
          what: 'The model name on the label on the back of the monitor (and on the box, if there is one).',
          how: 'Find the sticker on the back panel or under the stand. Compare the full model name, letter by letter, with the advert. If the monitor is on, open the on-screen menu (OSD) — many monitors show the model in an "Information" page.',
          ok: 'The label matches the advert exactly, including any suffix such as "E2", "W", or "E14A".',
          bad: 'A different suffix, a missing or unreadable label, or a label that looks peeled off and re-attached.',
          why: 'Similar names can mean very different monitors. For example, the MSI PRO MP251 is 100 Hz with HDMI and VGA only, while the PRO MP251 E2 is 120 Hz and adds DisplayPort. You could pay for a better model than you get.' },
        { id: 'phys-date', t: 'Check the manufacturing date', sec: 15,
          what: 'The manufacturing date (often written as "Manufactured", "MFG" or a year/month code) on the rear label.',
          how: 'Read the date on the sticker and compare it with when the seller says they bought it.',
          ok: 'The date is a little earlier than the seller\'s purchase date and matches their story.',
          bad: 'The monitor is much older than claimed, or the date is missing.',
          why: 'Age affects backlight wear. When there is no receipt, some manufacturers use the production date or serial number to decide whether a monitor is still under warranty.' },
        { id: 'phys-scratches', t: 'Inspect the screen for scratches', q: true, sec: 30,
          what: 'The screen surface (the matte anti-glare coating).',
          how: 'With the screen off, hold your phone flashlight at a low angle and sweep across the screen. Later, check again on white and dark backgrounds.',
          ok: 'No marks, or tiny hairline marks that are invisible when the screen is on.',
          bad: 'Scratches you can see while using the monitor, especially near the center, or shiny patches where the coating was rubbed off.',
          why: 'The anti-glare coating cannot be repaired. Deep scratches stay visible forever.' },
        { id: 'phys-cracks', t: 'Inspect for cracks and dents in the panel', q: true, c: true, sec: 30,
          what: 'The screen and its edges.',
          how: 'Look closely at the whole screen and along the edges. Run a finger gently along the bezel (the frame), never press on the screen itself.',
          ok: 'No cracks, no impact points, no dents.',
          bad: 'Any crack (including thin "spider web" lines), an impact point, or a dent in the screen.',
          why: 'A cracked panel cannot be fixed economically. Cracks spread and cause lines, dark spots and dead areas.' },
        { id: 'phys-frame', t: 'Inspect the frame and corners', sec: 20,
          what: 'The plastic frame, the four corners and the back cover.',
          how: 'Look at every corner and along the seams. Check that the gap between the frame and screen is even all around.',
          ok: 'Light wear or small scuffs only. Even gaps.',
          bad: 'Cracked plastic, bent or crushed corners, or a frame that is lifting away from the screen.',
          why: 'Crushed corners usually mean the monitor was dropped. A drop can cause hidden panel damage that appears later.' },
        { id: 'phys-repair', t: 'Look for signs of repair or disassembly', sec: 30,
          what: 'Screws, seams and stickers on the back of the monitor.',
          how: 'Check for scratched or stripped screw heads, missing screws, pry marks along the seams, broken clips, or parts that look like they came from another monitor.',
          ok: 'Factory screws in place, clean seams, no tool marks.',
          bad: 'Tool marks, missing screws, broken clips, or mismatched parts.',
          why: 'Someone opened it for a reason — usually a fault. A previous repair can also void the manufacturer warranty.' },
        { id: 'phys-stand', t: 'Check the stand and mounting points', sec: 30,
          what: 'The stand, its hinge, and the VESA screw holes on the back.',
          how: 'Attach the stand. Tilt the screen through its full range and check that it stays where you leave it. Look inside the VESA holes for damaged threads.',
          ok: 'The stand is firm, holds its position and does not wobble much.',
          bad: 'Cracked stand or hinge, a screen that droops on its own, or stripped VESA threads.',
          why: 'Original replacement stands are often hard to find for budget monitors.' },
        { id: 'phys-ports', t: 'Inspect HDMI, DisplayPort and power connectors', sec: 40,
          what: 'Every port on the back: HDMI, DisplayPort, VGA, audio and the power input.',
          how: 'Shine your flashlight into each port. Plug a cable in — it should fit snugly and not wiggle.',
          ok: 'Straight pins, clean contacts, firm fit.',
          bad: 'Bent or missing pins, a loose or wobbly port, brown/black burn marks, or green corrosion.',
          why: 'Loose ports cause the picture to cut out. Burn marks point to an electrical problem — do not buy.' },
        { id: 'phys-buttons', t: 'Check the physical buttons', sec: 30,
          what: 'The power button and the menu buttons or joystick.',
          how: 'Press every button. Open the on-screen menu and move through it.',
          ok: 'Every button clicks and responds once per press.',
          bad: 'Stuck or unresponsive buttons, buttons that trigger the wrong action, or a power button that needs several presses.',
          why: 'Without working buttons you cannot change inputs, brightness or settings.' }
      ]
    },

    /* ---------------------------------------------------------------- 2 */
    {
      id: 'pixels', num: 2, title: 'Dead and stuck pixel inspection', icon: 'grid', time: '5 min',
      intro: 'A pixel is one tiny dot on the screen. Each pixel has three sub-pixels: red, green and blue. Faulty pixels are easiest to find on solid-color screens.',
      links: ['eizo'],
      guide: `
        <h4>How to run the test</h4>
        <ol class="steps-list">
          <li><strong>Connect the monitor</strong> to your laptop with HDMI or DisplayPort.</li>
          <li><strong>Open the testing website</strong> (EIZO Monitor Test, above) and drag the browser window onto the external monitor.</li>
          <li><strong>Enter full-screen mode</strong> — use the site's full-screen option or press <kbd>F11</kbd> (on a Mac: <kbd>Ctrl</kbd>+<kbd>⌘</kbd>+<kbd>F</kbd>).</li>
          <li><strong>Show white, black, red, green and blue</strong> backgrounds one after another.</li>
          <li><strong>Inspect every part of the screen</strong> on each color: go slowly from left to right, top to bottom. Your phone camera zoom works as a magnifier.</li>
        </ol>
        <p class="tip"><strong>Tip:</strong> clean the screen first. Dust looks like a dead pixel, but it moves or disappears when you wipe it with a soft cloth.</p>
        <h4>What faulty pixels look like</h4>
        <div class="figure-grid">
          <figure><img src="assets/img/dead-pixel.svg" alt="Illustration of a dead pixel: a black dot on a white screen" loading="lazy" width="320" height="200"><figcaption><strong>Dead pixel</strong> — always black. Easiest to see on <em>white</em>.</figcaption></figure>
          <figure><img src="assets/img/stuck-pixel.svg" alt="Illustration of a stuck pixel: a red dot that stays red" loading="lazy" width="320" height="200"><figcaption><strong>Stuck pixel</strong> — stuck on one color (red, green or blue). Shows on most backgrounds.</figcaption></figure>
          <figure><img src="assets/img/bright-pixel.svg" alt="Illustration of a bright pixel: a white dot on a black screen" loading="lazy" width="320" height="200"><figcaption><strong>Bright pixel</strong> — always lit (white). Very visible on <em>black</em>.</figcaption></figure>
          <figure><img src="assets/img/pixel-cluster.svg" alt="Illustration of a pixel cluster: several faulty pixels together" loading="lazy" width="320" height="200"><figcaption><strong>Pixel cluster</strong> — several faulty pixels side by side. Usually more noticeable.</figcaption></figure>
        </div>
        <div class="callout info"><strong>How to mark the results:</strong> <span class="pill pass">Pass</span> no faulty pixels. <span class="pill warn">Warning</span> one dead or stuck pixel near an edge. <span class="pill fail">Fail</span> a bright pixel near the center, a cluster, or several faulty pixels. Stuck pixels sometimes recover, but never buy assuming they will.</div>`,
      checks: [
        { id: 'pix-white', t: 'White background', q: true, sec: 50,
          how: 'Full-screen white. Look for black or colored dots.', ok: 'Perfectly even white with no dots.', bad: 'Black dots (dead pixels) or colored dots (stuck pixels).', why: 'White reveals dead pixels best.' },
        { id: 'pix-black', t: 'Black background', q: true, sec: 50,
          how: 'Full-screen black. Look for white or colored dots that stay lit.', ok: 'No lit dots. (Glow at the corners is checked in Step 3.)', bad: 'White or colored dots (bright or stuck pixels).', why: 'Black reveals bright and stuck pixels best — the most annoying kind.' },
        { id: 'pix-red', t: 'Red background', q: true, sec: 40,
          how: 'Full-screen red. Look for black, green, blue or white dots.', ok: 'Even red with no odd dots.', bad: 'Any dot that is not red.', why: 'Reveals green or blue sub-pixels that are stuck, and dead red sub-pixels.' },
        { id: 'pix-green', t: 'Green background', q: true, sec: 40,
          how: 'Full-screen green. Look for black, red, blue or white dots.', ok: 'Even green with no odd dots.', bad: 'Any dot that is not green.', why: 'Reveals red or blue sub-pixels that are stuck, and dead green sub-pixels.' },
        { id: 'pix-blue', t: 'Blue background', q: true, sec: 40,
          how: 'Full-screen blue. Look for black, red, green or white dots.', ok: 'Even blue with no odd dots.', bad: 'Any dot that is not blue.', why: 'Reveals red or green sub-pixels that are stuck, and dead blue sub-pixels.' }
      ]
    },

    /* ---------------------------------------------------------------- 3 */
    {
      id: 'quality', num: 3, title: 'Display quality inspection', icon: 'sun', time: '5 min',
      intro: 'Use the solid-color, gray and gradient patterns from the EIZO test. Check black screens in a dim spot if you can — shop lights hide backlight problems.',
      links: ['eizo'],
      guide: `
        <div class="callout info"><strong>Normal vs. not acceptable:</strong> slight IPS glow in the corners is <strong>normal</strong> on IPS monitors and is not a defect. Severe discoloration, any lines across the screen, and flickering that does not go away are <strong>not acceptable</strong>.</div>
        <p class="muted small">Before judging the picture, reset the monitor to factory settings in its on-screen menu — the previous owner may have changed colors or brightness.</p>`,
      checks: [
        { id: 'q-bleed', t: 'Backlight bleeding', img: 'backlight-bleed', sev: 'medium', sec: 30,
          def: 'Light leaking from the edges or corners of the screen. It looks like bright patches on a black picture.',
          how: 'Show full-screen black at about 50% brightness. Look straight at the screen from your normal distance. Then move your head left and right: bleed stays the same shape and color.',
          accept: 'Slight bleed visible only on a black screen in a dark room is common and usually acceptable.',
          rec: 'Small edge bleed: acceptable or negotiate. Large bright patches visible in dark movies or games: avoid.' },
        { id: 'q-glow', t: 'IPS glow', img: 'ips-glow', sev: 'low', sec: 20,
          def: 'A soft silver, purple or yellow glow in the corners of IPS screens when showing dark content.',
          how: 'Same black screen. Move your head: IPS glow gets stronger or weaker and changes color as your viewing angle changes. Step back — it usually fades.',
          accept: 'Normal for IPS panels. Not a defect.',
          rec: 'Do not reject a monitor for normal IPS glow. Mark Warning only if it is unusually strong from a normal sitting position.' },
        { id: 'q-uniform', t: 'Uneven brightness', img: 'uneven-brightness', sev: 'medium', sec: 30,
          def: 'Some areas of the screen are darker or brighter than others, looking cloudy or patchy.',
          how: 'Show full-screen white, then 50% gray. Look at the whole screen from your normal distance.',
          accept: 'Small differences you have to search for are normal on budget monitors.',
          rec: 'Clearly darker sides or clouds visible on gray: negotiate. Strong, distracting patches: avoid.' },
        { id: 'q-discolor', t: 'Yellow or pink discoloration', img: 'discoloration', sev: 'high', c: true, q: true, sec: 30,
          def: 'Patches of yellow, pink or green tint on white or gray. Often caused by heat, age or pressure.',
          how: 'Show full-screen white and light gray. Look along the edges and corners for tinted areas.',
          accept: 'A whole screen that is slightly warm or cool can be fixed in settings. Tinted patches cannot.',
          rec: 'Slight patch: Warning, negotiate. Severe or obvious patches: Fail — do not buy.' },
        { id: 'q-vlines', t: 'Vertical lines', img: 'vertical-lines', sev: 'critical', c: true, q: true, sec: 30,
          def: 'Thin lines (one pixel or wider) running from top to bottom that never move.',
          how: 'Check every solid color and a gradient. If you see a line, try another cable and port — if the line stays, the panel is faulty.',
          accept: 'Never acceptable.',
          rec: 'Do not buy. Lines usually get worse over time.' },
        { id: 'q-hlines', t: 'Horizontal lines', img: 'horizontal-lines', sev: 'critical', c: true, q: true, sec: 30,
          def: 'Lines or bands running from left to right that never move.',
          how: 'Same as vertical lines: check all solid colors and a gradient, then swap cable and port.',
          accept: 'Never acceptable.',
          rec: 'Do not buy.' },
        { id: 'q-retention', t: 'Image retention', img: 'image-retention', sev: 'low', sec: 60,
          def: 'A faint "ghost" of an image that was on screen before.',
          how: 'Leave a static, high-contrast window (for example white text on black) on screen for 2–3 minutes, then switch to full-screen 50% gray. Look for a faint outline.',
          accept: 'Faint retention that disappears within a few minutes is normal on some LCDs.',
          rec: 'Fades quickly: acceptable. A ghost that stays clearly visible for a long time: avoid.' },
        { id: 'q-flicker', t: 'Flickering', img: 'flickering', sev: 'critical', c: true, sec: 60,
          def: 'The brightness pulses, shimmers or flashes instead of staying steady.',
          how: 'Look at a white screen at high, medium and low brightness. Flicker often shows at low brightness. A phone camera may show rolling bands; bands on camera alone are not proof — what you can see with your own eyes matters most.',
          accept: 'Visible flickering is not acceptable.',
          rec: 'Persistent or severe flicker: Fail — do not buy. Very faint flicker only at the lowest brightness: Warning.' },
        { id: 'q-dark', t: 'Dark patches', img: 'dark-patches', sev: 'high', sec: 30,
          def: 'Dim spots or areas on a bright screen, often from a failing backlight LED or damage behind the panel.',
          how: 'Show full-screen white. Look for dim spots, especially along the bottom edge.',
          accept: 'Not acceptable if you can see them in normal use.',
          rec: 'Avoid. A failing backlight usually gets worse.' },
        { id: 'q-pressure', t: 'Pressure damage', img: 'pressure-damage', sev: 'critical', c: true, sec: 30,
          def: 'Blotchy or rippled spots, sometimes with rainbow edges, where the panel was pressed or hit.',
          how: 'Show full-screen gray and white. Look for blotches, especially in the middle of the screen. Do not press on the screen to test.',
          accept: 'Not acceptable — it is physical panel damage.',
          rec: 'Do not buy.' },
        { id: 'q-banding', t: 'Color banding', img: 'color-banding', sev: 'low', sec: 30,
          def: 'A smooth gradient shows visible steps or stripes instead of a smooth blend.',
          how: 'Open the gradient patterns on the EIZO test. Look at gray and colored gradients.',
          accept: 'Slight banding is normal on many budget panels and can also be caused by software, color profiles or compressed video.',
          rec: 'Slight: acceptable. Strong, blocky steps on a simple gray gradient: Warning, check with another computer.' }
      ]
    },

    /* ---------------------------------------------------------------- 4 */
    {
      id: 'resolution', num: 4, title: 'Resolution and refresh rate', icon: 'gauge', time: '3 min',
      intro: 'Check that the computer can actually run the monitor at its advertised resolution and refresh rate.',
      links: ['ufo'],
      guide: `
        <div id="ref-expected" class="callout info" hidden></div>
        <div class="os-tabs" data-tabs>
          <div class="tab-list" role="tablist" aria-label="Operating system">
            <button role="tab" id="tab-ubuntu" aria-controls="panel-ubuntu" aria-selected="true">Ubuntu</button>
            <button role="tab" id="tab-windows" aria-controls="panel-windows" aria-selected="false" tabindex="-1">Windows</button>
          </div>
          <div role="tabpanel" id="panel-ubuntu" aria-labelledby="tab-ubuntu">
            <ol class="steps-list">
              <li>Open <strong>Settings → Displays</strong>.</li>
              <li>Select the <strong>external monitor</strong> (click its box in the diagram, or pick it from the list).</li>
              <li>Check <strong>Resolution</strong> and <strong>Refresh Rate</strong>. Choose the highest refresh rate and click <strong>Apply</strong>.</li>
            </ol>
            <p>Or open a terminal and run:</p>
            <div class="code-block"><code>xrandr</code><button class="btn btn-sm copy-btn" data-copy="xrandr" type="button">Copy</button></div>
            <p>Find the connected output (for example <code>HDMI-1</code> or <code>DP-1</code>). Each line lists a resolution and its refresh rates. <strong>The asterisk (<code>*</code>) marks the mode currently in use</strong>; a plus sign (<code>+</code>) marks the monitor's preferred mode.</p>
            <pre class="sample" aria-label="Example xrandr output">HDMI-1 connected 1920x1080+0+0 ...
   1920x1080     60.00 +  100.00*   75.00
   1680x1050     59.95</pre>
            <p>To switch to a refresh rate (replace the output name and numbers with yours):</p>
            <div class="code-block"><code>xrandr --output HDMI-1 --mode 1920x1080 --rate 100</code><button class="btn btn-sm copy-btn" data-copy="xrandr --output HDMI-1 --mode 1920x1080 --rate 100" type="button">Copy</button></div>
            <p class="muted small">On Ubuntu sessions using Wayland, <code>xrandr</code> may not show accurate information. If it looks wrong, trust the Settings → Displays page.</p>
          </div>
          <div role="tabpanel" id="panel-windows" aria-labelledby="tab-windows" hidden>
            <ol class="steps-list">
              <li>Open <strong>Settings → System → Display</strong>. Click the external monitor's box at the top, and check <strong>Display resolution</strong>.</li>
              <li>Go to <strong>Advanced display</strong> (Windows 10: <em>Advanced display settings</em>).</li>
              <li>Select the <strong>external monitor</strong> in the drop-down at the top.</li>
              <li>Verify the <strong>resolution</strong> and choose the highest value under <strong>Choose a refresh rate</strong>.</li>
            </ol>
          </div>
        </div>
        <h4>Confirm in the browser</h4>
        <p>Open TestUFO on the external monitor. The top of the page shows the refresh rate the browser is running at.</p>
        <div class="callout warn"><strong>Browser results are only a guide.</strong> They can be wrong when the laptop is in power-saving mode, the browser is slow, or several monitors with different refresh rates are connected (the browser may follow the main screen). Move the window fully onto the external monitor and reload the page. Trust the operating system settings first.</div>
        <div class="callout info"><strong>Before marking a fail:</strong> make sure your equipment can handle it. A laptop port, an old HDMI cable or a VGA connection may limit the refresh rate. Try DisplayPort, a different cable, or another computer.</div>`,
      checks: [
        { id: 'res-resolution', t: 'Advertised resolution is available and sharp', c: true, sec: 45,
          what: 'The native resolution (for example 1920 × 1080).',
          how: 'Use the steps above. The native resolution is usually marked "(Recommended)" on Windows or with "+" in xrandr.',
          ok: 'The advertised resolution is listed and the picture looks sharp at it.',
          bad: 'The advertised resolution is missing or looks blurry even with a known-good computer and cable.',
          why: 'If the native resolution does not work, the monitor is the wrong model or faulty.' },
        { id: 'res-refresh', t: 'Maximum advertised refresh rate can be selected', q: true, c: true, sec: 60,
          what: 'The highest refresh rate (for example 100 Hz, 120 Hz, 144 Hz or 180 Hz).',
          how: 'Select the highest refresh rate in Settings (or with xrandr) and apply it. The picture must stay on and stable.',
          ok: 'The advertised maximum is offered and works.',
          bad: 'The maximum is not offered, or the screen goes black at it — even with a compatible port and cable.',
          why: 'Refresh rate is a main reason to pick a monitor. Some ports (for example VGA) are limited to 60 Hz by design, so test with HDMI or DisplayPort.' },
        { id: 'res-testufo', t: 'TestUFO confirms the refresh rate', sec: 45,
          how: 'Open testufo.com on the external monitor and read the detected Hz at the top.',
          ok: 'Shows about the selected refresh rate (for example 99.9–100 Hz).',
          bad: 'A very different number on a single-monitor setup after reloading.',
          why: 'A second confirmation that the selected mode is really running. Mark Warning rather than Fail if only the browser disagrees.' },
        { id: 'res-osd', t: 'Monitor menu shows the same input mode', na: true, sec: 30,
          how: 'Open the monitor\'s on-screen menu and find the information page (if it has one).',
          ok: 'It reports the same resolution and refresh rate.',
          bad: 'It reports a lower refresh rate than the computer claims.',
          why: 'Confirms the signal the monitor is really receiving. Mark N/A if the menu has no information page.' }
      ]
    },

    /* ---------------------------------------------------------------- 5 */
    {
      id: 'motion', num: 5, title: 'Motion and gaming performance', icon: 'move', time: '5 min',
      intro: 'Check that moving objects look normal and the screen stays stable at its highest refresh rate.',
      links: ['ufoGhost', 'ufoSkip'],
      guide: `
        <dl class="glossary">
          <div><dt>Refresh rate</dt><dd>How many new pictures the screen shows per second, in hertz (Hz). Higher feels smoother.</dd></div>
          <div><dt>Response time</dt><dd>How fast a pixel changes color, in milliseconds (ms). Advertised numbers are best-case figures.</dd></div>
          <div><dt>Motion blur</dt><dd>Moving objects look slightly soft. <strong>All LCD monitors have some motion blur — it is normal, not a defect.</strong></dd></div>
          <div><dt>Ghosting</dt><dd>A faint dark trail behind moving objects, caused by slow pixel changes.</dd></div>
          <div><dt>Inverse ghosting</dt><dd>A bright or colored halo trailing a moving object. Caused by an overdrive (response time) setting that is too strong.</dd></div>
          <div><dt>Screen tearing</dt><dd>The picture looks split horizontally during fast movement. Caused by the computer and screen being out of sync — not a monitor fault.</dd></div>
          <div><dt>Adaptive-Sync</dt><dd>A feature (also called FreeSync or G-Sync Compatible) that lets the monitor match the game's frame rate to reduce tearing. Needs a supported graphics card and must be enabled in the monitor menu and on the computer.</dd></div>
        </dl>
        <h4>How to test</h4>
        <ol class="steps-list">
          <li>Set the <strong>highest refresh rate</strong> first (Step 4).</li>
          <li>Open TestUFO Ghosting on the external monitor. Watch the UFOs move across the screen.</li>
          <li>Try each <strong>Response Time / Overdrive</strong> setting in the monitor menu (for example Normal, Fast, Fastest). Strong halos on the highest setting are expected; the default setting should look clean.</li>
          <li>Leave the test running for a few minutes. The screen must not flicker, go black, or stutter.</li>
        </ol>`,
      checks: [
        { id: 'mot-ghost', t: 'Moving objects look normal', sec: 60,
          how: 'Watch the UFOs on TestUFO Ghosting.', ok: 'Smooth movement with slight blur, like other LCD monitors.', bad: 'Long smeared trails, or the UFOs break up and stutter.',
          why: 'Heavy ghosting makes games and scrolling uncomfortable. Ordinary motion blur is not a fault.' },
        { id: 'mot-overdrive', t: 'Overdrive settings behave normally', na: true, sec: 60,
          how: 'Switch between response-time settings in the monitor menu while watching TestUFO.', ok: 'At least one setting looks clean, without bright halos.', bad: 'Strong colored halos on every setting.',
          why: 'Strong inverse ghosting on all settings is distracting. Mark N/A if the monitor has no such setting.' },
        { id: 'mot-stable', t: 'Stable at maximum refresh rate for several minutes', c: true, sec: 120,
          how: 'Keep TestUFO running at the maximum refresh rate for 2–3 minutes. Optionally run the frame-skipping test.', ok: 'No flicker, black screens, or stutter.', bad: 'The picture flickers, drops out, or the monitor loses signal — even with a compatible cable and port.',
          why: 'A monitor that cannot hold its advertised refresh rate does not deliver what it promises.' },
        { id: 'mot-adaptive', t: 'Adaptive-Sync can be enabled', na: true, sec: 60,
          how: 'Enable Adaptive-Sync / FreeSync in the monitor menu and in your graphics driver settings, if your computer supports it.', ok: 'It turns on and the picture stays stable.', bad: 'The screen flickers or goes black when Adaptive-Sync is on.',
          why: 'Mark N/A if the monitor or your computer does not support it — this does not count against the monitor.' }
      ]
    },

    /* ---------------------------------------------------------------- 6 */
    {
      id: 'color', num: 6, title: 'Color and text quality', icon: 'palette', time: '4 min',
      intro: 'Check how comfortable everyday work looks: text, documents, white pages and colors.',
      guide: `
        <div class="callout info"><strong>Color coverage vs. color accuracy.</strong> <em>Coverage</em> (for example "99% sRGB") is how many colors the screen <em>can</em> show. <em>Accuracy</em> is how <em>correctly</em> it shows them. A monitor can cover many colors and still show them inaccurately.</div>
        <div class="callout warn"><strong>You cannot measure color accuracy or color gamut by eye.</strong> Visual checks only reveal obvious problems. Real measurement requires a hardware device called a colorimeter.</div>`,
      checks: [
        { id: 'col-text', t: 'Small text is sharp and readable', sec: 30,
          how: 'At the native resolution, open a website with small text. Look closely at letters.', ok: 'Crisp letters with clean edges.', bad: 'Fuzzy or doubled letters, or colored fringes (with native resolution and 100% scaling).',
          why: 'Blurry text causes eye strain and may mean the wrong resolution or a scaling problem.' },
        { id: 'col-doc', t: 'Document or VS Code looks clean', sec: 40,
          how: 'Open a text document or VS Code. Try a light and a dark theme, and scroll.', ok: 'Even background, readable text, no unusual smearing when scrolling.', bad: 'Uneven background, tinted areas, or text that smears badly while scrolling.',
          why: 'This is what you will look at every day.' },
        { id: 'col-white', t: 'White and gray backgrounds look even', sec: 30,
          how: 'Show full-screen white and gray (EIZO test).', ok: 'Neutral and even.', bad: 'Visible tint or patches (see Step 3).',
          why: 'Confirms the display-quality checks in normal use.' },
        { id: 'col-gradient', t: 'Color gradients look smooth', sec: 30,
          how: 'View the gradient patterns on the EIZO test.', ok: 'Mostly smooth, with only faint steps.', bad: 'Strong, blocky steps or missing shades.',
          why: 'Shows how well the panel handles subtle shades.' },
        { id: 'col-angles', t: 'Colors stay consistent from different angles', sec: 30,
          how: 'Move your head left, right, up and down while looking at a photo or white screen.', ok: 'IPS panels: colors stay nearly the same. Some brightness change is normal.', bad: 'Colors shift strongly or invert at small angles on a monitor advertised as IPS.',
          why: 'Unexpected shifts can mean a different panel type than advertised.' },
        { id: 'col-temp', t: 'Color temperature is uniform', sec: 30,
          how: 'On a white screen, compare the left side with the right, and the top with the bottom.', ok: 'The same shade of white everywhere.', bad: 'One side clearly warmer (yellow) or cooler (blue) than the other.',
          why: 'Uneven color temperature cannot be fixed in the settings.' },
        { id: 'col-bright', t: 'Brightness settings work properly', sec: 30,
          how: 'Change brightness from 0 to 100 in the monitor menu.', ok: 'Brightness changes smoothly across the whole range. The maximum is clearly bright.', bad: 'Brightness does not change, jumps suddenly, or the screen is dim even at 100.',
          why: 'A dim maximum can mean a worn backlight.' }
      ]
    },

    /* ---------------------------------------------------------------- 7 */
    {
      id: 'connect', num: 7, title: 'Connectivity and accessories', icon: 'plug', time: '4 min',
      intro: 'Test every port the monitor has, and check what comes with it. Mark features the monitor does not have as N/A — they will not count as failures.',
      checks: [
        { id: 'con-hdmi', t: 'HDMI input works', sec: 40,
          how: 'Connect with HDMI. If there are two HDMI ports, test both.', ok: 'Picture appears quickly and stays stable.', bad: 'No signal, a flickering picture, or a loose connection.', why: 'HDMI is the most common way to connect.' },
        { id: 'con-dp', t: 'DisplayPort input works', na: true, sec: 40,
          how: 'Connect with DisplayPort, if both the monitor and your computer have it.', ok: 'Picture appears and is stable at full refresh rate.', bad: 'No signal or unstable picture.', why: 'Often the best port for high refresh rates. N/A if not supported or you cannot test it.' },
        { id: 'con-vga', t: 'VGA (D-Sub) input works', na: true, sec: 30,
          how: 'Connect with a VGA cable if you have one.', ok: 'Picture appears. VGA is usually limited to 60 Hz — that is normal.', bad: 'No picture, or a wavy, unstable image.', why: 'Useful for older computers. N/A if not supported.' },
        { id: 'con-audio', t: 'Headphone output works', na: true, sec: 30,
          how: 'Plug headphones into the monitor\'s headphone jack and play audio over HDMI/DisplayPort.', ok: 'Clear sound in both ears.', bad: 'No sound, crackling, or only one side.', why: 'N/A if there is no headphone jack.' },
        { id: 'con-speakers', t: 'Built-in speakers work', na: true, sec: 30,
          how: 'Select the monitor as the audio output on your computer and play a video.', ok: 'Sound plays without crackling or buzzing.', bad: 'No sound, distortion or rattling.', why: 'N/A if the monitor has no speakers.' },
        { id: 'con-controls', t: 'Physical controls change settings', sec: 30,
          how: 'Use the buttons to switch input, change brightness and adjust volume (if available).', ok: 'Every function works.', bad: 'Some functions do not respond.', why: 'Confirms the controls work in practice, not just click.' },
        { id: 'con-vesa', t: 'VESA mounting holes are usable', na: true, sec: 20,
          how: 'Check that all four VESA holes are present and threads are not stripped. If you have a mount, test one screw.', ok: 'All holes present with clean threads.', bad: 'Stripped or broken holes.', why: 'Needed for wall or arm mounts. N/A if not VESA-compatible.' },
        { id: 'con-stand', t: 'Stand is complete and stable', sec: 20,
          how: 'Check that the base and neck are included and assembled firmly.', ok: 'Complete, firm stand.', bad: 'Missing parts, cracks or heavy wobble.', why: 'A missing stand is a cost — negotiate.' },
        { id: 'con-adapter', t: 'Power adapter is included', na: true, sec: 20,
          how: 'Check that the external power adapter (power brick) comes with the monitor.', ok: 'The original adapter is included.', bad: 'No adapter, or a random adapter (see Step 8).', why: 'Mark N/A if the monitor has a built-in power supply and uses a normal power cable.' },
        { id: 'con-cables', t: 'Included cables are present and work', na: true, sec: 20,
          how: 'Check for the power cable and any video cable that should be included.', ok: 'Cables present and undamaged.', bad: 'Damaged, cut or missing cables.', why: 'Mark N/A if the seller says no cables are included and the price reflects it.' }
      ]
    },

    /* ---------------------------------------------------------------- 8 */
    {
      id: 'power', num: 8, title: 'Power adapter inspection', icon: 'bolt', time: '3 min',
      intro: 'Many budget monitors use an external power adapter ("power brick"). A wrong or damaged adapter can destroy the monitor or be a fire risk.',
      guide: `
        <div id="ref-power" class="callout info" hidden></div>
        <div class="callout danger"><strong>Safety first:</strong> never open the power adapter or the monitor, and never touch internal electrical parts. If you notice a burning smell, smoke, sparks, or loud crackling, unplug it from the wall and do not buy.</div>
        <div class="adapter-example">
          <img src="assets/img/adapter-label.svg" alt="Illustration of a power adapter label showing Output 12V DC, 2.5A, 30W and a center-positive polarity symbol" loading="lazy" width="360" height="200">
          <div>
            <h4>Example: MSI PRO MP251</h4>
            <ul class="kv">
              <li><span>Output voltage</span><strong>12V DC</strong></li>
              <li><span>Output current</span><strong>2.5A</strong></li>
              <li><span>Power</span><strong>30W <span class="muted">(12V × 2.5A)</span></strong></li>
              <li><span>Type</span><strong>External power adapter</strong></li>
            </ul>
          </div>
        </div>
        <h4>How to read the adapter label</h4>
        <ul class="plain-list">
          <li><strong>OUTPUT</strong> is what matters (INPUT is the wall side, usually 100–240V).</li>
          <li>The <strong>⎓</strong> symbol (a solid line over a dashed line) means <strong>DC</strong>.</li>
          <li>The <strong>polarity symbol</strong> shows a dot with a "+" or "−" in the middle. "+" in the middle means <em>center positive</em>.</li>
        </ul>
        <h4>Rules for a replacement adapter</h4>
        <ul class="plain-list rules">
          <li><span class="pill fail">Must match</span> the <strong>voltage</strong> exactly (for example 12V).</li>
          <li><span class="pill fail">Must match</span> the <strong>connector</strong> size and shape.</li>
          <li><span class="pill fail">Must match</span> the <strong>polarity</strong>.</li>
          <li><span class="pill pass">Equal or higher</span> <strong>current</strong> rating is fine (for example 2.5A or 3A for a 2.5A monitor). The monitor only draws what it needs. Lower current is not OK.</li>
        </ul>`,
      checks: [
        { id: 'pwr-voltage', t: 'Output voltage matches the monitor', na: true, sec: 20,
          how: 'Compare the adapter OUTPUT voltage with the label next to the monitor\'s DC input or the manual.', ok: 'Exactly the same voltage.', bad: 'Any different voltage.', why: 'The wrong voltage can permanently damage the monitor. N/A for monitors with a built-in power supply.' },
        { id: 'pwr-current', t: 'Output current is equal or higher', na: true, sec: 15,
          how: 'Compare the OUTPUT current (A) with the monitor\'s requirement.', ok: 'Equal or higher (for example 2.5A or more for a 2.5A monitor).', bad: 'Lower than required.', why: 'An under-rated adapter can overheat or cause random shutdowns.' },
        { id: 'pwr-watt', t: 'Wattage is sufficient', na: true, sec: 15,
          how: 'Check the watt (W) rating, or multiply volts × amps.', ok: 'Equal or higher than the requirement (for example 30W or more).', bad: 'Lower wattage.', why: 'Same reason as current.' },
        { id: 'pwr-connector', t: 'Connector fits properly', na: true, sec: 20,
          how: 'Plug the barrel connector in.', ok: 'Fits firmly with no wobble.', bad: 'Loose, forced, or the wrong size.', why: 'A poor fit causes sparks and picture drop-outs.' },
        { id: 'pwr-polarity', t: 'Polarity matches', na: true, sec: 15,
          how: 'Compare the polarity symbol on the adapter with the monitor label or manual.', ok: 'Same polarity (usually center positive).', bad: 'Different or unknown polarity on a non-original adapter.', why: 'Reverse polarity can destroy the monitor instantly.' },
        { id: 'pwr-damage', t: 'No physical damage to adapter or cables', c: true, sec: 20,
          how: 'Look along the whole cable and at both ends. Check the adapter case. (For internal power supplies, check the power cord.)', ok: 'Intact case and insulation.', bad: 'Cracked case, exposed wires, tape repairs, melted or burnt spots.', why: 'Electrical safety risk — fire or electric shock.' },
        { id: 'pwr-stable', t: 'Power connection is stable', q: true, c: true, sec: 30,
          how: 'With the picture on, gently move the cable near the monitor\'s power input. Do not pull hard.', ok: 'The picture stays on with no flicker.', bad: 'The screen flickers, turns off, or you see sparks.', why: 'Unstable power is a safety risk and a sign of a damaged jack or adapter.' },
        { id: 'pwr-noise', t: 'No abnormal noises', c: true, sec: 20,
          how: 'Listen close to the adapter and the back of the monitor, at different brightness levels.', ok: 'Silent, or a very faint whine you only hear up close.', bad: 'Loud buzzing, crackling, clicking or popping.', why: 'Loud electrical noises can mean failing components. Mark faint whine as a Warning.' },
        { id: 'pwr-smell', t: 'No burning smell', c: true, sec: 15,
          how: 'After a few minutes of use, smell near the adapter and the monitor\'s vents. Do not touch internal parts.', ok: 'No smell, or a slight "new electronics" smell.', bad: 'Burning or hot plastic smell.', why: 'A burning smell is an electrical safety problem. Unplug immediately.' }
      ]
    },

    /* ---------------------------------------------------------------- 9 */
    {
      id: 'stability', num: 9, title: 'Stability and temperature', icon: 'thermo', time: '10–15 min',
      intro: 'Some faults only appear when the monitor is cold or after it warms up. If the shop allows it, give this step at least 15 minutes — you can do other steps while it runs.',
      guide: `
        <ol class="steps-list">
          <li>Start from a <strong>cold start</strong>: ask the seller not to switch the monitor on before you arrive.</li>
          <li>Play a <strong>video</strong> in full screen and <strong>scroll</strong> through websites.</li>
          <li><strong>Adjust brightness</strong> up and down.</li>
          <li><strong>Turn the monitor off and back on</strong> a few times with its power button.</li>
          <li>Test <strong>sleep and wake</strong>: lock the computer or set the screen to turn off after 1 minute in the power settings, then wake it.</li>
          <li>Leave the monitor <strong>running for at least 15 minutes</strong>, then repeat the white and black screens from Step 2.</li>
        </ol>
        <div class="callout warn"><strong>Watch for heat-related problems:</strong> lines that appear after warming up, flickering, the screen going black for a moment, or the monitor turning itself off.</div>`,
      checks: [
        { id: 'stab-cold', t: 'Cold start works normally', sec: 60,
          how: 'Switch on a monitor that has been off for a while.', ok: 'Picture appears within a few seconds and looks normal from the start.', bad: 'Lines, flicker or a dim picture at first that "fixes itself" when warm.', why: 'Problems that disappear when warm are early signs of a failing part.' },
        { id: 'stab-video', t: 'Video plays smoothly', sec: 120,
          how: 'Play a full-screen video for a few minutes.', ok: 'Smooth playback, stable picture.', bad: 'Flicker, drop-outs, or artifacts.', why: 'A realistic everyday test.' },
        { id: 'stab-scroll', t: 'Scrolling looks stable', sec: 60,
          how: 'Scroll through busy websites quickly.', ok: 'Normal LCD blur, no glitches.', bad: 'Tearing on the monitor alone, flashing or broken picture.', why: 'Exposes signal and panel problems.' },
        { id: 'stab-bright', t: 'Picture stays stable when changing brightness', sec: 30,
          how: 'Change brightness while watching a white screen.', ok: 'Smooth change with no flicker or blackouts.', bad: 'Flashing, flicker or the picture turns off.', why: 'Can reveal backlight power problems.' },
        { id: 'stab-power', t: 'Turns off and on reliably', sec: 60,
          how: 'Use the monitor\'s power button to switch it off and on 3 times.', ok: 'Turns on every time, and the picture returns.', bad: 'Fails to start, needs several tries, or clicks repeatedly.', why: 'Start-up failures often mean a failing power supply.' },
        { id: 'stab-sleep', t: 'Sleep and wake work', sec: 90,
          how: 'Let the computer turn the screen off, then wake it with the mouse or keyboard.', ok: 'The monitor wakes and shows the picture again.', bad: 'Stays black, shows "No signal" forever, or needs a power cycle.', why: 'An annoying everyday fault.' },
        { id: 'stab-15', t: 'No problems after 15 minutes running', c: true, sec: 900,
          how: 'Leave the monitor on for at least 15 minutes, then re-check white and black screens.', ok: 'Picture is the same as at the start.', bad: 'Lines, flicker, discoloration or dark areas appear after warming up.', why: 'Heat-related faults usually get worse with time.' },
        { id: 'stab-blackout', t: 'No random black screens during the whole test', c: true, sec: 30,
          how: 'Think back over the whole inspection.', ok: 'The picture never dropped out on its own.', bad: 'The screen went black or lost signal by itself, even briefly (with a known-good cable).', why: 'Random blackouts are a serious fault.' }
      ]
    },

    /* ---------------------------------------------------------------- 10 */
    {
      id: 'seller', num: 10, title: 'Seller questions', icon: 'chat', time: '4 min',
      intro: 'Ask these questions and write down the answers in the notes boxes. Mark Pass for a good answer, Warning for an unclear one, Fail for a bad one.',
      guide: `<div class="callout info"><strong>Return period:</strong> ask for at least a <strong>7-day replacement or return period</strong> when possible — <strong>one month is better</strong>. Some faults only appear after days of use. Get it in writing (a receipt or message).</div>`,
      checks: [
        { id: 'sel-when', t: 'When was the monitor purchased?', note: 'always', sec: 20, ok: 'A clear answer that matches the manufacturing date.', bad: 'Vague answers or a date that does not match the label.' },
        { id: 'sel-why', t: 'Why is it being sold?', note: 'always', sec: 20, ok: 'A normal reason (upgrade, moving, extra monitor).', bad: 'Evasive answers.' },
        { id: 'sel-repair', t: 'Has it ever been repaired?', note: 'always', sec: 20, ok: 'No repairs, or a documented warranty repair.', bad: 'Unofficial repairs or opened by someone.' },
        { id: 'sel-defects', t: 'Are there any known defects?', note: 'always', sec: 20, ok: 'None, or minor issues that match what you found.', bad: 'Defects that were hidden until you found them.' },
        { id: 'sel-adapter', t: 'Is the original power adapter included?', note: 'always', na: true, sec: 15, ok: 'Yes, original adapter.', bad: 'No adapter, or a generic one with unknown ratings.', why: 'N/A for monitors with a built-in power supply.' },
        { id: 'sel-acc', t: 'Are all accessories included?', note: 'always', sec: 15, ok: 'Stand, cables and any included items are present.', bad: 'Missing items not reflected in the price.' },
        { id: 'sel-receipt', t: 'Is there a receipt?', note: 'always', sec: 15, ok: 'Yes — the original receipt or invoice.', bad: 'No proof of purchase (higher risk of a stolen item and harder warranty claims).' },
        { id: 'sel-warranty', t: 'Is there any remaining manufacturer warranty?', note: 'always', q: true, sec: 20, ok: 'Yes, with the receipt or serial number to prove it.', bad: 'No warranty and no return period.' },
        { id: 'sel-return', t: 'Does the shop offer a replacement or return period?', note: 'always', q: true, sec: 20, ok: 'At least 7 days — ideally one month — in writing.', bad: 'No returns at all ("sold as seen").' }
      ]
    }
  ];

  /* Reference specifications.
   * Sources: MSI global product datasheets (storage-asset.msi.com/datasheet/pro-monitors/global/*.pdf),
   * ViewSonic global product page, AOC product page. Values not published by the manufacturer are
   * marked UNKNOWN — never guessed. Regional versions can differ: always confirm on the official page.
   */
  const models = [
    { id: 'msi-mp251', brand: 'MSI', model: 'PRO MP251',
      size: '24.5"', panel: 'IPS', resolution: '1920 × 1080', refresh: '100 Hz (HDMI); VGA up to 60 Hz',
      brightness: '300 cd/m²', contrast: '1300:1',
      connectivity: '1× HDMI 1.4b, 1× D-Sub (VGA), 1× Line-in, 1× Headphone-out; 2× 2W speakers',
      power: 'External adapter, 12V 2.5A', vesa: '100 × 100 mm',
      url: 'https://www.msi.com/Business-Productivity-Monitor/PRO-MP251',
      datasheet: 'https://storage-asset.msi.com/datasheet/pro-monitors/global/PRO-MP251.pdf',
      maxHz: 100, res: '1920x1080', external: true,
      notes: 'No DisplayPort. Adaptive-Sync supported.' },
    { id: 'msi-mp251-e2', brand: 'MSI', model: 'PRO MP251 E2',
      size: '24.5"', panel: 'IPS', resolution: '1920 × 1080', refresh: '120 Hz (HDMI & DisplayPort); VGA up to 60 Hz',
      brightness: '300 cd/m²', contrast: '1500:1',
      connectivity: '1× HDMI 2.0, 1× DisplayPort 1.4a, 1× D-Sub (VGA), 1× Line-in, 1× Headphone-out; 2× 2W speakers',
      power: 'External adapter, 12V 2.5A', vesa: '100 × 100 mm',
      url: 'https://www.msi.com/Business-Productivity-Monitor/PRO-MP251-E2',
      datasheet: 'https://storage-asset.msi.com/datasheet/pro-monitors/global/PRO-MP251-E2.pdf',
      maxHz: 120, res: '1920x1080', external: true, notes: 'Adaptive-Sync supported.' },
    { id: 'msi-mp251w-e2', brand: 'MSI', model: 'PRO MP251W E2',
      size: '24.5"', panel: 'IPS', resolution: '1920 × 1080', refresh: '120 Hz (HDMI & DisplayPort); VGA up to 60 Hz',
      brightness: '300 cd/m²', contrast: '1500:1',
      connectivity: '1× HDMI 2.0, 1× DisplayPort 1.4a, 1× D-Sub (VGA), 1× Line-in, 1× Headphone-out; 2× 2W speakers',
      power: 'Internal power board (100–240V AC power cable)', vesa: '100 × 100 mm',
      url: 'https://www.msi.com/Business-Productivity-Monitor/PRO-MP251W-E2',
      datasheet: 'https://storage-asset.msi.com/datasheet/pro-monitors/global/PRO-MP251W-E2.pdf',
      maxHz: 120, res: '1920x1080', external: false, notes: 'White version. Unlike the MP251 E2, it has a built-in power supply — no external adapter.' },
    { id: 'msi-mp242a-e2', brand: 'MSI', model: 'PRO MP242A E2',
      size: '23.8"', panel: 'IPS', resolution: '1920 × 1080', refresh: '120 Hz (HDMI & DisplayPort); VGA up to 60 Hz',
      brightness: '300 cd/m²', contrast: '1500:1',
      connectivity: '1× HDMI 1.4b, 1× DisplayPort 1.2a, 1× D-Sub (VGA), 1× Headphone-out; 2× 2W speakers',
      power: 'Built-in (datasheet: "Power Cable", 100–240V AC input)', vesa: '100 × 100 mm',
      url: 'https://www.msi.com/Business-Productivity-Monitor/PRO-MP242A-E2',
      datasheet: 'https://storage-asset.msi.com/datasheet/pro-monitors/global/PRO-MP242A-E2.pdf',
      maxHz: 120, res: '1920x1080', external: false, notes: 'Adaptive-Sync supported.' },
    { id: 'msi-mp242-e14a', brand: 'MSI', model: 'PRO MP242 E14A',
      size: '23.8"', panel: 'IPS', resolution: '1920 × 1080', refresh: '144 Hz (HDMI & DisplayPort); VGA up to 60 Hz',
      brightness: '300 cd/m²', contrast: '1500:1',
      connectivity: '1× HDMI 2.0b, 1× DisplayPort 1.2a, 1× D-Sub (VGA), 1× Headphone-out; 2× 2W speakers',
      power: 'Internal power board (100–240V AC)', vesa: '100 × 100 mm',
      url: 'https://www.msi.com/Business-Productivity-Monitor/PRO-MP242-E14A',
      datasheet: 'https://storage-asset.msi.com/datasheet/pro-monitors/global/PRO-MP242-E14A.pdf',
      maxHz: 144, res: '1920x1080', external: false, notes: 'Not the same as the older PRO MP242 (75 Hz). Adaptive-Sync supported.' },
    { id: 'vs-va240a-h', brand: 'ViewSonic', model: 'VA240A-H',
      size: '24" class (23.8" viewable)', panel: 'IPS', resolution: '1920 × 1080', refresh: '120 Hz',
      brightness: '250 cd/m² (typ.)', contrast: '1,500:1 static (typ.)',
      connectivity: '1× HDMI 1.4, 1× VGA. Audio output and speakers: not listed on the official page',
      power: 'External power adapter, DC socket (center positive). DC output rating: UNKNOWN — read the adapter label', vesa: '75 × 75 mm',
      url: 'https://www.viewsonic.com/global/products/lcd/VA240A-H',
      maxHz: 120, res: '1920x1080', external: true, notes: 'Specifications vary by region — check your country\'s ViewSonic page.' },
    { id: 'aoc-24g4', brand: 'AOC', model: '24G4',
      size: '23.8"', panel: 'IPS', resolution: '1920 × 1080', refresh: '180 Hz',
      brightness: '300 cd/m²', contrast: '1000:1 (static)',
      connectivity: '2× HDMI 2.0, 1× DisplayPort 1.4, 1× Audio out; 2× 2W speakers',
      power: 'Internal (100–240V AC)', vesa: '100 × 100 mm',
      url: 'https://www.aoc.com/au/gaming/monitors/24g4',
      maxHz: 180, res: '1920x1080', external: false,
      notes: 'Do not confuse with the 24G4X, 24G4HRE or 24G4HA — they are different models. Regional pages may differ.' }
  ];

  const SPEC_FIELDS = [
    ['size', 'Screen size'], ['panel', 'Panel type'], ['resolution', 'Resolution'], ['refresh', 'Refresh rate'],
    ['brightness', 'Brightness'], ['contrast', 'Contrast ratio'], ['connectivity', 'Connectivity'],
    ['power', 'Power supply'], ['vesa', 'VESA mounting']
  ];

  return { steps, models, LINKS, SPEC_FIELDS };
})();
