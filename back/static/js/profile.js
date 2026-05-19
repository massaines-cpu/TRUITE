let reactionTypes = [];
let profilePosts = [];
let currentUser = null;
let profileUser = null;
let profileUserId = null;

const DEFAULT_REACTIONS = [
    { slug: "like", label: "J'aime", emoji: "👍" },
    { slug: "love", label: "J'adore", emoji: "❤️" },
    { slug: "funny", label: "Drôle", emoji: "😂" },
    { slug: "dislike", label: "Je déteste", emoji: "👎" },
    { slug: "not_interested", label: "Ça ne m'intéresse pas", emoji: "😐" }
];

function getToken() {
    return localStorage.getItem("token");
}

function getStoredUser() {
    try {
        const user = localStorage.getItem("user");
        return user ? JSON.parse(user) : null;
    } catch (error) {
        return null;
    }
}

function getProfileUserId() {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("user_id");
    if (fromUrl) return fromUrl;
    const stored = getStoredUser();
    return stored ? stored.id : localStorage.getItem("user_id");
}

function authHeaders() {
    const token = getToken();
    return token ? { "Authorization": `Bearer ${token}` } : {};
}

function isAuthenticated() {
    return Boolean(getToken());
}

function isMyProfile() {
    return currentUser && profileUser && Number(currentUser.id) === Number(profileUser.id);
}

document.addEventListener("DOMContentLoaded", async function () {
    currentUser = getStoredUser();
    profileUserId = getProfileUserId();

    if (!profileUserId) {
        window.location.href = "/login/";
        return;
    }

    updateAuthDisplay();
    bindPostForm();
    await loadReactionTypes();
    await fetchUserProfile();
    await loadSuggestions();
});

function updateAuthDisplay() {
    const authenticated = isAuthenticated();

    document.querySelectorAll(".auth-only").forEach(element => {
        element.style.display = authenticated ? "" : "none";
    });

    document.querySelectorAll(".guest-only").forEach(element => {
        element.style.display = authenticated ? "none" : "";
    });
}

function updateProfileMode() {
    document.querySelectorAll(".self-profile-only").forEach(element => {
        element.style.display = isMyProfile() ? "" : "none";
    });

    document.querySelectorAll(".other-profile-only").forEach(element => {
        element.style.display = !isMyProfile() && isAuthenticated() ? "" : "none";
    });
}

function bindPostForm() {
    const form = document.getElementById("profile-post-form");
    if (!form) return;

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const content = document.getElementById("profile-post-content").value.trim();
        const image = document.getElementById("profile-post-image").files[0];

        if (!content) {
            showProfileFormMessage("Le texte est obligatoire.", true);
            return;
        }

        if (!image) {
            showProfileFormMessage("L'image est obligatoire pour chaque post.", true);
            return;
        }

        const formData = new FormData();
        formData.append("content", content);
        formData.append("image", image);

        const response = await fetch("/api/posts/", {
            method: "POST",
            headers: authHeaders(),
            body: formData
        });

        const data = await safeJson(response);

        if (!response.ok) {
            showProfileFormMessage(data.error || data.image?.[0] || data.content?.[0] || "Erreur lors de la création du post.", true);
            return;
        }

        form.reset();
        showProfileFormMessage("Post publié.", false);
        await fetchUserProfile();
    });
}

function showProfileFormMessage(text, isError) {
    const message = document.getElementById("profile-post-form-message");
    if (!message) return;
    message.textContent = text;
    message.className = isError ? "form-message error" : "form-message success";
}

async function safeJson(response) {
    try {
        return await response.json();
    } catch (error) {
        return {};
    }
}

async function loadReactionTypes() {
    const response = await fetch("/api/reactions/types/");
    const data = response.ok ? await response.json() : [];
    reactionTypes = data.length ? data : DEFAULT_REACTIONS;
}

async function fetchUserProfile() {
    try {
        const userResponse = await fetch(`/api/accounts/profile/${profileUserId}/`);

        if (!userResponse.ok) {
            showProfileError();
            return;
        }

        const userData = await userResponse.json();
        profileUser = userData.user ? userData.user : userData;

        const postsResponse = await fetch(`/api/posts/user/${profileUserId}/`, {
            headers: authHeaders()
        });
        const posts = postsResponse.ok ? await postsResponse.json() : [];

        renderProfile(profileUser, posts);
        await loadFollowStatus(profileUser.id);
        updateAuthDisplay();
        updateProfileMode();

    } catch (error) {
        console.error("Erreur profil:", error);
        showProfileError();
    }
}

function bindCommentButtons() {
    document.querySelectorAll(".comment-submit-btn").forEach(button => {
        button.addEventListener("click", function () {
            createComment(this.dataset.postId);
        });
    });
}

