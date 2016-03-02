/**
 * Created by Tyler on 1/3/2016.
 */
var mongoose = require("mongoose");


module.exports = mongoose.model('User',{
    organization: String,
    title: String,
    description: String
});
