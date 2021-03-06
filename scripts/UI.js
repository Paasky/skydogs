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
        
        newWindow.find('[action="confirm"]').click(function(){
            if(data.callback) var callbackReply = data.callback(true);
            if(!data.callback || !callbackReply) newWindow.remove();
        });
        newWindow.find('[action="cancel"], [action="close"]').click(function(){
            if(data.callback) var callbackReply = data.callback(false);
            if(!data.callback || !callbackReply) newWindow.remove();
        });
        
        if(createNewWindow){
            $('#app-container').append(newWindow);
            WindowFactory.initWindow(newWindow);
        } else {
            WindowFactory.setActive(newWindow);
        }
        return newWindow;
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
    initWindow: function(elem){
        elem.mousedown(function(){
            WindowFactory.setActive(elem);
        });
        WindowFactory.setActive(elem);
        WindowFactory.setDraggable(elem);
    },
    setActive: function(elem){
        $('.window').removeClass('active');
        elem.addClass('active');
    },
    setDraggable: function(elem){
        var x_pos = 0,
            y_pos = 0;

        function mouseUp() {
            $(document).unbind('mousemove', divMove, true);
        }

        function mouseDown(e) {
            x_pos = e.clientX - elem.position().left;
            y_pos = e.clientY - elem.position().top;
            $(document).mousemove(divMove);
        }

        function divMove(e) {
            window.getSelection().removeAllRanges();
            elem.css('transform', 'none');
            if(e.clientY >= 0 && e.clientY <= $(window).height()){
                elem.css('top', (e.clientY - y_pos) + 'px');
            }
            if(e.clientX >= 0 && e.clientX <= $(window).width()){
                elem.css('left', (e.clientX - x_pos) + 'px');
            }
        }

        elem.find('.windowHeader').mousedown(mouseDown);
        elem.find('.windowHeader').mouseup(mouseUp);
    }
}

var NotificationFactory = {
    create: function(text, type, duration){
        if(!type) type = 'info';
        if(!duration) duration = 5000;

        var output =
            '<div class="notification ui-btn">'+
                '<i class="fa fa-'+type+'" aria-hidden="true"></i>'+
                text+
                '<i class="fa fa-times" aria-hidden="true"></i>'+
            '</div>';
        var newNotification = $(output);
        newNotification.find('.fa-times').click(function(){ $(this).parent().remove(); });
        $('#notifications').prepend(newNotification);
        newNotification.hide().slideDown();
        setTimeout(function(){
            newNotification.slideUp(
                1000,
                function(){ $(this).remove(); }
            );
        }, duration);

        return newNotification;
    },
}

$(document).keypress(function(e){
  if (e.keyCode === 13) $('.window.active [action="confirm"]').last().click();     // enter
  if (e.keyCode === 27) $('.window.active [action="close"]').last().click();   // esc
});
