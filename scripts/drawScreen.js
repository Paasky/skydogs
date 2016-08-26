var aircraft_markers = new ObjectHolder();

// updates the screen, which draws the players & the FoW
function drawAircrafts(){
    var game_settings = game_data.game_settings;
    var player_settings = game_data.player_settings;
    var aircrafts = game_data.AIRCRAFTS;
    var on_zoom = 'on';
    if(! game_data.player_settings.screen_settings.smooth_zoom) on_zoom = 'zoomend';
    
    function checkMarker(m){
        if(!m || ! aircrafts.get(m.id)){
            m.marker.remove();
            aircraft_markers.deleteById(m.id);
            console.log('DRAWSCREEN ------------ the marker has disappeared!');
        }
    }
    function checkAircraft(a_id){
        if(! aircrafts.get(a_id)){
            checkMarker(aircraft_markers.get(a_id));
            return false;
        } else {
            return true;
        }
    }
    
    // first remove markers that no longer exist
    aircraft_markers.forEach(checkMarker);
    
    // for each aircraft
    aircrafts.forEach(function(a){
        
        // `a` might disappear at any moment, so check it exists & store the values, just in case
        if(! a || ! checkAircraft(a.id)){
            console.log('DRAWSCREEN ------------ the aircraft has disappeared!');
            return;
        }
        var a_id = a.id;
        var a_name = a.name;
        var a_position = a.position;
        var a_destination = a.destination;
        var p = a.getPlayer();
        var p_id = p.id;
        var p_name = p.name;
        
        // if it doesn't exist, create a new marker
        if(! aircraft_markers.get(a_id)){
        
            // create an img element for the marker
            var el = document.createElement('div');
            el.className = 'aircraft_marker marker';
            if(p_id == player_settings.id) el.className += ' user_marker';
            el.setAttribute('id', a_id);
            
                var image = document.createElement('div');
                image.className = 'marker_image aircraft_image';
                image.style.backgroundImage = 'url('+ game_data.game_settings.img_path +'/airscrew1.png' +')';

                var label = document.createElement('div');
                label.className = 'marker_label aircraft_label';
                label.innerText = a_name;

                    var innerLabel = document.createElement('div');
                    innerLabel.className = 'inner_label';
                    innerLabel.innerText = p_name;
                    label.appendChild(innerLabel);

            el.appendChild(image);
            el.appendChild(label);
            
            // add the click trigger
            el.addEventListener('click', function() {
                $(document).trigger( 'aircraftClick', a );
            });

            // add marker to map
            var marker = new mapboxgl.Marker(el)
                            .setLngLat(a_position)
                            .addTo(map);
            aircraft_markers.set({
                id: a_id,
                marker: marker
            });
            
        } else {
            aircraft_markers.get(a_id).marker.setLngLat(a_position);
        }
        
        if(a_destination && a_destination.type != 'none'){
            var angle = getAngle(a_position, a_destination);
            angle -= map.getBearing();
            $('.aircraft_marker[id="'+a_id+'"] .aircraft_image')
            // .css('transform', 'rotate3d(1,0,0,'+map.getPitch()+'deg) rotate('+angle+'deg)');
            .css('transform', 'rotate('+angle+'deg)');
        }
    });
        
        
      //////////////////////////////////////
     /*********** ROUTE STUFF ************/
    //////////////////////////////////////
    /*
    // route variables
    var path = [
        player_markers[player_settings.id].getPosition(),
        new google.maps.LatLng(player_settings.heading.lat, player_settings.heading.lng)
    ];
    var visible = true;
    if(p.end_type=="none"){ visible = false; }
    
    // create the route
    var r = new google.maps.Polyline({
        geodesic: false,
        strokeColor: '#FFFFFF',
        strokeOpacity: 0.5,
        strokeWeight: 2,
        map: map,
        visible: visible,
        zIndex: game_settings.z_index.route,
        path: path,
        visible: visible
    });
    
    // add click listener to route
    google.maps.event.addListener(r, 'click', function (event) {
        //setNavBoxText(true, "player", p.id);
    });

    // add the marker & route into the players list
    players[player_settings.id].route = r;
    */
    
    // update player icon size to different zoom levels
    map.on(on_zoom, updateAircraftIcons);
    updateAircraftIcons();
    
    // create Fog of War
    updateFow();
    updateRangeCircle();
    // if( player_settings.screen_settings.follow ){ map.setCenter(player_markers[player_settings.id].getPosition()); }
}
drawAircrafts();


