var server_data = {
    game_settings: {
        map_bounds: {
            north: 61.5,
            south: 20,
            east: -60,
            west: -161
        },
        map_bounds_padding: 6,
        
        img_path: 'img',
        
        // geo_per_kmh: 0.1,
        geo_per_kmh: 0.5,
        ai_sleep: 10,
        tick_length: 500,
        
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
            fullscreen: false,
            smooth_zoom: false
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
                        if(range.status && range.dist.km > 10) citiesInRange.push(city.id);
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
                        //console.log('MERCHANTAI ------------ Everything is too far away! Fallback to closest city.');
                    }
                    var city = CITIES.get(rand_id);
                    //console.log(p.name+' ('+p.id+') '+ 'heads for '+city.name);
                    a.destination = cloneObject(city.position);
                    a.destination.type = "city";
                    a.destination.id = rand_id;
                    if(game_data.AIRCRAFTS.get(a.id)){
                        $(document).trigger('cityLeave', a.id);
                    }
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
            if(game_data.AIRCRAFTS.get(a.id)){
                $(document).trigger('cityArrive', a.id);
            }
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
    AIRCRAFTS: new ObjectHolder(),
    COMMODITIES: COMMODITIES,
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


function setDestination(type, id){
    var aircraft = PLAYERS.get(server_data.player_settings.id).getAircraft();
    var new_dest;
    
    if(type=='city'){
        if(! id in CITIES) return {success: false, message: 'City does not exist'};
        new_dest = cloneObject(CITIES.get(id).position);
    } else {
        return {success: false, message: 'Destination type not supported'};
    }
    
    var range = hasRange(aircraft, new_dest, aircraft.speed);
    if(range.status){
        aircraft.destination = new_dest;
        aircraft.destination.type = type;
        aircraft.destination.id = id;
        $(document).trigger('cityLeave', aircraft.id);
        return {success: true, message: 'Up up and away!'};;
    } else {
        return {
            success: false,
            message: 'Not enough range! Current range: '+range.range_km+' km, distance: '+Math.round(range.dist.km)+' km'
        };
    }
}

function buyCommodity(commodity, amount){
    if(!commodity || !amount) return {success: false, message: 'commodity and amount are required'};
    var player = PLAYERS.get(server_data.player_settings.id);
    var aircraft = player.getAircraft();
    var city = CITIES.get(aircraft.position.id);
    if(!city) return {success: false, message: 'Land in a city before trying to buy commodities'};

    var co_price = city.getCommoditySalePrice(commodity);
    var sum = co_price * amount;
    if(player.money < sum ) return {success: false, message: 'Not enough money'};

    player.money -= sum;
    var addStatus = aircraft.addCargo(commodity, amount, co_price);
    if(!addStatus.success) return addStatus;
    return {success: true, message: 'Purchase successful'};
}

function sellCommodity(commodity, amount){
    if(!commodity || !amount) return {success: false, message: 'commodity and amount are required'};
    var player = PLAYERS.get(server_data.player_settings.id);
    var aircraft = player.getAircraft();
    var city = CITIES.get(aircraft.position.id);
    if(!city) return {success: false, message: 'Land in a city before trying to sell commodities'};

    var co_price = city.getCommodityBuyPrice(commodity);
    var cargoStatus = aircraft.takeCargo(commodity, amount);
    if(!cargoStatus.success) return cargoStatus;
    player.money += amount * co_price;
    return {success: true, message: 'Sale successful'};
}
