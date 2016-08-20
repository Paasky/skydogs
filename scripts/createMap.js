var map;

// creates the map, the map bounds & the cities
function createMap(){
    var game_settings = game_data.game_settings;
    var cities = game_data.CITIES;
    var on_zoom = 'on';
    if(! game_data.player_settings.screen_settings.smooth_zoom) on_zoom = 'zoomend';
    
    mapboxgl.accessToken = 'pk.eyJ1IjoicGFhc2t5IiwiYSI6ImNpcXJtMzNmYzAwOGhoeW5tbW14dGcxbTkifQ.fGxM6r956obCHqPxCFqE2Q';

    // create the map
    map = new mapboxgl.Map({
        container: 'map-canvas',
        style: 'mapbox://styles/paasky/ciqrm5tfn0003cem6ez8q3tmz',
        center: PLAYERS.get(game_data.player_settings.id).getAircraft().position,
        zoom: 8,
        minZoom: 6,
        maxZoom: 10,
        pitch: 30
    });
    map.setMaxBounds([
        [game_settings.map_bounds.west, game_settings.map_bounds.south],
        [game_settings.map_bounds.east, game_settings.map_bounds.north]
    ]);
    map.on(on_zoom, function(){
        map.setPitch( ( map.getZoom() - 6 ) * 10 );
    });
    
    // create cities
    cities.forEach(function(city){
        var country = city.getCountry();
        
        // create an img element for the marker
        var el = document.createElement('div');
        el.className = 'city_marker marker';
        el.style.backgroundImage = 'url('+ getFlagUrl( country.flag_file, 'roundel', 'sm' ) +')';
        
        // create & append the city label
        var label = document.createElement('div');
        label.className = 'marker_label city_label';
        label.innerText = city.name;
        label.style.backgroundColor = country.color1;
        label.style.borderColor = country.color2;
        label.style.color = country.color2;
        el.appendChild(label);
        
        // add the click trigger
        el.addEventListener('click', function() {
            $(document).trigger( 'cityClick', city );
        });

        // add marker to map
        new mapboxgl.Marker(el)
            .setLngLat(city.position)
            .addTo(map);
    });
    
    // update the icon sizes now & during zooming
    updateCityIcons();
    map.on(on_zoom, updateCityIcons);
}

// update the city icon size for different zoom levels
function updateCityIcons(){
    var radius = Math.round(map.getZoom()/2*10);
    $('.city_marker').css({
        'width': radius + 'px',
        'height': radius + 'px',
        'top': '-'+ (radius/2) + 'px',
        'left': '-'+ (radius/2) + 'px'
    });
}

createMap();
