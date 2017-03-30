	var current_page = 1;
	var lat = 0;
	var lng = 0;
	var earth_list = [];
	var asc_time = false;
	var asc_mag = false;
	//read JSON data from specific link
	function printtime(){
		//get time range
		var start = $("#startDate").val();
		var end = $("#endDate").val();
		//corner situation
		if(start >= end){
			alert("Please enter valid date range!");
			return;
		}
		$.ajax({
            url: 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=' + start + '&endtime=' + end,
            type: 'GET',
            dataType: 'json',
			success: function (dt) {
				if(dt != undefined){
				array = dt;
				//make sure data is not null
				if(array.features.length!=0){
					changePage(1);
					$("#map").css("display", "none");
				}
				else{
					alert("No result in your date range, please search other date again!");
					return;
				}
				}
            },
            error: function () {
				alert("Can not find valid url!");
            }
		});
	}
	//create table accoring to data length
	function maketable(){
		$('#historical_table').append($('<tbody/>'));
		var j = 1;
		for (var i = (current_page-1)*7; i < (current_page-1)*7+7; i++) {
			var r = $('<tr/>');
			//this list for multiple marker
			earth_list.push([array.features[i].properties.place, array.features[i].geometry.coordinates[1], array.features[i].geometry.coordinates[0]]);
			for (var Index = 0; Index < 3; Index++) {
				//date
				if(Index == 0){
					var value = array.features[i].properties.time;
					d = new Date(value); // the date since the epoch (1 January, 1970)
					value = d.toLocaleString(); 
				}
				//location
				if(Index == 1){
					var value = array.features[i].properties.place;
				}
				//magnitude
				if(Index == 2){
					var value = array.features[i].properties.mag;	
				}
				if (value == null) {
					value = "";
				}
				r.append($('<td/>').html(value));
				r.attr("id", i);
				r.attr("data-target", "#Modal");
				r.attr("data-toggle", "modal" );
				$('#historical_table').append(r);
				//add click event to every data
				$("tbody > tr").click(function () {
					var clicked = $(this).attr("id");
					lat = array.features[clicked].geometry.coordinates[1];
					lng = array.features[clicked].geometry.coordinates[0];
					$("#type").html("Type: " + array.features[clicked].properties.type);
					$("#location").html("Location: " + array.features[clicked].properties.place);
					$("#depth").html("Depth of earthquake: " + array.features[clicked].geometry.coordinates[1]);
					$("#link").html(array.features[clicked].properties.url);
					$("#link").attr("href", array.features[clicked].properties.url);
					var visibile = array.features[clicked].properties.status;
					if(visibile != "reviewed"){
						$("#automatic").css("visibility", "visible");
					}
					else{
						$("#reviewed").css("visibility", "visible");
					}
					$("#fire").attr("title", array.features[clicked].properties.sig);
					initialize();
				});
			}
		}
		initialize_map()
		$("#pagination").css("display", "inline"); 
		$("tbody").attr("id", "list_body");
	}
	function removetable(){
		$('#historical_table tbody').remove();
	}
	function prevPage(){
		if (current_page > 1) {
			current_page--;
			changePage(current_page);
		}
	}
	function nextPage(){
		if (current_page < numPages()) {
			current_page++;
			changePage(current_page);
		}
	}
	function changePage(page){
	removetable();
    var next = $("#next");
    var prev = $("#prev");
    var page_number = $("#page");
	$("#map_wrapper").css("display", "block");
    // Validate page
    if (page < 1) page = 1;
    if (page > numPages()) page = numPages();
	$("thead").css("visibility", "visible"); 
    maketable();
    page_number.html(page + "/" + numPages());

    if (page == 1) {
        prev.css("visibility", "hidden"); 
    } else {
        prev.css("visibility", "visible"); 
    }

    if (page == numPages()) {
        next.css("visibility", "hidden");
    } else {
        next.css("visibility", "visible"); 
    }
	}
	function numPages(){
		return Math.ceil(array.features.length / 7);
	}
	//single marker google map
	//https://developers.google.com/maps/documentation/javascript/markers
	function initialize() {
	var myLatLng = {lat, lng};
        var map = new google.maps.Map(document.getElementById('googleMap'), {
          zoom: 4,
          center: myLatLng
        });

        var marker = new google.maps.Marker({
          position: myLatLng,
          map: map
        });
	}
	//multiple markers in google map
	//https://wrightshq.com/playground/placing-multiple-markers-on-a-google-map-using-api-3/
	function initialize_map() {
    var map;
    var bounds = new google.maps.LatLngBounds();
    var mapOptions = {
        mapTypeId: 'roadmap'
    };
                    
    // Display a map on the page
    map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
    map.setTilt(45);
        
    // Multiple Markers
	var k = 0;
	var markers = [];
	for(var j = (current_page-1)*7; j < (current_page-1)*7+7; j++){
		markers.push(earth_list[j]);
		k ++;
	}
                        
    // Info Window Content
    var infoWindowContent = [];
	for(var i = 0; i < 7; i++){
		infoWindowContent.push(['<div class="info_content">' +
        '<h3>' + markers[i][0] + '</h3>' +
        '</div>']);
	}
        
    // Display multiple markers on a map
    var infoWindow = new google.maps.InfoWindow(), marker, i;

    // Loop through our array of markers & place each one on the map  
    for( i = 0; i < markers.length; i++ ) {
        var position = new google.maps.LatLng(markers[i][1], markers[i][2]);
        bounds.extend(position);
        marker = new google.maps.Marker({
            position: position,
            map: map,
            title: markers[i][0]
        });
        // Allow each marker to have an info window    
        google.maps.event.addListener(marker, 'mouseover', (function(marker, i) {
            return function() {
                infoWindow.setContent(infoWindowContent[i][0]);
                infoWindow.open(map, marker);
            }
        })(marker, i));
        // Automatically center the map fitting all markers on the screen
        map.fitBounds(bounds);
    }
    // Override our map zoom level once our fitBounds function runs (Make sure it only runs once)
    var boundsListener = google.maps.event.addListener((map), 'bounds_changed', function(event) {
        this.setZoom(1);
        google.maps.event.removeListener(boundsListener);
    });
}

	function sortByDate(){
	var arr = array.features;
	var key = 'time';
	arr.sort(function(a, b) {
        var x = a.properties[key]; var y = b.properties[key];
		if(asc_time){
			$("#date_asc").css("display", "inline");
			$("#date_dsc").css("display", "none");
			$("#mag_asc").css("display", "none");
			$("#mag_dsc").css("display", "none");
			return ((x < y) ? -1 : ((x > y) ? 1 : 0));
		}
		else{
			$("#date_asc").css("display", "none");
			$("#date_dsc").css("display", "inline");
			$("#mag_asc").css("display", "none");
			$("#mag_dsc").css("display", "none");
			return ((x < y) ? 1 : ((x > y) ? -1 : 0));
		}
    });
	asc_time = !asc_time;
	changePage(current_page);
}

	function sortByMag(){
	var arr = array.features;
	var key = 'mag';
	arr.sort(function(a, b) {
        var x = a.properties[key]; var y = b.properties[key];
		if(asc_mag){	
			$("#date_asc").css("display", "none");
			$("#date_dsc").css("display", "none");
			$("#mag_asc").css("display", "inline");
			$("#mag_dsc").css("display", "none");
			return ((x < y) ? -1 : ((x > y) ? 1 : 0));
		}
		else{
			$("#date_asc").css("display", "none");
			$("#date_dsc").css("display", "none");
			$("#mag_asc").css("display", "none");
			$("#mag_dsc").css("display", "inline");
			return ((x < y) ? 1 : ((x > y) ? -1 : 0));
		}
    });
	asc_mag = !asc_mag;
	changePage(current_page);	
}	
	//circle markers for earthquake data
	//https://developers.google.com/maps/documentation/javascript/earthquakes
	var map;
      function initMap() {
        map = new google.maps.Map(document.getElementById('map'), {
          zoom: 2,
          center: {lat: -33.865427, lng: 151.196123},
          mapTypeId: 'terrain'
        });

        // Create a <script> tag and set the USGS URL as the source.
        var script = document.createElement('script');

        // This example uses a local copy of the GeoJSON stored at
        // http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojsonp
        script.src = 'https://developers.google.com/maps/documentation/javascript/examples/json/earthquake_GeoJSONP.js';
        document.getElementsByTagName('head')[0].appendChild(script);

        map.data.setStyle(function(feature) {
          var magnitude = feature.getProperty('mag');
          return {
            icon: getCircle(magnitude)
          };
        });
      }

      function getCircle(magnitude) {
        return {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: 'red',
          fillOpacity: .2,
          scale: Math.pow(2, magnitude) / 2,
          strokeColor: 'white',
          strokeWeight: .5
        };
      }

      function eqfeed_callback(results) {
        map.data.addGeoJson(results);
      }