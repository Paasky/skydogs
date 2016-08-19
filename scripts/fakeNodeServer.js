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
        geo_per_kmh: 1,
        ai_sleep: 10,
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
        visibility: 200
    }
};
getDB();

var server = {
    ai: {
        merchantAI: function(p){
            var a = p.getAircraft();
            
            // if the player isn't going anywhere
            if(a.destination.type=="none" && p.ai){
                // if the current player is sleeping in the city
                if(p.sleep>0){
                    p.sleep--;

                // if the player is active, do stuff
                } else {
                    
                    var citiesInRange = [];
                    var closestCity = {dist: 9999999, id:0};
                    CITIES.forEach(function(city){
                        var range = hasRange(a, city.position);
                        if(range.status) citiesInRange.push(city.id);
                        if(range.dist.km < closestCity.dist){
                            closestCity.dist = range.dist.km;
                            closestCity.id = city.id;
                        }
                    });
                    
                    var rand_id = closestCity.id;
                    if(citiesInRange.length > 0){
                        // select a random city
                        rand_id = citiesInRange[Math.floor(Math.random()*citiesInRange.length)];
                    } else {
                        console.log('MERCHANTAI ------------ Everything is too far away! Fallback to closest city.');
                    }
                    var city = CITIES.get(rand_id);
                    console.log(p.name+' ('+p.id+') '+ 'heads for '+city.name);
                    a.destination = cloneObject(city.position);
                    a.destination.type = "city";
                    a.destination.id = rand_id;
                }
            }
        },
    },
    tick: function(){
        var arrivedAircraft = tick(AIRCRAFTS, server_data.game_settings.tick_length);
        updateGameData();
        PLAYERS.forEach(function(p){
            server.ai.merchantAI(p);
        });
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
    var new_AIRCRAFTS = new ObjectHolder();
    var new_PLAYERS = new ObjectHolder();
    
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
            new_AIRCRAFTS.set(new_a);
            new_PLAYERS.set(new_p);
        }
    });
    game_data.AIRCRAFTS = new_AIRCRAFTS;
    game_data.PLAYERS = new_PLAYERS;
}
updateGameData(PLAYERS.get(server_data.player_settings.id));


function setUserDestination(type, id){
    var aircraft = PLAYERS.get(server_data.player_settings.id).getAircraft();
    var new_dest;
    
    if(type=='city'){
        if(! id in CITIES){
            return false;
        }
        new_dest = cloneObject(CITIES.get(id).position);
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