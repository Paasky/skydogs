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
*/
$(document).mousemove(function(event) {
    game_data.player_settings.mouse_position.x = event.pageX;
    game_data.player_settings.mouse_position.y = event.pageY;
});


$(document).on('cityClick', function(e, city){
    log('user clicks on city '+city.name);
    log(userSetDestination('city', city.id).message);
});
$(document).on('game_dataUpdated', function(){
    console.log('game_dataUpdated');
});


$(document).on('cityArrive', function(e, data){
    $('.aircraft_marker[id="'+data.aircraft_id+'"]').fadeOut(1000);
});

$(document).on('cityLeave', function(e, aircraft_id){
    $('.aircraft_marker[id="'+aircraft_id+'"]').fadeIn(1000);
});



