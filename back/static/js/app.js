// js register.html

$('#password, #conf_passw').on('keyup', function () {
  if ($('#password').val() == $('#conf_passw').val()) {
    $('#passw-msg')
      .html('Mots de passe identiques')
      .css('color', 'green');
  } else {
    $('#passw-msg')
      .html('Mots de passe différents')
      .css('color', 'red');
  }
});

document.getElementById('image').addEventListener('change', function () {
  const fichier = this.files[0];
  const apercu = document.getElementById('apercu');

  if (fichier) {
    apercu.src = URL.createObjectURL(fichier);
    apercu.style.display = 'block';
  } else {
    apercu.src = '';
    apercu.style.display = 'none';
  }
});

$('form').on('submit', function (e) {
  e.preventDefault();

  const formData = new FormData(this);

  $.ajax({
    url: '/api/accounts/register/',
    type: 'POST',
    data: formData,
    processData: false,
    contentType: false,

    success: function (response) {
      alert('Inscription réussie !');
      console.log(response);
      window.location.href = '/login/';
    },

    error: function (xhr) {
      console.log(xhr.responseJSON);
      alert('Erreur lors de l’inscription');
    }
  });
});


// js login.html

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
      $('#login-msg')
        .html('Connexion réussie !')
        .css('color', 'green');

      console.log(response);
    },

    error: function (xhr) {
      $('#login-msg')
        .html('Nom d’utilisateur ou mot de passe incorrect')
        .css('color', 'red');

      console.log(xhr.responseJSON);
    }
  });
});