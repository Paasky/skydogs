
var app = angular.module('skyDogs', ['rzModule', 'ui.bootstrap']);

$(document).mousemove(function(event) {
    game_data.player_settings.mouse_position.x = event.pageX;
    game_data.player_settings.mouse_position.y = event.pageY;
});


// fly to a city
function flyToCityId(cityId){
    var setReply = userSetDestination('city', cityId);
    if(!setReply.success){ var type='exclamation'; }
    NotificationFactory.create(setReply.message, type);
}

$(document).on('cityClick', function(e, city){
    var setReply = userSetDestination('city', city.id);
    if(!setReply.success){ var type='exclamation'; }
    NotificationFactory.create(setReply.message, type);
});





