

app.controller('MenuUIController', function UIController($scope) {
    $scope.toggleMenu = function(){
        $('#game-menu').slideToggle();
    };
    $scope.toggleSearch = function(){
        $('#search-field').slideToggle();
    };
});

app.controller('InfoUIController', function UIController($scope) {

});

app.controller('MapUIController', function UIController($scope) {
    var panAmount = 200;
    $scope.panN = function(){
        map.panBy([0,-1*panAmount]);
    };
    $scope.panS = function(){
        map.panBy([0,panAmount]);
    };
    $scope.panW = function(){
        map.panBy([-1*panAmount,0]);
    };
    $scope.panE = function(){
        map.panBy([panAmount,0]);
    };
    $scope.toggleFollowUser = function(){
        game_data.player_settings.screen_settings.follow = !game_data.player_settings.screen_settings.follow;
        if(game_data.player_settings.screen_settings.follow){
            $('#map-controls .fa-plane').addClass('active');
        } else {
            $('#map-controls .fa-plane').removeClass('active');
        }
    };
    $scope.zoomIn = function(){
        map.zoomIn();
    };
    $scope.zoomOut = function(){
        map.zoomOut();
    };
});

app.controller('AircraftUIController', function UIController($scope) {

});

// create the world market window
function drawWorldMarketWindow(){
    var header = 'World Market';
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
    setWorldMarketData();
    $('#worldMarket').tablesorter();
    $('#worldMarket [flyToCityId]').click(flyToCityId);
}
$('#worldMarketBtn').click(drawWorldMarketWindow);

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
