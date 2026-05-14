function envoyerGeoloc(token) {
  return new Promise((resolve) => {
    console.log("1 - envoyerGeoloc appelée");

    if (!navigator.geolocation) {
      console.log("Geolocation non supportée");
      resolve();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      function (pos) {
        console.log("2 - position OK");

        fetch("/recup-location/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
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
          resolve();
        })
        .catch(err => {
          console.log("FETCH ERROR", err);
          resolve();
        });
      },

      function (err) {
        console.log("GEO ERROR", err);
        resolve();
      }
    );
  });
}