function updateFow(){
    if(! map._loaded) return false;
    var game_settings = game_data.game_settings;
    var player_settings = game_data.player_settings;
    
    // draw the FoW
    function getFoW() {
        var coords = new Array();
        
        if(player_settings.id in aircraft_markers){
            coords.push([game_settings.map_bounds.west-2, game_settings.map_bounds.south-2]);
            coords.push([game_settings.map_bounds.west-2, game_settings.map_bounds.north+2]);
            coords.push([game_settings.map_bounds.east+2, game_settings.map_bounds.north+2]);
            coords.push([game_settings.map_bounds.east+2, game_settings.map_bounds.south-2]);
            $.merge(
                coords,
                drawCircle(
                    aircraft_markers.get(player_settings.id).marker.getLngLat(),
                    player_settings.visibility,
                    1
                )
            );
            coords.push([game_settings.map_bounds.east+2, game_settings.map_bounds.south-2]);
            coords.push([game_settings.map_bounds.west-2, game_settings.map_bounds.south-2]);
        }
        
        return {
            'type': 'Feature',
            'properties': {
                'name': 'FoW'
            },
            'geometry': {
                'type': 'Polygon',
                'coordinates': [coords]
            }
        };
    }


    // create the FoW
    if(! player_settings.fogOfWar){
        map.addSource('fow', {
            'type': 'geojson',
            'data': getFoW()
        });
        player_settings.fogOfWar = true;
        
        map.addLayer({
            'id': 'fow',
            'type': 'fill',
            'source': 'fow',
            'layout': {},
            'paint': {
                'fill-color': '#000',
                'fill-opacity': 0.2
            }
        });
    } else {
        map.getSource('fow').setData(getFoW());
    }
}

function updateRangeCircle(){
    if(! map._loaded) return false;
    var player_settings = game_data.player_settings;
    
    function getRangeCircle(){
        return {
            "type": "Feature",
            "properties": {'name':'Range'},
            "geometry": {
                "type": "LineString",
                "coordinates": drawCircle(
                    aircraft_markers.get(player_settings.id).marker.getLngLat(),
                    getRangeKm(game_data.AIRCRAFTS.get(player_settings.id)),
                    1
                )
           }
        };
        return {
            'type': 'Feature',
            'properties': {},
            'geometry': {
                'type': 'LineString',
                'coordinates': []
            }
        };
    }
    
    // create the rangeCircle
    if(! player_settings.rangeCircle){
        map.addSource('rangeCircle', {
            'type': 'geojson',
            'data': getRangeCircle()
        });
        player_settings.rangeCircle = true;
        
        map.addLayer({
            'id': 'rangeCircle',
            'type': 'line',
            'source': 'rangeCircle',
            'layout': {
                "line-join": "round",
                "line-cap": "round"
            },
            'paint': {
                "line-color": "#fff",
                "line-width": 5,
                'line-opacity': 0.5,
                'line-dasharray': [1, 5]
            }
        });
    } else {
        map.getSource('rangeCircle').setData(getRangeCircle());
    }
}

// draw a circle
function drawCircle(point, radius, dir) {
    var points=64;
    var d2r = Math.PI / 180;   // degrees to radians 
    var r2d = 180 / Math.PI;   // radians to degrees 
    var earthsradius = 6378; // 3963 is the radius of the earth in miles

    // find the raidus in lat/lon 
    var rlat = (radius / earthsradius) * r2d; 
    var rlng = rlat / Math.cos(point.lat * d2r); 


    var extp = [];
    var end=points+1;
    for (var i=0; i < end; i++)  
    { 
        var theta = Math.PI * (i / (points/2)); 
        ey = point.lng + (rlng * Math.cos(theta)); // center a + radius x * cos(theta) 
        ex = point.lat + (rlat * Math.sin(theta)); // center b + radius y * sin(theta) 
        extp.push([ey, ex]); 
    } 
    return extp;
}


// update the city icon size for different zoom levels
function updateAircraftIcons(){
    var radius = Math.round(map.getZoom()/2*8);
    $('.aircraft_marker').css({
        'width': radius + 'px',
        'height': radius + 'px',
        'top': '-'+ (radius/2) + 'px',
        'left': '-'+ (radius/2) + 'px'
    });
}


function onScreenUpdate(){
    $(document).trigger('screenUpdate');
    tick(game_data.AIRCRAFTS, game_data.player_settings.tick_length);
    drawAircrafts();
}
var screenUpdate = setInterval(onScreenUpdate, game_data.player_settings.tick_length);
