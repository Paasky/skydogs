// create the world market window
function drawWorldMarketWindow(){
    var header = 'World Markets';
    header += '<span id="worldMarketFilterBtn" class="windowButton">Filter</span>';

    var content = '<table id="worldMarket" class="tablesorter">';
    content += '<thead><tr>';
    content += '<th>Name</th>';
    content += '<th>Price</th>';
    content += '<th>% of Avg</th>';
    content += '<th>Distance</th>';
    content += '<th>City</th>';
    content += '</tr></thead>';
    content += '<tbody></tbody>';
    content += '</table>';

    WindowFactory.create({header: header, content: content, id: 'worldMarketWindow'});
    setWorldMarketWindowData();
    $('#worldMarket').tablesorter();
    $('#worldMarket [flyToCityId]').click(flyToCityId);
}

// set the world market window data, every 1000ms
function setWorldMarketData(){

    // check the market screen exists
    if($('#worldMarketWindow').length == 0) return;

    var player = game_data.PLAYERS.get(game_data.player_settings.id);
    var aircraft = player.getAircraft();

    game_data.CITIES.forEach(function(city){ city.market.forEach(function(co){
        setWorldMarketDataRow(aircraft, city, co, true);
    }); });
}
$(document).on('longScreenUpdate', setWorldMarketData);

function setWorldMarketDataRow(aircraft, city, co, inRangeOnly){
    if(inRangeOnly && !hasRange(aircraft, city.position).success){
        $('#worldMarket tr[cityCommodityIds="'+city.id+'_'+co.id+'"]').remove();
        return;
    }
    var tr = $('#worldMarket tr[cityCommodityIds="'+city.id+'_'+co.id+'"]');

    var coPrice = getMoney(co.price, true);
    var coModifier = Math.round(co.modifier*100)+' %';
    var cityDistance = Math.round(getDistances(aircraft.position, city.position).km)+'km';

    if(tr.length != 0){
        tr.find('[coPrice]').text(coPrice);
        tr.find('[coModifier]').text(coModifier);
        tr.find('[cityDistance]').text(cityDistance);
    } else {
        tr = '<tr cityCommodityIds="'+city.id+'_'+co.id+'">';
        tr += '<td coName>'+co.name+'</td>';
        tr += '<td coPrice>'+coPrice+'</td>';
        tr += '<td coModifier>'+coModifier+'</td>';
        tr += '<td cityDistance>'+cityDistance+'</td>';
        tr += '<td cityName>'+city.name+'</td>';
        tr += '<td flyTo><span class="windowButton" flyToCityId="'+city.id+'">Fly to</span></td>';
        tr += '</tr>';

        $('#worldMarket tbody').append(tr);
    }

}

// fly to the city
function flyToCityId(){

    var cityId = $(this).attr('flyToCityId');
    WindowFactory.createInfo(JSON.stringify(userSetDestination('city', cityId)));
}
