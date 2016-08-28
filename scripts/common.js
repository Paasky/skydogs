function tick(aircrafts, tick_length){
    var arrivedAircraft = [];
    aircrafts.forEach(function(a){
        var p = a.getPlayer();

        // if the route is visible (aka it exists)
        if(a.destination.type && a.destination.type != "none"){

            // distance calculations
            var dist = getDistances(a.position, a.destination, a.speed, tick_length);

            // if the distance left to travel is larger than the distance the player will travel
            if(dist.geo>dist.dist_per_tick){
                var dist_travelled = getDistances(a.position, dist.new_pos);

                // set position of player
                a.position.lat=dist.new_pos.lat;
                a.position.lng=dist.new_pos.lng;

                a.fuel.amount -= a.fuel.consumption*dist_travelled.km;

            // if the distance left to travel is same or smaller than the distance the player will travel
            } else {
                var dist_travelled = getDistances(a.position, a.destination);
                a.fuel.amount -= a.fuel.consumption*dist_travelled.km;

                arrivedAircraft.push(a);
                // set player position to the destination, hide the route path, and set info box to 0
                a.position = cloneObject(a.destination);
                a.destination.type = 'none';
                if(p.ai) p.sleep=server_data.game_settings.ai_sleep;
            }
        }
    });
    return arrivedAircraft;
}

function cloneObject(obj) {
    return jQuery.extend(true, {}, obj);
}

function isOnline(p){
    if(p.id == server_data.player_settings.id){
        return true;
    } else {
        return false;
    }
}

function log(text){
    $(document).trigger('log', text);
    console.log(text);
    if(game_data.player_settings.log == true){
        var nextLog = $('<p>'+text+'</p>');
        $('#logger').append(nextLog);
        nextLog.fadeOut(2000, function(){ nextLog.remove(); });
    }
}

// calculates the optimal angle to intercept another player
function getAngleOfAttack(pos_attacker, pos_defender,
                          dest_defender, speed_attacker,
                          speed_defender){
    var angle_a = getAngle(pos_defender, dest_defender);
    var side_z = getDistances(pos_attacker, pos_defender).geo;
    
    var math1 = -2 * side_z * Math.cos(angle_a);
    var math2 = 2 * side_z * Math.sqrt(Math.cos(angle_a)^2 + speed_attacker^2 / speed_defender^2 -1);
    var math3 = 2 * (speed_attacker^2 / speed_defender^2 -1);
    var side_y =  (math1 + math2) / math3;
    var side_x = speed_attacker / speed_defender * side_y;
    var angle_b = Math.asin(speed_defender / speed_attacker * Math.sin(angle_a));
    
    var answer = {
        defender_dist: side_y,
        attacker_dist: side_x,
        attacker_angle: angle_b,
    };
    return answer;
}

// calculates the distance between two points
function getDistances(pos1, pos2, speed, tick_length){
    if(speed===undefined) speed=false;
    //--------  Distance in Geo  --------
    var dist_x = pos2.lng - pos1.lng;
    var dist_y = pos2.lat - pos1.lat;
    var dist_in_geo = Math.sqrt(dist_x*dist_x + dist_y*dist_y);
    
    //--------  Distance in Km  --------
    function rad(x) {
        return x * Math.PI / 180;
    }	
    var R = 6378137; // Earth? mean radius in meter
    var dLat = rad(pos2.lat - pos1.lat);
    var dLong = rad(pos2.lng - pos1.lng);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(rad(pos1.lat)) * Math.cos(rad(pos2.lat)) *
        Math.sin(dLong / 2) * Math.sin(dLong / 2);

    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var dist_in_km = R * c / 1000;
    
    
    var result = {
        geo: dist_in_geo,
        km: dist_in_km,
    };
    
    //--------  Distance in Time  --------
    if(speed){

        // distance player moves in one tick (aka screen update interval)
        /*
        
        example:
        speed         = 360   km/h
        geo_per_kmh   =   0.1
                      =  36   geo/h   ( *geo_per_kmh )
                      =   6   geo/min ( /60 )
                      =   0.1 geo/s   ( /60 )
        tick_length   =   0.1 s       ( tick_length/1000 )
        dist_per_tick =   0.01 geo
        
        */
        var dist_per_tick = speed * game_data.game_settings.geo_per_kmh / 60 / 60 * ( tick_length / 1000 );
        
        var ticks = dist_in_geo / dist_per_tick;
        var time = ticks * ( tick_length / 1000 );
        var h = Math.floor(time / 3600);
        var m = Math.floor((time-h*3600) / 60);
        var s = Math.floor(time-h*3600-m*60);
        
        var time_str = h + ":";
        if(m<10){ time_str = time_str + "0"; }
        time_str = time_str + m +":";
        if(s<10){ time_str = time_str + "0"; }
        time_str = time_str + s;
        
        //--------  New Position  --------
        var new_x = dist_per_tick * (dist_x / dist_in_geo) + pos1.lng;
        var new_y = dist_per_tick * (dist_y / dist_in_geo) + pos1.lat;
        var new_pos = {lat: new_y, lng: new_x};
        
        result.dist_per_tick = dist_per_tick;
        result.new_pos = new_pos;
        result.h = h;
        result.m = m;
        result.s = s;
        result.time_str = time_str;
        result.ticks = ticks;
    }
    return result;
}

