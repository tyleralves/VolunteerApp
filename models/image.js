/**
 * Created by Tyler on 3/7/2016.
 */
var mongoose = require("mongoose");

var imageSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    user_id: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    dateCreated: Date,
    fieldname: String,
    originalname: String,
    encoding: String,
    mimetype: String,
    destination: String,
    filename: String,
    path: String,
    extension: String
    });

//imageSchema.index({content:'text'});

module.exports = mongoose.model('Image', imageSchema);