# MEOVV latest

A small GitHub Pages site displaying the latest upload (including Shorts) from @MEOVV_OFFICIAL. YouTube’s public Atom feed is fetched at build time; no API key or third-party feed proxy is needed.

The GitHub Actions workflow runs on push, manual dispatch, and hourly at minute 17. Scheduled runs may be delayed; GitHub can disable scheduled workflows in public repositories after 60 days of inactivity. Check the Actions tab if updates stop. A failed feed fetch leaves the previous successful deployment intact.

Run `npm run build` with Node 22+, then serve `dist` over HTTP. Copy `public/card.png` into `dist` for a local social-card preview. Production builds do this automatically. `SITE_URL` controls absolute card URLs.

`index.html` is the share URL. `embed.html` loads the newest built video into a YouTube iframe whenever opened. An already-playing video is not interrupted when a newer upload arrives. X Player Card metadata points at the stable embed page and uses a permanent thumbnail. X's card acceptance, nested YouTube playback, and mobile behavior require testing on X; they are not guaranteed. Videos with embedding restrictions can be opened using Watch on YouTube.

Independent fan page; not affiliated with MEOVV or THEBLACKLABEL.
