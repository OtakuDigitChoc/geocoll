var map;
var polySecteurs;
var markerCluster;
var infoWindows = [];
var markers = [];

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 43.946679, lng: 7.179026},
    minZoom : 10,
    zoom: 9
  });
  DisplaySectors(map);
  SearchAdress(map);
  DisplayColleges(map);
}

/*@author : Ali Boulajine
*@comment : reçoit en paramétre la map (pas necessaire) et une latLang,
            renvoie le polygone (secteur) contenant la latlang passé en paramétres.
 */
function PinInPolygone(map, latLang){
  var layerContaintPin = null;
  map.data.forEach(function(feature){
    var geo =  feature.getGeometry();
    var paths = null;
    var type = geo.getType();
    geo.getArray().forEach(function(multiPoly){
      if (type === "MultiPolygon" ) {
        multiPoly.getArray().forEach(function(poly){
          var multiPolygon= Array();
             multiPolygon.push(poly.getArray());
             paths = multiPolygon;
        });
      }
      else {
        paths = multiPoly.getArray();
      }
    });
      var secteur = new google.maps.Polygon({paths:paths});
      if ( google.maps.geometry.poly.containsLocation(latLang,secteur)){
        layerContaintPin = feature;
      }
  });
  return layerContaintPin;
}


function DisplaySectors(map){
  map.data.addGeoJson(secteurs,'1');
  map.data.setStyle(function(feature) {
    return {
      fillColor: 'blue',
      fillOpacity : 0.1,
      strokeColor : 'blue',
      clickable : false,
      strokeWeight: 1
    };
  });
    map.data.addListener('mousedown', function(event) {
    map.data.revertStyle();
    map.data.overrideStyle(event.feature, {fillColor: 'red',strokeColor: 'red',strokeWeight: 3});
    document.getElementById('info-box').textContent = event.feature.getProperty('NOM_SECTEUR');
  });

  /*map.data.addListener('mouseup', function(event) {
    map.data.revertStyle();
    document.getElementById('info-box').textContent = "";
  });*/
}
/*@author : Ali Boulajine
*@comment :- recherche adresse
           - itinérao
 */
function SearchAdress(map){
  var geocoder = new google.maps.Geocoder();
  var directionsService = new google.maps.DirectionsService;
  var directionsDisplay = new google.maps.DirectionsRenderer;
  var travel_mode = google.maps.TravelMode.WALKING;//mode itinéraire à pied
  directionsDisplay.setMap(map);

  var place_id = null;
  var options = {
    componentRestrictions: {country: 'fr'}
  };

  var input = /** @type {!HTMLInputElement} */(
        document.getElementById('pac-input'));

    var types = document.getElementById('type-selector');
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(types);

    var autocomplete = new google.maps.places.Autocomplete(input, options);
    console.log(input);
    autocomplete.bindTo('bounds', map);

    var infowindow = new google.maps.InfoWindow();
    var marker = new google.maps.Marker({
      map: map,
      anchorPoint: new google.maps.Point(0, -29)
    });

    autocomplete.addListener('place_changed', function() {
      infowindow.close();
      marker.setVisible(false);
      console.log(autocomplete);
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
      console.log(place.place_id);
      var layerContaintPin = PinInPolygone(map,place.geometry.location);
      map.data.revertStyle();
      map.data.overrideStyle(layerContaintPin, {fillColor: 'red',strokeColor: 'red',strokeWeight: 3});
      console.log(layerContaintPin);
      var adresse_dest = layerContaintPin['f'].ADRESSE +", alpes maritimes";
      geocoder.geocode({'address': adresse_dest}, function(results, status) {
      if (status === google.maps.GeocoderStatus.OK) {
        place_id = results[0].place_id;
        console.log(place_id);
          directionsService.route({
            origin: {'placeId': place.place_id},
            destination: {'placeId': place_id},
            travelMode: travel_mode
          }, function(response, status) {
            console.log(status);
            console.log(response);
          if (status === google.maps.DirectionsStatus.OK) {
            directionsDisplay.setDirections(response);
          }
          else {
            window.alert('On arrive pas à calculer votre itinéraire ' + status);
          }
          });

        } else {
          alert('On arrive pas à calculer votre itinéraire : pb adresse college ' + status);
        }
      });

      var address = '';
      if (place.address_components) {
        address = [
          (place.address_components[0] && place.address_components[0].short_name || ''),
          (place.address_components[1] && place.address_components[1].short_name || ''),
          (place.address_components[2] && place.address_components[2].short_name || '')
        ].join(' ');
      }


      infowindow.setContent('<div><strong>Votre Adresse</strong><br>' + address);
      FindMarker(layerContaintPin['f'].NOM_SECTEUR);
      infowindow.open(map, marker);
    });
}

/*@author : Ali Boulajine
 *@comment : reçoit en paramétre la map (pas necessaire), charge le fichier kml (layer college)
            en ajax (jquery-2.2.4.js) puis on le converti avec la bibliothéque (togeojson.js) et on boucle
            sur les feature pour ajouter chaque marker et sont infowindow.
            les markers sont mit dans un cluster avec la bibliothéque (markerClusterer.js)
 */
function DisplayColleges(map){
  var pinBlue = {
    url: 'img/university-blue.png',
    size: new google.maps.Size(32, 37),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(0, 37)
  };
  var pinRed = {
    url: 'img/university-red.png',
    size: new google.maps.Size(32, 37),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(0, 37)
  };
  $.ajax('data/colleges.kml').done(function(geojsonColleges) {
      var infoWindowActive = null;
      var colleges = toGeoJSON.kml(geojsonColleges);
      var contentInfo;
      colleges.features.forEach(function(college){
        var properties = college.properties;
        var geometry = college.geometry;
        contentInfo = '<strong>'+properties.coll_nom1+'  '+ properties.coll_nom2+'</strong><br>';
            contentInfo += properties.coll_adr +' '+properties.coll_com+'<br>';
            contentInfo += properties.coll_tel;
        var infoWindow = new google.maps.InfoWindow({
          position: {lat : geometry.coordinates[1], lng :geometry.coordinates[0]},
          content: contentInfo
        });
        var marker = new google.maps.Marker({
          position: {lat : geometry.coordinates[1], lng :geometry.coordinates[0]},
          map: map,
          icon: properties.coll_type === "CLG P" ? pinRed : pinBlue,
          title: properties.coll_nom1 + " " + properties.coll_nom2,
          zIndex: properties.coll_type === "CLG P" ? 1 : 2
        });
        markers.push(marker);
        infoWindows.push(infoWindow);

        google.maps.event.addListener(marker ,'click', function() {
          console.log(infoWindow);
            if (infoWindowActive != null) infoWindowActive.close();
            infoWindow.open(map, marker);
            infoWindowActive = infoWindow;
            document.getElementById('info-box').HTMLInputElement = contentInfo;
        });
      });
      var options = {
          imagePath: 'img/m'
      };
      markerCluster = new MarkerClusterer(map, markers, options);
  });
}

/*@author : Ali Boulajine
 *@comment : reçoit en paramétre le nom du secteur, trouve le marker correspendant,
            si il y'en a un on cherche l'infoWindow correspendant et on l'ouvre.
 */
function FindMarker(secteurName){
  markers.find(function(marker){
    if ( marker.title.includes(secteurName)) {
      infoWindows.find(function(infoWindow){
        if (infoWindow.getPosition().toString() === marker.position.toString() ){
          console.log(infoWindow.getPosition().toJSON());
          console.log(marker.position.toJSON());
          infoWindow.open(map,marker);
        }
      });
    }
  });

}
