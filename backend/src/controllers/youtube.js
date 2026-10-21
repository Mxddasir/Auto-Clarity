const axios = require('axios');

exports.searchVideos = async (req, res) => {
  try {
    const { q, maxResults = 3 } = req.query;
    if (!q) return res.status(400).json({ error: 'Query required' });

    const { data } = await axios.get(
      'https://www.googleapis.com/youtube/v3/search',
      {
        params: {
          part: 'snippet',
          q: `${q} how to fix tutorial`,
          type: 'video',
          maxResults,
          relevanceLanguage: 'en',
          regionCode: 'GB',
          key: process.env.YOUTUBE_API_KEY
        }
      }
    );

    res.json({
      videos: data.items.map(item => ({
        id:          item.id.videoId,
        title:       item.snippet.title,
        channel:     item.snippet.channelTitle,
        thumbnail:   item.snippet.thumbnails.medium.url,
        publishedAt: item.snippet.publishedAt,
        url:         `https://www.youtube.com/watch?v=${item.id.videoId}`
      }))
    });
  } catch {
    res.status(500).json({ error: 'YouTube search failed' });
  }
};
