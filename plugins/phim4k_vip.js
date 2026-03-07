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

// Token được tạo từ username: hung, password: hung
const AUTH_TOKEN = "eyJ1c2VybmFtZSI6Imh1bmciLCJwYXNzd29yZCI6Imh1bmciLCJ0cyI6MTc2NDcyNTIxNDA1NX0";

function getHomeSections() {
    return JSON.stringify([
        { slug: 'phim4k_movies', title: 'Phim4K Movies', type: 'Horizontal', path: 'catalog/movie' },
        { slug: 'phim4k_series', title: 'Phim4K Series', type: 'Horizontal', path: 'catalog/series' }
    ]);
}

function getPrimaryCategories() {
    // Trích xuất từ danh sách genres trong manifest của bạn
    return JSON.stringify([
        { name: 'Phim lẻ', slug: 'phim4k_movies' },
        { name: 'Phim bộ', slug: 'phim4k_series' },
        { name: 'Phim Việt Nam', slug: 'Việt Nam' },
        { name: 'Hàn Quốc', slug: 'Hàn Quốc' },
        { name: 'Trung Quốc', slug: 'Trung Quốc' },
        { name: 'Hành động', slug: 'Action & Adventure' },
        { name: 'Kinh dị', slug: 'Horror' }
    ]);
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    var type = (slug === 'phim4k_series') ? 'series' : 'movie';
    
    // Nếu slug là một thể loại (genre), ta dùng cấu trúc lọc của Stremio
    if (slug !== 'phim4k_movies' && slug !== 'phim4k_series') {
        return `https://stremio.phim4k.xyz/${AUTH_TOKEN}/catalog/${type}/phim4k_${type}s/genre=${encodeURIComponent(slug)}.json`;
    }

    // Mặc định trả về catalog chính
    return `https://stremio.phim4k.xyz/${AUTH_TOKEN}/catalog/${type}/${slug}.json`;
}

function getUrlSearch(keyword, filtersJson) {
    // API Phim4K hỗ trợ search qua catalog endpoint
    return `https://stremio.phim4k.xyz/${AUTH_TOKEN}/catalog/movie/phim4k_movies/search=${encodeURIComponent(keyword)}.json`;
}

function getUrlDetail(id) {
    // id thường có dạng phim4k:movie:413 hoặc phim4k:yet-hi
    var type = id.includes('series') ? 'series' : 'movie';
    return `https://stremio.phim4k.xyz/${AUTH_TOKEN}/meta/${type}/${id}.json`;
}

function getUrlStream(id) {
    var type = id.includes('series') ? 'series' : 'movie';
    return `https://stremio.phim4k.xyz/${AUTH_TOKEN}/stream/${type}/${id}.json`;
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
                posterUrl: item.poster,
                backdropUrl: item.background,
                year: item.releaseInfo || 0,
                quality: "HD/4K",
                episode_current: item.description || "",
                lang: "Vietsub"
            };
        });

        return JSON.stringify({
            items: movies,
            pagination: {
                currentPage: 1,
                totalPages: 10, // API Stremio thường không trả về tổng trang rõ ràng trong metas
                totalItems: movies.length
            }
        });
    } catch (error) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseMovieDetail(apiResponseJson) {
    try {
        var response = JSON.parse(apiResponseJson);
        var meta = response.meta || {};

        return JSON.stringify({
            id: meta.id,
            title: meta.name,
            posterUrl: meta.poster,
            backdropUrl: meta.background,
            description: meta.description || "",
            year: meta.year || 0,
            rating: meta.imdbRating || 0,
            quality: "4K",
            category: (meta.genres || []).join(", "),
            country: meta.country || "",
            director: (meta.director || []).join(", "),
            casts: (meta.cast || []).join(", ")
        });
    } catch (error) { return "null"; }
}

function parseDetailResponse(apiResponseJson) {
    try {
        var response = JSON.parse(apiResponseJson);
        var streams = response.streams || [];
        
        var streamUrl = "";
        if (streams.length > 0) {
            streamUrl = streams[0].url || "";
        }

        return JSON.stringify({
            url: streamUrl,
            headers: { 
                "User-Agent": "Stremio/1.6.0",
                "Referer": "https://phim4k.com" 
            },
            subtitles: []
        });
    } catch (error) { return "{}"; }
}

function getImageUrl(path) {
    return path || ""; // Phim4K trả về link ảnh tuyệt đối trong JSON
}
