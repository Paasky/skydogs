

app.controller('CityUIController', function UIController($scope) {
    $scope.isActive = false;

    $scope.city = game_data.CITIES.get(1);
    $scope.country = $scope.city.getCountry();
    $scope.player = game_data.PLAYERS.get(game_data.player_settings.id);
    $scope.aircraft = player.getAircraft();

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
        },
    }

    $(document).on('cityArrive', function(e, data){
        if(data.player_id != game_data.player_settings.id) return;
        $scope.city = game_data.CITIES.get(data.city_id);
        $scope.country = city.getCountry();

        $scope.$apply();
    });

    $(document).on('cityLeave', function(e, data){
        if(data.player_id != game_data.player_settings.id) return;

        $scope.isActive = false;

        $scope.$apply();
    });



    ///// CITY MARKET /////

    $scope.openCityMarket = function(){
        $scope.market.isActive = true;
        updateCityMarket();
    }

    function closeCityMarket(){
        $scope.market.isActive = false;
        $scope.$apply;
    }

    function updateCityMarket(){
        if(! $scope.market.isActive) return;

        $scope.market.commodities = new ObjectHolder();


        $scope.city.market.forEach(function(co){

            var scopeCommodity = {
                id: co.id,
                name: co.name,
                basePrice: getMoney(co.base_price, true),
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
            if(aircraft.getCargo(co).success){
                var canSell = true;
                var dataPlayerValue = aircraft.getCargo(co).message.valuePerItem;

                if(dataCityModifier > 1){
                    sellCss = 'color: rgb(0,'+Math.round((dataCityModifier-1)*128)+',0)';
                } else {
                    sellCss = 'color: rgb('+Math.round((dataCityModifier-1)*-256)+',0,0)';
                }
            } else {
                var canSell = false;
            }

            // add data to to scopeCommodity
            scopeCommodity.buyPrice = getMoney(dataCityBuyPrice, true);
            scopeCommodity.salePrice = getMoney(dataCitySalePrice, true);

            if(canSell){
                scopeCommodity.playerValue = getMoney(dataPlayerValue, true);
                scopeCommodity.playerAmount = aircraft.getCargo(co).message.amount;
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

        $scope.$apply();

    // end updateCityMarket
    }


    ///// CITY MARKET SHOP /////

    $scope.openCityMarketShop = function(){
        $scope.market.shop.isActive = true;
        updateCityMarketShop();
    }

    function closeCityMarketShop(){
        $scope.market.shop.isActive = false;
        $scope.$apply;
    }

    function updateCityMarketShop(commodityId){
        if(!$scope.market.shop.isActive) return;

        if(commodityId) $scope.market.shop.commodityId = commodityId;
        var commodity = game_data.COMMODITIES.get($scope.market.shop.commodityId);

        $scope.market.shop.buySelected = false,
        $scope.market.shop.sellSelected = false,
        $scope.market.shop.amountAvailable = 0,
        $scope.market.shop.commodityPrice = 0,
        $scope.market.shop.commodityWeight = 0,
        $scope.market.shop.priceSum = 0,
        $scope.market.shop.weightSum = 0,
        };

        $scope.$apply;
    }

    $('#cityScreenLeft>.cityScreen-btn:not(#cityScreen-marketBtn)').click(closeCityMarket);
    $(document).on('longScreenUpdate', function(){
        updateCityMarket();
        updateCityMarketShop();
    });
});


/////// OLD JQUERY ///////

// creates the buy/sell-window on cityScreenMarket action click
function createShopWindow(){
    return;
    var action = $(this).attr('action');
    if(!action) return;

    var co_id = $(this).parent().attr('co_id');
    var header = '';
    var content = '';

    if(action == 'buy'){
        var buySelected = 'selected ';
        var sellSelected = '';
    } else {
        var buySelected = '';
        var sellSelected = 'selected ';
    }

    // shop type selector (buy/sell)
    header += '<select id="shopTypeSelector">';
    header += '<option '+buySelected+'value="buy">Buy</option>';
    header += '<option '+sellSelected+'value="sell">Sell</option>';
    header += '</select>';

    // commodity selector
    header += '<select id="shopCommoditySelector">';
    game_data.COMMODITIES.forEach(function(co){
        var coSelected = '';
        if(co.id == co_id) coSelected = 'selected ';
        header += '<option '+coSelected+'value="'+co.id+'">'+co.name+'</option>';
    });
    header += '</select>';

    content += '<table id="shopContent">';
    content += '<tr>';
        content += '<td>Amount:</td>';
        content += '<td><input type=number id="shopAmount" value="1" min="1"></td>';
        content += '<td class="gray">(<span id="shopAmountAvailable"></span> available)</td>';
    content += '</tr>';
    content += '<tr>';
        content += '<td>Unit Price:</td>';
        content += '<td><span id="shopCommodityPrice"></span></td>';
    content += '</tr>';
    content += '<tr>';
        content += '<td>Unit Weight:</td>';
        content += '<td><span id="shopCommodityWeight"></span> kg</td>';
    content += '</tr>';
    content += '<tr class="sum-row">';
        content += '<td>Total Sum:</td>';
        content += '<td><span id="shopPriceSum"></span></td>';
        content += '<td rowspan="4"><span id="shopConfirm" class="windowButton" action="confirm"></span></td>';
    content += '</tr>';
    content += '<tr class="gray">';
        content += '<td>Your money:</td>';
        content += '<td><span id="shopPlayerMoneyAvailable"></span></td>';
    content += '</tr>';
    content += '<tr>';
        content += '<td>Total Weight:</td>';
        content += '<td><span id="shopWeightSum"></span> kg</td>';
    content += '</tr>';
    content += '<tr class="gray">';
        content += '<td>Free space:</td>';
        content += '<td><span id="shopPlayerWeightAvailable"></span> kg</td>';
    content += '</tr>';
    content += '</table>';

    WindowFactory.create({
        id: 'shopWindow',
        header: header,
        content: content,
        callback: shopAction,
    });
    setShopWindowData();
    $('#shopWindow input, #shopWindow select').change(setShopWindowData);
    $('#shopWindow input').keyup(setShopWindowData);
}

// sets the shopWindow values on open/update
function setShopWindowData(){
    return;
    var city = game_data.CITIES.get($('#cityScreen').attr('city_id'));
    var player = game_data.PLAYERS.get(game_data.player_settings.id);
    var aircraft = player.getAircraft();
    var shop = $('#shopWindow');
    var commodity = game_data.COMMODITIES.get($('#shopCommoditySelector').val());
    var commodityWeight = commodity.weight;

    // buying or selling
    var shopType = $('#shopTypeSelector').val();
    shop.attr('shopType', shopType);
    $('#shopConfirm').text($('#shopTypeSelector :selected').text());

    // amounts
    var shopAmount = $('#shopAmount').val();
    if(shopAmount < 1) shopAmount = 1;
    if(shopType=='buy'){
        var amountAvailable = city.market.get(commodity.id).amount;
    } else {
        var amountAvailable = aircraft.getCargo(commodity).message.amount;
    }
    $('#shopAmountAvailable').text(amountAvailable);
    $('#shopPlayerMoneyAvailable').text(getMoney(player.money, true));
    $('#shopPlayerWeightAvailable').text(aircraft.getFreeCargoSpace());

    // price
    if(shopType=='buy'){
        var cityPrice = city.getCommoditySalePrice(commodity).message;
    } else {
        var cityPrice = city.getCommodityBuyPrice(commodity).message;
    }
    $('#shopCommodityPrice').text(getMoney(cityPrice, true));
    $('#shopCommodityWeight').text(commodityWeight);
    $('#shopPriceSum').text(getMoney(cityPrice * shopAmount, true));
    $('#shopWeightSum').text(commodityWeight * shopAmount);

    var enoughMoney = player.money >= cityPrice * shopAmount;
    var enoughSpace = aircraft.getFreeCargoSpace() >= commodityWeight * shopAmount;
    if(!enoughMoney || !enoughSpace){
        $('#shopConfirm').attr('disabled','').removeAttr('action');
    } else {
        $('#shopConfirm').attr('action','confirm').removeAttr('disabled');
    }
}

// callback function for shopWindow action
function shopAction(isAction){
    return;
    if(!isAction) return false;

    // buying or selling
    var shopType = $('#shopTypeSelector').val();
    var co_id = $('#shopCommoditySelector').val();
    var amount = $('#shopAmount').val();

    if(shopType=='buy'){
        WindowFactory.create({
            header: 'Purchase Information',
            type: 'info',
            content: JSON.stringify(userBuyCommodity(co_id, amount))
        });
    } else {
        WindowFactory.create({
            header: 'Sale Information',
            type: 'info',
            content: JSON.stringify(userSellCommodity(co_id, amount))
        });
    }

    setCityMarketScreenData();
}




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

// Leaves the city
function leaveCity(e, a_id){
    if(game_data.PLAYERS.get(game_data.player_settings.id).getAircraft().id == a_id){
        $('#cityScreen').fadeOut();
    }
}
$(document).on('cityLeave', leaveCity);
$('#cityScreen-leaveBtn').click(function(){ $(document).trigger('cityLeave', game_data.PLAYERS.get(game_data.player_settings.id).getAircraft().id); });
