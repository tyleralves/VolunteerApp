var express = require('express');
var router = express.Router();
var passport = require('passport');
var path = require('path');
var User = require('../models/user');
var Feedback = require('../models/feedback');
var multer = require('multer');
var app = require('../app');
var mongoose = require('mongoose');
var Promise = require('bluebird');
Promise.promisifyAll(mongoose);
//var readChunk = require('read-chunk');                for magic bytes implementation
//var fileType = require('file-type');                  for magic bytes implementation

//Custom Middleware
var middleware = require('../middleware/common');     //Require custom middleware
var isAuthenticated = middleware.isAuthenticated;
var upload = middleware.multerSetup();


//Custom hbs helpers
var hbs = require('hbs');
var hbsHelpers = require('../hbsHelpers/common');      //Require custom hbs helpers
hbsHelpers.registerAllHelpers();                       //Registering all hbs helpers


//Homepage
router.get('/', function (req, res, next) {
    //Fetching data to populate newest listings collage
    User.find({role: 'organization'}).sort({datecreated: -1}).limit(6).exec(function (err, docs) {
            docs.forEach(function(item){
                item.description = item.description.slice(0,40);
                item.description += "...";
            });

            res.render('index.hbs', {user: req.user, orgsfeatured: docs, message: req.flash('message'),auth: req.flash('auth')})
        }
    );
});

//Organization List
router.get('/orglist', function (req, res, next) {
    var currPage = req.query.page || 1;
    delete req.query.page;
    var searchQuery = {};
    searchQuery.options = [];
    searchQuery.keyword = req.query.keyword;
    searchQuery.location = req.query.location;
    for(var i in req.query){                                            //remove blanks from req.query
        if(req.query.hasOwnProperty(i) && req.query[i] !== ''){
            if(i.indexOf('searchOption') !== -1) {                       //If it is a checkbox option ====Think about refactoring this mechanism====

                searchQuery.options.push(req.query[i]);

            }
        }
    }

    var query = {};
    if(typeof searchQuery.keyword !== 'undefined' && searchQuery.keyword !== ''){
        query.$text = {$search: searchQuery.keyword};
    }
    if(typeof searchQuery.options !== 'undefined' && searchQuery.options.length > 0){
        query.options = {$all: searchQuery.options};
    }

    User.paginate(query, {page: currPage, limit: 10, sort: {datecreated: 'descending'}}, function(err, result) {
        var docs = result.docs;
        docs.forEach(function(item){
            item.description = item.description.slice(0,700);
            if(item.description.length === 700){
                item.description += '...';
            }
        });
        res.render('orglist.hbs', {user: req.user, orglist: docs, currentPage: result.page, totalPages: result.pages, query: JSON.stringify(query)})
    });

});


//Organization Profile
router.get('/userprofile/:username', function (req, res, next) {
    User.findOne({username: req.params.username})
        .populate({path: 'feedbackreceived_ids', options: {sort: {datecreated: -1}}})
        .exec(function (err, docs) {

            Feedback.populate(docs, {path: 'feedbackreceived_ids.sender_id', select: 'username displayname profileimg', model: 'User'}, function (err, updatedDocs) {
                console.log("====================" + JSON.stringify(updatedDocs.feedbackreceived_ids[0].sender_id));
                res.render('userprofile.hbs', {
                    user: req.user,
                    userDetails: updatedDocs,
                    message: req.flash('message')
                });
            })
        })
});


//User List
router.get('/userlist', function (req, res, next) {
    User.find({'role': 'volunteer'}, function (e, docs) {
        res.render('userlist.hbs', {
            user: req.user, "volunteerlist": docs
        });
    });
});

//Registration
router.route('/register')
    .get(function (req, res, next) {
        res.render('register.hbs', {
            title: 'Join the Volunteer Community!',
            message: req.flash('message'),
            user:req.user
        });
    })
    .post(passport.authenticate('signup', {
        successRedirect: '/dashboard',
        failureRedirect: '/register',
        failureFlash: 'true'
    })
);

//Login
router.route('/login')
    .get(function(req,res,err){
        if(req.user){
            req.flash('message','You are already logged in. To change accounts log out first.');
            res.redirect('/login');
        }
        res.render('login.hbs', {message: req.flash('message')});
    })
    .post(passport.authenticate('login', {
        failureRedirect: '/login',
        failureFlash: 'true'
    }),
    function (req, res, next) {
        res.redirect('/dashboard');
    }
);

//Logout
router.get('/signout', function (req, res, next) {
    req.logout();
    res.redirect('/');
});

//Routing for new user registration page is shared with register.hbs (routed above)
//

//Dashboard
router.get('/dashboard', isAuthenticated, function (req, res, next) {
    User.findById(req.user.id, function (e, docs) {             //Necessary? Just use req.user instead?
        res.render('dashboard.hbs', {
            user: req.user, userDetails: docs
        });
    });
});

//Update user from within dashboard
router.post('/updateuser',
    upload.single('upl'),  //IMPORTANT: Need to implement magic bytes test to ensure file uploads are kosher
    function (req, res, next) {
        var updatedImgPath = req.hasOwnProperty('file')?req.file.filename:req.user.profileimg;
        User.update({_id: req.user.id}, {
            $set: {
                displayname: req.body.displayname,
                description: req.body.about,
                profileimg: updatedImgPath
            }
        }, function (e, raw) {
            if (e) {
                console.log("Error updating User within post('/updateprofile')");
            }
        });
        next();
    },
    function (req, res, next) {
        res.redirect('/dashboard');
    }
);

