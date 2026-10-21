const player = document.getElementById('player');
const status = document.getElementById('status');
async function load() {
  try {
    const response = await fetch(`latest.json?t=${Date.now()}`, {cache:'no-store'});
    if (!response.ok) throw new Error('Feed unavailable');
    const data = await response.json();
    const video = data.videos[0];
    if (!video || !/^[\w-]{11}$/.test(video.id)) throw new Error('No video');
    const frame = document.createElement('iframe');
    frame.title = video.title;
    frame.src = `https://www.youtube.com/embed/${video.id}?playsinline=1&rel=0`;
    frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    player.replaceChildren(frame);
    document.getElementById('watch').href = `https://www.youtube.com/watch?v=${video.id}`;
    const title = document.getElementById('title');
    if (title) title.textContent = video.title;
    const published = document.getElementById('published');
    if (published) published.textContent = 'LATEST UPLOAD / ' + new Date(video.published).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
    const stale = Date.now() - Date.parse(data.checkedAt) > 3*60*60*1000;
    status.textContent = `${stale ? 'Updates may be delayed. ' : ''}Updated ${new Date(data.checkedAt).toLocaleString()} · Checked hourly`;
  } catch {
    player.textContent = 'The latest video couldn’t be loaded.';
    status.textContent = 'Please try again shortly, or visit the official channel using the YouTube link.';
  }
}
load();

