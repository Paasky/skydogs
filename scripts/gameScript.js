
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
            name: '',
            flagUrl: '',
            css: '',
        },
        city: {
            name: '',
            pop: 0,
        },
    };
    $(document).on('cityArrive', function(e, data){
        if(data.player_id != $scope.player_settings.id) return;
        var city = $scope.CITIES.get(data.city_id);
        var country = city.getCountry();

        $scope.cityScreen.country.name = country.name;
        $scope.cityScreen.country.flagUrl = getFlagUrl(country.flag_file);
        $scope.cityScreen.country.css = 'color: '+country.color2+'; background: '+country.color1+';';
        $scope.cityScreen.city.id = city.id;
        $scope.cityScreen.city.name = city.name;
        $scope.cityScreen.city.pop = city.population.city;

        $scope.$apply()
    });
    
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





