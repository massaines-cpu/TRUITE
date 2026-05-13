function envoyerGeoloc(token) {

  console.log("1 - envoyerGeoloc appelée");

  navigator.geolocation.getCurrentPosition(

    function (pos) {

      console.log("2 - position OK");

      console.log("3 - AVANT FETCH");

      fetch('/recup-location/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Token ' + token
        },
        body: JSON.stringify({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        })
      })
      .then(res => {
        console.log("4 - RESPONSE FETCH", res);
        return res.json();
      })
      .then(data => {
        console.log("5 - DATA", data);
      })
      .catch(err => {
        console.log("FETCH ERROR", err);
      });

    },

    function (err) {
      console.log("GEO ERROR", err);
    }

  );

}