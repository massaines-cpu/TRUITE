let reactionTypes = [];
let currentPosts = [];
let currentUser = null;
let generatedFeedPostImageFile = null;

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
    } catch {
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

async function safeJson(response) {
    try {
        return await response.json();
    } catch {
        return {};
    }
}

function updateAuthDisplay() {
    const authenticated = isAuthenticated();

    document.querySelectorAll(".auth-only").forEach(el => {
        el.style.display = authenticated ? "" : "none";
    });

    document.querySelectorAll(".guest-only").forEach(el => {
        el.style.display = authenticated ? "none" : "";
    });
}

function showFormMessage(text, isError) {
    const message = document.getElementById("post-form-message");
    if (!message) return;

    message.textContent = text;
    message.className = isError ? "form-message error" : "form-message success";
}

function getDefaultAvatar(sex = null) {
    const label = sex && sex.toLowerCase() === "female" ? "F" : "T";
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">
            <rect width="120" height="120" rx="60" fill="#e8f5fd"/>
            <text x="50%" y="55%" text-anchor="middle" font-size="44" font-family="Arial" fill="#1d9bf0" font-weight="bold">${label}</text>
        </svg>
    `;
    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
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
    return url ? String(url) : "";
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

function base64ToFile(base64, filename) {
    const byteString = atob(base64);
    const bytes = new Uint8Array(byteString.length);

    for (let i = 0; i < byteString.length; i++) {
        bytes[i] = byteString.charCodeAt(i);
    }

    return new File([bytes], filename, { type: "image/png" });
}

function ensureAiModal() {
    let modal = document.getElementById("ai-image-modal");

    if (modal) return modal;

    modal = document.createElement("div");
    modal.id = "ai-image-modal";
    modal.style.display = "none";
    modal.innerHTML = `
        <div class="ai-modal-backdrop"></div>
        <div class="ai-modal-box">
            <h3 id="ai-modal-title">Générer une image IA</h3>

            <p class="ai-modal-help">
                Tu peux écrire un prompt, ou laisser vide pour utiliser le prompt par défaut du backend.
            </p>

            <textarea
                id="ai-modal-prompt"
                placeholder="Ex: robot drôle en train d'écrire un post..."
                rows="4"
            ></textarea>

            <div class="ai-modal-preview-wrap" style="display:none;">
                <img id="ai-modal-preview" alt="AI preview">
            </div>

            <div class="ai-modal-actions">
                <button type="button" id="ai-modal-generate">Générer</button>
                <button type="button" id="ai-modal-apply" style="display:none;">Utiliser cette image</button>
                <button type="button" id="ai-modal-close">Annuler</button>
            </div>

            <p id="ai-modal-message"></p>
        </div>
    `;

    document.body.appendChild(modal);

    return modal;
}

function openAiPostImageModal() {
    const modal = ensureAiModal();

    const title = document.getElementById("ai-modal-title");
    const promptInput = document.getElementById("ai-modal-prompt");
    const generateBtn = document.getElementById("ai-modal-generate");
    const applyBtn = document.getElementById("ai-modal-apply");
    const closeBtn = document.getElementById("ai-modal-close");
    const previewWrap = modal.querySelector(".ai-modal-preview-wrap");
    const preview = document.getElementById("ai-modal-preview");
    const message = document.getElementById("ai-modal-message");

    let generatedFile = null;

    title.textContent = "Générer une image pour le post";
    promptInput.value = "";
    preview.src = "";
    previewWrap.style.display = "none";
    applyBtn.style.display = "none";
    message.textContent = "";
    modal.style.display = "flex";

    closeBtn.onclick = function () {
        modal.style.display = "none";
    };

    generateBtn.onclick = async function () {
        generateBtn.disabled = true;
        generateBtn.textContent = "Génération...";
        message.textContent = "";

        const response = await fetch("/api/ia/generate/", {
            method: "POST",
            headers: {
                ...authHeaders(),
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                image_type: "post_image",
                prompt: promptInput.value.trim()
            })
        });

        const data = await safeJson(response);

        generateBtn.disabled = false;
        generateBtn.textContent = "Générer";

        if (!response.ok || !data.image) {
            console.error("AI image error", data);
            message.textContent = "Erreur pendant la génération.";
            return;
        }

        generatedFile = base64ToFile(data.image, `post_image_${Date.now()}.png`);
        preview.src = `data:image/png;base64,${data.image}`;
        previewWrap.style.display = "block";
        applyBtn.style.display = "inline-block";
    };

    applyBtn.onclick = function () {
        if (!generatedFile) return;

        generatedFeedPostImageFile = generatedFile;

        let postPreview = document.getElementById("feed-post-ai-preview");

        if (!postPreview) {
            postPreview = document.createElement("img");
            postPreview.id = "feed-post-ai-preview";
            postPreview.style.maxWidth = "220px";
            postPreview.style.display = "block";
            postPreview.style.marginTop = "10px";

            const form = document.getElementById("post-form");
            if (form) form.appendChild(postPreview);
        }

        postPreview.src = preview.src;
        postPreview.style.display = "block";
        modal.style.display = "none";
    };
}

function bindAiPostButton() {
    const btn = document.getElementById("generate_post_image");

    if (!btn) return;

    btn.addEventListener("click", openAiPostImageModal);
}

function initPostComposerToggle() {
    const toggleBtn = document.getElementById("toggle-post-form");
    const form = document.getElementById("post-form");

    if (!toggleBtn || !form) return;

    form.style.display = "none";

    toggleBtn.addEventListener("click", function () {
        const visible = form.style.display !== "none";
        form.style.display = visible ? "none" : "block";
        toggleBtn.textContent = visible ? "+ Nouveau post" : "Fermer";
    });
}

async function loadReactionTypes() {
    const response = await fetch("/api/reactions/types/");
    const data = response.ok ? await response.json() : [];

    reactionTypes = data.length ? data : DEFAULT_REACTIONS;
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

function bindPostForm() {
    const form = document.getElementById("post-form");
    if (!form) return;

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const content = document.getElementById("post-content").value.trim();
        const imageInput = document.getElementById("post-image");
        const image = imageInput ? imageInput.files[0] : null;

        if (!isAuthenticated()) {
            showFormMessage("Connecte-toi pour publier.", true);
            return;
        }

        if (!content) {
            showFormMessage("Le texte est obligatoire.", true);
            return;
        }

        if (!image && !generatedFeedPostImageFile) {
            showFormMessage("L'image est obligatoire pour chaque post.", true);
            return;
        }

        const formData = new FormData();
        formData.append("content", content);

        if (image) {
            formData.append("image", image);
        } else if (generatedFeedPostImageFile) {
            formData.append("image", generatedFeedPostImageFile);
        }

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
        generatedFeedPostImageFile = null;

        const preview = document.getElementById("feed-post-ai-preview");
        if (preview) {
            preview.src = "";
            preview.style.display = "none";
        }

        showFormMessage("Post publié.", false);

        currentPosts.unshift(data);
        renderPosts(currentPosts);
        bindCommentButtons();
        updateAuthDisplay();
    });
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

                    ${isMyPost ? `
                        <div class="post-owner-actions">
                            <button type="button" onclick="openEditPost(${post.id})">Modifier</button>
                            <button type="button" onclick="deletePost(${post.id})">Supprimer</button>
                        </div>
                    ` : ""}
                </div>

                <p class="post-text ${isMyPost ? "editable-post-text" : ""}" onclick="${isMyPost ? `openEditPost(${post.id})` : ""}">
                    ${escapeHtml(post.content.trim())}
                </p>

                ${post.image ? `
                    <img
                        class="tweet-image ${isMyPost ? "editable-post-image" : ""}"
                        src="${fixImageUrl(post.image)}"
                        alt="post image"
                        onclick="${isMyPost ? `openEditPost(${post.id})` : ""}"
                    >
                ` : ""}

                ${isMyPost ? `
                    <div class="edit-post-box" id="edit-box-${post.id}" style="display:none;">
                        <textarea id="edit-content-${post.id}">${escapeHtml(post.content.trim())}</textarea>
                        <input type="file" id="edit-image-${post.id}" accept="image/*">

                        <div class="edit-actions">
                            <button type="button" onclick="submitEditPost(${post.id})">Enregistrer</button>
                            <button type="button" onclick="closeEditPost(${post.id})">Annuler</button>
                        </div>
                    </div>
                ` : ""}

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

function bindCommentButtons() {
    document.querySelectorAll(".feed-comment-submit-btn").forEach(button => {
        button.onclick = function () {
            createComment(this.dataset.postId);
        };
    });
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

    const data = await safeJson(response);

    if (!response.ok) {
        console.error("Reaction error", data);
        return;
    }

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
}

async function deletePost(postId) {
    const confirmed = confirm("Supprimer cette publication ?");
    if (!confirmed) return;

    const response = await fetch(`/api/posts/${postId}/delete/`, {
        method: "DELETE",
        headers: authHeaders()
    });

    const data = await safeJson(response);

    if (!response.ok) {
        console.error("Delete error", data);
        return;
    }

    currentPosts = currentPosts.filter(post => Number(post.id) !== Number(postId));

    const postEl = document.getElementById(`post-${postId}`);
    if (postEl) postEl.remove();
}

function openEditPost(postId) {
    const box = document.getElementById(`edit-box-${postId}`);
    if (box) box.style.display = "block";
}

function closeEditPost(postId) {
    const box = document.getElementById(`edit-box-${postId}`);
    if (box) box.style.display = "none";
}

async function submitEditPost(postId) {
    const content = document.getElementById(`edit-content-${postId}`).value.trim();
    const imageInput = document.getElementById(`edit-image-${postId}`);

    const formData = new FormData();
    formData.append("content", content);

    if (imageInput.files[0]) {
        formData.append("image", imageInput.files[0]);
    }

    const response = await fetch(`/api/posts/${postId}/update/`, {
        method: "PATCH",
        headers: authHeaders(),
        body: formData
    });

    const data = await safeJson(response);

    if (!response.ok) {
        console.error("Update post error", data);
        return;
    }

    const index = currentPosts.findIndex(post => Number(post.id) === Number(postId));

    if (index !== -1) {
        currentPosts[index] = data;
    }

    const oldCard = document.getElementById(`post-${postId}`);

    if (oldCard) {
        oldCard.outerHTML = renderPost(data);
        bindCommentButtons();
        updateAuthDisplay();
    }
}

function logoutUser() {
    localStorage.clear();
    window.location.href = "/";
}

document.addEventListener("DOMContentLoaded", async function () {
    currentUser = getStoredUser();

    updateAuthDisplay();
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) logoutBtn.addEventListener("click", logoutUser);


    bindPostForm();
    bindAiPostButton();
    initPostComposerToggle();

    await loadReactionTypes();
    await loadFeed();
    await loadSuggestions();
});

window.toggleReplyForm = toggleReplyForm;
window.createReply = createReply;
window.reactTo = reactTo;
window.toggleFollow = toggleFollow;
window.deletePost = deletePost;
window.openEditPost = openEditPost;
window.closeEditPost = closeEditPost;
window.submitEditPost = submitEditPost;
window.logoutUser = logoutUser;