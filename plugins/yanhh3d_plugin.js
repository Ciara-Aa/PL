// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "yanhh3d",
        "name": "YanHH3D",
        "version": "1.0.0",
        "baseUrl": "https://yanhh3d.ee",
        "iconUrl": "https://yanhh3d.ee/favicon.ico",
        "isEnabled": true,
        "isAdult": false,
        "type": "MOVIE",
        "layoutType": "VERTICAL"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'top-yanhh3d-xem-nhieu', title: 'Bảng Xếp Hạng', type: 'Horizontal', path: '' },
        { slug: 'yanhh3d-hoan-thanh', title: 'Hoàn Thành', type: 'Horizontal', path: '' },
        { slug: 'tu-tien', title: 'Tu Tiên', type: 'Horizontal', path: '' },
        { slug: 'trung-sinh', title: 'Trùng Sinh', type: 'Horizontal', path: '' },
        { slug: 'yanhh3d-moi-cap-nhat', title: 'Mới Cập Nhật', type: 'Grid', path: '' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Mới cập nhật', slug: 'yanhh3d-moi-cap-nhat' },
        { name: 'Hoàn thành', slug: 'yanhh3d-hoan-thanh' },
        { name: 'Tu tiên', slug: 'tu-tien' },
        { name: 'Hiện đại', slug: 'hien-dai' },
        { name: 'Kiếm hiệp', slug: 'kiem-hiep' },
        { name: 'Cổ trang', slug: 'co-trang' },
        { name: 'Đô thị', slug: 'do-thi' },
        { name: 'Trùng sinh', slug: 'trung-sinh' },
        { name: 'Hài hước', slug: 'hai-huoc' },
        { name: 'Tiên hiệp', slug: 'tien-hiep' },
        { name: 'Xuyên không', slug: 'xuyen-khong' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({
        sort: [
            { name: 'Mới cập nhật', value: 'latest' },
            { name: 'Xem nhiều', value: 'views' }
        ],
        category: [
            { name: "Tu Tiên", value: "tu-tien" },
            { name: "Hiện Đại", value: "hien-dai" },
            { name: "Kiếm Hiệp", value: "kiem-hiep" },
            { name: "Cổ Trang", value: "co-trang" },
            { name: "Đô Thị", value: "do-thi" },
            { name: "Trùng Sinh", value: "trung-sinh" },
            { name: "Hài Hước", value: "hai-huoc" },
            { name: "Tiên Hiệp", value: "tien-hiep" },
            { name: "Xuyên Không", value: "xuyen-khong" }
        ]
    });
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    var baseUrl = "https://yanhh3d.ee";

    if (filters.category) {
        return baseUrl + "/" + filters.category + "/page/" + page + "/";
    }

    if (!slug || slug === '') {
        return baseUrl + "/page/" + page + "/";
    }

    if (slug.indexOf("http") === 0) return slug;

    return baseUrl + "/" + slug + "/page/" + page + "/";
}

function getUrlSearch(keyword, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    return "https://yanhh3d.ee/page/" + page + "/?s=" + encodeURIComponent(keyword);
}

function getUrlDetail(slug) {
    if (!slug) return "";
    var baseUrl = "https://yanhh3d.ee";

    if (slug.indexOf("|") !== -1) {
        var parts = slug.split("|");
        if (parts.length >= 3) {
            var epSlug = parts[0];
            var postId = parts[1];
            var svId = parts[2];
            return baseUrl + "/wp-content/themes/halimmovies/player.php?episode_slug=" + epSlug + "&server_id=" + svId + "&subsv_id=&post_id=" + postId;
        }
    }

    if (slug.indexOf("http") === 0) return slug;
    if (slug.indexOf("/") === 0) return baseUrl + slug;
    return baseUrl + "/" + slug;
}

function getUrlCategories() { return "https://yanhh3d.ee/"; }

// =============================================================================
// PARSERS
// =============================================================================

var PluginUtils = {
    cleanText: function (text) {
        if (!text) return "";
        return text.replace(/<[^>]*>/g, "")
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/\s+/g, " ")
            .trim();
    }
};

