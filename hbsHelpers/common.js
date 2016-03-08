var hbs = require('hbs');

Helpers = {
    registerAllHelpers: function(){
        hbs.registerHelper('iterate', function(context,options){
            var ret="";
            var startCount = options.hash['startCount'];
            var endCount;
            if(options.hash.hasOwnProperty('endCount')){
                endCount = options.hash['endCount'];
            }else{
                endCount = context.length;
            }
            for(var i=startCount;i<endCount;i++){
                if(typeof context[i] !== 'undefined'){
                    ret = ret + options.fn(context[i]);
                }

            }
            return ret;
        });



        hbs.registerHelper('replyUser', function(sender,activeUser,options){
            if(sender === activeUser){
                return options.fn(this);
            }else{
                return options.inverse(this);
            }
        });

        hbs.registerHelper('messages', function(context,options){
            var ret="";
            var data;


            if (options.data) {
                data = hbs.handlebars.createFrame(options.data);
            }


            context = context.toObject();
            context.sort(function(a,b){
                return b.dateCreated - a.dateCreated || b.originatingId - a.originatingId;
            });
            for(var i = 0; i<context.length; i++) {
                if (data){
                    if(typeof context[i-1] === 'undefined' || context[i].originatingId !== context[i-1].originatingId){
                        data.index = "activateDiv";
                        if(typeof context[i+1] === 'undefined' || context[i].originatingId !== context[i+1].originatingId){
                            ret = ret + options.fn(context[i], {data: data}) + "</div>";
                        }else{
                            ret = ret + options.fn(context[i], {data: data});
                        }
                    }else if(i===context.length-1 || context[i].originatingId !== context[i+1].originatingId){
                        data.index = "initialHidden";
                        ret = ret + options.inverse(context[i], {data: data}) + "</div>";
                    }else{
                        data.index = "initialHidden";
                        ret = ret + options.inverse(context[i], {data: data});
                    }
                }
            }
            return ret;
        });


    }
};

module.exports = Helpers;