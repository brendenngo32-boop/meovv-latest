const player = document.getElementById('player') || document.getElementById('video-wrapper');
const status = document.getElementById('status');
function showVideo(video, autoplay = false) {
  const frame = document.createElement('iframe');
  frame.title = video.title;
  frame.src = `https://www.youtube.com/embed/${video.id}?playsinline=1&rel=0${autoplay ? '&autoplay=1' : ''}`;
  frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  frame.allowFullscreen = true;
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  player.replaceChildren(frame);
  player.classList.add('is-playing');
}
async function load() {
  try {
    if (!player) throw new Error('Missing player container');
    const response = await fetch(`latest.json?t=${Date.now()}`, {cache:'no-store'});
    if (!response.ok) throw new Error('Feed unavailable');
    const data = await response.json();
    const video = data.videos?.[0];
    if (!video || !/^[\w-]{11}$/.test(video.id)) throw new Error('No video');
    document.getElementById('watch').href = `https://www.youtube.com/watch?v=${video.id}`;
    const title = document.getElementById('title');
    if (title) title.textContent = video.title;
    const published = document.getElementById('published');
    if (published) published.textContent = 'LATEST UPLOAD / ' + new Date(video.published).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
    if (player.id === 'video-wrapper') {
      const button = player.querySelector('button');
      button.disabled = false;
      button.setAttribute('aria-label', `Play ${video.title}`);
      button.addEventListener('click', () => showVideo(video, true), {once:true});
    } else {
      showVideo(video);
    }
    const stale = data.feedStatus === 'unavailable' || Date.now() - Date.parse(data.checkedAt) > 3*60*60*1000;
    status.textContent = `${stale ? 'Updates may be delayed. ' : ''}Updated ${new Date(data.checkedAt).toLocaleString()} · Checked every 30 minutes`;
  } catch {
    if (player) player.textContent = 'The latest video could not be loaded.';
    if (status) status.textContent = 'Please reload or visit the official channel using the YouTube link.';
  }
}
load();
