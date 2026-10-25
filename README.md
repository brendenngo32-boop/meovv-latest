# MEOVV latest

The browser-only watermark editor is available at `/watermark/`, linked from the homepage. Upload your own photos, add text or image logos, adjust placement, and download individual images or a ZIP. Photo processing stays on your device; remembered watermark settings and logos use browser local storage. The editor has no external dependencies.

A small GitHub Pages site displaying the latest regular video (excluding Shorts) from @MEOVV_OFFICIAL. YouTube’s public Atom feed is fetched at build time; no API key or third-party feed proxy is needed.

The GitHub Actions workflow runs on push, manual dispatch, and every 30 minutes at minutes 17 and 47. Scheduled runs may be delayed; GitHub can disable scheduled workflows in public repositories after 60 days of inactivity. Check the Actions tab if updates stop. A failed feed fetch leaves the previous successful deployment intact.

Run `npm run build` with Node 22+, then serve `dist` over HTTP. Copy `public/card.png` into `dist` for a local social-card preview. Production builds do this automatically. `SITE_URL` controls absolute card URLs.

`index.html` is the share URL. `embed.html` loads the newest built video into a YouTube iframe whenever opened. An already-playing video is not interrupted when a newer upload arrives. X Player Card metadata points at the stable embed page and uses a permanent thumbnail. X's card acceptance, nested YouTube playback, and mobile behavior require testing on X; they are not guaranteed. Videos with embedding restrictions can be opened using Watch on YouTube.

Independent fan page; not affiliated with MEOVV or THEBLACKLABEL.


Shorts are excluded using the feed's canonical video links: only YouTube watch URLs are accepted. If the feed contains only Shorts, the build stops and keeps the last successful regular-video deployment.

