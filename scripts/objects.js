function ObjectHolder(){
    this.ids = [];
    
    this.set = function(input){
        if(input instanceof Array){
            var objects = input;
        } else {
            var objects = [input];
        }
        objects.forEach(function(o){
            if(! o.id) throw new TypeError(o + ' does not have attribute `id`');
            this[o.id] = o;
            if(this.ids.indexOf(o.id) == -1){
                this.ids.push(o.id);
            }
        }, this);
    }
    
    this.get = function(ids){
        if(ids instanceof Array){
            var output = [];
            ids.forEach(function(id){
                output.push(this[id]);
            }, this);
            return output;
        } else {
            return this[ids];
        }
    }
    
    this.getAll = function(){
        return this.get(this.ids);
    }
    
    this.deleteById = function(input){
        if(input instanceof Array){
            var ids = input;
        } else {
            var ids = [input];
        }
        ids.forEach(function(id){
            var i = this.ids.indexOf(id);
            if(i != -1){
                delete this[id];
                this.ids.splice(i, 1);
            }
        }, this);
    }
    
    this.reset = function(){
        this.removeById(this.ids);
    }
    
    this.resetWithObject = function(input){
        this.removeById(this.ids);
        this.add(input);
    }
    
    this.forEach = function(callback, thisArg){
        if (typeof callback !== "function") {
          throw new TypeError(callback + ' is not a function');
        }
        var T, k = 0, O = Object(this);
        if (arguments.length > 1) {
          T = thisArg;
        }
        this.ids.forEach(function(id){
            callback.call(T, this[id], id, O);
        }, this);
    }
}


var AIRCRAFTS = new ObjectHolder();
function Aircraft(id, name, fuel, speed, position, destination, player_id, server) {
    if(server===undefined) server=true;
    this.id = id;
    this.name = name;
    this.fuel = fuel;
    this.speed = speed;
    this.position = position;
    this.destination = destination;
    this.server = server;
    
    this.getPlayer = function(){ if(this.server){ return PLAYERS.get(player_id); } else { return game_data.PLAYERS.get(player_id); } };
}

var COUNTRIES = new ObjectHolder();
function Country(id, name, flag_file, color1, color2, is_dry) {
    this.id = id;
    this.name = name;
    this.flag_file = flag_file;
    this.color1 = color1;
    this.color2 = color2;
    this.is_dry = is_dry;
}


var CITIES = new ObjectHolder();
function City(id, name, country_id, population, position) {
    this.id = id;
    this.name = name;
    this.population = population;
    this.position = position;
    
    this.getCountry = function(){ return COUNTRIES[country_id] };
}


var PLAYERS = new ObjectHolder();
function Player(id, name, ai, money, aircraft_id, server) {
    if(server===undefined) server=true;
    this.id = id;
    this.name = name;
    this.ai = ai;
    this.money = money;
    this.server = server;
    
    this.getAircraft = function(){ if(this.server){ return AIRCRAFTS.get(aircraft_id); } else { return game_data.AIRCRAFTS.get(aircraft_id); } };
    this.getPosition = function(){ return this.getAircraft().position };
    this.getDestination = function(){ return this.getAircraft().destination };
    this.getSpeed = function(){ return this.getAircraft().speed }
}

var COMMODITIES = new ObjectHolder();
function Commodity(id, name, unit, units, weight, base_price, req_per_pop, req_cargo_id, req_cargo_mod){
    this.id = id;
    this.name = name;
    this.unit = unit;
    this.units = units;
    this.weight = weight;
    this.base_price = base_price;
    this.req_per_pop = req_per_pop;
    this.req_cargo_id = req_cargo_id;
    this.req_cargo_mod = req_cargo_mod;

    this.getUnit = function(amount){ if(amount==1){ return this.unit; } else { return this.units; } }
    this.getAveragePrice = function(){ return this.base_price; }
}
