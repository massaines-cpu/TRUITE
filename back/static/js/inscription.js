$('#passw, #conf_passw').on('keyup', function () {
  if ($('#passw').val() == $('#conf_passw').val()) {
    $('#message').html('Mots de passe identiques').css('color', 'green');
  } else {
    $('#message').html('Mots de passe différents').css('color', 'red');
  }
});

function check_availability() {
  var username = $('#username').val();

  $.get('/check-username', { username: username }, function (result) {
    if (result.available) {
      $('#username-msg').html(username + ' est disponible').css('color', 'green');
    } else {
      $('#username-msg').html(username + ' est déjà pris').css('color', 'red');
    }
  });
}

$('#username').on('blur', function () {
  if ($(this).val().length >= 4) {
    check_availability();
  }
});

document.getElementById('image').addEventListener('change', function() {
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

