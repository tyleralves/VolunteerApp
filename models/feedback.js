/**
 * Created by Tyler on 12/31/2015.
 */
var mongoose = require("mongoose");
var mongoosePaginate = require("mongoose-paginate");

var feedbackSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    sender_id: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    datecreated: Date,
    content: String
    }
);

feedbackSchema.index({content:'text'});
feedbackSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Feedback', feedbackSchema);
