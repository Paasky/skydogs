// draws the city screen on cityArrive
function drawCityScreen(e, data){
    if(data.aircraft_id != game_data.player_settings.id) return;
    var city = game_data.CITIES.get(data.city_id);
    var country = city.getCountry();

    $('#cityScreen-country').css('backgroundColor', country.color1).css('color', country.color2);
    $('#cityScreen-country-flag').prop('src', getFlagUrl(country.flag_file));
    $('#cityScreen-country-name').text(country.name);
    $('#cityScreen-name').text(city.name);
    $('#cityScreen-popNumber').text(city.population.city);
    $('#cityScreen-content').html('');
    $('#cityScreen').attr('city_id',data.city_id).fadeIn();
}
$(document).on('cityArrive', drawCityScreen);

// draws the market table on cityScreen marketBtn click
function drawCityScreenMarket(){
    var base = $('#cityScreen-content');
    base.hide().html('');

    base.append('<h1>Market</h1>');
    var table = '<table id="cityScreenMarket" class="tablesorter">';

    table += '<thead>';
        table += '<tr><td class="borderRight" colspan="2">Commodity</td><td class="borderRight" colspan="3">City</td><td colspan="2">You</td></tr>';
        table += '<tr><th>Name</th><th class="borderRight">Avg.</th><th>Buys for</th><th>Sells for</th><th class="borderRight">Stock</th><th>Value</th><th>Amount</th></tr>';
    table += '</thead>';

    table += '<tbody>';
    game_data.COMMODITIES.forEach(function(co){

        table += '<tr co_id="'+co.id+'">';

            table += '<td name>'+co.name+'</td>';
            table += '<td basePrice class="borderRight">'+getMoney(co.base_price, true)+'</td>';
            table += '<td buyPrice></td>';
            table += '<td salePrice></td>';
            table += '<td cityAmount class="borderRight"></td>';
            table += '<td playerValue></td>';
            table += '<td playerAmount></td>';

        table += '</tr>';
    });
    table += '</tbody>';

    base.append($(table));
    setCityMarketScreenData();


    base.fadeIn();
    $('#cityScreenMarket').tablesorter();

    base.find('td').click(createShopWindow);
}
$('#cityScreen-marketBtn').click(drawCityScreenMarket);

// sets the cityScreenMarket values every 1000ms
function setCityMarketScreenData(){

    // check the market exists
    if($('#cityScreenMarket').length == 0) return;

    var city = game_data.CITIES.get($('#cityScreen').attr('city_id'));
    var player = game_data.PLAYERS.get(game_data.player_settings.id);
    var aircraft = player.getAircraft();

    game_data.COMMODITIES.forEach(function(co){

        // set up data
        var dataCityAmount = city.market.get(co.id).amount;
        var dataCityModifier = city.market.get(co.id).modifier;
        var dataCityBuyPrice = city.getCommodityBuyPrice(co).message;
        var dataCitySalePrice = city.getCommoditySalePrice(co).message;
        var buyColor = '';
        var sellColor = '';

        if(dataCityAmount != 0){
            var canBuy = true;

            if(dataCityModifier > 1){
                buyColor = 'rgb('+Math.round((dataCityModifier-1)*128)+',0,0)';
            } else {
                buyColor = 'rgb(0,'+Math.round((dataCityModifier-1)*-256)+',0)';
            }
        } else {
            var canBuy = false;
        }

        if(aircraft.getCargo(co).success){
            var canSell = true;
            var dataPlayerValue = aircraft.getCargo(co).message.valuePerItem;

            if(dataCityModifier > 1){
                sellColor = 'rgb(0,'+Math.round((dataCityModifier-1)*128)+',0)';
            } else {
                sellColor = 'rgb('+Math.round((dataCityModifier-1)*-256)+',0,0)';
            }
        } else {
            var canSell = false;
        }

        var tr = $('#cityScreenMarket tr[co_id="'+co.id+'"]');

        if(canSell){
            tr.find('[buyPrice]').text(getMoney(dataCityBuyPrice, true)).removeAttr('disabled','').attr('action', 'sell').css('color', sellColor);
            tr.find('[playerValue]').text(getMoney(dataPlayerValue, true));
            tr.find('[playerAmount]').text(aircraft.getCargo(co).message.amount);
        } else {
            tr.find('[buyPrice]').text(getMoney(dataCityBuyPrice, true)).attr('disabled','').removeAttr('action');
            tr.find('[playerValue], [playerAmount]').text('0');
        }

        if(canBuy){
            tr.find('[salePrice]').text(getMoney(dataCitySalePrice, true)).removeAttr('disabled','').attr('action', 'buy').css('color', buyColor);
            tr.find('[cityAmount]').text(dataCityAmount);
        } else {
            tr.find('[salePrice]').text(getMoney(dataCitySalePrice, true)).attr('disabled','').removeAttr('action');
            tr.find('[cityAmount]').text('0');
        }
    });
}
$(document).on('longScreenUpdate', setCityMarketScreenData);

// creates the buy/sell-window on cityScreenMarket action click
function createShopWindow(){
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