// Parse list / search: yanhh3d.ee uses .flw-item cards
function parseListResponse(html) {
    var movies = [];
    var foundSlugs = {};

    // Match each .flw-item card block
    var itemRegex = /<div[^>]*class="[^"]*flw-item[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/gi;
    var match;

    while ((match = itemRegex.exec(html)) !== null) {
        var itemHtml = match[0];

        // URL & slug from film-poster-ahref or dynamic-name links
        var linkMatch = itemHtml.match(/<a[^>]+class="[^"]*film-poster-ahref[^"]*"[^>]+href="([^"]+)"/i) ||
                        itemHtml.match(/<a[^>]+href="(https?:\/\/yanhh3d\.ee\/[^"]+)"[^>]*class="[^"]*dynamic-name/i) ||
                        itemHtml.match(/<a[^>]+href="(https?:\/\/yanhh3d\.ee\/[^"]+)"/i);
        if (!linkMatch) continue;

        var url = linkMatch[1];
        var slug = url.replace(/https?:\/\/[^\/]+\//, "").replace(/\/$/, "");
        if (!slug) continue;

        // Title from title attribute or .dynamic-name text
        var titleMatch = itemHtml.match(/title="([^"]+)"/i) ||
                         itemHtml.match(/<a[^>]+class="[^"]*dynamic-name[^"]*"[^>]*>([^<]+)<\/a>/i);
        var title = titleMatch ? PluginUtils.cleanText(titleMatch[1]) : slug;

        // Thumbnail from .film-poster-img
        var thumbMatch = itemHtml.match(/<img[^>]+class="[^"]*film-poster-img[^"]*"[^>]+src="([^"]+)"/i) ||
                         itemHtml.match(/<img[^>]+src="([^"]+)"[^>]+class="[^"]*film-poster-img/i) ||
                         itemHtml.match(/<img[^>]+src="([^"]+\.(?:webp|jpg|png|jpeg))[^"]*"/i);
        var thumb = thumbMatch ? thumbMatch[1] : "";

        // Episode badge from .tick-rate
        var epMatch = itemHtml.match(/<div[^>]*class="[^"]*tick-rate[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
        var episode = epMatch ? PluginUtils.cleanText(epMatch[1]) : "4K";

        if (!foundSlugs[slug]) {
            movies.push({
                id: slug,
                title: title,
                posterUrl: thumb,
                backdropUrl: thumb,
                quality: "4K",
                episode_current: episode,
                lang: "Vietsub"
            });
            foundSlugs[slug] = true;
        }
    }

    // Fallback: simpler regex to catch any missed hrefs
    if (movies.length === 0) {
        var fallbackRegex = /<a[^>]+href="(https?:\/\/yanhh3d\.ee\/[^"\/]+\/[^"\/]+\/)"[^>]*title="([^"]+)"[^>]*>/gi;
        var fm;
        while ((fm = fallbackRegex.exec(html)) !== null) {
            var furl = fm[1];
            var fslug = furl.replace(/https?:\/\/[^\/]+\//, "").replace(/\/$/, "");
            var ftitle = fm[2];
            if (fslug && !foundSlugs[fslug]) {
                movies.push({
                    id: fslug, title: ftitle, posterUrl: "", backdropUrl: "",
                    quality: "4K", episode_current: "4K", lang: "Vietsub"
                });
                foundSlugs[fslug] = true;
            }
        }
    }

    var totalPages = 1;
    var currentPage = 1;
    var curMatch = html.match(/<span[^>]*class="[^"]*current[^"]*"[^>]*>(\d+)<\/span>/i);
    if (curMatch) currentPage = parseInt(curMatch[1]);

    var pageRegex = /page\/(\d+)\//g;
    var pm;
    while ((pm = pageRegex.exec(html)) !== null) {
        var p = parseInt(pm[1]);
        if (p > totalPages) totalPages = p;
    }

    return JSON.stringify({
        items: movies,
        pagination: { currentPage: currentPage, totalPages: totalPages || 1 }
    });
}

