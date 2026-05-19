let reactionTypes = [];
let currentPosts = [];
let currentUser = null;

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

function authHeaders() {
    const token = getToken();
    return token ? { "Authorization": `Bearer ${token}` } : {};
}

function isAuthenticated() {
    return Boolean(getToken());
}

document.addEventListener("DOMContentLoaded", async function () {
    currentUser = getStoredUser();
    updateAuthDisplay();
    bindPostForm();
    await loadReactionTypes();
    await loadFeed();
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

function bindPostForm() {
    const form = document.getElementById("post-form");
    if (!form) return;

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const content = document.getElementById("post-content").value.trim();
        const image = document.getElementById("post-image").files[0];

        if (!isAuthenticated()) {
            showFormMessage("Connecte-toi pour publier.", true);
            return;
        }

        if (!content) {
            showFormMessage("Le texte est obligatoire.", true);
            return;
        }

        if (!image) {
            showFormMessage("L'image est obligatoire pour chaque post.", true);
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
            showFormMessage(
                data.error || data.image?.[0] || data.content?.[0] || "Erreur lors de la création du post.",
                true
            );
            return;
        }

        form.reset();
        showFormMessage("Post publié.", false);
        await loadFeed();
    });
}

function showFormMessage(text, isError) {
    const message = document.getElementById("post-form-message");
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

function avatarOnError(img, sex) {
    img.onerror = null;
    img.src = getDefaultAvatar(sex);
}

function fixImageUrl(url) {
    if (!url) return "";
    return String(url);
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

function bindCommentButtons() {
    document.querySelectorAll(".feed-comment-submit-btn").forEach(button => {
        button.addEventListener("click", function () {
            createComment(this.dataset.postId);
        });
    });
}

function profileUrl(userId) {
    return `/profile/?user_id=${userId}`;
}

async function loadFeed() {
    const response = await fetch("/api/posts/", {
        headers: authHeaders()
    });

    currentPosts = response.ok ? await response.json() : [];
    renderPosts(currentPosts);
    bindCommentButtons();
    updateAuthDisplay();
}

function renderPosts(posts) {
    const container = document.getElementById("feed-posts");
    if (!container) return;

    if (!posts.length) {
        container.innerHTML = `<div class="empty-posts">Aucun post pour le moment.</div>`;
        return;
    }

    container.innerHTML = posts.map(post => renderPost(post)).join("");
}

function renderPost(post) {
    const avatar = cleanAvatarUrl(post.author_profile_pic, post.author_sex);
    const isMyPost = currentUser && Number(currentUser.id) === Number(post.author_id);

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

                    ${!isMyPost && isAuthenticated()
                        ? `<button type="button" class="mini-follow-btn" onclick="toggleFollow(${post.author_id})">Suivre</button>`
                        : ""}
                </div>

                <p class="post-text">${escapeHtml(post.content)}</p>

                ${post.image ? `<img class="tweet-image" src="${fixImageUrl(post.image)}" alt="post image">` : ""}

                <div class="tweet-actions reaction-row">
                    ${renderReactionButtons("post", post.id, post.reactions_summary, post.user_reaction)}
                    <span class="comment-count">💬 ${post.comments_count || 0}</span>
                </div>

                <div class="comments-box">
                    <div class="comment-form auth-only">
                        <input id="feed-comment-input-${post.id}" type="text" placeholder="Écrire un commentaire..." maxlength="1000">
                        <button type="button" class="feed-comment-submit-btn" data-post-id="${post.id}">Commenter</button>
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
    if (!isAuthenticated()) {
        window.location.href = "/login/";
        return;
    }

    const input = document.getElementById(`feed-comment-input-${postId}`);
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

    const data = await safeJson(response);

    if (!response.ok) {
        console.error("Comment error", data);
        return;
    }

    input.value = "";

    const index = currentPosts.findIndex(post => Number(post.id) === Number(postId));

    if (index !== -1) {
        currentPosts[index].comments = currentPosts[index].comments || [];
        currentPosts[index].comments.push(data);
        currentPosts[index].comments_count = (currentPosts[index].comments_count || 0) + 1;

        const oldCard = document.getElementById(`post-${postId}`);
        if (oldCard) {
            oldCard.outerHTML = renderPost(currentPosts[index]);
            bindCommentButtons();
            updateAuthDisplay();
        }
    }
}

function toggleReplyForm(commentId) {
    const form = document.getElementById(`reply-form-${commentId}`);
    if (!form) return;
    form.classList.toggle("visible");
}

async function createReply(event, commentId) {
    console.log("CREATE REPLY CALLED");
    event.preventDefault();

    if (!isAuthenticated()) {
        window.location.href = "/login/";
        return;
    }

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

    const data = await safeJson(response);
    console.log("Reply data", data);

    if (!response.ok) {
        console.error("Reply error", data);
        return;
    }

    form.reset();
    form.classList.remove("visible");
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

    if (!response.ok) {
        console.error("Reaction error", await safeJson(response));
        return;
    }

    const data = await safeJson(response);
    

    if (target === "post" && data.post) {
        const index = currentPosts.findIndex(post => Number(post.id) === Number(targetId));
        if (index !== -1) {
            currentPosts[index] = data.post;
            const oldCard = document.getElementById(`post-${targetId}`);
            if (oldCard) {
                oldCard.outerHTML = renderPost(data.post);
                bindCommentButtons();
                updateAuthDisplay();
            }
        }
        return;
    }

    await loadFeed();
}

async function loadSuggestions() {
    const container = document.getElementById("suggestions-list");
    if (!container) return;

    const response = await fetch("/api/follows/suggestions/", {
        headers: authHeaders()
    });

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

                ${isAuthenticated()
                    ? `<button type="button" onclick="toggleFollow(${user.id})">${user.is_following ? "Suivi" : "Suivre"}</button>`
                    : ""}
            </div>
        `;
    }).join("");
}

async function toggleFollow(userId) {
    if (!isAuthenticated()) {
        window.location.href = "/login/";
        return;
    }

    const response = await fetch(`/api/follows/toggle/${userId}/`, {
        method: "POST",
        headers: authHeaders()
    });

    if (!response.ok) {
        console.error("Follow error", await safeJson(response));
        return;
    }

    await loadSuggestions();
    await loadFeed();
}

function logoutUser() {
    localStorage.clear();
    window.location.href = "/";
}