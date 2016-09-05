

app.controller('CityUIController', function UIController($scope) {
    $scope.isActive = false;

    $scope.city = game_data.CITIES.get(1);
    $scope.country = $scope.city.getCountry();
    $scope.player = game_data.PLAYERS.get(game_data.player_settings.id);
    $scope.aircraft = $scope.player.getAircraft();
    $scope.getMoney = getMoney;

    $scope.market = {
        isActive: false,
        commodities: [],
        shop: {
            isActive: false,
            buySelected: false,
            sellSelected: false,
            amountAvailable: 0,
            commodityPrice: 0,
            commodityWeight: 0,
            priceSum: 0,
            weightSum: 0,
            amount: 1,
        },
    }

    $(document).on('cityArrive', function(e, data){
        if(data.player_id != game_data.player_settings.id) return;
        $scope.city = game_data.CITIES.get(data.city_id);
        $scope.country = $scope.city.getCountry();
        $scope.flagUrl = getFlagUrl($scope.country.flag_file);
        $scope.css = 'background:'+$scope.country.color1+';color:'+$scope.country.color2;

        $('#cityScreen').fadeIn();

        $scope.$apply();
    });

    $(document).on('cityLeave', function(e, aircraftId){
        if($scope.aircraft.id != aircraftId) return;

        $scope.isActive = false;
        $scope.market.isActive = false;
        $scope.market.shop.isActive = false;
        $('#cityScreen').fadeOut();

        $scope.$apply();
    });



    ///// CITY MARKET /////

    $scope.openCityMarket = function(){
        $scope.market.isActive = true;
        updateCityMarket();
    }

    function closeCityMarket(){
        $scope.market.isActive = false;
        $scope.market.shop.isActive = false;
        $scope.$apply;
    }

    function updateCityMarket(){

        $scope.market.commodities = new ObjectHolder();

        $scope.city.market.forEach(function(co){

            var scopeCommodity = {
                id: co.id,
                name: co.name,
                basePrice: co.base_price,
                weight: co.weight,
                buyCss: '',
                sellCss: '',
                buyDisabled: false,
                sellDisabled: false,
                buySelected: false,
                sellSelected: false,
            };

            // set up data
            var dataCityAmount = co.amount;
            var dataCityModifier = co.modifier;
            var dataCityBuyPrice = $scope.city.getCommodityBuyPrice(co).message;
            var dataCitySalePrice = $scope.city.getCommoditySalePrice(co).message;
            var buyCss = '';
            var sellCss = '';

            // does the city have this commodity -> can buy?
            if(dataCityAmount != 0){
                var canBuy = true;

                if(dataCityModifier > 1){
                    buyCss = 'color: rgb('+Math.round((dataCityModifier-1)*128)+',0,0)';
                } else {
                    buyCss = 'color: rgb(0,'+Math.round((dataCityModifier-1)*-256)+',0)';
                }
            } else {
                var canBuy = false;
            }

            // does the aircraft have this commodity -> can sell?
            if($scope.aircraft.getCargo(co).success){
                var canSell = true;
                var dataPlayerValue = $scope.aircraft.getCargo(co).message.valuePerItem;

                if(dataCityModifier > 1){
                    sellCss = 'color: rgb(0,'+Math.round((dataCityModifier-1)*128)+',0)';
                } else {
                    sellCss = 'color: rgb('+Math.round((dataCityModifier-1)*-256)+',0,0)';
                }
            } else {
                var canSell = false;
            }

            // add data to to scopeCommodity
            scopeCommodity.buyPrice = dataCityBuyPrice;
            scopeCommodity.salePrice = dataCitySalePrice;

            if(canSell){
                scopeCommodity.playerValue = dataPlayerValue;
                scopeCommodity.playerAmount = $scope.aircraft.getCargo(co).message.amount;
                scopeCommodity.sellCss = sellCss;
            } else {
                scopeCommodity.playerValue = 0;
                scopeCommodity.playerAmount = 0;
                scopeCommodity.sellDisabled = true;
            }

            if(canBuy){
                scopeCommodity.cityAmount = dataCityAmount;
                scopeCommodity.buyCss = buyCss;
            } else {
                scopeCommodity.cityAmount = 0;
                scopeCommodity.buyDisabled = true;
            }

            // push it to the market
            $scope.market.commodities.set(scopeCommodity);

        // end city market foreach
        });

        $scope.$apply;

    // end updateCityMarket
    }


    ///// CITY MARKET SHOP /////

    $scope.openCityMarketShop = function($event, type){
        $scope.market.shop.isActive = true;
        var coId = angular.element($event.currentTarget).parent().attr('co_id');
        updateCityMarketShop(coId, type);
    }

    $scope.closeCityMarketShop = function(){
        $scope.market.shop.isActive = false;
        $scope.$apply;
    }

    function updateCityMarketShop(commodityId, type){

        if(commodityId)
            $scope.market.shop.commoditySelector = $scope.market.commodities.get(commodityId);
        if(type) $scope.market.shop.typeSelector = type;
        var co = $scope.market.shop.commoditySelector;

        if($scope.market.shop.typeSelector=='buy'){
            $scope.market.shop.buySelected = true;
            $scope.market.shop.sellSelected = false;
            $scope.market.shop.commodityPrice = co.salePrice;
        } else {
            $scope.market.shop.buySelected = false;
            $scope.market.shop.sellSelected = true;
            $scope.market.shop.commodityPrice = co.buyPrice;
        }
        $scope.market.shop.commodityWeight = co.weight;
        $scope.market.shop.priceSum = getMoney($scope.market.shop.commodityPrice * $scope.market.shop.amount);
        $scope.market.shop.weightSum = getMoney($scope.market.shop.commodityWeight * $scope.market.shop.amount);

        //$scope.$apply;
    }

    $('#cityScreenLeft>.cityScreen-btn:not(#cityScreen-marketBtn)').click(closeCityMarket);
    $(document).on('longScreenUpdate', function(){
        if($scope.market.isActive) updateCityMarket();
        if($scope.market.shop.isActive) updateCityMarketShop();
    });
});




// Sells all items in the cargo hold
$('#cityScreen-sellAllBtn').click(function(e){
    e.stopPropagation();
    var a = game_data.AIRCRAFTS.get(game_data.player_settings.id);
    if(!a.cargoHold.ids.length) WindowFactory.createInfo(JSON.stringify({success: false, message: 'Cargo Hold is empty'}));
    a.cargoHold.forEach(function(co){
        WindowFactory.createInfo(JSON.stringify(userSellCommodity(co.id, co.amount).message));
    });
});

// Refuels the plane
$('#cityScreen-refuelBtn').click(function(e){
    e.stopPropagation();
    WindowFactory.createInfo(JSON.stringify(userRefuel().message));
});
$('#cityScreen-leaveBtn').click(function(){ $(document).trigger('cityLeave', game_data.PLAYERS.get(game_data.player_settings.id).getAircraft().id); });
