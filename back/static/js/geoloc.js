navigator.geolocation.getCurrentPosition(success)

function success(pos){
  const coordonnees = pos.coords
  var lati = coordonnees.latitude
  var longi = coordonnees.longitude

  fetch('/recup-location', {
    method: 'POST',
    headers: {
        'Content-type': 'application/json',

    },
    body: JSON.stringify({
        latitude: lati,
        longitude: longi
    })
  })
}