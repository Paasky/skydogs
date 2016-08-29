
var app = angular.module('skyDogs', []);

app.controller('CityUIController', function UIController($scope) {
    var scopeSources = [
        'COUNTRIES', 'CITIES', 'COMMODITIES', 'PLAYERS', 'AIRCRAFTS',
        'AIRCRAFTTYPES', 'game_settings', 'player_settings',
    ];
    scopeSources.forEach(function(source){
        $scope[source] = game_data[source];
    });
    
    $scope.cityScreen = {
        country: {
            name: 'Confederacy',
            flagUrl: 'file:///F:/Documents/skydogs/angular_app/img/flag/confederacy.png',
        },
        city: {
            name: 'Wheeling',
            pop: 62000,
        },
    };
    
});

$(document).mousemove(function(event) {
    game_data.player_settings.mouse_position.x = event.pageX;
    game_data.player_settings.mouse_position.y = event.pageY;
});


// fly to a city
function flyToCityId(){
    var cityId = $(this).attr('flyToCityId');
    WindowFactory.createInfo(JSON.stringify(userSetDestination('city', cityId)));
}

$(document).on('cityClick', function(e, city){
    WindowFactory.createInfo(JSON.stringify(userSetDestination('city', city.id)));
});





