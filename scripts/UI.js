var WindowFactory = {
    
    create: function(data, returnString){
        // data: {header: '', content: '' footer: '', type: '', id:''}
        if(!data) return {success: false, message: 'Window(): data is required'};
        if(!data.content) return {success: false, message: 'Window(): content is required'};
        if(!data.type && !data.header) return {success: false, message: 'Window(): header is required if type is not set'};
        
        var types = {
            info: {
                header: 'Information',
                footer: '<span class="windowButton" action="close">OK</span>'
            },
            confirm: {
                header: 'Confirm',
                footer: '<span class="windowButton" action="confirm">Yes</span><span class="windowButton" action="cancel">No</span>'
            },
            warn: {
                header: 'Warning!',
                footer: '<span class="windowButton" action="confirm">Continue</span><span class="windowButton" action="cancel">Cancel</span>'
            }
        };
        if(data.type && !types[data.type]) return {success: false, message: 'Window(): '+data.type+' not found in types'};
        if( (data.type == 'confirm' || data.type == 'confirm' ) &&
            (!data.callback || typeof(data.callback) != 'function') ){
            return {success: false, message: 'Window(): confirm window requires a callback function'};
        }
        
        var windowType = types[data.type];
        var createNewWindow = true;

        // if we don't return a string & window is in DOM, don't create a new one
        if(!returnString && $('#'+data.id).length != 0) createNewWindow = false;

        
        // window div
        var html = '';
        if(createNewWindow){
            html+= '<div class="window center-xy';
            if(data.type) html+= ' '+data.type;
            html+='"';
            if(data.id) html+=' id="'+data.id+'"';
            html+='>';
        }
        
        // header
        html+='<div class="windowHeader">';
        if(data.header){
            html+=data.header;
        } else {
            html+=windowType.header;
        }
        html+='<span class="windowClose" action="cancel">x</span>';
        html+='</div>';
        
        // content
        html+='<div class="windowContent scrollable">';
        html+=data.content;
        html+='</div>';
        
        // footer
        if(data.footer || windowType){
            html+='<div class="windowFooter">';
            if(data.footer){
                html+=data.footer;
            } else {
                html+=windowType.footer;
            }
            html+='</div>';
        }
        
        // close window div
        if(createNewWindow){
            html+='</div>';
            if(returnString) return html;

            var newWindow = $(html);
        } else {
            var newWindow = $('#'+data.id).html(html);
        }
        
        newWindow.mousedown(function(){
            WindowFactory.setActive(newWindow);
        });
        newWindow.find('[action="confirm"]').click(function(){
            if(data.callback) var callbackReply = data.callback(true);
            if(!data.callback || !callbackReply) newWindow.remove();
        });
        newWindow.find('[action="cancel"], [action="close"]').click(function(){
            if(data.callback) var callbackReply = data.callback(false);
            if(!data.callback || !callbackReply) newWindow.remove();
        });
        
        if(createNewWindow) $('#app-container').append(newWindow);
        WindowFactory.setActive(newWindow);
        WindowFactory.setDraggable(newWindow);
    },
    createConfirm: function(content, returnString){
        return WindowFactory.create({type: 'confirm', content: content}, returnString);
    },
    createInfo: function(content, returnString){
        return WindowFactory.create({type: 'info', content: content}, returnString);
    },
    createWarn: function(content, returnString){
        return WindowFactory.create({type: 'warn', content: content}, returnString);
    },
    setActive: function(elem){
        $('.window').removeClass('active');
        elem.addClass('active');
    },
    setDraggable: function(elem){
        var x_pos = 0,
            y_pos = 0;

        function mouseUp() {
            elem.unbind('mousemove', divMove, true);
        }

        function mouseDown(e) {
            x_pos = e.clientX - elem.offset().left;
            y_pos = e.clientY - elem.offset().top;
            elem.mousemove(divMove);
        }

        function divMove(e) {
            elem.css('transform', 'none');
            if(e.clientY >= 0 && e.clientY <= $(window).height()){
                elem.css('top', (e.clientY - y_pos) + 'px');
            }
            if(e.clientX >= 0 && e.clientX <= $(window).width()){
                elem.css('left', (e.clientX - x_pos) + 'px');
            }
        }

        elem.mousedown(mouseDown);
        elem.mouseup(mouseUp);
    }
}

