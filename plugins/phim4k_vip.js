// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "phim4k_vip",
        "name": "Phim4K VIP",
        "version": "1.0.0",
        "baseUrl": "https://stremio.phim4k.xyz",
        "iconUrl": "https://phim4k.com/favicon.ico",
        "isEnabled": true,
        "type": "MOVIE"
    });
}

const AUTH_TOKEN = "eyJ1c2VybmFtZSI6Imh1bmciLCJwYXNzd29yZCI6Imh1bmciLCJ0cyI6MTc2NDcyNTIxNDA1NX0";

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    var type = (slug === 'phim4k_series') ? 'series' : 'movie';
    if (slug !== 'phim4k_movies' && slug !== 'phim4k_series') {
        return "https://stremio.phim4k.xyz/" + AUTH_TOKEN + "/catalog/" + type + "/phim4k_" + type + "s/genre=" + encodeURIComponent(slug) + ".json";
    }
    return "https://stremio.phim4k.xyz/" + AUTH_TOKEN + "/catalog/" + type + "/" + slug + ".json";
}

function getUrlSearch(keyword, filtersJson) {
    return "https://stremio.phim4k.xyz/" + AUTH_TOKEN + "/catalog/movie/phim4k_movies/search=" + encodeURIComponent(keyword) + ".json";
}

function getUrlDetail(id) {
    var type = id.indexOf('series') > -1 ? 'series' : 'movie';
    return "https://stremio.phim4k.xyz/" + AUTH_TOKEN + "/meta/" + type + "/" + id + ".json";
}

function getUrlStream(id) {
    var type = id.indexOf('series') > -1 ? 'series' : 'movie';
    return "https://stremio.phim4k.xyz/" + AUTH_TOKEN + "/stream/" + type + "/" + id + ".json";
}

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(apiResponseJson) {
    try {
        var response = JSON.parse(apiResponseJson);
        var items = response.metas || [];
        var movies = items.map(function (item) {
            return {
                id: item.id,
                title: item.name,
                posterUrl: item.poster || "",
                backdropUrl: item.background || "",
                year: item.name.match(/\((\d{4})\)/) ? item.name.match(/\((\d{4})\)/)[1] : 0,
                quality: "4K/Bluray",
                episode_current: "Full",
                lang: "Vietsub"
            };
        });
        return JSON.stringify({
            items: movies,
            pagination: { currentPage: 1, totalPages: 1, totalItems: movies.length }
        });
    } catch (error) { return JSON.stringify({ items: [], pagination: { currentPage: 1 } }); }
}

function parseMovieDetail(apiResponseJson) {
    try {
        var response = JSON.parse(apiResponseJson);
        var meta = response.meta || {};
        
        // Trả về đầy đủ thông tin phim để tránh lỗi MovieDetail
        return JSON.stringify({
            id: meta.id,
            title: meta.name,
            posterUrl: meta.poster || "",
            backdropUrl: meta.background || "",
            description: (meta.description || "").replace(/<[^>]*>/g, ""),
            year: meta.year || 0,
            rating: meta.imdbRating || 0,
            quality: "4K",
            category: (meta.genres || []).join(", "),
            country: meta.country || "",
            director: (meta.director || []).join(", "),
            casts: (meta.cast || []).join(", "),
            servers: [{
                name: "Phim4K VIP",
                episodes: [{ id: meta.id, name: "Xem Ngay", slug: meta.id }]
            }]
        });
    } catch (error) { return "null"; }
}

function parseDetailResponse(apiStreamResponseJson) {
    try {
        var response = JSON.parse(apiStreamResponseJson);
        var streams = response.streams || [];
        
        if (streams.length === 0) return "{}";

        // CHỈ LẤY 1 LINK DUY NHẤT để tránh lỗi logic app
        return JSON.stringify({
            url: streams[0].url,
            headers: { 
                "User-Agent": "Stremio/1.6.0 (AppleTV; tvOS/17.0)", 
                "Referer": "https://stremio.phim4k.xyz/",
                "Origin": "https://stremio.phim4k.xyz"
            },
            subtitles: []
        });
    } catch (error) { return "{}"; }
}

function getImageUrl(path) { return path || ""; }
function getHomeSections() { return JSON.stringify([{ slug: 'phim4k_movies', title: 'Phim4K Movies', type: 'Horizontal', path: 'catalog/movie' }, { slug: 'phim4k_series', title: 'Phim4K Series', type: 'Horizontal', path: 'catalog/series' }]); }
function getPrimaryCategories() { return JSON.stringify([{ name: 'Phim lẻ', slug: 'phim4k_movies' }, { name: 'Phim bộ', slug: 'phim4k_series' }]); }
