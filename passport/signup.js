/**
 * Created by Tyler on 12/31/2015.
 */
var LocalStrategy   = require('passport-local').Strategy;
var User = require('../models/user');
var bCrypt = require('bcrypt-nodejs');

module.exports = function(passport){

    passport.use('signup', new LocalStrategy({
                passReqToCallback : true // allows us to pass back the entire request to the callback
            },
            function(req, username, password, done) {
                findOrCreateUser = function(){

                    // find a user in Mongo with provided username
                    User.findOne({ 'username' :  username.toLowerCase() }, function(err, user) {
                        // In case of any error, return using the done method
                        if (err) {
                            console.log('Error in SignUp: ' + err);
                            return done(err);
                        }
                        //Checking whether username already exists
                        if (user) {
                            console.log('User already exists with username: ' + username);
                            req.flash('message', 'Username already exists');
                            return done(null, false);
                        }else{
                            //Username is not a duplicate... find a user in Mongo with provided email to make sure no duplicate email
                            User.findOne({email: req.body.useremail.toLowerCase()}, function(err,user){
                                if(err) {
                                    console.log('Error in signup - duplicate email section: ' + err);
                                    return done(err);
                                }
                                //Checking whether email already exists
                                if(user){
                                    console.log('Email already exists: ' + user.email);
                                    req.flash('message', 'Email already exists');
                                    return done(null,false);
                                }else{
                                    // if there is no user with that email
                                    // create the user
                                    var newUser = new User();
                                    var regInputs = req.body;

                                    // set the user's local credentials
                                    newUser.username = username.toLowerCase();
                                    newUser.displayname = username;
                                    newUser.description = "Please update your user description";
                                    newUser.password = createHash(password);
                                    newUser.email = regInputs.useremail.toLowerCase();
                                    delete regInputs.useremail;
                                    newUser.role = regInputs.userrole;
                                    delete regInputs.userrole;
                                    newUser.profileimg = 'defaultuserimage.png';
                                    newUser.datecreated = new Date();
                                    newUser.messagein = [];
                                    newUser.feedbackreceived_ids = [];
                                    newUser.feedbacksent_ids = [];
                                    //newUser.firstName = req.body.firstname;
                                    //newUser.lastName = req.body.lastname;

                                    //Org specific checkbox details
                                    newUser.options = [];
                                    if(regInputs.hasOwnProperty('options')){
                                        for(var i = 0; i<regInputs.options.length; i++){
                                            newUser.options.push(regInputs.options[i]);
                                        }
                                    }

                                    // save the user
                                    newUser.save(function(err) {
                                        if (err){
                                            console.log('Error in Saving user: '+err);
                                            throw err;
                                        }
                                        console.log('User Registration succesful');
                                        return done(null, newUser);
                                    });
                                }
                            })
                        }
                    });
                };
                // Delay the execution of findOrCreateUser and execute the method
                // in the next tick of the event loop
                process.nextTick(findOrCreateUser);
            })
    );

    // Generates hash using bCrypt
    var createHash = function(password){
        return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
    }

};