import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { loadFeed } from './feed.mjs';

const channel = 'UCowiwt93gqGlNG4k5VDxO-w';
const base = (process.env.SITE_URL || 'https://meovv.lol').replace(/\/$/, '');

const feed = await loadFeed({channel, base});
const {videos} = feed;
if (feed.feedStatus !== 'fresh') console.warn('::warning::' + feed.feedError + '; keeping last verified video from ' + feed.checkedAt);

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
       // Preserve old links while using the same Player Card everywhere.
       const redirect = content.replace('<head>', `<head>\n    <base href="${base}/">\n    <meta http-equiv="refresh" content="0;url=${base}/">\n    <link rel="canonical" href="${base}/">`);
       await mkdir('dist/share', {recursive:true});
       await writeFile('dist/share/index.html', redirect);
       await writeFile('dist/share.html', redirect);
   }
}
await writeFile('dist/latest.json', JSON.stringify(feed, null, 2));
await writeFile('dist/.nojekyll', '');
console.log(`Built ${videos.length} regular videos. Latest: ${videos[0].title}`);
