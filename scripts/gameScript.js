/*
var app = angular.module('skyDogs', []);

app.factory('settings', [function(){
  var o = {
    settings: game_data
  };
  return o;
}]);


app.controller('Ctrl', ['$scope',function($scope) {
    $scope.age = 24;
}]);
$(document).mousemove(function(event) {
    game_data.player_settings.mouse_location.x = event.pageX;
    game_data.player_settings.mouse_location.y = event.pageY;
});
*/


$(document).on('cityClick', function(e, city){
    log('user clicks on city '+city.name);
    log(setUserDestination('city', city.id));
});
$(document).on('game_dataUpdated', function(){
    console.log('game_dataUpdated');
});

/*
$(document).on('cityArrive', function(e, city){
    var p = game_data.players[game_data.player_settings.id];
    var marker = $('.player_marker[id="'+p_id+'"] .player_image')];
    
    // fade the icon away
	marker.setClickable(false);
    var i=11;
    var cityArriveFade = setInterval(function() {
        i--;
        if (i >= 0) {
            marker.setOpacity(i/10);
        }
    }, 100);
    
    // nullify the fader so it doesn't take up resources
    setTimeout(function(){clearInterval(cityArriveFade);}, 1000);
});

$(document).on('cityLeave', function(e, city){
    var marker = player_markers[game_data.player_settings.id];
    
    // fade in the icon
	marker.setClickable(true);
    var i=-1;
    var cityLeaveFade = setInterval(function() {
        i++;
        if (i <= 10) {
            marker.setOpacity(i/10);
        }
    }, 100);
    
    // nullify the fader so it doesn't take up resources
    setTimeout(function(){clearInterval(cityLeaveFade);}, 1000);
});
*/


