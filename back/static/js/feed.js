document.addEventListener("DOMContentLoaded", function () {
    loadFeed();
});

async function loadFeed() {

    const response = await fetch("/api/accounts/posts/list/");
    const posts = await response.json();

    const container = document.getElementById("feed-posts");

    container.innerHTML = posts.map(post => `
        <article class="tweet-card">

            <div class="tweet-avatar">
                <img src="/media/profiles/default-male-avatar.png">
            </div>

            <div class="tweet-body">

                <div class="tweet-top">
                    <strong>${post.author}</strong>
                    <span>@${post.author}</span>
                </div>

                <p>${post.content}</p>

                ${post.image ? `
                    <img class="tweet-image" src="${post.image}">
                ` : ""}

                <div class="tweet-actions">
                    <span>♡ ${post.total_likes}</span>
                    <span>💬 0</span>
                    <span>↗</span>
                </div>

            </div>

        </article>
    `).join("");
}

function logoutUser() {
    localStorage.clear();
    window.location.href = "/login/";
}