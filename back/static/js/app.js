if ($('#login-form').length) {

  $('#login-form').on('submit', async function (e) {
    e.preventDefault();

    const formData = {
      username: $('#username').val(),
      password: $('#password').val()
    };

    $.ajax({
      url: '/api/accounts/login/',
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(formData),

      success: async function (response) {
        localStorage.clear();
        localStorage.setItem("token", response.token);
        localStorage.setItem("user_id", response.user.id);
        localStorage.setItem("user", JSON.stringify(response.user));

        if (typeof envoyerGeoloc === "function") {
          await envoyerGeoloc(response.token);
        }

        window.location.href = "/profile/";
      },

      error: function (xhr) {
        $('#login-msg')
          .html("Nom d’utilisateur ou mot de passe incorrect")
          .css('color', 'red');
        console.log(xhr.responseJSON);
      }
    });
  });
}

if ($('#register-form').length) {
  $('#register-form').on('submit', function (e) {
    e.preventDefault();

    const password = $('#password').val();
    const confirmPassword = $('#conf_passw').val();

    if (password !== confirmPassword) {
      $('#passw-msg').show().css('color', 'red');
      return;
    }

    const formData = new FormData(this);

    $.ajax({
      url: '/api/accounts/register/',
      type: 'POST',
      data: formData,
      processData: false,
      contentType: false,

      success: function () {
        window.location.href = "/login/";
      },

      error: function (xhr) {
        const data = xhr.responseJSON || {};
        const firstError = Object.values(data)[0];
        const message = Array.isArray(firstError) ? firstError[0] : "Erreur pendant l'inscription";
        $('#register-msg').html(message).css('color', 'red');
        console.log(data);
      }
    });
  });
}


function base64ToFile(base64, filename) {
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new File([array], filename, { type: "image/png" });
}

function setFileInputFile(input, file) {
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  input.files = dataTransfer.files;
}

if ($('#generate-register-avatar').length) {
  let generatedAvatarFile = null;

  $('#generate-register-avatar').on('click', async function () {
    const btn = this;
    const sex = $('input[name="sex"]:checked').val() || 'default';

    btn.disabled = true;
    btn.textContent = 'Génération...';
    $('#register-ai-avatar-msg').text('Génération en cours...').css('color', '#536471');

    try {
      const response = await fetch('/api/ia/generate/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_type: 'profile_avatar',
          sex: sex,
          prompt: $('#username').val() ? `avatar for username ${$('#username').val()}` : ''
        })
      });

      const data = await response.json();

      if (!response.ok || !data.image) {
        $('#register-ai-avatar-msg').text('Erreur pendant la génération.').css('color', 'red');
        return;
      }

      generatedAvatarFile = base64ToFile(data.image, `register_avatar_${Date.now()}.png`);
      $('#register-ai-avatar-preview').attr('src', `data:image/png;base64,${data.image}`);
      $('#register-ai-avatar-box').show();
      $('#register-ai-avatar-msg').text('Image générée. Tu peux l’utiliser ou la refuser.').css('color', 'green');
    } catch (error) {
      console.error(error);
      $('#register-ai-avatar-msg').text('Erreur pendant la génération.').css('color', 'red');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Générer une photo IA';
    }
  });

  $('#use-register-ai-avatar').on('click', function () {
    if (!generatedAvatarFile) return;
    setFileInputFile(document.getElementById('image'), generatedAvatarFile);
    $('#apercu').attr('src', URL.createObjectURL(generatedAvatarFile)).show();
    $('#register-ai-avatar-msg').text('Image IA sélectionnée pour le compte.').css('color', 'green');
  });

  $('#reject-register-ai-avatar').on('click', function () {
    generatedAvatarFile = null;
    $('#register-ai-avatar-box').hide();
    $('#register-ai-avatar-preview').attr('src', '');
    $('#register-ai-avatar-msg').text('Image refusée. Tu peux régénérer.').css('color', '#536471');
  });
}
