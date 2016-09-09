

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


    ///// WORLD MARKET WINDOW /////

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
            $scope.wm.marketRows[city.id+'_'+co.id] = {
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

        if(!$scope.wm.windowInited){
            setTimeout(function(){
                WindowFactory.initWindow($('#world-market-window'));
            }, 10);
            $scope.wm.windowInited = true;
        }
    }
    $scope.closeWorldMarket = function(){
        $scope.wm.isActive = false;
        $scope.$apply;
        $scope.wm.windowInited = false;
    }

    function updateMarketData(){

        game_data.CITIES.forEach(function(city){

            var rangeReply = hasRange($scope.aircraft, city.position);
            if(
                // in range filter
                ($scope.wm.filters.inRange && !rangeReply.success)
                ||

                // distance filter
                (rangeReply.dist.km < $scope.wm.filters.distanceMin || rangeReply.dist.km > $scope.wm.filters.distanceMax)
            ){
                city.market.forEach(function(co){
                    $scope.wm.marketRows[city.id+'_'+co.id].isActive = false;
                });
                return;
            }

            city.market.forEach(function(co){

                var avgPercent = Math.round(co.modifier * 100);
                if(
                    // commodity filter
                    ($scope.wm.filters.commodities.length > 0 && $scope.wm.filters.commodities.indexOf(co.id) == -1)
                    ||

                    // % of avg filter
                    (avgPercent < $scope.wm.filters.avgMin || avgPercent > $scope.wm.filters.avgMax)
                    ||

                    // price filter
                    (co.price < $scope.wm.filters.priceMin || co.price > $scope.wm.filters.priceMax)
                ){
                    $scope.wm.marketRows[city.id+'_'+co.id].isActive = false;
                    return;
                }

                $scope.wm.marketRows[city.id+'_'+co.id].price = co.price;
                $scope.wm.marketRows[city.id+'_'+co.id].avgPercent = avgPercent;
                $scope.wm.marketRows[city.id+'_'+co.id].cityDistance = Math.round(rangeReply.dist.km);
                $scope.wm.marketRows[city.id+'_'+co.id].isActive = true;

            });

        });

        $scope.$apply;
    }

    $scope.flyToCity = function($event){
        flyToCityId(angular.element($event.currentTarget).attr('cityId'));
    }
    $scope.toggleWorldMarketFilters = function(){
        $('#world-market-filters').slideToggle();
        $('#worldMarketFilterBtn').toggleClass('active');
    }
    $(document).on('longScreenUpdate', function(){ if($scope.wm.isActive) updateMarketData(); });
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
