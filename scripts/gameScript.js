
var app = angular.module('skyDogs', []);

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





