var server_data = {
    game_settings: {
        map_bounds: {
            north: 61.5,
            south: 22,
            east: -60,
            west: -161
        },
        map_bounds_padding: 6,
        
        img_path: 'img',
        
        // geo_per_kmh: 0.1,
        geo_per_kmh: 0.1,
        ai_sleep: 50,
        tick_length: 1000,
        
        z_index: {
            border: 10,
            map_bound: 15,
            route: 20,
            city: 30,
            player: 40,
            fov: 50,
            label: 60,
            user_icon: 90
        }
    },

    player_settings: {
        id: 1,
        screen_settings: {
            city: true,
            border: false,
            tag: false,
            icon: true,
            route: true,
            info: false,
            navbox: false,
            follow: false,
            search: false,
            fullscreen: false
        },
        tick_length: 100,
        mouse_position: {x:0, y:0},
        position: { lat: 40.717, lng: -74.004 },
        heading: { lat: 37.2073850, lng: -93.2901779 },
        log: true,
        speed: 360,
        visibility: 150
    }
};
getDB();

var server = {
    ai: {
        merchantAI: function(p){
            var a = p.getAircraft();
            
            // if the player isn't going anywhere
            if(a.destination.type=="none" && p.ai==1){

                // if the current player is sleeping in the city
                if(p.sleep>0){
                    p.sleep--;

                // if the player is active, do stuff
                } else {
                    var citiesInRange = [];
                    CITIES.forEach(function(city){
                        var range = hasRange(a, city.position);
                        if(range.status) citiesInRange.push(city);
                    });
                    
                    // select a random city
                    var keys = Object.keys(citiesInRange);
                    var rand_id = keys[Math.floor(keys.length * Math.random())];
                    
                    p.destination = citiesInRange[rand_id].position;
                    p.destination.type = "city";
                    p.destination.id = rand_id;
                    
                    log('merchantAI: '+ p.name +' heads for '+ citiesInRange[rand_id].name)
                }
            }
        },
    },
    tick: function(){
        var arrivedAircraft = tick(AIRCRAFTS, server_data.game_settings.tick_length);
        updateGameData();
        arrivedAircraft.forEach(function(a){
            a.fuel.amount = a.fuel.max;
            $(document).trigger('cityArrive', a);
        });
    }
};
var serverTicker = setInterval(server.tick, server_data.game_settings.tick_length);







// current session

var game_data = {
    game_settings: server_data.game_settings,
    player_settings: server_data.player_settings,
    COUNTRIES: COUNTRIES,
    CITIES: CITIES,
    PLAYERS: new ObjectHolder(),
    AIRCRAFTS: new ObjectHolder()
};

function updateGameData(){
    var player = PLAYERS.get(server_data.player_settings.id);
    var aircraft = player.getAircraft();
    var aircrafts = new ObjectHolder();
    var players = new ObjectHolder();
    
    // check each active aircraft (as a)
    AIRCRAFTS.forEach(function(a){
        
        // get distance between aircraft & a
        var distances = getDistances(
            aircraft.position,
            a.position
        );
        
        // if the player can see p, 
        if(distances.km <= server_data.player_settings.visibility){
            
            // add cloned a & p to the list
            var new_a = cloneObject(a);
            new_a.server = false;
            var new_p = cloneObject(a.getPlayer());
            new_p.server = false;
            aircrafts.set(new_a);
            players.set(new_p);
        }
    });
    
    // update the player's game data & trigger the event
    game_data.AIRCRAFTS = aircrafts;
    game_data.PLAYERS = players;
}
updateGameData(PLAYERS.get(server_data.player_settings.id));


function setUserDestination(type, id){
    var aircraft = PLAYERS.get(server_data.player_settings.id).getAircraft();
    var new_dest;
    
    if(type=='city'){
        if(! id in CITIES){
            return false;
        }
        new_dest = CITIES.get(id).position;
    } else {
        return false;
    }
    
    var range = hasRange(aircraft, new_dest, aircraft.speed);
    if(range.status){
        aircraft.destination = new_dest;
        aircraft.destination.type = type;
        aircraft.destination.id = id;
        return 'up up and away!';
    } else {
        return 'Not enough range! Current range: '+range.range_km+' km, distance: '+Math.round(range.dist.km)+' km';
    }
}