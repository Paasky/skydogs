

app.controller('MenuUIController', function UIController($scope) {

    $scope.city = game_data.CITIES.get(1);
    $scope.country = $scope.city.getCountry();
    $scope.player = game_data.PLAYERS.get(game_data.player_settings.id);
    $scope.aircraft = $scope.player.getAircraft();
    $scope.getMoney = getMoney;

    $scope.toggleMenu = function(){
        $('#game-menu').slideToggle();
    };
    $scope.toggleSearch = function(){
        $('#search-field').slideToggle().focus();
    };




    $scope.wm = {
        isActive: false,
        filters: {
            inRange: true,
            avgMin: 50,
            avgMax: 200,
            distanceMin: 0,
            distanceMax: 5000,
            priceMin: 0,
            priceMax: 20,
            commodities: [],
        },
        marketRows: {},
    };
    game_data.CITIES.forEach(function(city){
        city.market.forEach(function(co){
            $scope.marketRows[city.id+'_'+co.id] = {
                name: co.name,
                price: co.price,
                avgPercent: 100,
                cityDistance: 0,
                cityId: city.id,
                cityName: city.name,
            };
        });
    });

    $scope.openWorldMarket = function(){
        $scope.wm.isActive = true;
        updateMarketData();
        $scope.$apply;
    }
    $scope.closeWorldMarket = function(){
        $scope.wm.isActive = false;
        $scope.$apply;
    }

    function updateMarketData(){

        $scope.wm.marketRows = [];

        game_data.CITIES.forEach(function(city){

            // in range filter
            var rangeReply = hasRange($scope.aircraft, city.position);
            if($scope.wm.filters.inRange && !rangeReply.success) return;

            // distance filter
            if($scope.wm.filters.distanceMin < rangeReply.dist.km || rangeReply.dist.km > $scope.wm.filters.distanceMax) return;

            city.market.forEach(function(co){

                // commodity filter
                if($scope.wm.filters.commodities.length > 0 && $scope.wm.filters.commodities.indexOf(co.id) == -1 ) return;

                // % of avg filter
                var avgPercent = co.modifier * 100;
                if($scope.wm.filters.avgMin < avgPercent || avgPercent > $scope.wm.filters.avgMax) return;

                // price filter
                if($scope.wm.filters.priceMin < co.price || co.price > $scope.wm.filters.priceMax) return;

                $scope.marketRows[city.id+'_'+co.id].price = co.price;
                $scope.marketRows[city.id+'_'+co.id].avgPercent = avgPercent;
                $scope.marketRows[city.id+'_'+co.id].cityDistance = rangeReply.dist.km;

            });

        });

        $scope.$apply;
    }

    $scope.flyToCity= function($event){
        flyToCityId(angular.element($event.currentTarget).attr('cityId'));
    }
    $(document).on('longScreenUpdate', function(){ if($scope.isActive) updateMarketData(); });
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
