var express = require('express');
var router = express.Router();
var fs = require('fs');
var passport = require('passport');
var path = require('path');
var User = require('../models/user');
var Feedback = require('../models/feedback');
var Message = require('../models/message');
var Image = require('../models/image');
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
    User.find({role: 'organization'}).sort({datecreated: -1}).limit(6).exec(function (err, orgsDocs) {
        
        orgsDocs = orgsDocs.map(function (item) {
            item.description = item.description.length<280?item.description: item.description.slice(0, 280);
            if(item.description.length===280){
                item.description = item.description + '...';
            }
            return item;
        });
        Feedback
          .find({})
          .sort({datecreated: -1})
          .limit(3).populate('recipient_id','username displayname')
          .exec(function (err, feedbackDocs) {
            feedbackDocs = feedbackDocs.map(function (feedback) {
                feedback.content = feedback.content.length<280?feedback.content:feedback.content.slice(0, 280);
                if(feedback.content.length===280){
                    feedback.content = feedback.content + '...';
                }
                return feedback;
            });
            res.render('index.hbs', {user: req.user, orgsfeatured: orgsDocs, feedbackfeatured: feedbackDocs, message: req.flash('message'),auth: req.flash('auth')});
        });
    });

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
        .populate({path: 'image_ids',options:{sort:{dateCreated:-1}}})
        .populate({path: 'feedbackreceived_ids', options: {sort: {datecreated: -1}}})
        .exec(function (err, docs) {

            Feedback.populate(docs, {path: 'feedbackreceived_ids.sender_id', select: 'username displayname profileimg', model: 'User'}, function (err, updatedDocs) {
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

//Dashboard
router.get('/dashboard', isAuthenticated, function (req, res, next) {
    User.findById(req.user.id)
        .populate({path:'image_ids',options:{sort: {dateCreated:-1}}})
        .exec(function (e, docs) {             //Necessary? Just use req.user instead?
        res.render('dashboard.hbs', {
            user: req.user, userDetails: docs
        });
    });
});

//Update user from within dashboard
router.post('/addimages',
    upload.array('file',12),
    function(req, res, next){
        var imageArray = req.files;
        imageArray = imageArray.map(function(currentValue,index,array){
            currentValue._id = mongoose.Types.ObjectId();
            currentValue.user_id = req.user.id;
            currentValue.dateCreated = Date.now();
            return currentValue;
        });
        Image.create(imageArray, function(err,images){
                var imageIdArray = [];
                for(var i=0; i<images.length; i++){
                    imageIdArray.push(images[i]._id);
                }
                User.findByIdAndUpdate(req.user.id, {$pushAll: {image_ids:imageIdArray}},{upsert:true}, function(err, docs){
                    res.redirect('/dashboard');
                });
            });
    });

router.post('/removeimage', function(req, res, next){
    Image.findOne({_id:req.body.imageId})
        .exec(function(err, response){
            User.findOne({_id:req.user._id}, function(err, user){
                var imageIndex = user.image_ids.indexOf(req.body.imageId);
                user.image_ids.splice(imageIndex,1);
                user.save();
                fs.unlink(response.destination + response.filename);
                response.remove();
                res.end();
          });
    });
});

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
router.route('/messages')
    .get(isAuthenticated, function(req,res,next){    //Note: messages.hbs relies on 'replyUser' and 'messages' handlebars helpers defined at the top of index.js
        User.findOne({username:req.query.username}, function(err,recipientDocs){
            if(err){
                console.log("error in GET: /messages");
            }
            User.findById(req.user._id)
                .populate({path:'message_ids', options: {sort: {datecreated: -1}}})
                .exec(function(err,userDocs){
                    Message.populate(userDocs,{path:'message_ids.sender_id', select:'username displayname profileimg', model:'User'},function(err, updatedUserDocs){
                        res.render('messages.hbs', {
                            user: updatedUserDocs, query: req.query, receivingUser:recipientDocs
                        });
                    })
                });
        });
    })
    .post(function(req,res,next){
        var messageStringTitle = typeof req.body.originatingTitle !== 'undefined'&&req.body.originatingTitle !== ''?req.body.originatingTitle:req.body.messageTitle;    //checks to see if query parameter defined for originating title, if not sets message title to originating title (starts new message string)
        
        var newMessage = {
            _id: mongoose.Types.ObjectId(),
            sender_id: req.user._id,
            recipientUser: req.body.messageUser,
            originatingTitle: messageStringTitle,
            title: req.body.messageTitle,
            content: req.body.messageContent,
            dateCreated: new Date()
        };

        if(typeof req.body.originatingTitle === 'undefined' || req.body.originatingTitle === ''){
            newMessage.originatingId = Math.floor(Math.random()*10e6);
        }else{
            newMessage.originatingId = req.body.originatingId;
        }

        Message.create(newMessage);
        User.update({$or:[{'username': req.body.messageUser},{_id:req.user._id}]}, {$push:{message_ids: newMessage._id}}, {upsert:true, multi:true}, function(err,docs){});

        next();
    }, function(req,res,next){
        res.redirect(req.url + '?username=' + req.body.messageUser + '&originatingTitle=' + req.body.originatingTitle + '&originatingId=' + req.body.originatingId);
    });


//Feedback
router.route('/feedback')
    .post(function(req,res,next){
        var newFeedback = {
            _id: mongoose.Types.ObjectId(),
            sender_id: req.user._id,
            recipient_id: req.body.feedbackid,
            content: req.body.messageContent,
            datecreated: new Date()
        };

        Feedback.create(newFeedback);
        User.findByIdAndUpdate(req.user._id, {$push:{feedbacksent_ids: newFeedback._id}},{upsert:true}, function(err,docs){
        });
        User.findByIdAndUpdate(req.body.feedbackid, {$push:{feedbackreceived_ids: newFeedback._id}},{upsert:true}, function(err,docs){
        });
        next();
    }, function(req,res,next){
        res.redirect('/userprofile/' + req.body.feedbackuser/* + '&originatingTitle=' + req.body.originatingTitle*/);
    });


module.exports = router;