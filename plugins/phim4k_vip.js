// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "phim4k_vip",
        "name": "Phim4K VIP",
        "version": "1.2.5",
        "baseUrl": "https://stremio.phim4k.xyz",
        "iconUrl": "https://phim4k.com/favicon.ico",
        "isEnabled": true,
        "type": "MOVIE"
    });
}

// Token xác thực cho tài khoản VIP
const AUTH_TOKEN = "eyJ1c2VybmFtZSI6Imh1bmciLCJwYXNzd29yZCI6Imh1bmciLCJ0cyI6MTc2NDcyNTIxNDA1NX0";

function getHomeSections() {
    return JSON.stringify([
        { slug: 'phim4k_movies', title: 'Phim4K Movies', type: 'Horizontal', path: 'catalog/movie' },
        { slug: 'phim4k_series', title: 'Phim4K Series', type: 'Horizontal', path: 'catalog/series' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Phim mới', slug: 'phim4k_movies' },
        { name: 'Phim bộ', slug: 'phim4k_series' },
        { name: 'Phim hành động', slug: 'Action & Adventure' },
        { name: 'Phim viễn tưởng', slug: 'Sci-Fi & Fantasy' },
        { name: 'Hoạt hình', slug: 'Animation' },
        { name: 'Kinh dị', slug: 'Horror' },
        { name: 'Hài hước', slug: 'Comedy' }
    ]);
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var type = (slug === 'phim4k_series') ? 'series' : 'movie';
    
    // Xử lý lọc theo thể loại từ menu
    if (slug !== 'phim4k_movies' && slug !== 'phim4k_series') {
        return `https://stremio.phim4k.xyz/${AUTH_TOKEN}/catalog/${type}/phim4k_${type}s/genre=${encodeURIComponent(slug)}.json`;
    }

    return `https://stremio.phim4k.xyz/${AUTH_TOKEN}/catalog/${type}/${slug}.json`;
}

function getUrlSearch(keyword, filtersJson) {
    return `https://stremio.phim4k.xyz/${AUTH_TOKEN}/catalog/movie/phim4k_movies/search=${encodeURIComponent(keyword)}.json`;
}

function getUrlDetail(id) {
    var type = id.includes('series') ? 'series' : 'movie';
    return `https://stremio.phim4k.xyz/${AUTH_TOKEN}/meta/${type}/${id}.json`;
}

// Hàm lấy danh sách luồng phát (Stream)
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
                year: item.name.match(/\((\d{4})\)/)?.[1] || 0, // Trích xuất năm từ tên phim
                quality: "HD/4K",
                episode_current: item.description ? item.description.substring(0, 100) + "..." : "",
                lang: "Vietsub/Lồng tiếng"
            };
        });

        return JSON.stringify({
            items: movies,
            pagination: {
                currentPage: 1,
                totalPages: 1,
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
            description: (meta.description || "").replace(/<[^>]*>/g, ""),
            year: meta.year || 0,
            rating: meta.imdbRating || 0,
            quality: "4K/Bluray",
            category: (meta.genres || []).join(", "),
            country: meta.country || "",
            director: (meta.director || []).join(", "),
            casts: (meta.cast || []).join(", ")
        });
    } catch (error) { return "null"; }
}

// PARSER CHO STREAM - Đã cập nhật để đọc đúng cấu trúc link tập phim bạn gửi
function parseDetailResponse(apiResponseJson) {
    try {
        var response = JSON.parse(apiResponseJson);
        var streams = response.streams || [];
        
        if (streams.length === 0) return "{}";

        // Chọn stream đầu tiên làm mặc định hoặc có thể logic chọn chất lượng cao nhất ở đây
        var selectedStream = streams[0];

        return JSON.stringify({
            url: selectedStream.url,
            title: selectedStream.title,
            headers: { 
                "User-Agent": "Stremio/1.6.0",
                "Referer": "https://phim4k.com" 
            },
            // Metadata bổ sung cho trình phát
            extra: streams.map(function(s) {
                return { name: s.title, url: s.url };
            })
        });
    } catch (error) { return "{}"; }
}

function getImageUrl(path) {
    return path || "";
}