function hasRange(aircraft, destination, speed){
    if(speed===undefined) speed=false;
    var dist = getDistances(aircraft.position, destination, speed);
    var range_km = getRangeKm(aircraft);
    var reply = {
        dist: dist,
        range_km: range_km
    }
    if(dist.km <= range_km){
        reply.success = true;
    } else {
        reply.success = false;
    }
    return reply;
}

function getRangeKm(aircraft){
    return Math.round(aircraft.fuel.amount / aircraft.fuel.consumption);;
}

// calculates the angle between two points
function getAngle(from, to) {
    var point1 = {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [from.lng, from.lat]
        }
    };
    var point2 = {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [to.lng, to.lat]
        }
    };
    return turf.bearing(point1, point2);
}

// get url of a flag
function getFlagUrl(filename, type, size){
    if(type===undefined) type='flag';
    if(size===undefined) size='';
    if(size) size+='/';
    var url = game_data.game_settings.img_path +'/'+ type +'/'+ size + filename;
    return url;
}

function debugSingleTick(){
    clearInterval(serverTicker);
    clearInterval(screenUpdate);
    server.tick();
    onScreenUpdate();
}

function getFirstFreePlayerId(){
    for(i=1;;i++){
        if(PLAYERS.ids.indexOf(i)==-1){
            return i;
        }
    }
}
function getFirstFreeAircraftId(){
    for(i=1;;i++){
        if(AIRCRAFTS.ids.indexOf(i)==-1){
            return i;
        }
    }
}

function getPriceModifier(orig_amount, orig_required){
    var modifier;

    // standardize amount & required
    var amount = orig_amount/orig_required*100;
    var required = 100;

    // cities want to keep 5 times their requirement in storage
    // if they have more, the prices go down
    // if they have less, the prices goes up

    // surplus -> lower prices
    if(amount > required*5){
        modifier = 41.3 * Math.pow(amount+required, -0.577);

    // demand -> higher prices
    } else {
        modifier = 11.76 / Math.pow(amount+required, 0.385);
    }
    if(modifier < 0.5) modifier = 0.5;
    if(modifier > 2) modifier = 2;
    return getMoney(modifier);
}

function getCommodityPrice(amount, required, base_price){
    var modifier = 0.5;
    if(required>0) modifier = getPriceModifier(amount, required);
    return { modifier: modifier, price: getMoney( modifier * base_price) };
}

function getCostPerKm(aircraft){
    // 18 = fuel
    return COMMODITIES.get(18).base_price * aircraft.fuel.consumption
}

function getMoney(amount, asString){
    var roundedAmount = Math.round(amount*100)/100;
    if(asString){
        if(roundedAmount < 0) return '- $'+(roundedAmount*-1).toFixed(2);
        return '$'+roundedAmount.toFixed(2);
    }
    return roundedAmount;
}


