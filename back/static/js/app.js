if ($('#password').length && $('#conf_passw').length) {

  $('#password, #conf_passw').on('keyup', function () {

    if ($('#password').val() === $('#conf_passw').val()) {
      $('#message').html('Mots de passe identiques').css('color', 'green');
    } else {
      $('#message').html('Mots de passe différents').css('color', 'red');
    }

  });

}

function check_availability() {

  const username = $('#username').val();

  if (!username) return;

  $.get('/check-username', { username: username }, function (result) {

    if (result.available) {
      $('#username-msg').html(username + ' est disponible').css('color', 'green');
    } else {
      $('#username-msg').html(username + ' est déjà pris').css('color', 'red');
    }

  });

}

if ($('#username').length) {

  $('#username').on('blur', function () {
    if ($(this).val().length >= 4) {
      check_availability();
    }
  });

}

const image = document.getElementById('image');

if (image) {

  image.addEventListener('change', function () {

    const fichier = this.files[0];
    const apercu = document.getElementById('apercu');

    if (apercu) {

      if (fichier) {
        apercu.src = URL.createObjectURL(fichier);
        apercu.style.display = 'block';
      } else {
        apercu.src = '';
        apercu.style.display = 'none';
      }

    }

  });

}
if ($('#login-form').length) {

  $('#login-form').on('submit', function (e) {

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

      success: function (response) {

  console.log("LOGIN SUCCESS");

  console.log("TOKEN =", response.token);

  envoyerGeoloc(response.token);

},

      error: function (xhr) {

        console.log("LOGIN ERROR", xhr);

        $('#login-msg')
          .html('Identifiants incorrects')
          .css('color', 'red');

      }

    });

  });

}