//Messages
//TODO: Order message strings to be displayed in order of newest message
router.route('/messages')
    .get(isAuthenticated, function(req,res,next){    //Note: messages.hbs relies on 'replyUser' and 'messages' handlebars helpers defined at the top of index.js
        User.findOne({username:req.query.username}, function(err,docs){
            if(err){
                console.log("error!!");
            }
            res.render('messages.hbs', {
                user: req.user, query: req.query, receivingUser:docs
            });
        });
    })
    .post(function(req,res,next){
        var messageStringTitle = typeof req.body.originatingTitle !== 'undefined'&&req.body.originatingTitle !== ''?req.body.originatingTitle:req.body.messageTitle;    //checks to see if query parameter defined for originating title, if not sets message title to originating title (starts new message string)
        
        var newMessage = {
            senderDisplay: req.user.displayname,
            senderUser: req.user.username,
            senderImage: req.user.profileimg,         //need to update to dynamic sender image, currently it will use the sender image at the time the message is sent
            recipientUser: req.body.messageUser,
            originatingTitle: messageStringTitle,
            title: req.body.messageTitle,
            content: req.body.messageContent,
            dateCreated: new Date()
        };

        var messageSender = function(docs){
            var tempMessageArray = docs.messagein;

            //Iterate through all message strings in messagein property of docs document
            for(var i = 0; i<tempMessageArray.length; i++){
                //IF the originating title of the first message within the existing message string (and thus all others in string) are the originating title of the new message AND
                //either the sender OR recipient of the existing message string are the sender of the new message AND
                //either the sender OR recipient of the existing message string are the recipient of the new message THEN
                //the new message belongs to the existing message string at this iteration of the messagein property
                if(tempMessageArray[i][0].originatingTitle===messageStringTitle&&(tempMessageArray[i][0].senderUser===newMessage.senderUser||tempMessageArray[i][0].recipientUser===newMessage.senderUser)&&(tempMessageArray[i][0].senderUser===newMessage.recipientUser||tempMessageArray[i][0].recipientUser===newMessage.recipientUser)){
                    var existingMessageIndex = i;
                    break;
                }
            }

            if(typeof existingMessageIndex === 'undefined'){    //IF the above algorithm did not find that the new message belongs to an existing message string, it is added as a new message string array
                tempMessageArray.unshift([newMessage]);
                docs.messagein = tempMessageArray;
            }else{
                docs.messagein[existingMessageIndex].unshift(newMessage);    //ELSE the new message is added to the existing message string to which is belongs
            }
            return docs;
        };


        //Update sending user
        User.findOne({username: req.user.username}, function(e, docs){
            messageSender(docs);
            docs.markModified('messagein');
            docs.save(function(e){
                if(e){
                    console.log("Error saving outgoing message");
                }
            })
        });

        //Update receiving user
        User.findOne({username: req.body.messageUser}, function(e, docs){
            messageSender(docs);
            docs.markModified('messagein');
            docs.save(function(e){
                if(e){
                    console.log("Error sending message within post ('/messages')");
                }
            });
        });

        next();
    }, function(req,res,next){
        res.redirect(req.url + '?username=' + req.body.messageUser + '&originatingTitle=' + req.body.originatingTitle);
    });


//Feedback
//TODO: Order message strings to be displayed in order of newest message
router.route('/feedback')
    .get(isAuthenticated, function(req,res,next){    //Note: feedback.hbs relies on 'replyUser' and 'messages' handlebars helpers defined at the top of index.js
        User.findOne({_id:req.query.id}, function(err,docs){
            if(err){
                console.log("error!!");
            }

            res.render('feedback.hbs', {
                user: req.user, query: req.query, receivingUser:docs
            });
        });
    })
    .post(function(req,res,next){
        var newFeedback = {
            _id: mongoose.Types.ObjectId(),
            sender_id: req.user._id,
            content: req.body.messageContent,
            datecreated: new Date()
        };

        Feedback.create(newFeedback);
        User.findByIdAndUpdate(req.user._id, {$push:{feedbacksent_ids: newFeedback._id}},{upsert:true}, function(err,docs){
            console.log("=================", docs);
        });
        User.findByIdAndUpdate(req.body.feedbackid, {$push:{feedbackreceived_ids: newFeedback._id}},{upsert:true}, function(err,docs){
            console.log("=================", newFeedback._id);
        });
        next();
    }, function(req,res,next){
        res.redirect(req.url + '?id=' + req.body.feedbackid/* + '&originatingTitle=' + req.body.originatingTitle*/);
    });

//Jobs============================================================================================================
/*Routing for new job page
 router.post('/addJob', function (req, res, next) {
 res.render('newjob.hbs', {

 });
 });
 */

//Routing for joblist.hbs
router.get('/joblist', function (req, res, next) {
    var db = req.db;
    var collection = db.get('jobcollection');
    collection.find({}, {}, function (e, docs) {
        res.render('joblist.hbs', {
            user: req.user, "joblist": docs, message: req.flash('message')
        });
    });
});

module.exports = router;