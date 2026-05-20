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

        console.log("TOKEN =", response.token);
        console.log("LOGIN OK");

        await envoyerGeoloc(response.token);

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

$('#register-form').on('submit', function (e) {
  e.preventDefault();

  const formData = {
    username: $('#username').val(),
    password: $('#password').val(),
  };

  $.ajax({
    url: '/api/accounts/register/',
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(formData),

    success: function (response) {
      console.log("REGISTER OK");

      if (response.redirect) {
        window.location.href = response.redirect;
      }
    },

    error: function (xhr) {
      console.log(xhr.responseJSON);
    }
  });
});