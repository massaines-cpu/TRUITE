document.addEventListener("DOMContentLoaded", function () {
    fetchUserProfile();
});

async function fetchUserProfile() {
    try {
        const userId = localStorage.getItem("user_id");

        const response = await fetch(`/api/accounts/profile/${userId}/`);

        if (!response.ok) {
            showProfileError();
            return;
        }

        const user = await response.json();
        renderProfile(user);

    } catch (error) {
        console.error("Erreur profil:", error);
        showProfileError();
    }
}

function renderProfile(user) {
    document.getElementById("user-fullname").textContent =
        `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username;

    document.getElementById("user-handle").textContent =
        `@${user.username}`;

    document.getElementById("user-email").textContent =
        user.email || "—";

    document.getElementById("user-sex").textContent =
        user.sex || "—";

    document.getElementById("user-birthdate").textContent =
        user.birth_date || "—";

    const img = document.getElementById("profile-img");

    if (user.profile_pic) {
        img.src = user.profile_pic;
    } else {
        img.src = "/media/profiles/default-male-avatar.png";
    }
}

function showProfileError() {
    document.getElementById("user-fullname").textContent = "Utilisateur non trouvé";
    document.getElementById("user-handle").textContent = "@unknown";
}