/**
 * Created by Tyler on 1/8/2016.
 */
var express = require('express');
var router = express.Router();
var passport = require('passport');
var path = require('path');
var User = require('../models/user');
var multer = require('multer');
//var readChunk = require('read-chunk');                for magic bytes implementation
//var fileType = require('file-type');                  for magic bytes implementation



Middleware = {
    //Checks whether user is logged in
    isAuthenticated: function(req,res,next){
        if(req.isAuthenticated()){
            return next();
        }
        req.flash('auth',"You do not have the proper permissions to access this page");
        res.redirect('/');
    },
    multerSetup: function(req,res,next){
        var storage = multer.diskStorage({
            destination: function (req, file, cb) {
                cb(null, './public/uploads/')
            },
            //detects file type, then adds extension to match file type
            filename: function (req, file, cb) {
                var ext = "";
                switch(file.mimetype){
                    case 'image/png':
                        ext = '.png';
                        break;
                    case 'image/jpeg':
                        ext = '.jpeg';
                        break;
                    default:
                        ext = '';
                }
                cb(null, Date.now() + ext); //Appending .jpg
            }
        });


        var upload = multer({storage:storage, fileFilter: function (req, file, cb) {
            var acceptedExt = ['.png','.jpg','.gif','.bmp'];
            if (req.hasOwnProperty('file') && acceptedExt.indexOf(path.extname(file.originalname))=== -1) {
                return cb(new Error('Image type not allowed: ' + path.extname(file.originalname)));
            }

            cb(null, true)
        }});

        return upload;
     }

};

module.exports = Middleware;