// city
function drawCityScreen(e, data){
    if(data.aircraft_id != game_data.player_settings.id) return;
    var city = game_data.CITIES.get(data.city_id);
    var country = city.getCountry();

    $('#cityScreen-country').css('backgroundColor', country.color1).css('color', country.color2);
    $('#cityScreen-country-flag').prop('src', getFlagUrl(country.flag_file));
    $('#cityScreen-country-name').text(country.name);
    $('#cityScreen-name').text(city.name);
    $('#cityScreen-popNumber').text(city.population.city);
    $('#cityScreen-content').html('');
    $('#cityScreen').attr('city_id',data.city_id).fadeIn();
}
$(document).on('cityArrive', drawCityScreen);

function drawCityScreenMarket(){
    var city = game_data.CITIES.get($('#cityScreen').attr('city_id'));
    var player = game_data.PLAYERS.get(game_data.player_settings.id);
    var aircraft = player.getAircraft();
    var base = $('#cityScreen-content');
    base.hide().html('');
    
    base.append('<h1>Market</h1>');
    var table = '<table id="cityScreenMarket" class="tablesorter">';
    
    table += '<thead>';
        table += '<tr><td class="borderRight" colspan="2">Commodity</td><td class="borderRight" colspan="3">City</td><td colspan="2">You</td></tr>';
        table += '<tr><th>Name</th><th class="borderRight">Avg.</th><th>Buys for</th><th>Sells for</th><th class="borderRight">Stock</th><th>Value</th><th>Amount</th></tr>';
    table += '</thead>';
    
    table += '<tbody>';
    game_data.COMMODITIES.forEach(function(co){

        var dataCityAmount = city.market.get(co.id).amount;
        var dataCityModifier = city.market.get(co.id).modifier
        if(dataCityAmount != 0){
            var buyAction = ' action="buy" co_id="'+co.id+'"';

            if(dataCityModifier > 1){
                buyAction += ' style="color: rgb('+Math.round((dataCityModifier-1)*128)+',0,0);"';
            } else {
                buyAction += ' style="color: rgb(0,'+Math.round((dataCityModifier-1)*-256)+',0);"';
            }
        } else {
            var buyAction = ' disabled';
        }

        if(aircraft.getCargo(co).success){
            var sellAction = ' action="sell" co_id="'+co.id+'"';

            if(dataCityModifier > 1){
                sellAction += ' style="color: rgb(0,'+Math.round((dataCityModifier-1)*128)+',0);"';
            } else {
                sellAction += ' style="color: rgb('+Math.round((dataCityModifier-1)*-256)+',0,0);"';
            }
        } else {
            var sellAction = ' disabled';
        }
        
        table += '<tr>';

            table += '<td>'+co.name+'</td>';
            table += '<td class="borderRight">'+getMoney(co.base_price, true)+'</td>';
            table += '<td'+sellAction+'>'+getMoney(city.getCommodityBuyPrice(co).message, true)+'</td>';
            table += '<td'+buyAction+'>'+getMoney(city.getCommoditySalePrice(co).message, true)+'</td>';
            table += '<td'+buyAction+' class="borderRight">'+city.market.get(co.id).amount+'</td>';
            if(sellAction != ' disabled'){
                table += '<td'+sellAction+'>'+getMoney(aircraft.getCargo(co).message.valuePerItem, true)+'</td>';
                table += '<td'+sellAction+'>'+aircraft.getCargo(co).message.amount+'</td>';
            } else {
                table += '<td'+sellAction+'>0</td>';
                table += '<td'+sellAction+'>0</td>';
            }

        table += '</tr>';
    });
    table += '</tbody>';
    
    base.append($(table));
    base.fadeIn();
    $('#cityScreenMarket').tablesorter();

    base.find('[action]').click(createShopWindow);
}

function createShopWindow(){
    var action = $(this).attr('action');
    var co_id = $(this).attr('co_id');
    var header = '';
    var content = '';

    if(action == 'buy'){
        var buySelected = 'selected ';
        var sellSelected = '';
    } else {
        var buySelected = '';
        var sellSelected = 'selected ';
    }

    // shop type selector (buy/sell)
    header += '<select id="shopTypeSelector">';
    header += '<option '+buySelected+'value="buy">Buy</option>';
    header += '<option '+sellSelected+'value="sell">Sell</option>';
    header += '</select>';

    // commodity selector
    header += '<select id="shopCommoditySelector">';
    game_data.COMMODITIES.forEach(function(co){
        var coSelected = '';
        if(co.id == co_id) coSelected = 'selected ';
        header += '<option '+coSelected+'value="'+co.id+'">'+co.name+'</option>';
    });
    header += '</select>';

    content += '<table id="shopContent">';
    content += '<tr>';
        content += '<td>Amount:</td>';
        content += '<td><input type=number id="shopAmount" value="1"></td>';
        content += '<td class="gray">(<span id="shopAmountAvailable"></span> available)</td>';
    content += '</tr>';
    content += '<tr>';
        content += '<td>Price:</td>';
        content += '<td><span id="shopCommodityPrice"></span></td>';
    content += '</tr>';
    content += '<tr class="sum-row">';
        content += '<td>Total:</td>';
        content += '<td><span id="shopSum"></span></td>';
        content += '<td rowspan="2"><span id="shopConfirm" class="windowButton" action="confirm"></span></td>';
    content += '</tr>';
    content += '<tr class="gray">';
        content += '<td>Your money:</td>';
        content += '<td><span id="shopPlayerMoneyAvailable"></span></td>';
    content += '</tr>';
    content += '</table>';

    WindowFactory.create({
        id: 'shopWindow',
        header: header,
        content: content,
        callback: shopAction,
    });
    setShopData();
    $('#shopWindow input, #shopWindow select').change(setShopData);
}

