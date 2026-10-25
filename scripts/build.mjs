import { mkdir, writeFile, copyFile, readFile, cp } from 'node:fs/promises';
const channel = 'UCowiwt93gqGlNG4k5VDxO-w';
const base = (process.env.SITE_URL || 'https://meovv.lol').replace(/\/$/, '');
let checkedAt = new Date().toISOString();
let videos;
try {
const response = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channel}`, {signal: AbortSignal.timeout(30000)});
if (!response.ok) throw new Error(`YouTube feed returned ${response.status}; retaining previous deployment`);
const xml = await response.text();
const decode = s => s.replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n,16))).replace(/&#(\d+);/g, (_,n) => String.fromCodePoint(+n)).replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
videos = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, entry]) => {
  const field = tag => entry.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))?.[1];
  const url = entry.match(/<link\b[^>]*rel="alternate"[^>]*href="([^"]+)"/)?.[1];
  return {id:field('yt:videoId'), title:decode(field('title') || ''), published:field('published'), url};
}).filter(v => /^[\w-]{11}$/.test(v.id) && Number.isFinite(Date.parse(v.published)) && v.url?.startsWith('https://www.youtube.com/watch?v=')).sort((a,b) => Date.parse(b.published)-Date.parse(a.published));
if (!videos.length) throw new Error('No regular videos in the feed; retaining previous deployment rather than showing Shorts');
 } catch (error) {
  console.warn('::warning::' + error.message + '; using last verified video');
  const previousResponse = await fetch(base + '/latest.json?fallback=' + Date.now(), {signal: AbortSignal.timeout(30000)});
  if (!previousResponse.ok) throw new Error('No previous video available; cannot safely deploy');
  const previous = await previousResponse.json();
  if (previous.channel !== channel || !Number.isFinite(Date.parse(previous.checkedAt)) || !Array.isArray(previous.videos) || !previous.videos.length || !previous.videos.every(v => /^[\w-]{11}$/.test(v.id) && typeof v.title === 'string' && Number.isFinite(Date.parse(v.published)) && v.url === 'https://www.youtube.com/watch?v=' + v.id)) throw new Error('Invalid previous video data');
  videos = previous.videos;
  checkedAt = previous.checkedAt;
}
await mkdir('dist',{recursive:true});
for (const file of ['index.html','embed.html','style.css','app.js','card.svg']) {
  const content = await readFile(`public/${file}`,'utf8');
  await writeFile(`dist/${file}`,content.replaceAll('__SITE_URL__',base));
}
await writeFile('dist/latest.json',JSON.stringify({channel,checkedAt,videos},null,2));
await writeFile('dist/.nojekyll','');
await cp('public/watermark', 'dist/watermark', { recursive: true });
console.log(`Built ${videos.length} uploads. Latest: ${videos[0].title} (${videos[0].id})`);

