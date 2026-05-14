document.addEventListener("DOMContentLoaded", function () {
    fetchUserProfile();
});

async function fetchUserProfile() {
    try {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("user_id");

        console.log("USER ID:", userId);
        console.log("TOKEN:", token);

        if (!userId) {
            window.location.href = "/login/";
            return;
        }

        const response = await fetch(`/api/accounts/profile/${userId}/`);

        if (!response.ok) {
            showProfileError();
            return;
        }

        const data = await response.json();
        console.log("PROFILE DATA:", data);

        const user = data.user ? data.user : data;
        const posts = data.posts ? data.posts : [];

        renderProfile(user, posts);

    } catch (error) {
        console.error("Erreur profil:", error);
        showProfileError();
    }
}

function renderProfile(user, posts) {
    document.getElementById("user-fullname").textContent =
        `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username;

    document.getElementById("user-handle").textContent = `@${user.username}`;
    document.getElementById("user-email").textContent = user.email || "—";
    document.getElementById("user-sex").textContent = user.sex || "—";
    document.getElementById("user-birthdate").textContent = user.birth_date || "—";

    const img = document.getElementById("profile-img");

    if (user.profile_pic && !user.profile_pic.includes("default-")) {
        img.src = user.profile_pic;
    } else {
        if (user.sex && user.sex.toLowerCase() === "female") {
            img.src = "/static/images/default-female-avatar.png";
        } else {
            img.src = "/static/images/default-male-avatar.png";
        }
    }

    document.getElementById("posts-count").textContent = posts.length;
    renderPosts(posts);
}

function renderPosts(posts) {
    const container = document.getElementById("profile-posts");

    if (!posts.length) {
        container.innerHTML = `
            <div class="empty-posts">
                Aucun post pour le moment.
            </div>
        `;
        return;
    }

    container.innerHTML = posts.map(post => `
        <article class="tweet-card">
            <div class="tweet-avatar">
                <img src="/media/profiles/default-male-avatar.png" alt="avatar">
            </div>

            <div class="tweet-body">
                <div class="tweet-top">
                    <strong>${post.author || "Utilisateur"}</strong>
                    <span>@${post.author || "user"}</span>
                </div>

                <p>${post.content || ""}</p>

                ${post.image ? `<img class="tweet-image" src="${post.image}" alt="post image">` : ""}

                <div class="tweet-actions">
                    <span>♡ ${post.total_likes || 0}</span>
                    <span>💬 0</span>
                    <span>↗</span>
                </div>
            </div>
        </article>
    `).join("");
}

function showProfileError() {
    document.getElementById("user-fullname").textContent = "Utilisateur non trouvé";
    document.getElementById("user-handle").textContent = "@unknown";
}

function logoutUser() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("user_id");

    window.location.href = "/";
}