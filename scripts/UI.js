// city
function drawCityScreen(e, data){
    if(data.aircraft_id != game_data.player_settings.id) return;
    var city = game_data.CITIES.get(data.city_id);
    var country = city.getCountry();

    $('#cityScreen-country').css('backgroundColor', country.color1).css('color', country.color2);
    $('#cityScreen-country-flag').prop('src', getFlagUrl(country.flag_file));
    $('#cityScreen-country-name').text(country.name);
    $('#cityScreen-name').text(city.name);
    $('#cityScreen-popNumber').text(city.population.city);
    $('#cityScreen').attr('city_id',data.city_id).fadeIn();

    var content = $('#cityScreen-content');
}
$(document).on('cityArrive', drawCityScreen);

function drawCityScreenMarket(){
    var city = game_data.CITIES.get($('#cityScreen').attr('city_id'));
    var aircraft = game_data.AIRCRAFTS.get(game_data.player_settings.id);
    var base = $('#cityScreen-content');
    base.hide().html('');
    
    base.append('<h1>Market</h1>');
    var table = '<table id="cityScreenMarket" class="tablesorter">';
    
    table += '<thead>';
        table += '<tr><td class="borderRight" /><td class="borderRight" colspan="3">City</td><td colspan="2">You</td></tr>';
        table += '<tr><th class="borderRight">Commodity</th><th>Buys for</th><th>Sells for</th><th class="borderRight">Stock</th><th>Value</th><th>Amount</th></tr>';
    table += '</thead>';
    
    table += '<tbody>';
    game_data.COMMODITIES.forEach(function(co){
        
        table += '<tr>';
        
            table += '<td class="borderRight">'+co.name+'</td>';
            table += '<td>'+getMoney(city.getCommodityBuyPrice(co).message, true)+'</td>';
        if(city.market.get(co.id).amount != 0){
            table += '<td>'+getMoney(city.getCommoditySalePrice(co).message, true)+'</td>';
        } else {
            table += '<td></td>';
        }
            table += '<td class="borderRight">'+city.market.get(co.id).amount+'</td>';
        if(aircraft.getCargo(co).success){
            table += '<td>'+getMoney(aircraft.getCargo(co).message.valuePerItem, true)+'</td>';
            table += '<td>'+aircraft.getCargo(co).message.amount+'</td>';
        } else {
            table += '<td></td>';
            table += '<td>0</td>';
        }
        
        table += '</tr>';
    });
    table += '</tbody>';
    
    base.append($(table));
    base.fadeIn();
    $('#cityScreenMarket').tablesorter();
}
$('#cityScreen-marketBtn').click(drawCityScreenMarket);

$('#cityScreen-sellAllBtn').click(function(e){
    e.stopPropagation();
    var a = game_data.AIRCRAFTS.get(game_data.player_settings.id);
    if(!a.cargoHold.ids.length) alert(JSON.stringify({success: false, message: 'Cargo Hold is empty'}));
    a.cargoHold.forEach(function(co){
        alert(JSON.stringify(userSellCommodity(co.id, co.amount).message));
    });
});
$('#cityScreen-refuelBtn').click(function(e){
    e.stopPropagation();
    alert(JSON.stringify(userRefuel().message));
});

$('#cityScreen-leaveBtn').click(function(){
    $('#cityScreen').fadeOut();
    $(document).trigger('cityLeave', game_data.PLAYERS.get(game_data.player_settings.id).getAircraft().id);
});