function renderProfile(user, posts) {
    document.getElementById("user-fullname").textContent =
        `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username;

    document.getElementById("user-handle").textContent = `@${user.username}`;
    document.getElementById("user-email").textContent = user.email || "—";

    const img = document.getElementById("profile-img");

    img.onerror = function () { avatarOnError(img, user.sex); };
    img.src = cleanAvatarUrl(user.profile_pic, user.sex);

    document.getElementById("posts-count").textContent = posts.length;
    profilePosts = posts;
    renderPosts(posts);
    bindCommentButtons();
}

async function loadFollowStatus(userId) {
    const response = await fetch(`/api/follows/status/${userId}/`, { headers: authHeaders() });
    if (!response.ok) return;

    const data = await response.json();
    const followers = document.getElementById("followers-count");
    const following = document.getElementById("following-count");
    const button = document.getElementById("profile-follow-btn");

    if (followers) followers.textContent = data.followers_count || 0;
    if (following) following.textContent = data.following_count || 0;

    if (button) {
        button.textContent = data.is_following ? "Abonné" : "Suivre";
        button.classList.toggle("following", Boolean(data.is_following));
    }
}

function getDefaultAvatar(sex = null) {
    if (sex && sex.toLowerCase() === "female") {
        return "/static/images/default-female-avatar.png";
    }
    return "/static/images/default-male-avatar.png";
}

function cleanAvatarUrl(url, sex = null) {
    if (!url) return getDefaultAvatar(sex);

    const value = String(url);

    if (value.includes("/media/profiles/dunetocat.png")) {
        return getDefaultAvatar(sex);
    }

    if (value.includes("/media/profiles/default")) {
        return getDefaultAvatar(sex);
    }

    return value;
}

function fixImageUrl(url) {
    if (!url) return "";
    return String(url);
}

function avatarOnError(img, sex) {
    img.onerror = null;
    img.src = getDefaultAvatar(sex);
}

function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("fr-FR");
}

function escapeHtml(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function profileUrl(userId) {
    return `/profile/?user_id=${userId}`;
}

function renderPosts(posts) {
    const container = document.getElementById("profile-posts");
    if (!container) return;

    if (!posts.length) {
        container.innerHTML = `<div class="empty-posts">Aucun post pour le moment.</div>`;
        return;
    }

    container.innerHTML = posts.map(post => renderPost(post)).join("");
}

function renderPost(post) {
    const avatar = cleanAvatarUrl(post.author_profile_pic, post.author_sex);

    return `
        <article class="tweet-card" id="post-${post.id}">
            <a class="tweet-avatar" href="${profileUrl(post.author_id)}">
                <img src="${avatar}" alt="avatar" onerror="avatarOnError(this, '${escapeHtml(post.author_sex || "")}')">
            </a>

            <div class="tweet-body">
                <div class="tweet-top">
                    <a class="author-link" href="${profileUrl(post.author_id)}">
                        <strong>${escapeHtml(post.author)}</strong>
                        <span>@${escapeHtml(post.author)}</span>
                    </a>
                    <span class="post-date">${formatDate(post.created_at)}</span>
                </div>

                <p class="post-text">${escapeHtml(post.content)}</p>

                ${post.image ? `<img class="tweet-image" src="${fixImageUrl(post.image)}" alt="post image">` : ""}

                <div class="tweet-actions reaction-row">
                    ${renderReactionButtons("post", post.id, post.reactions_summary, post.user_reaction)}
                    <span class="comment-count">💬 ${post.comments_count || 0}</span>
                </div>

                <div class="comments-box">
                    <div class="comment-form auth-only">
                        <input id="comment-input-${post.id}" type="text" placeholder="Écrire un commentaire..." maxlength="1000">
                        <button type="button" class="comment-submit-btn" data-post-id="${post.id}">Commenter</button>
                    </div>

                    <div class="comments-list">
                        ${(post.comments || []).map(comment => renderComment(comment)).join("")}
                    </div>
                </div>
            </div>
        </article>
    `;
}

function renderComment(comment) {
    const avatar = cleanAvatarUrl(comment.author_profile_pic, comment.author_sex);

    return `
        <div class="comment-card" id="comment-${comment.id}">
            <a href="${profileUrl(comment.author_id)}">
                <img src="${avatar}" alt="avatar" onerror="avatarOnError(this, '${escapeHtml(comment.author_sex || "")}')">
            </a>
            <div class="comment-body">
                <div class="comment-top">
                    <a class="author-link" href="${profileUrl(comment.author_id)}">
                        <strong>${escapeHtml(comment.author)}</strong>
                        <span>@${escapeHtml(comment.author)}</span>
                    </a>
                </div>
                <p>${escapeHtml(comment.content)}</p>

                <div class="comment-actions reaction-row">
                    ${renderReactionButtons("comment", comment.id, comment.reactions_summary, comment.user_reaction)}
                    <button type="button" class="reply-toggle auth-only" onclick="toggleReplyForm(${comment.id})">Répondre</button>
                </div>

                <form class="reply-form auth-only" id="reply-form-${comment.id}" onsubmit="createReply(event, ${comment.id})">
                    <input type="text" name="content" placeholder="Écrire une réponse..." maxlength="1000" required>
                    <button type="submit">Envoyer</button>
                </form>

                <div class="replies-list">
                    ${(comment.replies || []).map(reply => renderComment(reply)).join("")}
                </div>
            </div>
        </div>
    `;
}

function renderReactionButtons(target, targetId, summary = {}, selected = null) {
    return reactionTypes.map(reaction => {
        const count = summary && summary[reaction.slug] ? summary[reaction.slug] : 0;
        const activeClass = selected === reaction.slug ? "active" : "";
        return `
            <button type="button" class="reaction-btn ${activeClass}" onclick="reactTo('${target}', ${targetId}, '${reaction.slug}')" title="${escapeHtml(reaction.label)}">
                <span class="reaction-emoji">${reaction.emoji}</span>
                <span class="reaction-count">${count}</span>
            </button>
        `;
    }).join("");
}

async function createComment(postId) {
    console.log("COMMENT CLICKED", postId);
    if (!isAuthenticated()) {
        window.location.href = "/login/";
        return;
    }

    const input = document.getElementById(`comment-input-${postId}`);
    const content = input ? input.value.trim() : "";

    if (!content) return;

    const response = await fetch(`/api/posts/${postId}/comments/`, {
        method: "POST",
        headers: {
            ...authHeaders(),
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ content })
    });

    if (!response.ok) {
        console.error("Comment error", await safeJson(response));
        return;
    }

    input.value = "";
    await fetchUserProfile();
}

function toggleReplyForm(commentId) {
    const form = document.getElementById(`reply-form-${commentId}`);
    if (!form) return;
    form.classList.toggle("visible");
}

async function createReply(event, commentId) {
    event.preventDefault();

    if (!isAuthenticated()) return;

    const form = event.target;
    const content = form.content.value.trim();
    if (!content) return;

    const response = await fetch(`/api/posts/comments/${commentId}/replies/`, {
        method: "POST",
        headers: {
            ...authHeaders(),
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ content })
    });

    if (!response.ok) {
        console.error("Reply error", await safeJson(response));
        return;
    }

    form.reset();
    form.classList.remove("visible");
    await fetchUserProfile();
}

async function reactTo(target, targetId, reactionSlug) {
    if (!isAuthenticated()) {
        window.location.href = "/login/";
        return;
    }

    const endpoint = target === "post"
        ? `/api/reactions/posts/${targetId}/`
        : `/api/reactions/comments/${targetId}/`;

    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            ...authHeaders(),
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ reaction_type: reactionSlug })
    });

    const data = await safeJson(response);

    if (!response.ok) {
        console.error("Reaction error", data);
        return;
    }

    if (target === "post" && data.post) {
        const index = profilePosts.findIndex(post => Number(post.id) === Number(targetId));

        if (index !== -1) {
            profilePosts[index] = data.post;

            const oldCard = document.getElementById(`post-${targetId}`);
            if (oldCard) {
                oldCard.outerHTML = renderPost(data.post);
                bindCommentButtons();
                updateAuthDisplay();
                updateProfileMode();
            }
        }

        return;
    }

    await fetchUserProfile();
}

async function loadSuggestions() {
    const container = document.getElementById("suggestions-list");
    if (!container) return;

    const response = await fetch("/api/follows/suggestions/", { headers: authHeaders() });
    const users = response.ok ? await response.json() : [];

    if (!users.length) {
        container.innerHTML = `<p class="muted-text">Aucune suggestion.</p>`;
        return;
    }

    container.innerHTML = users.map(user => {
        const avatar = cleanAvatarUrl(user.profile_pic, user.sex);

        return `
            <div class="suggestion-row">
                <a href="${profileUrl(user.id)}">
                    <img src="${avatar}" alt="avatar" onerror="avatarOnError(this, '${escapeHtml(user.sex || "")}')">
                    <span>@${escapeHtml(user.username)}</span>
                </a>
                ${isAuthenticated() ? `<button type="button" onclick="toggleFollow(${user.id})">${user.is_following ? "Suivi" : "Suivre"}</button>` : ""}
            </div>
        `;
    }).join("");
}

async function toggleFollow(userId = null) {
    const targetId = userId || profileUserId;

    if (!isAuthenticated()) {
        window.location.href = "/login/";
        return;
    }

    const response = await fetch(`/api/follows/toggle/${targetId}/`, {
        method: "POST",
        headers: authHeaders()
    });

    if (!response.ok) {
        console.error("Follow error", await safeJson(response));
        return;
    }

    if (Number(targetId) === Number(profileUserId)) {
        await loadFollowStatus(profileUserId);
    }

    await loadSuggestions();
}

function showProfileError() {
    document.getElementById("user-fullname").textContent = "Utilisateur non trouvé";
    document.getElementById("user-handle").textContent = "@unknown";
}

function logoutUser() {
    localStorage.clear();
    window.location.href = "/";
}
