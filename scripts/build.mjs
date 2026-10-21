import fs from 'fs';

async function getLatestVideoId() {
    try {
        // YouTube channel RSS feed for @MEOVV_OFFICIAL
        const channelId = 'UCAK-1g08Zq32W02g1e2e2gQ'; // Replace with exact channel ID if needed, or use public RSS
        const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=UCMEOVV_CHANNEL_ID`;
        
        // Alternative public scrape method via public page or RSS feed proxy if preferred:
        const res = await fetch('https://www.youtube.com/@MEOVV_OFFICIAL/videos');
        const text = await res.text();
        
        // Match the first video ID instance in the raw page source
        const match = text.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
        return match ? match[1] : 'DdRSM0jYPYg'; // Fallback to latest known ID
    } catch (e) {
        console.error("Error fetching latest video:", e);
        return 'DdRSM0jYPYg';
    }
}

async function build() {
    const videoId = await getLatestVideoId();
    console.log(`Injecting latest video ID: ${videoId}`);

    // Read your index template from public/
    let html = fs.readFileSync('./public/index.html', 'utf8');

    // Replace the placeholder with the dynamic video ID
    html = html.replace(/__VIDEO_ID__/g, videoId);

    // Write it back out for deployment
    fs.writeFileSync('./public/index.html', html);
    console.log('Build completed successfully.');
}

build();
