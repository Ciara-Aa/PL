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

function parseListResponse(html) {
    var movies = [];
    var foundSlugs = {};
    var itemRegex = /<(?:article|div)[^>]*class="[^"]*(?:halim-item|thumb|halim-thumb)[^"]*"[^>]*>([\s\S]*?)<\/(?:article|div)>/gi;
    var match;

    while ((match = itemRegex.exec(html)) !== null) {
        var itemHtml = match[1];
        var linkMatch = itemHtml.match(/<a[^>]+href="([^"]+)"[^>]*title=/i) || itemHtml.match(/<a[^>]+href="([^"]+)"/i);
        if (!linkMatch) continue;

        var url = linkMatch[1];
        if (url.indexOf("http") === -1) url = "https://yanhh3d.ee" + (url.indexOf("/") === 0 ? "" : "/") + url;
        var slug = url.replace(/https?:\/\/[^\/]+\//, "").replace(/\/$/, "");

        var titleMatch = itemHtml.match(/title="([^"]+)"/i) || itemHtml.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
        var title = titleMatch ? PluginUtils.cleanText(titleMatch[1]) : "";

        var thumbMatch = itemHtml.match(/<img[^>]+src="([^"]+)"/i) || itemHtml.match(/<img[^>]+data-src="([^"]+)"/i);
        var thumb = thumbMatch ? thumbMatch[1] : "";

        var episodeMatch = itemHtml.match(/<span[^>]*class="[^"]*episode[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
        var episode = episodeMatch ? PluginUtils.cleanText(episodeMatch[1]) : "HD";

        if (slug && !foundSlugs[slug]) {
            movies.push({
                id: slug,
                title: title || "Không tiêu đề",
                posterUrl: thumb,
                backdropUrl: thumb,
                quality: "4K",
                episode_current: episode,
                lang: "Vietsub"
            });
            foundSlugs[slug] = true;
        }
    }

    var totalPages = 1;
    var currentPage = 1;
    var currentMatch = html.match(/<span[^>]*class="[^"]*current[^"]*"[^>]*>(\d+)<\/span>/i);
    if (currentMatch) currentPage = parseInt(currentMatch[1]);
    
    var pageRegex = /page\/(\d+)\//g;
    var pageMatch;
    while ((pageMatch = pageRegex.exec(html)) !== null) {
        var p = parseInt(pageMatch[1]);
        if (p > totalPages) totalPages = p;
    }

    return JSON.stringify({
        items: movies,
        pagination: { currentPage: currentPage, totalPages: totalPages || 1 }
    });
}

function parseSearchResponse(html) { return parseListResponse(html); }

function parseMovieDetail(html) {
    try {
        var titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
        var title = titleMatch ? PluginUtils.cleanText(titleMatch[1]) : "";

        var poster = "";
        var posterMetaMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i);
        if (posterMetaMatch) poster = posterMetaMatch[1];

        var description = "";
        var contentMatch = html.match(/<div[^>]*class="[^"]*(?:entry-content|video-item-info)[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
        if (contentMatch) description = PluginUtils.cleanText(contentMatch[1]);

        var postIdMatch = html.match(/post_id["']?\s*:\s*["']?(\d+)["']?/i) || html.match(/data-post-id=["'](\d+)["']/i);
        var postId = postIdMatch ? postIdMatch[1] : "";

        var servers = [];
        var listRegex = /<ul[^>]*id="listsv-(\d+)"[^>]*>([\s\S]*?)<\/ul>/gi;
        var listMatch;
        while ((listMatch = listRegex.exec(html)) !== null) {
            var svId = listMatch[1];
            var listHtml = listMatch[2];
            var episodes = [];
            var epRegex = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
            var epMatch;
            while ((epMatch = epRegex.exec(listHtml)) !== null) {
                var epUrl = epMatch[1];
                var epName = PluginUtils.cleanText(epMatch[2]);
                var epSlugMatch = epUrl.match(/\/([^\/.]+)\.html/);
                var epSlug = epSlugMatch ? epSlugMatch[1].replace(/-sv\d+$/, "") : "";
                episodes.push({
                    id: epSlug + "|" + postId + "|" + svId,
                    name: "Tập " + epName,
                    slug: epSlug
                });
            }
            if (episodes.length > 0) {
                episodes.reverse();
                servers.push({ name: "Server " + svId, episodes: episodes });
            }
        }

        return JSON.stringify({
            title: title,
            posterUrl: poster,
            description: description,
            servers: servers,
            quality: "4K",
            lang: "Vietsub"
        });
    } catch (e) { return "null"; }
}

function parseDetailResponse(html) {
    try {
        var streamUrl = "";
        var fileM = html.match(/"file"\s*:\s*"([^"]+)"/i) || html.match(/"url"\s*:\s*"([^"]+)"/i);
        if (fileM) streamUrl = fileM[1].replace(/\\\/|\\\\/g, "/");

        if (!streamUrl) {
            var iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
            if (iframeMatch) streamUrl = iframeMatch[1];
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
