/**
 * Created by Tyler on 3/7/2016.
 */
var mongoose = require("mongoose");
var mongoosePaginate = require("mongoose-paginate");

var messageSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    sender_id: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    recipientUser: String,
    originatingTitle: String,
    title: String,
    content: String,
    dateCreated: Date,
    originatingId: Number
    });

messageSchema.index({content:'text'});
messageSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Message', messageSchema);