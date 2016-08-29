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
        tick_length: 1000, // 1000ms, 1 sec
        super_tick_length: 60, // 60*tick_length, 1 min
        
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
        anywhereAI: function(p){
            var a = p.getAircraft();
            
            // if the player isn't going anywhere
            if(a.destination.type=="none" && p.ai){
                // is the AI marked for deletion
                if(p.deleteAI){
                    console.log('deleting AI ('+a.id+')');
                    AIRCRAFTS.deleteById(a.id);
                    PLAYERS.deleteById(p.id);
                    return;
                }
                // if the current player is sleeping in the city
                if(p.sleep>0){
                    p.sleep--;

                // if the player is active, do stuff
                } else {
                    
                    // get the closest city & all cities in range
                    var citiesInRange = [];
                    var closestCity = {dist: 9999999, id:0};
                    CITIES.forEach(function(city){
                        var range = hasRange(a, city.position);
                        if(range.dist.km > 1 && range.dist.km < closestCity.dist){
                            closestCity.dist = range.dist.km;
                            closestCity.id = city.id;
                        }
                        // not in range or too close -> don't bother
                        if(!range.success || range.dist.km < 10) return;

                        citiesInRange.push(city.id);
                    });
                    
                    var rand_id = closestCity.id;
                    if(rand_id==0){
                        console.log('anywhereAI ('+p.id+'): could not find any cities to fly to, marking for deletion');
                        p.deleteAI=true;
                        return;
                    }
                    // select a random city if there's one in range
                    if(citiesInRange.length > 0){
                        rand_id = citiesInRange[Math.floor(Math.random()*citiesInRange.length)];
                    }
                    var city = CITIES.get(rand_id);
                    console.log('anywhereAI ('+p.id+'): heads for '+city.name);
                    a.destination = cloneObject(city.position);
                    a.destination.type = "city";
                    a.destination.id = rand_id;
                    if(game_data.AIRCRAFTS.get(a.id)) $(document).trigger('cityLeave', a.id);
                }
            }
        },
        merchantAI: function(p){
            var a = p.getAircraft();

            // if the player isn't going anywhere
            if(a.destination.type=="none" && p.ai){

                // is the AI marked for deletion
                if(p.deleteAI){
                    console.log('deleting AI ('+a.id+')');
                    AIRCRAFTS.deleteById(a.id);
                    PLAYERS.deleteById(p.id);
                    return;
                }

                //do we know where the ai is?
                var currentCity = CITIES.get(a.position.id);
                if(!currentCity){
                    server.ai.anywhereAI(p);
                    return;
                }
                // if the current player is sleeping in the city
                if(p.sleep>0){
                    p.sleep--;

                // if the player is active, do stuff
                } else {
                    var bestProfit = {profit: 0, id:0, profitPerKm: 0};
                    var cargoSpace = a.getFreeCargoSpace();

                    // find cities that are in range
                    CITIES.forEach(function(checkCity){
                        var range = hasRange(a, checkCity.position);

                        // not in range or too close -> don't bother
                        if(!range.success || range.dist.km < 10) return;

                        // loop through each commodity
                        COMMODITIES.forEach(function(co){
                            var amount = Math.round(cargoSpace / co.weight-0.5);

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

                            // profitPerKm
                            var profitPerKm = profit / range.dist.km;

                            // is it better than what we have?
                            if(bestProfit.profitPerKm < profitPerKm){
                                bestProfit.profit = profit;
                                bestProfit.id = checkCity.id;
                                bestProfit.co = co;
                                bestProfit.amount = amount;
                            }
                        });
                    });

                    var city = CITIES.get(bestProfit.id);
                    if(!city){
                        console.log('merchantAI ('+p.id+'): no profitable route found, try our luck elsewhere');
                        server.ai.anywhereAI(p);
                        return;
                    }

                    // buy the stuff
                    var purchaseStatus = buyCommodity(a, bestProfit.co, bestProfit.amount);
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
                });

                var refuelStatus = refuel(a);
                if(refuelStatus.success){
                    if(refuelStatus.message.price<1){
                        console.log('tiny refuel, whats going on?');
                    }
                } else {
                    console.log('AI ('+p.id+') could not refuel ('+refuelStatus.message+'), marking for deletion');
                    p.deleteAI=true;
                    p.sleep=0;
                }
            }
            if(game_data.AIRCRAFTS.get(a.id)){
                $(document).trigger('cityArrive', {aircraft_id: a.id, city_id: a.position.id});
            }
        });
        if(tickCounter % server_data.game_settings.super_tick_length == 0) server.superTick();
        tickCounter++;
        $(document).trigger('tickDone');
    },
    superTick: function(){
        console.log('supertick!');

        // recalc economy, for each commodity in each city.market
        var logs = '';
        CITIES.forEach(function(c){
            c.market.forEach(function(co){

                // 1st the city eats the required amount and produces the produced amount
                var amount = co.amount-co.required;
                if(co.production) amount += co.production;
                if(amount<0) amount=0;
                co.amount = Math.round(amount);

                // set the market price
                var priceReply = getCommodityPrice(co.amount, co.required, COMMODITIES.get(co.id).base_price);
                co.price = priceReply.price;
                co.modifier = priceReply.modifier;

                // one for the history books
                MARKETHISTORY.push({
                    commodity: co.id,
                    country: c.country_id,
                    state: c.state_id,
                    city: c.id,
                    amount: co.amount,
                    required: co.required,
                    production: co.production,
                    price: co.price,
                    modifier: priceReply.modifier,
                    tick: tickCounter,
                });

                // adjust production & usage
                if(co.required > 0){
                    var changePercent = 5;
                    if(priceReply.modifier <= 0.5 || priceReply.modifier >= 2) changePercent = 10;

                    // if modifier is low, there's too much in storage
                    if(priceReply.modifier < 0.6){
                        logs += c.name+' has too much '+COMMODITIES.get(co.id).name+', adjusting: ';

                        // if it's produced, lower the production
                        if(co.production > 0 ){
                            co.production = Math.round(co.production * ( (100-changePercent) / 100 ) );
                            logs += 'prod -'+changePercent+'%, ';

                        // not produced, so increase consumption by x2
                        } else { changePercent *= 2; }
                        co.required = Math.round(co.required * ( (100+changePercent) / 100 ) );
                        logs += 'usage +'+changePercent+'%\n';

                    // if modifier is high, there's too little in storage
                    } else if(priceReply.modifier > 1.8){
                        logs = c.name+' has too little '+co.name+', adjusting: ';

                        // if it's produced, increase the production
                        if(co.production > 0 ){
                            co.production = Math.round(co.production * ( (100+changePercent) / 100 ) );
                            logs += 'prod +'+changePercent+'%, ';

                        // not produced, so lower consumption by x2
                        } else { changePercent *= 2; }
                        co.required = Math.round(co.required * ( (100-changePercent) / 100 ) );
                        logs += 'usage -'+changePercent+'%\n';
                    }
                }
            });
        });
        console.log(logs);

        // checkAI
        var AIlimit = 100;

        // mark extra AI players for deletion
        if(PLAYERS.ids.length > AIlimit){
            var toRemove = PLAYERS.ids.length - AIlimit;
            PLAYERS.forEach(function(p){
                if(!p.ai || toRemove==0) return;
                p.deleteAI = true;
                toRemove--;
                console.log('Too many players, marking AI ('+p.id+') for deletion');
            });

        // create new AI's
        } else {
            var createdAIs = 0;
            while(PLAYERS.ids.length < AIlimit && createdAIs < 25){
                var city = CITIES.get(CITIES.ids[ Math.floor(Math.random()*CITIES.ids.length) ]);

                var destination = { id:0, lat:0, lng:0, type:'none' };
                var position = cloneObject(city.position);
                position.id = city.id;

                var fuel = { amount: 100, max: 100, consumption: 0.35 };

                var p_name =    playerNames[0][Math.floor(Math.random()*playerNames[0].length)]+
                                ' '+
                                playerNames[1][Math.floor(Math.random()*playerNames[1].length)];

                var a_name = '';
                if(Math.round(Math.random()) == 0){
                    a_name = aircraftNames[0][Math.floor(Math.random()*aircraftNames[0].length)];
                } else {
                    a_name =
                        aircraftNames[1][0][Math.floor(Math.random()*aircraftNames[1][0].length)]+
                        ' '+
                        aircraftNames[1][1][Math.floor(Math.random()*aircraftNames[1][1].length)];
                }

                var playerId = getFirstFreePlayerId();
                var aircraftId = getFirstFreeAircraftId();

                PLAYERS.set( new Player(playerId, p_name, true, Math.round(Math.random()*50)+100, aircraftId) );
                AIRCRAFTS.set( new Aircraft(aircraftId, a_name, fuel, 360, position, destination, playerId, true, 1) );

                console.log('Added new AI ('+playerId+') with aircraft #'+aircraftId);
                createdAIs++;
            }
        }
        $(document).trigger('supertickDone');
    },
};
var tickCounter = 0;
var serverTicker = setInterval(server.tick, server_data.game_settings.tick_length);







