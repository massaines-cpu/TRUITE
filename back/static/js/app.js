$('#register-form').on('submit', function (e) {
  e.preventDefault();

  const formData = new FormData(this);

  $.ajax({
    url: '/api/accounts/register/',
    type: 'POST',
    data: formData,
    processData: false,
    contentType: false,

    success: function (response) {
      localStorage.setItem("user_id", response.id);
      console.log(response);
      window.location.href = "/profile/";
    },

    error: function (xhr) {
      console.log(xhr.responseJSON);
      alert('Erreur lors de l’inscription');
    }
  });
});


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
      localStorage.setItem("user_id", response.user.id);
      console.log(response);
      window.location.href = "/profile/";
    },

    error: function (xhr) {
      $('#login-msg')
        .html('Nom d’utilisateur ou mot de passe incorrect')
        .css('color', 'red');

      console.log(xhr.responseJSON);
    }
  });
});