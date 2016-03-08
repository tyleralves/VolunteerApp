/**
 * Created by Tyler on 12/31/2015.
 */
var mongoose = require("mongoose");
var mongoosePaginate = require("mongoose-paginate");

var userSchema = new mongoose.Schema({
    //Registration properties
    username: String,
    password: String,
    email: String,
    role: String,
    datecreated: Date,
    profileimg: String,
    //Optional General Properties
    displayname: String,
    description: String,
    message_ids: [{type:mongoose.Schema.Types.ObjectId, ref: 'Message'}],
    feedbacksent_ids: [{type:mongoose.Schema.Types.ObjectId, ref: 'Feedback'}],
    feedbackreceived_ids: [{type:mongoose.Schema.Types.ObjectId, ref: 'Feedback'}],
    //Organization specific properties
    location: String,
    options: Array

    }
);

userSchema.index({description:'text'});
userSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('User', userSchema);
