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
    log(setDestination('city', city.id));
});
$(document).on('game_dataUpdated', function(){
    console.log('game_dataUpdated');
});


$(document).on('cityArrive', function(e, a_id){
    $('.aircraft_marker[id="'+a_id+'"]').fadeOut(1000);
});

$(document).on('cityLeave', function(e, a_id){
    $('.aircraft_marker[id="'+a_id+'"]').fadeIn(1000);
});



