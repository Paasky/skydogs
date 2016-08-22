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
        super_tick_length: 100,
        
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
        anwhereAI: function(p){
            var a = p.getAircraft();
            
            // if the player isn't going anywhere
            if(a.destination.type=="none" && p.ai){
                // is the AI marked for deletion
                if(p.deleteAI){
                    AIRCRAFTS.deleteById(a.id);
                    PLAYERS.deleteById(p.id);
                    return;
                }
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
                    console.log('anywhereAI ('+p.id+'): heads for '+city.name);
                    a.destination = cloneObject(city.position);
                    a.destination.type = "city";
                    a.destination.id = rand_id;
                    if(game_data.AIRCRAFTS.get(a.id)){
                        $(document).trigger('cityLeave', a.id);
                    }
                }
            }
        },
        merchantAI: function(p){
            var a = p.getAircraft();

            // if the player isn't going anywhere
            if(a.destination.type=="none" && p.ai){

                // is the AI marked for deletion
                if(p.deleteAI){
                    console.log('deleting AI '+a.id);
                    AIRCRAFTS.deleteById(a.id);
                    PLAYERS.deleteById(p.id);
                    return;
                }

                //do we know where the ai is?
                var currentCity = CITIES.get(a.position.id);
                if(!currentCity){
                    server.ai.anwhereAI(p);
                    return;
                }
                // if the current player is sleeping in the city
                if(p.sleep>0){
                    p.sleep--;

                // if the player is active, do stuff
                } else {
                    var amount = 250;
                    var bestProfit = {profit: 0, id:0};

                    // find cities that are in range
                    CITIES.forEach(function(checkCity){
                        var range = hasRange(a, checkCity.position);

                        // not in range -> don't bother
                        if(!range.success) return;

                        // loop through each commodity
                        COMMODITIES.forEach(function(co){

                            // check can we buy & sell this
                            var purchaseStatus = currentCity.getCommoditySalePrice(co, amount);
                            var sellStatus = checkCity.getCommodityBuyPrice(co, amount);
                            if(!purchaseStatus.success || !sellStatus.success) return;

                            //  can we afford it?
                            var cost = amount * purchaseStatus.message;
                            if(cost > p.money) return;

                            // do we get any profit?
                            var sales = amount * sellStatus.message;
                            var profit = sales - cost;
                            if(profit < 0) return;

                            // costs & actual profit
                            var flightCosts = getCostPerKm(a) * range.dist.km;
                            var routeProfit = profit - flightCosts;

                            // is it better than what we have?
                            if(bestProfit.profit < routeProfit){
                                bestProfit.profit = routeProfit;
                                bestProfit.id = checkCity.id;
                                bestProfit.co = co;
                            }
                        });
                    });

                    var city = CITIES.get(bestProfit.id);
                    if(!city){
                        if(!p.supersleeps) p.supersleeps=0;
                        p.supersleeps++;
                        if(p.supersleeps>5){
                            console.log('merchantAI ('+p.id+'): no profitable route found for the '+p.supersleeps+'. time, mark for deletion');
                            p.deleteAI=true;
                            p.sleep=0;
                            return;
                        } else {
                            console.log('merchantAI ('+p.id+'): no profitable route found! Sleeping for a superTick, '+p.supersleeps+'. time');
                            p.sleep = server_data.game_settings.super_tick_length;
                            return;
                        }
                    }
                    p.supersleeps=0;

                    // buy the stuff
                    var purchaseStatus = buyCommodity(a, bestProfit.co, amount);
                    if(!purchaseStatus.success) return purchaseStatus;

                    console.log('merchantAI ('+p.id+'): heads for '+city.name+' for $'+Math.round(bestProfit.profit)+' profit!');
                    a.destination = cloneObject(city.position);
                    a.destination.type = "city";
                    a.destination.id = city.id;
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
            var p = a.getPlayer();
            // arrived aircraft might have disappeared from the game
            if(!a || !p) return;
            if(p.ai){
                a.cargoHold.forEach(function(co){
                    var saleStatus = sellCommodity(a, co, co.amount);
                    if(!saleStatus.success) return saleStatus;
                    console.log('AI ('+p.id+') made a profit of $'+saleStatus.message.profit);
                });

                var refuelStatus = refuel(a);
                if(refuelStatus.success){
                    console.log('AI ('+p.id+') refueled for $'+refuelStatus.message.price);
                } else {
                    console.log('AI ('+p.id+') could not refuel ('+refuelStatus.message+'), marking for deletion');
                    p.deleteAI=true;
                    p.sleep=0;
                }

            }
            if(game_data.AIRCRAFTS.get(a.id)){
                $(document).trigger('cityArrive', a.id);
            }
        });
        if(tickCounter>server_data.game_settings.super_tick_length){
            tickCounter=0;
            server.superTick();
        }
        tickCounter++;
    },
    superTick: function(){
        console.log('supertick!');

        // recalc economy, for each commodity in each city.market
        CITIES.forEach(function(c){
            c.market.forEach(function(co){

                // 1st the city eats the required amount and produces the produced amount
                var amount = co.amount-co.required;
                if(co.production) amount += co.production;
                if(amount<0) amount=0;
                co.amount = Math.round(amount);

                // set the market price
                co.price = getCommodityPrice(co.amount, co.required, COMMODITIES.get(co.id).base_price);
            });
        });

        // checkAI
        var AIlimit = 50;

        // mark extra AI players for deletion
        if(PLAYERS.ids.length > AIlimit){
            var toRemove = PLAYERS.ids.length - AIlimit;
            PLAYERS.forEach(function(p){
                if(!p.ai || toRemove==0) return;
                p.deleteAI = true;
                toRemove--;
            });

        // create new AI's
        } else {

        }
    },
};
var tickCounter = server_data.game_settings.super_tick_length;
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

