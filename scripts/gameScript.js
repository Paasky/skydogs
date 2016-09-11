
var app = angular.module('skyDogs', ['rzModule', 'ui.bootstrap']);

// add parser through the tablesorter addParser method
$.tablesorter.addParser({
    // set a unique id
    id: 'km',
    is: function(s) {
        // return false so this parser is not auto detected
        return false;
    },
    format: function(s) {
        // format your data for normalization
        return parseInt(s.replace(' km',''));
    },
    // set type, either numeric or text
    type: 'numeric'
});

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





