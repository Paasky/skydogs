

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
        $scope.$apply;
    }

    function closeCityMarket(){
        $scope.market.isActive = false;
        $scope.market.shop.isActive = false;
        $scope.$apply;
    }

    $scope.getMarketBuyCss = function(co){
        var css = '';
        if(co.amount > 0){
            if(co.modifier > 1){
                css = 'color: rgb('+Math.round((co.modifier-1)*128)+',0,0)';
            } else {
                css = 'color: rgb(0,'+Math.round((co.modifier-1)*-256)+',0)';
            }
        }
        return css;
    }
    $scope.getMarketSellCss = function(co){
        var css = '';
        if($scope.aircraft.getCargo(co).success){
            if(co.modifier > 1){
                css = 'color: rgb('+Math.round((co.modifier-1)*128)+',0,0)';
            } else {
                css = 'color: rgb(0,'+Math.round((co.modifier-1)*-256)+',0)';
            }
        }
        return css;
    }
    $scope.getMarketBuyDisabled = function(co){
        if(co.amount>0) return false;
        return true;
    }
    $scope.getMarketSellDisabled = function(co){
        if($scope.aircraft.getCargo(co).success) return false;
        return true;
    }


    ///// CITY MARKET SHOP /////

    $scope.openCityMarketShop = function($event, type){
        if(angular.element($event.currentTarget).attr('disabled')) return;
        $scope.market.shop.isActive = true;
        var commodityId = angular.element($event.currentTarget).parent().attr('co_id');
        if(commodityId)
            $scope.market.shop.commoditySelector = $scope.city.market.get(commodityId);
        if(type) $scope.market.shop.typeSelector = type;
        $scope.$apply;
    }

    $scope.closeCityMarketShop = function(){
        $scope.market.shop.isActive = false;
        $scope.$apply;
    }
    $scope.confirmCityMarketShop = function($event){

        if($scope.market.shop.typeSelector=='buy'){
            if( $scope.player.money < $scope.getShopCommodityPrice() * $scope.market.shop.amount )
                NotificationFactory.create('Not enough money', 'exclamation');
            if( $scope.aircraft.getFreeCargoSpace() < $scope.market.shop.commoditySelector.weight * $scope.market.shop.amount )
                NotificationFactory.create('Not enough space in cargo hold', 'exclamation');
            if( $scope.market.shop.commoditySelector.amount < $scope.market.shop.amount )
                NotificationFactory.create('City does not have enough', 'exclamation');
        } else {
            if( $scope.aircraft.getCargo($scope.market.shop.commoditySelector).message.amount < $scope.market.shop.amount)
                NotificationFactory.create('Cargo hold does not have enough', 'exclamation');
        }
    }

    $scope.getShopAmountAvailable = function(){
        if($scope.market.shop.typeSelector=='buy')
            return $scope.market.shop.commoditySelector.amount;
        return $scope.aircraft.getCargo($scope.market.shop.commoditySelector).message.amount;
    }
    $scope.getShopCommodityPrice = function(){
        if($scope.market.shop.typeSelector=='buy')
            return $scope.market.shop.commoditySelector.getSalePrice().message;
        return $scope.market.shop.commoditySelector.getBuyPrice().message;
    }
    $scope.getShopConfirmDisabled = function(){
        if($scope.market.shop.typeSelector=='buy'){
            if( $scope.player.money < $scope.getShopCommodityPrice() * $scope.market.shop.amount
                ||
                $scope.aircraft.getFreeCargoSpace() < $scope.market.shop.commoditySelector.weight * $scope.market.shop.amount
                ||
                $scope.market.shop.commoditySelector.amount < $scope.market.shop.amount
              ) return true;
            return false;
        } else {
            if( $scope.aircraft.getCargo($scope.market.shop.commoditySelector).message.amount < $scope.market.shop.amount)
                return true;
            return false;
        }
    }

    $('#cityScreenLeft>.cityScreen-btn:not(#cityScreen-marketBtn)').click(closeCityMarket);
    $(document).on('longScreenUpdate', function(){ $scope.$apply; });
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
