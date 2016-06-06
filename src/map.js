var map;
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 43.710173, lng: 7.261953199999994},
    zoom: 9
  });
  console.log(secteurs);
  map.data.addGeoJson(secteurs);
  map.data.setStyle(function(feature) {
    return {
      fillColor: 'blue',
      strokeColor : 'blue',
      strokeWeight: 1
    };
  });
  map.data.addListener('mouseover', function(event) {
    console.log(event);
    map.data.revertStyle();
    map.data.overrideStyle(event.feature, {fillColor: 'red',strokeColor: 'red',strokeWeight: 3});
    document.getElementById('info-box').textContent = event.feature.getProperty('NOM_SECTEUR');
  });

  map.data.addListener('mouseout', function(event) {
    map.data.revertStyle();
  });
}
