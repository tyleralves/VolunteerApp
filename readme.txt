Preview deployed app at:
https://stormy-eyrie-32571.herokuapp.com/

COMPLETE:
Databases(2):
    1. Users
        a. Volunteers:
            - Dashboard
                + User Profile Page
                + Favorite postings
                + Private Messaging
        b. Organizations
            - Dashboard
                + Org Profile Page
                + Private Messaging
    2. Messages
    3. Feedback

Views:
    1. Index
        + Make description snippet more readable in newest organizations slider
        + Display feedback in slider
    2. Profile
        + Feedback score
        + Feedback
        + User Images
    3. Dashboard (each component is a panel)
        + Universal Components
            - Private Messages
            - My images
                *Image upload
                    + Up to 5 images
                    + all user images combined must be less than 10 mb
                    + crop to same size
    4. Messages
        + Document limit per page, and PAGINATION
    5. Feedback
    6. General
        + Prevent users from doing certain actions to their own account
            - leaving feedback
            - sending messages?
        + Prevent same user from leaving feedback multiple times to another user


StartUp:
Mongo Executables:
cd C:\program files\mongodb\server\3.2\bin

Local mongo server (now using MongoLab database):
mongod --dbpath C:\Users\Tyler\WebstormProjects\volunteerApp\data

Access MongoLab mongoDB terminal:
mongo ds019668.mlab.com:19668/heroku_67dwl1k0 -u <dbuser> -p <dbpassword>

Update Heroku:
git push heroku master
