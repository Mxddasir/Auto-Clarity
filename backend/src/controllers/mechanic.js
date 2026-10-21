const axios = require('axios');

exports.findMechanics = async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;
    if (!lat || !lng)
      return res.status(400).json({ error: 'lat and lng required' });

    console.log(`Searching mechanics at ${lat},${lng} radius ${radius}m`);

    const { data } = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine:  'google_maps',
        q:       'car garage MOT repair mechanic',
        ll:      `@${lat},${lng},14z`,
        type:    'search',
        api_key: process.env.SERP_API_KEY
      }
    });

    console.log('SerpAPI status:', data.search_metadata?.status);

    if (!data.local_results || data.local_results.length === 0) {
      return res.json({ mechanics: [], total: 0 });
    }

    const mechanics = data.local_results.map(p => ({
      id:           p.place_id || p.data_id,
      name:         p.title,
      address:      p.address,
      rating:       p.rating,
      totalRatings: p.reviews,
      openNow:      p.open_state?.toLowerCase().includes('open') ? true
                  : p.open_state?.toLowerCase().includes('close') ? false
                  : undefined,
      phone:        p.phone,
      website:      p.website,
      location: {
        lat: p.gps_coordinates?.latitude,
        lng: p.gps_coordinates?.longitude
      },
      photo:         p.thumbnail || null,
      mapsUrl:       p.links?.directions || null
    }));

    res.json({ mechanics, total: mechanics.length });

  } catch (err) {
    console.error('SerpAPI error:', err.response?.data || err.message);
    res.status(500).json({
      error:   'Mechanic search failed',
      details: err.response?.data?.error || err.message
    });
  }
};
