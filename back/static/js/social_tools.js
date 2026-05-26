function socialGetToken() {
    return localStorage.getItem("token");
}

function socialAuthHeaders() {
    const token = socialGetToken();
    return token ? { "Authorization": `Bearer ${token}` } : {};
}

async function socialSafeJson(response) {
    try {
        return await response.json();
    } catch {
        return {};
    }
}

function ensureSearchModal() {
    let modal = document.getElementById("search-modal");

    if (modal) return modal;

    modal = document.createElement("div");
    modal.id = "search-modal";
    modal.style.display = "none";
    modal.innerHTML = `
        <div class="social-modal-backdrop"></div>
        <div class="social-modal-box">
            <div class="social-modal-top">
                <h3>Recherche</h3>
                <button type="button" id="search-close-btn">×</button>
            </div>

            <input id="search-input" type="text" placeholder="Chercher un utilisateur, un post, #tag ou @username...">

            <div id="search-results" class="search-results"></div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("search-close-btn").onclick = function () {
        modal.style.display = "none";
    };

    document.querySelector("#search-modal .social-modal-backdrop").onclick = function () {
        modal.style.display = "none";
    };

    const input = document.getElementById("search-input");
    let searchTimer = null;

    input.addEventListener("input", function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => performSocialSearch(input.value), 250);
    });

    return modal;
}

function openSearchModal(query = "") {
    const modal = ensureSearchModal();
    const input = document.getElementById("search-input");

    modal.style.display = "flex";
    input.value = query;
    input.focus();

    if (query) {
        performSocialSearch(query);
    }
}

async function performSocialSearch(query) {
    const results = document.getElementById("search-results");
    const cleanQuery = (query || "").trim();

    if (!results) return;

    if (!cleanQuery) {
        results.innerHTML = `<p class="muted-text">Écris quelque chose pour lancer la recherche.</p>`;
        return;
    }

    const response = await fetch(`/api/search/?q=${encodeURIComponent(cleanQuery)}`);
    const data = await socialSafeJson(response);

    if (!response.ok) {
        results.innerHTML = `<p class="form-message error">Erreur pendant la recherche.</p>`;
        return;
    }

    const usersHtml = (data.users || []).map(user => `
        <a class="search-row" href="/profile/?user_id=${user.id}">
            <strong>@${user.username}</strong>
            <span>${[user.first_name, user.last_name].filter(Boolean).join(" ")}</span>
        </a>
    `).join("");

    const hashtagsHtml = (data.hashtags || []).map(item => `
        <button type="button" class="search-row search-hashtag" onclick="performSocialSearch('${item.label.replace("'", "\\'")}')">
            <strong>${item.label}</strong>
            <span>Voir les posts liés</span>
        </button>
    `).join("");

    const postsHtml = (data.posts || []).map(post => `
        <a class="search-row" href="/#post-${post.id}">
            <strong>${post.author}</strong>
            <span>${escapeForSearch(post.content).slice(0, 120)}</span>
        </a>
    `).join("");

    results.innerHTML = `
        <div class="search-section">
            <h4>Utilisateurs</h4>
            ${usersHtml || `<p class="muted-text">Aucun utilisateur.</p>`}
        </div>

        <div class="search-section">
            <h4>Hashtags</h4>
            ${hashtagsHtml || `<p class="muted-text">Aucun hashtag.</p>`}
        </div>

        <div class="search-section">
            <h4>Posts</h4>
            ${postsHtml || `<p class="muted-text">Aucun post.</p>`}
        </div>
    `;
}

function escapeForSearch(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

function ensureNotificationsPanel() {
    let panel = document.getElementById("notifications-panel");

    if (panel) return panel;

    panel = document.createElement("div");
    panel.id = "notifications-panel";
    panel.className = "notifications-panel";
    panel.style.display = "none";
    panel.innerHTML = `
        <div class="notifications-top">
            <strong>Notifications</strong>
            <button type="button" id="notifications-mark-read">Tout lire</button>
        </div>
        <div id="notifications-list"></div>
    `;

    document.body.appendChild(panel);

    document.getElementById("notifications-mark-read").onclick = async function () {
        await fetch("/api/notifications/read/", {
            method: "POST",
            headers: socialAuthHeaders(),
        });
        await loadNotifications(true);
    };

    return panel;
}

async function loadNotifications(showPanel = false) {
    if (!socialGetToken()) return;

    const response = await fetch("/api/notifications/", {
        headers: socialAuthHeaders(),
    });

    const data = await socialSafeJson(response);
    if (!response.ok) return;

    const countEl = document.getElementById("notifications-count");
    if (countEl) {
        const count = data.unread_count || 0;
        countEl.textContent = count > 9 ? "9+" : String(count);
        countEl.style.display = count ? "inline-flex" : "none";
    }

    const panel = ensureNotificationsPanel();
    const list = document.getElementById("notifications-list");

    if (list) {
        const notifications = data.notifications || [];

        if (!notifications.length) {
            list.innerHTML = `<p class="muted-text notification-empty">Aucune notification.</p>`;
        } else {
            list.innerHTML = notifications.map(item => `
                <a class="notification-row ${item.is_read ? "" : "unread"}" href="${notificationTargetUrl(item)}">
                    <span>${escapeForSearch(item.message)}</span>
                    <small>${formatNotificationDate(item.created_at)}</small>
                </a>
            `).join("");
        }
    }

    if (showPanel) {
        toggleNotificationsPanel(true);
    }
}

function notificationTargetUrl(item) {
    if (item.post_id) return `/#post-${item.post_id}`;
    if (item.sender_id) return `/profile/?user_id=${item.sender_id}`;
    return "/";
}

function formatNotificationDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("fr-FR");
}

function toggleNotificationsPanel(forceOpen = null) {
    const panel = ensureNotificationsPanel();
    const btn = document.getElementById("notifications-open-btn");
    const rect = btn ? btn.getBoundingClientRect() : null;

    if (rect) {
        panel.style.top = `${rect.bottom + 8 + window.scrollY}px`;
        panel.style.left = `${Math.max(12, rect.right - 340 + window.scrollX)}px`;
    }

    const shouldOpen = forceOpen === null ? panel.style.display === "none" : forceOpen;
    panel.style.display = shouldOpen ? "block" : "none";
}

function closeNotificationsPanel() {
    const panel = document.getElementById("notifications-panel");
    if (panel) panel.style.display = "none";
}

function bindSocialTools() {
    document.querySelectorAll("#search-open, #search-open-btn").forEach(btn => {
        btn.addEventListener("click", function (event) {
            event.preventDefault();
            openSearchModal();
        });
    });

    const notificationsBtn = document.getElementById("notifications-open-btn");
    if (notificationsBtn) {
        notificationsBtn.addEventListener("click", async function (event) {
            event.preventDefault();
            event.stopPropagation();
            await loadNotifications(true);
        });
    }


    document.addEventListener("click", function (event) {
        const panel = document.getElementById("notifications-panel");
        const btn = document.getElementById("notifications-open-btn");

        if (!panel || panel.style.display === "none") return;
        if (panel.contains(event.target) || (btn && btn.contains(event.target))) return;

        closeNotificationsPanel();
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeNotificationsPanel();
            const searchModal = document.getElementById("search-modal");
            if (searchModal) searchModal.style.display = "none";
        }
    });

    const params = new URLSearchParams(window.location.search);
    const initialSearch = params.get("search");

    if (initialSearch) {
        openSearchModal(initialSearch);
    }

    loadNotifications(false);
    setInterval(() => loadNotifications(false), 20000);
}

document.addEventListener("DOMContentLoaded", bindSocialTools);
