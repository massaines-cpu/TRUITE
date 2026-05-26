function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return '';
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch (error) {
    return {};
  }
}

async function postJson(url, payload) {
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCookie('csrftoken')
    },
    body: JSON.stringify(payload)
  });
}

function bindLoginForm() {
  const form = document.getElementById('login-form');
  if (!form || form.dataset.bound === '1') return;
  form.dataset.bound = '1';

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const response = await postJson('/api/accounts/login/', {
      username: document.getElementById('username').value.trim(),
      password: document.getElementById('password').value
    });

    const data = await safeJson(response);

    if (!response.ok) {
      const msg = document.getElementById('login-msg');
      if (msg) {
        msg.textContent = 'Nom d’utilisateur ou mot de passe incorrect';
        msg.style.color = 'red';
      }
      return;
    }

    localStorage.clear();
    localStorage.setItem('token', data.token);
    localStorage.setItem('user_id', data.user.id);
    localStorage.setItem('user', JSON.stringify(data.user));

    if (typeof envoyerGeoloc === 'function') {
      try { await envoyerGeoloc(data.token); } catch (error) { console.warn('Geoloc ignored', error); }
    }

    window.location.href = '/profile/';
  });
}

function bindRegisterForm() {
  const form = document.getElementById('register-form');
  if (!form || form.dataset.bound === '1') return;
  form.dataset.bound = '1';

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('conf_passw').value;
    const msg = document.getElementById('register-msg');
    const passMsg = document.getElementById('passw-msg');

    if (password !== confirmPassword) {
      if (passMsg) passMsg.style.display = 'block';
      if (msg) {
        msg.textContent = 'Les mots de passe ne correspondent pas.';
        msg.style.color = 'red';
      }
      return;
    }

    if (passMsg) passMsg.style.display = 'none';

    const formData = new FormData(form);
    formData.delete('csrfmiddlewaretoken');
    formData.delete('conf_passw');
    formData.delete('nouveau');

    const response = await fetch('/api/accounts/register/', {
      method: 'POST',
      headers: { 'X-CSRFToken': getCookie('csrftoken') },
      body: formData
    });

    const data = await safeJson(response);

    if (!response.ok) {
      if (msg) {
        msg.textContent = data.username?.[0] || data.email?.[0] || data.password?.[0] || data.error || 'Erreur lors de l’inscription.';
        msg.style.color = 'red';
      }
      return;
    }

    if (msg) {
      msg.textContent = 'Compte créé. Redirection vers la connexion...';
      msg.style.color = 'green';
    }

    window.location.href = '/login/';
  });
}

function bindProfilePreview() {
  const imageInput = document.getElementById('image');
  const preview = document.getElementById('apercu');
  if (!imageInput || !preview) return;

  imageInput.addEventListener('change', function () {
    const file = imageInput.files[0];
    if (!file) return;
    preview.src = URL.createObjectURL(file);
    preview.style.display = 'block';
  });
}

document.addEventListener('DOMContentLoaded', function () {
  bindLoginForm();
  bindRegisterForm();
  bindProfilePreview();
});