function parseSearchResponse(html) { return parseListResponse(html); }

// Parse movie detail page: extract title, poster, description, episode list
function parseMovieDetail(html) {
    try {
        // Title
        var titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
        var title = titleMatch ? PluginUtils.cleanText(titleMatch[1]) : "";

        // Poster
        var poster = "";
        var ogMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i);
        if (ogMatch) { poster = ogMatch[1]; }

        // Description
        var desc = "";
        var descMetaMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
        if (descMetaMatch) desc = PluginUtils.cleanText(descMetaMatch[1]);

        // Year from <span class="item">2024</span> or meta
        var year = 0;
        var yearMatch = html.match(/release\/(20\d{2})/i) || html.match(/>(\d{4})<\/a>/);
        if (yearMatch) year = parseInt(yearMatch[1]);

        // Episode list on yanhh3d.ee — episodes are plain <li><a href="...tap-X.html">Tập X</a></li>
        // Collect all episode links matching the pattern /slug/tap-X.html
        var servers = [];
        var episodes = [];
        var seen = {};

        var epRegex = /<a[^>]+href="(https?:\/\/yanhh3d\.ee\/[^"]+\/tap-[^"]+\.html)"[^>]*>([\s\S]*?)<\/a>/gi;
        var epMatch;
        while ((epMatch = epRegex.exec(html)) !== null) {
            var epUrl = epMatch[1];
            var epLabel = PluginUtils.cleanText(epMatch[2]);
            var epSlug = epUrl.replace(/https?:\/\/[^\/]+\//, "").replace(/\/$/, "");
            if (!seen[epSlug]) {
                seen[epSlug] = true;
                episodes.push({ id: epSlug, name: epLabel || epSlug, slug: epSlug });
            }
        }

        // Sort ascending by episode number
        episodes.sort(function(a, b) {
            var na = parseInt(a.slug.match(/tap-(\d+)/i) ? a.slug.match(/tap-(\d+)/i)[1] : 0);
            var nb = parseInt(b.slug.match(/tap-(\d+)/i) ? b.slug.match(/tap-(\d+)/i)[1] : 0);
            return na - nb;
        });

        if (episodes.length > 0) {
            servers.push({ name: "Server 1", episodes: episodes });
        }

        return JSON.stringify({
            title: title,
            posterUrl: poster,
            backdropUrl: poster,
            description: desc,
            servers: servers,
            quality: "4K",
            lang: "Vietsub",
            year: year
        });
    } catch (e) { return "null"; }
}

// Parse episode player page: extract m3u8/mp4 or iframe embed URL
function parseDetailResponse(html) {
    try {
        var streamUrl = "";

        // Strategy 1: look for file/url in JSON
        var fileM = html.match(/"file"\s*:\s*"([^"]+)"/i) || html.match(/"url"\s*:\s*"([^"]+\.m3u8[^"]*)"/i);
        if (fileM) streamUrl = fileM[1].replace(/\\\//g, "/");

        // Strategy 2: direct .m3u8 or .mp4 URL in source
        if (!streamUrl) {
            var mediaM = html.match(/(https?:\/\/[^"'\s]+\.(?:m3u8|mp4)[^"'\s]*)/i);
            if (mediaM) streamUrl = mediaM[1];
        }

        // Strategy 3: iframe embed
        if (!streamUrl) {
            var ifrM = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
            if (ifrM) streamUrl = ifrM[1];
        }

        if (streamUrl) {
            return JSON.stringify({
                url: streamUrl,
                headers: { "Referer": "https://yanhh3d.ee/" }
            });
        }
        return "{}";
    } catch (e) { return "{}"; }
}
