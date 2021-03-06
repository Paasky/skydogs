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
        this.deleteById(this.ids);
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

var MARKETHISTORY = [];
var CITYBUYHISTORY = [];
var CITYSALEHISTORY = [];


var AIRCRAFTS = new ObjectHolder();
function Aircraft(id, name, fuel, speed, position, destination, player_id, server, aircraftTypeId) {
    if(server===undefined) server=true;
    this.id = id;
    this.name = name;
    this.fuel = fuel;
    this.speed = speed;
    this.position = position;
    this.destination = destination;
    this.server = server;
    this.cargoHold = new ObjectHolder();
    
    this.getPlayer = function(){ if(this.server){ return PLAYERS.get(player_id); } else { return game_data.PLAYERS.get(player_id); } };
    this.addCargo = function(commodity, amount, purchasePrice){
        if(!commodity || !amount) return {success: false, message: 'Aircraft.addCargo(): commodity and amount are required'};
        if(this.getFreeCargoSpace() - commodity.weight * amount < 0) return {success: false, message: 'Cargo hold can\'t fit! Room in hold: '+this.getFreeCargoSpace()+'kg'};
        
        var currentCommodity = this.cargoHold.get(commodity.id);
        if(currentCommodity){
            if(purchasePrice){
                var a = currentCommodity.amount;
                var b = currentCommodity.valuePerItem;
                var c = amount;
                var d = purchasePrice;
                var newValuePerItem = (a*b + c*d) / (a + c);
                currentCommodity.valuePerItem = getMoney(newValuePerItem);
            }
            currentCommodity.amount += amount;
        } else {
            var newCommodity = cloneObject(commodity);
            newCommodity.valuePerItem = purchasePrice;
            newCommodity.amount = amount;
            this.cargoHold.set(newCommodity);
        }
        return { success: true, message: 'Commodity added into Cargo Hold' };
    }
    this.takeCargo = function(commodity, amount){
        if(!commodity || !amount) return {success: false, message: 'Aircraft.takeCargo(): commodity and amount are required'};
        
        var checkStatus = this.getCargo(commodity, amount);
        if(!checkStatus.success) return checkStatus;

        var cargoHoldCommodity = checkStatus.message;

        // remove the amount & check if there's any left
        cargoHoldCommodity.amount -= amount;
        if(cargoHoldCommodity.amount <= 0) this.cargoHold.deleteById(commodity.id);
        return { success: true, message: 'Cargo taken from Cargo Hold' };
    }
    this.getCargo = function(commodity, amount){
        if(!commodity) return {success: false, message: 'Aircraft.getCargo(): commodity is required'};
        
        var cargoHoldCommodity = this.cargoHold.get(commodity.id);

        // do we even have that commodity?
        if(!cargoHoldCommodity) return { success: false, message: {amount: 0, valuePerItem: 0} };
        if(cargoHoldCommodity.amount <= 0){
            this.cargoHold.deleteById(commodity.id);
            return { success: false, message: {amount: 0, valuePerItem: 0} };
        }

        // if the amount wasn't asked for
        if(!amount) return { success: true, message: cargoHoldCommodity };


        // do we have enough of the commodity?
        if(cargoHoldCommodity.amount < amount) return { success: false, message: 'Cargo Hold does not that much of this commodity' };

        return { success: true, message: cargoHoldCommodity };
    }
    this.getFreeCargoSpace = function(){
        var empty = this.cargoHold.size;
        this.cargoHold.forEach(function(co){
            empty -= co.weight * co.amount;
        });
        return empty;
    }
    
    this.getAircraftType = function(){ if(this.server){ return AIRCRAFTTYPES.get(aircraftTypeId); } else { return game_data.AIRCRAFTTYPES.get(aircraftTypeId); } };
    
    this.cargoHold.size = this.getAircraftType().cargoHoldSize;
}

var AIRCRAFTTYPES = new ObjectHolder();
function AircraftType(id, name, weight, maxWeight, cargoHoldSize, fuelTankSize, speedMod, price){
    this.id = id;
    this.name = name;
    this.weight = weight;
    this.maxWeight = maxWeight;
    this.cargoHoldSize = cargoHoldSize;
    this.fuelTankSize = fuelTankSize;
    this.speedMod = speedMod;
    this.price = price;
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
function City(id, name, state_id, country_id, population, position) {
    this.id = id;
    this.name = name;
    this.population = population;
    this.position = position;
    this.state_id = state_id;
    this.country_id = country_id;
    this.market = new ObjectHolder();
    
    this.getState = function(){ return this.state_id };
    this.getCountry = function(){ return COUNTRIES.get(this.country_id) };
    this.getCommodityBuyPrice = function(commodity, amount){
        if(!commodity) return {success: false, message: 'City.getCommodityBuyPrice(): commodity is required'};
        return this.market.get(commodity.id).getBuyPrice(amount);
    }
    this.getCommoditySalePrice = function(commodity, amount){
        if(!commodity) return {success: false, message: 'City.getCommoditySalePrice(): commodity is required'};
        
        return this.market.get(commodity.id).getSalePrice(amount);
    }
    this.getCommodity = function(commodity, amount){
        if(!commodity) return {success: false, message: 'City.getCommodity(): commodity is required'};

        var marketCommodity = this.market.get(commodity.id);

        // do we even have that commodity?
        if(!marketCommodity) return { success: false, message: 'Market does not have this commodity' };
        if(marketCommodity.amount <= 0){
            return { success: false, message: 'City does not have enough in stock' };
        }

        // if the amount wasn't asked for
        if(!amount) return { success: true, message: marketCommodity };


        // do we have enough of the commodity?
        if(marketCommodity.amount < amount) return { success: false, message: 'City does not have enough in stock' };

        return { success: true, message: marketCommodity };
    }
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