function setShopData(){
    var city = game_data.CITIES.get($('#cityScreen').attr('city_id'));
    var player = game_data.PLAYERS.get(game_data.player_settings.id);
    var aircraft = player.getAircraft();
    var shop = $('#shopWindow');
    var commodity = game_data.COMMODITIES.get($('#shopCommoditySelector').val());

    // buying or selling
    var shopType = $('#shopTypeSelector').val();
    shop.attr('shopType', shopType);
    $('#shopConfirm').text($('#shopTypeSelector :selected').text());

    // amounts
    var shopAmount = $('#shopAmount').val();
    if(shopType=='buy'){
        var amountAvailable = city.market.get(commodity.id).amount;
    } else {
        var amountAvailable = aircraft.getCargo(commodity).message.amount;
    }
    $('#shopAmountAvailable').text(amountAvailable);
    $('#shopPlayerMoneyAvailable').text(getMoney(player.money, true));

    // price
    if(shopType=='buy'){
        var cityPrice = city.getCommoditySalePrice(commodity).message;
    } else {
        var cityPrice = city.getCommodityBuyPrice(commodity).message;
    }
    $('#shopCommodityPrice').text(getMoney(cityPrice, true));
    $('#shopSum').text(getMoney(cityPrice * shopAmount, true));
}

function shopAction(isAction){
    if(!isAction) return false;

    // buying or selling
    var shopType = $('#shopTypeSelector').val();
    var co_id = $('#shopCommoditySelector').val();
    var amount = $('#shopAmount').val();

    if(shopType=='buy'){
        WindowFactory.create({
            header: 'Purchase Information',
            type: 'info',
            content: JSON.stringify(userBuyCommodity(co_id, amount))
        });
    } else {
        WindowFactory.create({
            header: 'Sale Information',
            type: 'info',
            content: JSON.stringify(userSellCommodity(co_id, amount))
        });
    }

    var city = game_data.CITIES.get($('#cityScreen').attr('city_id'));
    var player = game_data.PLAYERS.get(game_data.player_settings.id);
    var aircraft = player.getAircraft();
    var shop = $('#shopWindow');
    var commodity = game_data.COMMODITIES.get($('#shopCommoditySelector').val());

    // buying or selling
    var shopType = $('#shopTypeSelector').val();

    // amounts
    var shopAmount = $('#shopAmount').val();
    if(shopType=='buy'){
        var amountAvailable = city.market.get(commodity.id).amount;
    } else {
        var amountAvailable = aircraft.getCargo(commodity).message;
    }

    // price
    if(shopType=='buy'){
        var cityPrice = city.getCommoditySalePrice(commodity).message;
    } else {
        var cityPrice = city.getCommodityBuyPrice(commodity).message;
    }
    $('#shopCommodityPrice').text(getMoney(cityPrice, true));
    $('#shopSum').text(getMoney(cityPrice * shopAmount, true));
}




$('#cityScreen-marketBtn').click(drawCityScreenMarket);

$('#cityScreen-sellAllBtn').click(function(e){
    e.stopPropagation();
    var a = game_data.AIRCRAFTS.get(game_data.player_settings.id);
    if(!a.cargoHold.ids.length) WindowFactory.createInfo(JSON.stringify({success: false, message: 'Cargo Hold is empty'}));
    a.cargoHold.forEach(function(co){
        WindowFactory.createInfo(JSON.stringify(userSellCommodity(co.id, co.amount).message));
    });
});
$('#cityScreen-refuelBtn').click(function(e){
    e.stopPropagation();
    WindowFactory.createInfo(JSON.stringify(userRefuel().message));
});

$('#cityScreen-leaveBtn').click(function(){
    $('#cityScreen').fadeOut();
    $(document).trigger('cityLeave', game_data.PLAYERS.get(game_data.player_settings.id).getAircraft().id);
});
