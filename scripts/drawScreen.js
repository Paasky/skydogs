var aircraft_markers = new ObjectHolder();

// updates the screen, which draws the players & the FoW
function drawAircrafts(){
    var game_settings = game_data.game_settings;
    var player_settings = game_data.player_settings;
    var players = game_data.PLAYERS;
    var aircrafts = game_data.AIRCRAFTS;
    
    // first remove markers that no longer exist
    aircraft_markers.forEach(function(m){
        if(! aircrafts.get(m.id)){
            aircraft_markers.get(m.id).marker.remove();
            aircraft_markers.deleteById(m.id);
        }
    });
    
    // for each aircraft
    aircrafts.forEach(function(a){
        var p = a.getPlayer();
        if(! aircrafts.get(a.id)){ return; }
        
        // if it doesn't exist, create a new marker
        if(! aircraft_markers.get(a.id)){
        
            // create an img element for the marker
            var el = document.createElement('div');
            el.className = 'aircraft_marker marker';
            if(p.id == player_settings.id) el.className += ' user_marker';
            el.setAttribute('id', a.id);
            
                var image = document.createElement('div');
                image.className = 'marker_image aircraft_image';
                image.style.backgroundImage = 'url('+ game_data.game_settings.img_path +'/airscrew1.png' +')';

                var label = document.createElement('div');
                label.className = 'marker_label aircraft_label';
                label.innerText = a.name;

                    var innerLabel = document.createElement('div');
                    innerLabel.className = 'inner_label';
                    innerLabel.innerText = p.name;
                    label.appendChild(innerLabel);

            el.appendChild(image);
            el.appendChild(label);
            
            // add the click trigger
            el.addEventListener('click', function() {
                $(document).trigger( 'aircraftClick', a );
            });

            // add marker to map
            var marker = new mapboxgl.Marker(el)
                            .setLngLat(LngLat(a.position))
                            .addTo(map);
            aircraft_markers.set({
                id: a.id,
                marker: marker
            });
            
        } else {
            aircraft_markers.get(a.id).marker.setLngLat(LngLat(a.position));
        }
        var angle = 0;
        if(a.destination && a.destination.type != 'none'){
            angle = getAngle(a.position, a.destination);
        }
        angle -= map.getBearing();
        $('.aircraft_marker[id="'+a.id+'"] .aircraft_image')
        // .css('transform', 'rotate3d(1,0,0,'+map.getPitch()+'deg) rotate('+angle+'deg)');
        .css('transform', 'rotate('+angle+'deg)');
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
    map.on('zoom', updateAircraftIcons);
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
    var players = game_data.players;
    
    // draw the FoW
    function getFoW() {
        var coords = new Array();
        
        if(player_settings.id in aircraft_markers){
            coords.push([game_settings.map_bounds.west, game_settings.map_bounds.south]);
            coords.push([game_settings.map_bounds.west, game_settings.map_bounds.north]);
            coords.push([game_settings.map_bounds.east, game_settings.map_bounds.north]);
            coords.push([game_settings.map_bounds.east, game_settings.map_bounds.south]);
            $.merge(
                coords,
                drawCircle(
                    aircraft_markers.get(player_settings.id).marker.getLngLat(),
                    player_settings.visibility,
                    1
                )
            );
            coords.push([game_settings.map_bounds.east, game_settings.map_bounds.south]);
            coords.push([game_settings.map_bounds.west, game_settings.map_bounds.south]);
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
                    aircraft_markers.get(game_data.player_settings.id).marker.getLngLat(),
                    getRangeKm(game_data.AIRCRAFTS.get(game_data.player_settings.id)),
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
                "line-color": "#eee",
                "line-width": 5,
                'line-opacity': 0.2,
                'line-dasharray': [1, 4]
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
    var radius = Math.round(map.getZoom()/2*10);
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

function resetScreenUpdate(screen_update_frequency){
    clearInterval(screenUpdate);
    game_data.player_settings.screen_update_frequency = screen_update_frequency;
    screenUpdate = setInterval(onScreenUpdate, screen_update_frequency);
}