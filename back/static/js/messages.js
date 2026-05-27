let activeConversationId = null;
let activeConversationUser = null;
let conversationsCache = [];
let messagesTimer = null;

function getToken() {
    return localStorage.getItem("token");
}

function getStoredUser() {
    try {
        const user = localStorage.getItem("user");
        return user ? JSON.parse(user) : null;
    } catch {
        return null;
    }
}

function authHeaders() {
    const token = getToken();
    return token ? { "Authorization": `Bearer ${token}` } : {};
}

async function safeJson(response) {
    try {
        return await response.json();
    } catch {
        return {};
    }
}

function escapeHtml(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatMessageDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("fr-FR");
}

function getDefaultAvatar() {
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">
            <rect width="120" height="120" rx="60" fill="#e8f5fd"/>
            <text x="50%" y="55%" text-anchor="middle" font-size="44" font-family="Arial" fill="#1d9bf0" font-weight="bold">T</text>
        </svg>
    `;
    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

function avatarUrl(url) {
    return url || getDefaultAvatar();
}

async function loadConversations() {
    const container = document.getElementById("conversations-list");
    if (!container) return;

    const response = await fetch("/api/messages/conversations/", {
        headers: authHeaders()
    });

    const data = await safeJson(response);

    if (!response.ok) {
        container.innerHTML = `<p class="form-message error">Impossible de charger les conversations.</p>`;
        return;
    }

    conversationsCache = data;

    if (!data.length) {
        container.innerHTML = `<p class="muted-text messages-empty-small">Aucune conversation.</p>`;
        return;
    }

    container.innerHTML = data.map(conversation => {
        const other = conversation.other_user || {};
        const last = conversation.last_message;
        const unread = conversation.unread_count || 0;

        return `
            <button type="button" class="conversation-row ${Number(conversation.id) === Number(activeConversationId) ? "active" : ""}" onclick="openConversation(${conversation.id})">
                <img src="${avatarUrl(other.profile_pic)}" alt="avatar" onerror="this.src='${getDefaultAvatar()}'">
                <span>
                    <strong>@${escapeHtml(other.username || "unknown")}</strong>
                    <small>${last ? escapeHtml(last.content).slice(0, 55) : "Nouvelle conversation"}</small>
                </span>
                ${unread ? `<em>${unread > 9 ? "9+" : unread}</em>` : ""}
            </button>
        `;
    }).join("");
}

async function openConversation(conversationId) {
    activeConversationId = conversationId;

    const empty = document.getElementById("messages-empty");
    const active = document.getElementById("messages-active");

    if (empty) empty.style.display = "none";
    if (active) active.style.display = "block";

    const conversation = conversationsCache.find(item => Number(item.id) === Number(conversationId));
    const other = conversation ? conversation.other_user : null;
    const title = document.getElementById("active-conversation-name");
    if (title && other) title.textContent = `@${other.username}`;

    await loadMessages();
    await loadConversations();

    clearInterval(messagesTimer);
    messagesTimer = setInterval(loadMessages, 10000);
}

async function loadMessages() {
    if (!activeConversationId) return;

    const response = await fetch(`/api/messages/conversations/${activeConversationId}/messages/`, {
        headers: authHeaders()
    });

    const data = await safeJson(response);
    const list = document.getElementById("messages-list");
    const currentUser = getStoredUser();

    if (!response.ok || !list) return;

    list.innerHTML = data.map(message => {
        const mine = currentUser && Number(currentUser.id) === Number(message.sender_id);
        return `
            <div class="message-bubble ${mine ? "mine" : "other"}">
                <p>${escapeHtml(message.content)}</p>
                <small>${escapeHtml(message.sender_username)} · ${formatMessageDate(message.created_at)}</small>
            </div>
        `;
    }).join("");

    list.scrollTop = list.scrollHeight;
}

async function sendMessage(event) {
    event.preventDefault();

    if (!activeConversationId) return;

    const input = document.getElementById("message-input");
    const content = input ? input.value.trim() : "";

    if (!content) return;

    const response = await fetch(`/api/messages/conversations/${activeConversationId}/messages/`, {
        method: "POST",
        headers: {
            ...authHeaders(),
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ content })
    });

    if (!response.ok) {
        console.error("Message error", await safeJson(response));
        return;
    }

    input.value = "";
    await loadMessages();
    await loadConversations();
}

async function startConversationFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get("user_id");

    if (!userId) return;

    const response = await fetch("/api/messages/conversations/start/", {
        method: "POST",
        headers: {
            ...authHeaders(),
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ user_id: userId })
    });

    const data = await safeJson(response);

    if (response.ok && data.id) {
        activeConversationUser = data.other_user;
        conversationsCache = [data, ...conversationsCache.filter(item => Number(item.id) !== Number(data.id))];
        await openConversation(data.id);
    }
}

function logoutUser() {
    localStorage.clear();
    window.location.href = "/";
}

function updateAuthDisplay() {
    const authenticated = Boolean(getToken());

    document.querySelectorAll(".auth-only").forEach(el => {
        el.style.display = authenticated ? "" : "none";
    });

    document.querySelectorAll(".guest-only").forEach(el => {
        el.style.display = authenticated ? "none" : "";
    });
}

document.addEventListener("DOMContentLoaded", async function () {
    updateAuthDisplay();

    document.getElementById("logout-btn")?.addEventListener("click", logoutUser);
    document.getElementById("message-form")?.addEventListener("submit", sendMessage);

    if (!getToken()) return;

    await loadConversations();
    await startConversationFromUrl();

    setInterval(loadConversations, 20000);
});

window.openConversation = openConversation;
window.logoutUser = logoutUser;
