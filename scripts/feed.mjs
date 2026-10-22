const decode = s => s.replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n,16))).replace(/&#(\d+);/g, (_,n) => String.fromCodePoint(+n)).replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
const validVideo = v => /^[\w-]{11}$/.test(v?.id) && typeof v.title === 'string' && Number.isFinite(Date.parse(v.published)) && v.url === `https://www.youtube.com/watch?v=${v.id}`;

export function parseFeed(xml, channel) {
  if (!xml.includes(`<uri>https://www.youtube.com/channel/${channel}</uri>`)) throw new Error('Unexpected YouTube feed');
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, entry]) => {
    const field = tag => entry.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))?.[1];
    return {id:field('yt:videoId'),title:decode(field('title') || ''),published:field('published'),url:entry.match(/<link\b[^>]*rel="alternate"[^>]*href="([^"]+)"/)?.[1]};
  }).filter(validVideo).sort((a,b)=>Date.parse(b.published)-Date.parse(a.published));
}

export async function loadFeed({channel, base, fetcher=fetch, sleep=ms=>new Promise(r=>setTimeout(r,ms)), now=()=>new Date().toISOString()}) {
  let reason;
  for (let attempt=0; attempt<3; attempt++) {
    try {
      const response = await fetcher(`https://www.youtube.com/feeds/videos.xml?channel_id=${channel}`, {signal:AbortSignal.timeout(20000)});
      if (!response.ok) throw new Error(`YouTube feed returned ${response.status}`);
      const videos = parseFeed(await response.text(),channel);
      if (!videos.length) throw new Error('No regular videos in current feed');
      return {channel,checkedAt:now(),lastAttemptAt:now(),feedStatus:'fresh',videos};
    } catch(error) {
      reason = error.message;
      if (attempt<2) await sleep((attempt+1)*5000);
    }
  }
  // Recover only our previously published, validated regular videos. Never
  // advance checkedAt on an upstream failure or silently substitute a Short.
  const response = await fetcher(`${base}/latest.json?fallback=${Date.now()}`, {cache:'no-store',signal:AbortSignal.timeout(20000)});
  if (!response.ok) throw new Error(`${reason}; previous deployment unavailable (${response.status})`);
  const previous = await response.json();
  if (previous.channel !== channel || !Number.isFinite(Date.parse(previous.checkedAt)) || !Array.isArray(previous.videos) || !previous.videos.length || !previous.videos.every(validVideo)) throw new Error(`${reason}; invalid fallback data`);
  return {channel,checkedAt:previous.checkedAt,lastAttemptAt:now(),feedStatus:'unavailable',feedError:reason,videos:previous.videos};
}