// current session

var game_data = {
    game_settings: server_data.game_settings,
    player_settings: server_data.player_settings,
    COUNTRIES: COUNTRIES,
    CITIES: CITIES,
    AIRCRAFTTYPES: AIRCRAFTTYPES,
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


function setDestination(aircraft, type, city_id){
    var new_dest;
    
    if(type=='city'){
        if(! city_id in CITIES) return {success: false, message: 'City does not exist'};
        new_dest = cloneObject(CITIES.get(city_id).position);
    } else {
        return {success: false, message: 'Destination type not supported'};
    }
    
    var range = hasRange(aircraft, new_dest, aircraft.speed);
    if(range.success){
        aircraft.destination = new_dest;
        aircraft.destination.type = type;
        aircraft.destination.id = city_id;
        if(game_data.AIRCRAFTS.get(aircraft.id)) $(document).trigger('cityLeave', aircraft.id);
        return {success: true, message: 'Up up and away!'};
    } else {
        return {
            success: false,
            message: 'Not enough range! Current range: '+range.range_km+' km, distance: '+Math.round(range.dist.km)+' km'
        };
    }
}
function userSetDestination(type, id){
    var aircraft = PLAYERS.get(server_data.player_settings.id).getAircraft();
    var destReply = setDestination(aircraft, type, parseInt(id));
    if(destReply.success) $(document).trigger('cityLeave', aircraft.id);
    return destReply;
}

function buyCommodity(aircraft, commodity, amount){

    // check variables
    if(!aircraft || !commodity || !amount) return {success: false, message: 'aircraft, commodity and amount are required'};

    // get required variables
    var city = CITIES.get(aircraft.position.id);
    if(!city) return {success: false, message: 'Land in a city before trying to buy commodities'};
    var player = aircraft.getPlayer();

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
    player.money = getMoney(player.money - sum);

    CITYSALEHISTORY.push({
        commodity: commodity.id,
        amount: amount,
        price: priceStatus.message,
        country: city.country_id,
        state: city.state_id,
        city: city.id,
        tick: tickCounter,
    });

    return {success: true, message: { price: sum }};
}
function userBuyCommodity(commodity_id, amount){
    var commodity = COMMODITIES.get(commodity_id);
    var aircraft = PLAYERS.get(server_data.player_settings.id).getAircraft();
    return buyCommodity(aircraft, commodity, parseFloat(amount));
}

function sellCommodity(aircraft, commodity, amount){

    // check variables
    if(!aircraft || !commodity || !amount) return {success: false, message: 'aircraft, commodity and amount are required'};

    // get required variables
    var city = CITIES.get(aircraft.position.id);
    if(!city) return {success: false, message: 'Land in a city before trying to sell commodities'};
    var player = aircraft.getPlayer();

    // get the price & can we sell this much?
    var priceStatus = city.getCommodityBuyPrice(commodity, amount);
    if(!priceStatus.success) return priceStatus;

    // get the origValue if it's there
    var origValue = false;
    var aircraftCommodityReply = aircraft.getCargo(commodity);
    if(aircraftCommodityReply.success && aircraftCommodityReply.message.valuePerItem) origValue = getMoney(amount * aircraftCommodityReply.message.valuePerItem);

    // try to take it from the aircraft
    var cargoStatus = aircraft.takeCargo(commodity, amount);
    if(!cargoStatus.success) return cargoStatus;

    // add it to the city
    city.market.get(commodity.id).amount += amount;
    var price = getMoney(amount * priceStatus.message);

    // all done, add the money & return
    player.money = getMoney(player.money + price);

    var message = { price: price };
    if(origValue){
        message.origValue = origValue;
        message.profit = getMoney(price-origValue);
    }

    CITYBUYHISTORY.push({
        commodity: commodity.id,
        amount: amount,
        price: priceStatus.message,
        origPrice: origValue,
        country: city.country_id,
        state: city.state_id,
        city: city.id,
        tick: tickCounter,
    });

    return {success: true, message: message };
}
function userSellCommodity(commodity_id, amount){
    var commodity = COMMODITIES.get(commodity_id);
    var aircraft = PLAYERS.get(server_data.player_settings.id).getAircraft();
    return sellCommodity(aircraft, commodity, parseFloat(amount));
}

function refuel(aircraft, amount){
    if(!aircraft) return {success: false, message: 'aircraft is required'};
    var city = CITIES.get(aircraft.position.id);
    if(!city) return {success: false, message: 'Land in a city before trying to refuel'};
    var player = aircraft.getPlayer();

    if(! amount || amount==-1) amount = aircraft.fuel.max - aircraft.fuel.amount;
    if(amount===0) return {success: false, message: 'Aircraft is full of fuel'};
    var priceReply = city.getCommoditySalePrice(COMMODITIES.get(18)); // 18 = fuel, don't deduct it from the city stock
    if(!priceReply.success) return priceReply;
    var sum = getMoney(priceReply.message * amount);
    if(player.money < sum ) return {success: false, message: 'Not enough money'};

    player.money = getMoney(player.money - sum);
    aircraft.fuel.amount += amount;
    return {success: true, message: { amount: amount, price: sum }};
}
function userRefuel(amount){
    var aircraft = PLAYERS.get(server_data.player_settings.id).getAircraft();
    return refuel(aircraft, parseFloat(amount));
}

function refuelFromCargoHold(aircraft, amount){
    if(!aircraft) return {success: false, message: 'aircraft is required'};
    var player = aircraft.getPlayer();

    if(! amount || amount==-1) amount = aircraft.fuel.max - aircraft.fuel.amount;

    var cargoStatus = aircraft.takeCargo(COMMODITIES.get(18), amount);
    if(!cargoStatus.success) return cargoStatus;
    aircraft.fuel.amount += amount;
    return {success: true, message: 'Refuel successful'};
}
function userRefuelFromCargoHold(amount){
    var aircraft = PLAYERS.get(server_data.player_settings.id).getAircraft();
    return refuelFromCargoHold(aircraft, parseFloat(amount));
}
