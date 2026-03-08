// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "yanhh3d",
        "name": "YanHH3D",
        "version": "1.0.1",
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
        return baseUrl + "/yanhh3d-moi-cap-nhat/page/" + page + "/";
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
    if (slug.indexOf("http") === 0) return slug;
    if (slug.indexOf("/") === 0) return "https://yanhh3d.ee" + slug;
    return "https://yanhh3d.ee/" + slug;
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

/**
 * Parse list page. yanhh3d.ee structure:
 * <div class="flw-item item-qtip">
 *   <div class="film-poster">
 *     <div class="tick tick-rate">Tập 131/180 [4K]</div>
 *     <img src="..." class="film-poster-img">
 *     <a class="film-poster-ahref" href="..." title="..."><i class="icon-play"></i></a>
 *   </div>
 *   <div class="film-detail">
 *     <h3 class="film-name"><a class="dynamic-name" href="..." title="...">Name</a></h3>
 *   </div>
 *   <div class="clearfix"></div>
 * </div>
 */
function parseListResponse(html) {
    var movies = [];
    var foundSlugs = {};

    // Strategy: find all film-poster-ahref links (one per card), then grab
    // siblings (img, tick-rate) from surrounding context
    var anchorRegex = /<a[^>]+class="[^"]*film-poster-ahref[^"]*"[^>]+href="([^"]+)"[^>]*title="([^"]*)"[^>]*>/gi;
    var match;

    while ((match = anchorRegex.exec(html)) !== null) {
        var url = match[1];
        var title = PluginUtils.cleanText(match[2]);
        var slug = url.replace(/https?:\/\/[^\/]+\//, "").replace(/\/$/, "");
        if (!slug || foundSlugs[slug]) continue;

        // Look backwards in html from this anchor position for the img and tick-rate
        // Get a chunk of html around this anchor (500 chars before + 300 after)
        var start = Math.max(0, match.index - 600);
        var end = Math.min(html.length, match.index + match[0].length + 300);
        var context = html.substring(start, end);

        // Thumbnail
        var imgMatch = context.match(/<img[^>]+class="[^"]*film-poster-img[^"]*"[^>]+src="([^"]+)"/i) ||
                       context.match(/<img[^>]+src="([^"]+)"[^>]+class="[^"]*film-poster-img/i);
        var thumb = imgMatch ? imgMatch[1] : "";

        // Episode badge
        var tickMatch = context.match(/<div[^>]*class="[^"]*tick-rate[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
        var episode = tickMatch ? PluginUtils.cleanText(tickMatch[1]) : "4K";

        movies.push({
            id: slug,
            title: title || slug,
            posterUrl: thumb,
            backdropUrl: thumb,
            quality: "4K",
            episode_current: episode,
            lang: "Vietsub"
        });
        foundSlugs[slug] = true;
    }

    // Pagination
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

/**
 * Parse movie detail page. Episodes use <a class="ep-item" href="...tap-X.html">Tập X</a>
 */
function parseMovieDetail(html) {
    try {
        // Title
        var titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) ||
                         html.match(/<h2[^>]*class="[^"]*film-name[^"]*"[^>]*>([\s\S]*?)<\/h2>/i);
        var title = titleMatch ? PluginUtils.cleanText(titleMatch[1]) : "";

        // Poster from og:image
        var poster = "";
        var ogMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i);
        if (ogMatch) poster = ogMatch[1];

        // Description from meta or .film-description
        var desc = "";
        var descMatch = html.match(/<div[^>]*class="[^"]*film-description[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
        if (descMatch) {
            desc = PluginUtils.cleanText(descMatch[1]);
        } else {
            var descMeta = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
            if (descMeta) desc = PluginUtils.cleanText(descMeta[1]);
        }

        // Episodes: <a class="ep-item" href="...tap-X.html">Tập X</a>
        var episodes = [];
        var seen = {};
        var epRegex = /<a[^>]+class="[^"]*ep-item[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
        var epMatch;
        while ((epMatch = epRegex.exec(html)) !== null) {
            var epUrl = epMatch[1];
            var epLabel = PluginUtils.cleanText(epMatch[2]);
            // slug = full path minus domain
            var epSlug = epUrl.replace(/https?:\/\/[^\/]+\//, "").replace(/\/$/, "");
            if (!seen[epSlug]) {
                seen[epSlug] = true;
                episodes.push({ id: epSlug, name: epLabel || epSlug, slug: epSlug });
            }
        }

        // Fallback: any link matching /tap-X.html
        if (episodes.length === 0) {
            var fallbackEpRegex = /<a[^>]+href="(https?:\/\/yanhh3d\.ee\/[^"]+\/tap-[^"]+\.html)"[^>]*>([\s\S]*?)<\/a>/gi;
            var fem;
            while ((fem = fallbackEpRegex.exec(html)) !== null) {
                var fUrl = fem[1];
                var fLabel = PluginUtils.cleanText(fem[2]);
                var fSlug = fUrl.replace(/https?:\/\/[^\/]+\//, "").replace(/\/$/, "");
                if (!seen[fSlug]) {
                    seen[fSlug] = true;
                    episodes.push({ id: fSlug, name: fLabel || fSlug, slug: fSlug });
                }
            }
        }

        // Sort ascending by episode number
        episodes.sort(function(a, b) {
            var na = 0; var nb = 0;
            var ma = a.slug.match(/tap-(\d+)/i); if (ma) na = parseInt(ma[1]);
            var mb = b.slug.match(/tap-(\d+)/i); if (mb) nb = parseInt(mb[1]);
            return na - nb;
        });

        var servers = [];
        if (episodes.length > 0) {
            servers.push({ name: "YanHH3D", episodes: episodes });
        }

        return JSON.stringify({
            title: title,
            posterUrl: poster,
            backdropUrl: poster,
            description: desc,
            servers: servers,
            quality: "4K",
            lang: "Vietsub"
        });
    } catch (e) { return "null"; }
}

/**
 * Parse episode player page. Video is in iframe (e.g., streamfree.vip)
 * The GAS engine calls getUrlDetail(slug) which returns the episode page URL,
 * then fetches it, and passes the HTML here.
 */
function parseDetailResponse(html) {
    try {
        var streamUrl = "";

        // 1) Look for iframe src (streamfree.vip or other embed)
        var iframeRegex = /<iframe[^>]+src=["']([^"']+)["'][^>]*>/gi;
        var ifrMatch;
        while ((ifrMatch = iframeRegex.exec(html)) !== null) {
            var src = ifrMatch[1].replace(/&amp;/g, "&");
            // Skip ad/tracker iframes
            if (src.indexOf("google") !== -1 || src.indexOf("ads") !== -1) continue;
            if (src.indexOf("//") === 0) src = "https:" + src;
            streamUrl = src;
            break;
        }

        // 2) Look for direct m3u8/mp4 URLs
        if (!streamUrl) {
            var m3u8 = html.match(/(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/i);
            if (m3u8) streamUrl = m3u8[1];
        }

        // 3) Look for "file":"..." or "url":"..." in JSON
        if (!streamUrl) {
            var fileM = html.match(/"file"\s*:\s*"([^"]+)"/i);
            if (fileM) streamUrl = fileM[1].replace(/\\\//g, "/");
        }

        if (streamUrl) {
            return JSON.stringify({
                url: streamUrl,
                headers: {
                    "Referer": "https://yanhh3d.ee/",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                },
                subtitles: []
            });
        }
        return "{}";
    } catch (e) { return "{}"; }
}
