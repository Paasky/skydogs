function WindowFactory(){
    
    this.create = function(data, returnString){
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
        
        newWindow.find('[action="confirm"]').click(function(){
            newWindow.remove();
            if(data.callback) data.callback(true);
        });
        newWindow.find('[action="cancel"], [action="close"]').click(function(){
            newWindow.remove();
            if(data.callback) data.callback(false);
        });
        
        if(createNewWindow) $('#app-container').append(newWindow);
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
    $('#cityScreen').attr('city_id',data.city_id).fadeIn();
}
$(document).on('cityArrive', drawCityScreen);

function drawCityScreenMarket(){
    var city = game_data.CITIES.get($('#cityScreen').attr('city_id'));
    var aircraft = game_data.AIRCRAFTS.get(game_data.player_settings.id);
    var base = $('#cityScreen-content');
    base.hide().html('');
    
    base.append('<h1>Market</h1>');
    var table = '<table id="cityScreenMarket" class="tablesorter">';
    
    table += '<thead>';
        table += '<tr><td class="borderRight" /><td class="borderRight" colspan="3">City</td><td colspan="2">You</td></tr>';
        table += '<tr><th class="borderRight">Commodity</th><th>Buys for</th><th>Sells for</th><th class="borderRight">Stock</th><th>Value</th><th>Amount</th></tr>';
    table += '</thead>';
    
    table += '<tbody>';
    game_data.COMMODITIES.forEach(function(co){
        
        table += '<tr>';
        
            table += '<td class="borderRight">'+co.name+'</td>';
            table += '<td action="sell" co_id="'+co.id+'">'+getMoney(city.getCommodityBuyPrice(co).message, true)+'</td>';
        if(city.market.get(co.id).amount != 0){
            table += '<td action="buy" co_id="'+co.id+'">'+getMoney(city.getCommoditySalePrice(co).message, true)+'</td>';
        } else {
            table += '<td></td>';
        }
            table += '<td class="borderRight">'+city.market.get(co.id).amount+'</td>';
        if(aircraft.getCargo(co).success){
            table += '<td action="sell" co_id="'+co.id+'">'+getMoney(aircraft.getCargo(co).message.valuePerItem, true)+'</td>';
            table += '<td action="sell" co_id="'+co.id+'">'+aircraft.getCargo(co).message.amount+'</td>';
        } else {
            table += '<td></td>';
            table += '<td>0</td>';
        }
        
        table += '</tr>';
    });
    table += '</tbody>';
    
    base.append($(table));
    base.fadeIn();
    $('#cityScreenMarket').tablesorter();
}
$('#cityScreen-marketBtn').click(drawCityScreenMarket);

$('#cityScreen-sellAllBtn').click(function(e){
    e.stopPropagation();
    var a = game_data.AIRCRAFTS.get(game_data.player_settings.id);
    if(!a.cargoHold.ids.length) alert(JSON.stringify({success: false, message: 'Cargo Hold is empty'}));
    a.cargoHold.forEach(function(co){
        alert(JSON.stringify(userSellCommodity(co.id, co.amount).message));
    });
});
$('#cityScreen-refuelBtn').click(function(e){
    e.stopPropagation();
    alert(JSON.stringify(userRefuel().message));
});

$('#cityScreen-leaveBtn').click(function(){
    $('#cityScreen').fadeOut();
    $(document).trigger('cityLeave', game_data.PLAYERS.get(game_data.player_settings.id).getAircraft().id);
});