function buyCommodity(aircraft, commodity, amount){

    // check variables
    if(!aircraft || !commodity || !amount) return {success: false, message: 'aircraft, commodity and amount are required'};

    // get required variables
    var city = CITIES.get(aircraft.position.id);
    if(!city) return {success: false, message: 'Land in a city before trying to buy commodities'};
    var player = aircraft.getPlayer;

    // get the price & can we buy this much?
    var priceStatus = city.getCommoditySalePrice(commodity, amount);
    if(!priceStatus.success) return priceStatus;

    // does the player have money?
    var sum = getMoney(priceStatus.message * amount);
    if(player.money < sum ) return {success: false, message: 'Not enough money'};

    // try to add it to the aircraft
    var addStatus = aircraft.addCargo(commodity, amount, priceStatus.message);
    if(!addStatus.success) return addStatus;

    // take it from the city
    city.market.get(commodity.id).amount -= amount;

    // all done, deduct the money & return
    player.money -= sum;
    return {success: true, message: { price: sum }};
}

function sellCommodity(aircraft, commodity, amount){

    // check variables
    if(!aircraft || !commodity || !amount) return {success: false, message: 'aircraft, commodity and amount are required'};

    // get required variables
    var city = CITIES.get(aircraft.position.id);
    if(!city) return {success: false, message: 'Land in a city before trying to sell commodities'};
    var player = aircraft.getPlayer();

    // get the price & can we sell this much?
    var priceStatus = city.getCommodityBuyPrice(commodity);
    if(!priceStatus.success) return priceStatus;

    // get the origValue if it's there
    var origValue = false;
    if(commodity.valuePerItem) origValue = getMoney(amount * commodity.valuePerItem);

    // try to take it from the aircraft
    var cargoStatus = aircraft.takeCargo(commodity, amount);
    if(!cargoStatus.success) return cargoStatus;

    // add it to the city
    city.market.get(commodity.id).amount += amount;
    var price = getMoney(amount * priceStatus.message);

    // all done, add the money & return
    player.money += price;

    var message = { price: price };
    if(origValue){
        message.origValue = origValue;
        message.profit = getMoney(price-origValue);
    }
    return {success: true, message: message };
}

function refuel(aircraft, amount){
    if(!aircraft) return {success: false, message: 'aircraft is required'};
    var city = CITIES.get(aircraft.position.id);
    if(!city) return {success: false, message: 'Land in a city before trying to refuel'};
    var player = aircraft.getPlayer();

    if(! amount || amount==-1) amount = aircraft.fuel.max - aircraft.fuel.amount;

    var priceReply = city.getCommoditySalePrice(COMMODITIES.get(18)); // 18 = fuel
    if(!priceReply.success) return priceReply;
    var sum = getMoney(priceReply.message * amount);
    if(player.money < sum ) return {success: false, message: 'Not enough money'};

    player.money -= sum;
    aircraft.fuel.amount += amount;
    return {success: true, message: { amount: amount, price: sum }};
}

function refuelFromCargoHold(amount){
    if(!amount) return {success: false, message: 'amount is required'};
    var player = PLAYERS.get(server_data.player_settings.id);
    var aircraft = player.getAircraft();

    if(amount==-1) amount = aircraft.fuel.max - aircraft.fuel.amount;

    var cargoStatus = aircraft.takeCargo(COMMODITIES.get(18), amount);
    if(!cargoStatus.success) return cargoStatus;
    aircraft.fuel.amount += amount;
    return {success: true, message: 'Refuel successful'};
}
