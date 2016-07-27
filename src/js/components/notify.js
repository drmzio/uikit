import $ from 'jquery';

var uid = 0;

var containers = {},
    messages   = {},
    notify     =  function(options){

        if ($.type(options) == 'string') {
            options = { message: options };
        }

        if (arguments[1]) {
            options = $.extend(options, $.type(arguments[1]) == 'string' ? {status:arguments[1]} : arguments[1]);
        }

        return (new Message(options)).show();
    },
    closeAll  = function(group, instantly){

        var id;

        if (group) {
            for(id in messages) { if(group===messages[id].group) messages[id].close(instantly); }
        } else {
            for(id in messages) { messages[id].close(instantly); }
        }
    };

class Message {

    constructor(options) {

        this.options = $.extend({
            message: '',
            status: '',
            timeout: 5000,
            group: null,
            pos: 'top-center',
            onClose: function() {}
        }, options);

        this.uuid    = `notifymsg-${++uid}`;
        this.element = $(`
            <div class="uk-notify-message">
                <a class="uk-close"></a>
                <div></div>
            </div>
        `).data("notifyMessage", this);

        this.content(this.options.message);

        // status
        if (this.options.status) {
            this.element.addClass('uk-notify-message-'+this.options.status);
            this.currentstatus = this.options.status;
        }

        this.group = this.options.group;

        messages[this.uuid] = this;

        if (!containers[this.options.pos]) {
            containers[this.options.pos] = $('<div class="uk-notify uk-notify-'+this.options.pos+'"></div>').appendTo('body').on("click", ".uk-notify-message", function(){

                var message = $(this).data("notifyMessage");

                message.element.trigger('manualclose.uk.notify', [message]);
                message.close();
            });
        }
    }

    show() {

        if (this.element.is(":visible")) return;

        var $this = this;

        containers[this.options.pos].show().prepend(this.element);

        var marginbottom = parseInt(this.element.css("margin-bottom"), 10);

        this.element.css({"opacity":0, "margin-top": -1*this.element.outerHeight(), "margin-bottom":0}).animate({"opacity":1, "margin-top": 0, "margin-bottom":marginbottom}, function(){

            if ($this.options.timeout) {

                var closefn = function(){ $this.close(); };

                $this.timeout = setTimeout(closefn, $this.options.timeout);

                $this.element.hover(
                    function() { clearTimeout($this.timeout); },
                    function() { $this.timeout = setTimeout(closefn, $this.options.timeout);  }
                );
            }

        });

        return this;
    }

    close(instantly) {

        var $this    = this,
            finalize = function(){
                $this.element.remove();

                if (!containers[$this.options.pos].children().length) {
                    containers[$this.options.pos].hide();
                }

                $this.options.onClose.apply($this, []);
                $this.element.trigger('close.uk.notify', [$this]);

                delete messages[$this.uuid];
            };

        if (this.timeout) clearTimeout(this.timeout);

        if (instantly) {
            finalize();
        } else {
            this.element.animate({"opacity":0, "margin-top": -1* this.element.outerHeight(), "margin-bottom":0}, function(){
                finalize();
            });
        }
    }

    content(html){

        var container = this.element.find(">div");

        if (!html) {
            return container.html();
        }

        container.html(html);

        return this;
    }

    status(status) {

        if (!status) {
            return this.currentstatus;
        }

        this.element.removeClass('uk-notify-message-'+this.currentstatus).addClass('uk-notify-message-'+status);

        this.currentstatus = status;

        return this;
    }
}

UIkit.notify          = notify;
UIkit.notify.message  = Message;
UIkit.notify.closeAll = closeAll;
