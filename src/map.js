var map;
var polySecteurs;
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 43.710173, lng: 7.261953199999994},
    zoom: 9
  });
  DisplaySectors(map);
  SearchAdress(map);
}

function PinInPolygone(map, latLang){
  var layerContaintPin;
  map.data.forEach(function(feature){
    var geo =  feature.getGeometry();
    var paths;

    if (geo.getType() === "MultiPolygon" ){
      var multiPolygon= Array();
      geo["j"][0]["j"].forEach(function(polygone){
         multiPolygon.push(polygone["j"]);
      });
      paths = multiPolygon;
    }
    else {
      paths = geo["j"][0]["j"];
    }

    var secteur = new google.maps.Polygon({paths:paths});
    if ( google.maps.geometry.poly.containsLocation(latLang,secteur)){
      layerContaintPin = feature;
    }
  });
  return layerContaintPin;
}

function DisplaySectors(map){
  var test = map.data.addGeoJson(secteurs);
  map.data.setStyle(function(feature) {
    return {
      fillColor: 'blue',
      strokeColor : 'blue',
      strokeWeight: 1
    };
  });
  map.data.addListener('mouseover', function(event) {
    map.data.revertStyle();
    map.data.overrideStyle(event.feature, {fillColor: 'red',strokeColor: 'red',strokeWeight: 3});
    document.getElementById('info-box').textContent = event.feature.getProperty('NOM_SECTEUR');
  });

  map.data.addListener('mouseout', function(event) {
    map.data.revertStyle();
    document.getElementById('info-box').textContent = "";
  });
}

function SearchAdress(map){
  var options = {
    componentRestrictions: {country: 'fr'}
  };

  var input = /** @type {!HTMLInputElement} */(
        document.getElementById('pac-input'));

    var types = document.getElementById('type-selector');
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(types);

    var autocomplete = new google.maps.places.Autocomplete(input, options);
    autocomplete.bindTo('bounds', map);

    var infowindow = new google.maps.InfoWindow();
    var marker = new google.maps.Marker({
      map: map,
      anchorPoint: new google.maps.Point(0, -29)
    });

    autocomplete.addListener('place_changed', function() {
      infowindow.close();
      marker.setVisible(false);
      var place = autocomplete.getPlace();
      if (!place.geometry) {
        window.alert("Impossible de trouver votre adresse");
        return;
      }

      // If the place has a geometry, then present it on a map.
      if (place.geometry.viewport) {
        map.fitBounds(place.geometry.viewport);
      } else {
        map.setCenter(place.geometry.location);
        map.setZoom(15);  // Why 17? Because it looks good.
      }
      marker.setIcon(/** @type {google.maps.Icon} */({
        url: place.icon,
        size: new google.maps.Size(71, 71),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17, 34),
        scaledSize: new google.maps.Size(35, 35)
      }));
      marker.setPosition(place.geometry.location);
      marker.setVisible(true);
      var layerContaintPin = PinInPolygone(map,place.geometry.location);
      console.log(layerContaintPin);

      var address = '';
      if (place.address_components) {
        address = [
          (place.address_components[0] && place.address_components[0].short_name || ''),
          (place.address_components[1] && place.address_components[1].short_name || ''),
          (place.address_components[2] && place.address_components[2].short_name || '')
        ].join(' ');
      }

      infowindow.setContent('<div><strong>' + place.name + '</strong><br>' + address);
      infowindow.open(map, marker);
    });
}
