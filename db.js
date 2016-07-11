/**
 * Created by Tyler on 12/31/2015.
 */
module.exports = {
    "url": "mongodb://"+(process.env.MONGOLAB_USERNAME||MONGOLAB_USERNAME)+":"+(process.env.MONGOLAB_PASSWORD||MONGOLAB_PASSWORD)+"@ds019668.mlab.com:19668/heroku_67dwl1k0" //Uses remote mongolab db (heroku addon)
    //"url": "127.0.0.1:27017/volunteerApp"
};