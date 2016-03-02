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
                return b[0].dateCreated - a[0].dateCreated;
            });
            for(var i = 0; i<context.length; i++) {
                for(var j = 0; j<context[i].length; j++){
                    if (data){
                        if(j===0){
                            data.index = "activateDiv";
                            if(context[i].length===1){
                                ret = ret + options.fn(context[i][j], {data: data}) + "</div>";
                            }else{
                                ret = ret + options.fn(context[i][j], {data: data});
                            }
                        }else if(j===context[i].length-1){
                            data.index = "initialHidden";
                            ret = ret + options.inverse(context[i][j], {data: data}) + "</div>";
                        }else{
                            data.index = "initialHidden";
                            ret = ret + options.inverse(context[i][j], {data: data});
                        }

                    }

                }

            }
            return ret;
        });


    }
};

module.exports = Helpers;