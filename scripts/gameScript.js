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
    flyToCityId(city.id);
});





