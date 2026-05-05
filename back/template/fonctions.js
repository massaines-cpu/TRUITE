('#passw, #conf_passw').on('keyup', function () {
  if ($('#passw').val() == $('#conf_passw').val()) {
    $('#message').html('Matching').css('color', 'green');
  } else 
    $('#message').html('Not Matching').css('color', 'red');
});

function check_availability(){

    var user_id = $('#username').val();

    //use ajax????? to run the check
    $.post("bdd.db", { user_id: user_id },
        function(result){
            //if the result is 1
            if(result == 1){
                $('...').html(user_id + ' is available');
            }else{
                $('...').html(user_id + ' is not available');
            }
        });

}