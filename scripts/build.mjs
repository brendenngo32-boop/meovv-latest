import { mkdir, writeFile, readFile } from 'node:fs/promises';

const channel = 'UCowiwt93gqGlNG4k5VDxO-w';
const base = (process.env.SITE_URL || 'https://meovv.lol').replace(/\/$/, '');

const response = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channel}`, {signal: AbortSignal.timeout(30000)});
if (!response.ok) throw new Error(`YouTube feed returned ${response.status}; retaining previous deployment`);

const xml = await response.text();
const decode = s => s.replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n,16))).replace(/&#(\d+);/g, (_,n) => String.fromCodePoint(+n)).replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');

const videos = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, entry]) => {
   const field = tag => entry.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))?.[1];
   const url = entry.match(/<link\b[^>]*rel="alternate"[^>]*href="([^"]+)"/)?.[1];
   return {id:field('yt:videoId'), title:decode(field('title') || ''), published:field('published'), url};
}).filter(v => /^[\w-]{11}$/.test(v.id) && Number.isFinite(Date.parse(v.published)) && v.url?.startsWith('https://www.youtube.com/watch?v=')).sort((a,b) => Date.parse(b.published)-Date.parse(a.published));

if (!videos.length) throw new Error('No regular videos in the feed');

const latestVideoId = videos[0].id;
let thumbnail = `https://i.ytimg.com/vi/${latestVideoId}/hqdefault.jpg`;
try {
   const highResolution = `https://i.ytimg.com/vi/${latestVideoId}/maxresdefault.jpg`;
   const image = await fetch(highResolution, {method: 'HEAD', signal: AbortSignal.timeout(10000)});
   if (image.ok && image.headers.get('content-type')?.startsWith('image/')) thumbnail = highResolution;
} catch { /* Keep the standard YouTube thumbnail when the larger image is unavailable. */ }

await mkdir('dist',{recursive:true});

for (const file of ['index.html','embed.html','style.css','app.js','card.svg']) {
   let content = await readFile(`public/${file}`,'utf8');
   content = content.replaceAll('__SITE_URL__', base);
   content = content.replaceAll('__THUMBNAIL_URL__', thumbnail);
   if (file === 'index.html') {
       content = content.replaceAll('__VIDEO_ID__', latestVideoId);
   }
   await writeFile(`dist/${file}`, content);
   if (file === 'index.html') {
       const share = content
           .replace('name="twitter:card" content="player"', 'name="twitter:card" content="summary_large_image"')
           .replace(/\s*<meta name="twitter:player(?::[^"]+)?"[^>]*>/g, '')
           .replace(/\s*<meta property="og:video(?::[^"]+)?"[^>]*>/g, '')
           .replace('property="og:type" content="video.other"', 'property="og:type" content="website"')
           .replace(`property="og:url" content="${base}/"`, `property="og:url" content="${base}/share/"`);
       await mkdir('dist/share', {recursive:true});
       await writeFile('dist/share/index.html', share.replace('<head>', '<head>\n    <base href="../">'));
       // GitHub also serves share.html at /share. Include the complete card
       // metadata for crawlers that do not follow HTML refresh redirects.
       await writeFile('dist/share.html', share.replace('<head>', `<head>\n    <base href="${base}/">\n    <meta http-equiv="refresh" content="0;url=${base}/share/">\n    <link rel="canonical" href="${base}/share/">`));
   }
}

await writeFile('dist/latest.json', JSON.stringify({channel, checkedAt: new Date().toISOString(), videos}, null, 2));
await writeFile('dist/.nojekyll', '');
console.log(`Built ${videos.length} uploads. Latest: ${videos[0].title} (${latestVideoId})`);