var analyzeMarketHistory = {
    /* MARKETHISTORY (array)
    Each entry is the details of one commodity in one city at one supertick.
    Records are written after the city consumes/produces the commodities and
    the prices have been recalculated. Production & consumption values are
    modified after writing the entry.
    
    Contents: {
        amount: amount of commodity in the city
        city: id of city
        commodity: id of commodity
        country: id of country
        modifier: price modifier of the commodity
        price: price of the commodity
        production: amount produced per supertick *can be undefined*
        required: amount consumed per supertick
        state: id of the state
        tick: time of recording
    } */
    
    CommodityName_Tick_Amount: function(){
        var commodities = {};
        MARKETHISTORY.forEach(function(h){
            // get commodity name
            var name = COMMODITIES.get(h.commodity).name;
            
            // set up commodity
            if(!commodities[name]) commodities[name] = {};
            var commodity = commodities[name];
            
            // set up tick
            if(!commodity[h.tick]) commodity[h.tick] = 0;
            
            // add amount
            commodity[h.tick] += h.amount;
        });
        
        return commodities;
    },
    CommodityName_Tick_Production: function(){
        var commodities = {};
        MARKETHISTORY.forEach(function(h){
            if(!h.production) return;
            // get commodity name
            var name = COMMODITIES.get(h.commodity).name;
            
            // set up commodity
            if(!commodities[name]) commodities[name] = {};
            var commodity = commodities[name];
            
            // set up tick
            if(!commodity[h.tick]) commodity[h.tick] = 0;
            
            // add amount
            commodity[h.tick] += h.production;
        });
        
        return commodities;
    },
    CommodityName_Tick_Required: function(){
        var commodities = {};
        MARKETHISTORY.forEach(function(h){
            // get commodity name
            var name = COMMODITIES.get(h.commodity).name;
            
            // set up commodity
            if(!commodities[name]) commodities[name] = {};
            var commodity = commodities[name];
            
            // set up tick
            if(!commodity[h.tick]) commodity[h.tick] = 0;
            
            // add amount
            commodity[h.tick] += h.required;
        });
        
        return commodities;
    },
    CommodityName_Tick_ProductionVsRequired: function(){
        var commodities = {};
        MARKETHISTORY.forEach(function(h){
            // get commodity name
            var name = COMMODITIES.get(h.commodity).name;
            
            // set up commodity
            if(!commodities[name]) commodities[name] = {};
            var commodity = commodities[name];
            
            // set up tick
            if(!commodity[h.tick]) commodity[h.tick] = {p:0,r:0};
            
            // add amount
            commodity[h.tick].r += h.required;
            if(h.production) commodity[h.tick].p += h.production;
        });
        
        return commodities;
    },
    CommodityName_Tick_Modifier: function(){
        var commodities = {};
        MARKETHISTORY.forEach(function(h){
            if(!h.production) return;
            // get commodity name
            var name = COMMODITIES.get(h.commodity).name;
            
            // set up commodity
            if(!commodities[name]) commodities[name] = {};
            var commodity = commodities[name];
            
            // set up tick
            if(!commodity[h.tick]) commodity[h.tick] = 0;
            
            // add amount
            commodity[h.tick] += h.modifier;
        });
        
        return commodities;
    },
    Tick_CommodityName_Amount: function(){
        var ticks = {};
        MARKETHISTORY.forEach(function(h){
            
            // set up ticks
            if(!ticks[h.tick]) ticks[h.tick] = {};
            var tick = ticks[h.tick];
            
            // get commodity name
            var name = COMMODITIES.get(h.commodity).name;
            
            // set up commodity
            if(!tick[name]) tick[name] = 0;
            
            // add amount
            tick[name] += h.amount;
        });
        
        return ticks;
    },
    Tick_CommodityName_Modifier: function(){
        var ticks = {};
        MARKETHISTORY.forEach(function(h){
            
            // set up ticks
            if(!ticks[h.tick]) ticks[h.tick] = {};
            var tick = ticks[h.tick];
            
            // get commodity name
            var name = COMMODITIES.get(h.commodity).name;
            
            // set up commodity
            if(!tick[name]) tick[name] = 0;
            
            // add amount
            tick[name] += h.modifier;
        });
        
        return ticks;
    },
    Tick_ModifierCounts: function(){
        var ticks = {};
        MARKETHISTORY.forEach(function(h){
            
            // set up ticks
            if(!ticks[h.tick]) ticks[h.tick] = {};
            var tick = ticks[h.tick];
            
            // get modifier, rounded to 1st decimal
            var modifier = Math.round(h.modifier*10)/10;
            
            // set up commodity
            if(!tick[modifier]) tick[modifier] = 0;
            
            // add amount
            tick[modifier] += 1;
        });
        
        return ticks;
    },
    TotalImportExport: function(){
        var values = {imports: 0, exports: 0};
        CITYSALEHISTORY.forEach(function(h){
            values.exports+=h.amount*h.price;
        });
        CITYBUYHISTORY.forEach(function(h){
            values.imports+=h.amount*h.price;
        });
        return values;
    },
};
