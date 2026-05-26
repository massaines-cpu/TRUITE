let reactionTypes = [];
let profilePosts = [];
let currentUser = null;
let profileUser = null;
let profileUserId = null;

let generatedAvatarFile = null;
let generatedBannerFile = null;
let generatedPostImageFile = null;
let generatedEditPostImageFiles = {};

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

function getProfileUserId() {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("user_id");
    if (fromUrl) return fromUrl;

    const stored = getStoredUser();
    return stored ? stored.id : localStorage.getItem("user_id");
}

function isMyProfile() {
    return currentUser && profileUser && Number(currentUser.id) === Number(profileUser.id);
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

function updateProfileMode() {
    document.querySelectorAll(".self-profile-only").forEach(el => {
        el.style.display = isMyProfile() ? "" : "none";
    });

    document.querySelectorAll(".other-profile-only").forEach(el => {
        el.style.display = !isMyProfile() && isAuthenticated() ? "" : "none";
    });

    const img = document.getElementById("profile-img");
    const banner = document.getElementById("profile-banner");

    if (img && isMyProfile()) {
        img.title = "Cliquer pour générer ou changer l'avatar";
        img.style.cursor = "pointer";
    }

    if (banner && isMyProfile()) {
        banner.title = "Cliquer pour générer ou changer la bannière";
        banner.style.cursor = "pointer";
    }
}

function showProfileFormMessage(text, isError) {
    const message = document.getElementById("profile-post-form-message");
    if (!message) return;

    message.textContent = text;
    message.className = isError ? "form-message error" : "form-message success";
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
    return url ? String(url) : "";
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
                Tu peux écrire un prompt, ou laisser vide pour utiliser le prompt par défaut.
            </p>

            <textarea
                id="ai-modal-prompt"
                placeholder="Ex: avatar robot futuriste, style réaliste..."
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

function openAiImageModal(options) {
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

    title.textContent = options.title || "Générer une image IA";
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
                image_type: options.imageType,
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

        const filename = `${options.imageType}_${profileUserId || "user"}.png`;
        generatedFile = base64ToFile(data.image, filename);

        preview.src = `data:image/png;base64,${data.image}`;
        previewWrap.style.display = "block";
        applyBtn.style.display = "inline-block";
    };

    applyBtn.onclick = async function () {
        if (!generatedFile) return;

        applyBtn.disabled = true;
        applyBtn.textContent = "Enregistrement...";

        await options.onApply(generatedFile, preview.src);

        applyBtn.disabled = false;
        applyBtn.textContent = "Utiliser cette image";
        modal.style.display = "none";
    };
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

function renderProfile(user, posts) {
    const fullname = document.getElementById("user-fullname");
    const handle = document.getElementById("user-handle");
    const email = document.getElementById("user-email");
    const img = document.getElementById("profile-img");
    const banner = document.getElementById("profile-banner");
    const postsCount = document.getElementById("posts-count");

    if (fullname) {
        fullname.textContent = `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username;
    }

    if (handle) handle.textContent = `@${user.username}`;
    if (email) email.textContent = user.email || "—";

    if (img) {
        img.onerror = function () {
            avatarOnError(img, user.sex);
        };
        img.src = cleanAvatarUrl(user.profile_pic, user.sex);
    }

    if (banner && user.banner_image) {
        banner.src = fixImageUrl(user.banner_image);
    }

    if (postsCount) postsCount.textContent = posts.length;

    profilePosts = posts;
    renderPosts(posts);
    bindCommentButtons();
}

async function loadFollowStatus(userId) {
    const response = await fetch(`/api/follows/status/${userId}/`, {
        headers: authHeaders()
    });

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

function bindPostForm() {
    const form = document.getElementById("profile-post-form");
    if (!form) return;

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const content = document.getElementById("profile-post-content").value.trim();
        const imageInput = document.getElementById("profile-post-image");
        const image = imageInput ? imageInput.files[0] : null;

        if (!content) {
            showProfileFormMessage("Le texte est obligatoire.", true);
            return;
        }

        if (!image && !generatedPostImageFile) {
            showProfileFormMessage("L'image est obligatoire pour chaque post.", true);
            return;
        }

        const formData = new FormData();
        formData.append("content", content);

        if (image) {
            formData.append("image", image);
        } else if (generatedPostImageFile) {
            formData.append("image", generatedPostImageFile);
        }

        const response = await fetch("/api/posts/", {
            method: "POST",
            headers: authHeaders(),
            body: formData
        });

        const data = await safeJson(response);

        if (!response.ok) {
            showProfileFormMessage(
                data.error || data.image?.[0] || data.content?.[0] || "Erreur lors de la création du post.",
                true
            );
            return;
        }

        form.reset();
        generatedPostImageFile = null;

        const preview = document.getElementById("profile-post-ai-preview");
        if (preview) {
            preview.src = "";
            preview.style.display = "none";
        }

        showProfileFormMessage("Post publié.", false);

        profilePosts.unshift(data);
        renderPosts(profilePosts);
        bindCommentButtons();
        updateAuthDisplay();
        updateProfileMode();

        const count = document.getElementById("posts-count");
        if (count) count.textContent = profilePosts.length;
    });
}

function bindCommentButtons() {
    document.querySelectorAll(".comment-submit-btn").forEach(button => {
        button.onclick = function () {
            createComment(this.dataset.postId);
        };
    });
}

function bindAiProfileTools() {
    const avatar = document.getElementById("profile-img");
    const banner = document.getElementById("profile-banner");
    const postAiBtn = document.getElementById("generate_post_image");

    if (avatar) {
        avatar.addEventListener("click", function () {
            if (!isMyProfile()) return;

            openAiImageModal({
                title: "Générer une image de profil",
                imageType: "profile_avatar",
                onApply: async function (file, previewSrc) {
                    generatedAvatarFile = file;

                    const formData = new FormData();
                    formData.append("profile_pic", file);

                    const response = await fetch("/api/accounts/profile/update/", {
                        method: "PATCH",
                        headers: authHeaders(),
                        body: formData
                    });

                    const data = await safeJson(response);

                    if (!response.ok) {
                        console.error("Avatar update error", data);
                        return;
                    }

                    profileUser = data;
                    currentUser = data;
                    localStorage.setItem("user", JSON.stringify(data));

                    avatar.src = previewSrc;
                    renderProfile(data, profilePosts);
                    updateProfileMode();
                    updateAuthDisplay();
                }
            });
        });
    }

    if (banner) {
        banner.addEventListener("click", function () {
            if (!isMyProfile()) return;

            openAiImageModal({
                title: "Générer une bannière",
                imageType: "profile_banner",
                onApply: async function (file, previewSrc) {
                    generatedBannerFile = file;

                    const formData = new FormData();
                    formData.append("banner_image", file);

                    const response = await fetch("/api/accounts/profile/update/", {
                        method: "PATCH",
                        headers: authHeaders(),
                        body: formData
                    });

                    const data = await safeJson(response);

                    if (!response.ok) {
                        console.error("Banner update error", data);
                        banner.src = previewSrc;
                        return;
                    }

                    profileUser = data;
                    banner.src = previewSrc;
                }
            });
        });
    }

    if (postAiBtn) {
        postAiBtn.addEventListener("click", function () {
            openAiImageModal({
                title: "Générer une image pour le post",
                imageType: "post_image",
                onApply: async function (file, previewSrc) {
                    generatedPostImageFile = file;

                    let preview = document.getElementById("profile-post-ai-preview");

                    if (!preview) {
                        preview = document.createElement("img");
                        preview.id = "profile-post-ai-preview";
                        preview.style.maxWidth = "220px";
                        preview.style.display = "block";
                        preview.style.marginTop = "10px";

                        const form = document.getElementById("profile-post-form");
                        if (form) form.appendChild(preview);
                    }

                    preview.src = previewSrc;
                    preview.style.display = "block";
                }
            });
        });
    }
}

function initPostComposerToggle() {
    const toggleBtn = document.getElementById("toggle-post-form");
    const form = document.getElementById("profile-post-form");

    if (!toggleBtn || !form) return;

    form.style.display = "none";

    toggleBtn.addEventListener("click", function () {
        const visible = form.style.display !== "none";
        form.style.display = visible ? "none" : "block";
        toggleBtn.textContent = visible ? "+ Nouveau post" : "Fermer";
    });
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

                    ${isMyPost ? `
                        <div class="post-owner-actions">
                            <button type="button" onclick="openEditPost(${post.id})">Modifier</button>
                            <button type="button" onclick="deletePost(${post.id})">Supprimer</button>
                        </div>
                    ` : ""}
                </div>

                <p class="post-text ${isMyPost ? "editable-post-text" : ""}" onclick="${isMyPost ? `openEditPost(${post.id})` : ""}">
                    ${escapeHtml(post.content)}
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
                        <textarea id="edit-content-${post.id}">${escapeHtml(post.content)}</textarea>
                        <input type="file" id="edit-image-${post.id}" accept="image/*">
                        <button type="button" onclick="generateEditPostImage(${post.id})">Générer une nouvelle image avec l'IA</button>
                        <img id="edit-ai-preview-${post.id}" style="display:none;max-width:220px;margin-top:10px;border-radius:12px;" alt="Aperçu IA">

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

    const data = await safeJson(response);

    if (!response.ok) {
        console.error("Comment error", data);
        return;
    }

    input.value = "";

    const index = profilePosts.findIndex(post => Number(post.id) === Number(postId));

    if (index !== -1) {
        profilePosts[index].comments = profilePosts[index].comments || [];
        profilePosts[index].comments.push(data);
        profilePosts[index].comments_count = (profilePosts[index].comments_count || 0) + 1;

        const oldCard = document.getElementById(`post-${postId}`);
        if (oldCard) {
            oldCard.outerHTML = renderPost(profilePosts[index]);
            bindCommentButtons();
            updateAuthDisplay();
            updateProfileMode();
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

    profilePosts = profilePosts.filter(post => Number(post.id) !== Number(postId));

    const postEl = document.getElementById(`post-${postId}`);
    if (postEl) postEl.remove();

    const count = document.getElementById("posts-count");
    if (count) count.textContent = profilePosts.length;
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
    } else if (generatedEditPostImageFiles[postId]) {
        formData.append("image", generatedEditPostImageFiles[postId]);
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

    const index = profilePosts.findIndex(post => Number(post.id) === Number(postId));

    if (index !== -1) {
        profilePosts[index] = data;
    }

    const oldCard = document.getElementById(`post-${postId}`);

    if (oldCard) {
        oldCard.outerHTML = renderPost(data);
        delete generatedEditPostImageFiles[postId];
        bindCommentButtons();
        updateAuthDisplay();
        updateProfileMode();
    }
}

function generateEditPostImage(postId) {
    const contentInput = document.getElementById(`edit-content-${postId}`);
    const prompt = contentInput ? contentInput.value.trim() : "";

    openAiImageModal({
        title: "Générer une image pour ce post",
        imageType: "post_image",
        onApply: async function (file, previewSrc) {
            generatedEditPostImageFiles[postId] = file;
            const input = document.getElementById(`edit-image-${postId}`);
            if (input) input.value = "";
            const preview = document.getElementById(`edit-ai-preview-${postId}`);
            if (preview) {
                preview.src = previewSrc;
                preview.style.display = "block";
            }
        }
    });

    const promptInput = document.getElementById("ai-modal-prompt");
    if (promptInput && prompt) promptInput.value = prompt;
}

function toggleEditProfile() {
    const section = document.querySelector(".profile-edit-section");
    const btn = document.getElementById("edit-profile-btn");

    if (!section) return;

    section.classList.toggle("visible");

    if (btn) {
        btn.classList.toggle("active");
        btn.textContent = section.classList.contains("visible")
            ? "Annuler"
            : "Modifier le profil";
    }

    if (section.classList.contains("visible") && profileUser) {
        fillEditForm(profileUser);
        section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

function bindInlineProfileEdit() {
    ["user-fullname", "user-handle", "user-email"].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        el.style.cursor = "pointer";
        el.addEventListener("click", function () {
            if (isMyProfile()) {
                toggleEditProfile();
            }
        });
    });
}

function fillEditForm(user) {
    const fields = {
        "edit-username": user.username || "",
        "edit-email": user.email || "",
        "edit-sex": user.sex || "",
        "edit-birth_date": user.birth_date || "",
        "edit-first_name": user.first_name || "",
        "edit-last_name": user.last_name || ""
    };

    Object.entries(fields).forEach(([id, value]) => {
        const input = document.getElementById(id);
        if (input) input.value = value;
    });
}

function bindProfileEditForm() {
    const form = document.getElementById("profile-edit-form");
    if (!form) return;

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const formData = new FormData();

        formData.append("username", document.getElementById("edit-username").value);
        formData.append("email", document.getElementById("edit-email").value);
        formData.append("sex", document.getElementById("edit-sex").value);
        formData.append("birth_date", document.getElementById("edit-birth_date").value);
        formData.append("first_name", document.getElementById("edit-first_name").value);
        formData.append("last_name", document.getElementById("edit-last_name").value);

        const avatar = document.getElementById("edit-avatar")?.files[0];

        if (avatar) {
            formData.append("profile_pic", avatar);
        }

        const response = await fetch("/api/accounts/profile/update/", {
            method: "PATCH",
            headers: authHeaders(),
            body: formData
        });

        const data = await safeJson(response);

        if (!response.ok) {
            console.error("Update error", data);
            return;
        }

        profileUser = data;
        currentUser = data;
        localStorage.setItem("user", JSON.stringify(data));

        renderProfile(data, profilePosts);
        updateProfileMode();
        updateAuthDisplay();
        toggleEditProfile();
    });
}

function showProfileError() {
    const fullname = document.getElementById("user-fullname");
    const handle = document.getElementById("user-handle");

    if (fullname) fullname.textContent = "Utilisateur non trouvé";
    if (handle) handle.textContent = "@unknown";
}

function logoutUser() {
    localStorage.clear();
    window.location.href = "/";
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
    bindProfileEditForm();
    bindInlineProfileEdit();
    bindAiProfileTools();
    initPostComposerToggle();

    const editBtn = document.getElementById("edit-profile-btn");
    if (editBtn) {
        editBtn.addEventListener("click", toggleEditProfile);
    }

    await loadReactionTypes();
    await fetchUserProfile();
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
window.generateEditPostImage = generateEditPostImage;
window.logoutUser = logoutUser;