// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "yanhh3d",
        "name": "YanHH3D",
        "version": "1.0.2",
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

/**
 * getUrlDetail handles two cases:
 * 1) Normal slug like "tu-tien/tien-nghich" → returns page URL for detail
 * 2) Episode ID with pipe: "chapter_st|post_id|server_type" → returns AJAX player URL
 *    Example: "tap-130|1010|pro" → player.php?action=dox_ajax_player&post_id=1010&chapter_st=tap-130&type=pro
 */
function getUrlDetail(slug) {
    if (!slug) return "";

    // Check for our special encoded episode ID: chapter_st|post_id|type
    if (slug.indexOf("|") !== -1) {
        var parts = slug.split("|");
        if (parts.length >= 3) {
            var chapterSt = parts[0];  // e.g. "tap-130"
            var postId = parts[1];     // e.g. "1010"
            var svType = parts[2];     // e.g. "pro"
            return "https://yanhh3d.ee/player/player.php?action=dox_ajax_player&post_id=" + postId + "&chapter_st=" + chapterSt + "&type=" + svType + "&sv=1";
        }
    }

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
 * Parse list page. Each card has an <a class="film-poster-ahref" href="..." title="...">
 * Strategy: find all film-poster-ahref anchors (one per card) and look ~600 chars backwards
 * for img.film-poster-img and div.tick-rate.
 */
function parseListResponse(html) {
    var movies = [];
    var foundSlugs = {};

    var anchorRegex = /<a[^>]+class="[^"]*film-poster-ahref[^"]*"[^>]+href="([^"]+)"[^>]*title="([^"]*)"[^>]*>/gi;
    var match;

    while ((match = anchorRegex.exec(html)) !== null) {
        var url = match[1];
        var title = PluginUtils.cleanText(match[2]);
        var slug = url.replace(/https?:\/\/[^\/]+\//, "").replace(/\/$/, "");
        if (!slug || foundSlugs[slug]) continue;

        // Context around anchor to find img and episode badge
        var start = Math.max(0, match.index - 600);
        var end = Math.min(html.length, match.index + match[0].length + 300);
        var context = html.substring(start, end);

        var imgMatch = context.match(/<img[^>]+class="[^"]*film-poster-img[^"]*"[^>]+src="([^"]+)"/i) ||
                       context.match(/<img[^>]+src="([^"]+)"[^>]+class="[^"]*film-poster-img/i);
        var thumb = imgMatch ? imgMatch[1] : "";

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
 * Parse movie detail page.
 * Episodes use: <a class="ep-item" href="..." data-ep="tap-130" data-post-id="1010">Tập 130</a>
 * We build each server separately:
 * - Each server button: <span data-type="pro">VIETSUB 1080 V2</span>
 * - We create multiple server groups, each with all episodes encoded as "chapter_st|post_id|type"
 *
 * Available servers on yanhh3d.ee:
 *   pro (Vietsub 1080 V2), tiktik (Vietsub 1080 V1),
 *   vip4k (Vietsub 4K V1), vip4k_v2 (Vietsub 4K V2),
 *   tiktm (TM 1080 V1), pro_tm (TM 1080 V2),
 *   vip4ktm (TM 4K V1), vip4ktm_v2 (TM 4K V2)
 */
function parseMovieDetail(html) {
    try {
        // Title
        var titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
        var title = titleMatch ? PluginUtils.cleanText(titleMatch[1]) : "";

        // Poster
        var poster = "";
        var ogMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i);
        if (ogMatch) poster = ogMatch[1];

        // Description
        var desc = "";
        var descMatch = html.match(/<div[^>]*class="[^"]*film-description[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
        if (descMatch) desc = PluginUtils.cleanText(descMatch[1]);
        if (!desc) {
            var descMeta = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
            if (descMeta) desc = PluginUtils.cleanText(descMeta[1]);
        }

        // Extract server types from <span data-type="...">Server Name</span>
        var serverTypes = [];
        var svRegex = /<span[^>]+data-type="([^"]+)"[^>]*>([\s\S]*?)<\/span>/gi;
        var svMatch;
        while ((svMatch = svRegex.exec(html)) !== null) {
            var svType = svMatch[1];
            var svName = PluginUtils.cleanText(svMatch[2]);
            // Skip if it looks like a non-server span
            if (svType && svName && svName.length < 50) {
                serverTypes.push({ type: svType, name: svName });
            }
        }

        // Default servers if none found
        if (serverTypes.length === 0) {
            serverTypes = [
                { type: "pro", name: "VIETSUB 1080 V2" },
                { type: "vip4k", name: "VIETSUB 4K V1" }
            ];
        }

        // Extract episodes from <a class="ep-item" data-ep="tap-130" data-post-id="1010">
        var rawEpisodes = [];
        var seen = {};
        var epRegex = /<a[^>]+class="[^"]*ep-item[^"]*"[^>]*data-ep="([^"]*)"[^>]*data-post-id="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
        var epMatch;
        while ((epMatch = epRegex.exec(html)) !== null) {
            var dataEp = epMatch[1];      // e.g. "tap-130"
            var dataPostId = epMatch[2];  // e.g. "1010"
            var epLabel = PluginUtils.cleanText(epMatch[3]);
            if (!seen[dataEp]) {
                seen[dataEp] = true;
                rawEpisodes.push({ ep: dataEp, postId: dataPostId, label: epLabel });
            }
        }

        // Fallback: try reversed attribute order (data-post-id before data-ep)
        if (rawEpisodes.length === 0) {
            var epRegex2 = /<a[^>]+class="[^"]*ep-item[^"]*"[^>]*data-post-id="([^"]*)"[^>]*data-ep="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
            var epMatch2;
            while ((epMatch2 = epRegex2.exec(html)) !== null) {
                var dataPostId2 = epMatch2[1];
                var dataEp2 = epMatch2[2];
                var epLabel2 = PluginUtils.cleanText(epMatch2[3]);
                if (!seen[dataEp2]) {
                    seen[dataEp2] = true;
                    rawEpisodes.push({ ep: dataEp2, postId: dataPostId2, label: epLabel2 });
                }
            }
        }

        // Fallback: generic ep-item with href containing .html
        if (rawEpisodes.length === 0) {
            var epRegex3 = /<a[^>]+class="[^"]*ep-item[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
            var epMatch3;
            while ((epMatch3 = epRegex3.exec(html)) !== null) {
                var epUrl3 = epMatch3[1];
                var epLabel3 = PluginUtils.cleanText(epMatch3[2]);
                var epSlug3 = epUrl3.match(/\/(tap-[^\/]+)\.html/i);
                if (epSlug3 && !seen[epSlug3[1]]) {
                    seen[epSlug3[1]] = true;
                    rawEpisodes.push({ ep: epSlug3[1], postId: "", label: epLabel3 });
                }
            }
        }

        // Sort episodes ascending by number
        rawEpisodes.sort(function(a, b) {
            var na = 0; var nb = 0;
            var ma = a.ep.match(/tap-(\d+)/i); if (ma) na = parseInt(ma[1]);
            var mb = b.ep.match(/tap-(\d+)/i); if (mb) nb = parseInt(mb[1]);
            return na - nb;
        });

        // Build servers — each server type gets the full episode list
        var servers = [];
        for (var s = 0; s < serverTypes.length; s++) {
            var sv = serverTypes[s];
            var episodes = [];
            for (var e = 0; e < rawEpisodes.length; e++) {
                var ep = rawEpisodes[e];
                // Encode as "chapter_st|post_id|server_type" for getUrlDetail
                var epId = ep.ep + "|" + ep.postId + "|" + sv.type;
                episodes.push({
                    id: epId,
                    name: ep.label || ep.ep,
                    slug: ep.ep
                });
            }
            if (episodes.length > 0) {
                servers.push({ name: sv.name, episodes: episodes });
            }
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
 * Parse the AJAX player response from player.php.
 * The response contains an iframe with src pointing to the actual embed player.
 * Example response: <iframe src="https://streamfree.vip/embed/vt/XXXX" ...></iframe>
 */
function parseDetailResponse(html) {
    try {
        var streamUrl = "";

        // 1) iframe embed (most common — streamfree.vip, etc.)
        var iframeRegex = /<iframe[^>]+src=["']([^"']+)["'][^>]*>/gi;
        var ifrMatch;
        while ((ifrMatch = iframeRegex.exec(html)) !== null) {
            var src = ifrMatch[1].replace(/&amp;/g, "&");
            if (src.indexOf("google") !== -1 || src.indexOf("ads") !== -1) continue;
            if (src.indexOf("//") === 0) src = "https:" + src;
            streamUrl = src;
            break;
        }

        // 2) Direct m3u8/mp4 URL
        if (!streamUrl) {
            var m3u8 = html.match(/(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/i);
            if (m3u8) streamUrl = m3u8[1];
        }
        if (!streamUrl) {
            var mp4 = html.match(/(https?:\/\/[^"'\s]+\.mp4[^"'\s]*)/i);
            if (mp4) streamUrl = mp4[1];
        }

        // 3) JSON "file":"..." or "url":"..."
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
