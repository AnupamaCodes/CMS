const express = require('express');
const router = express.Router();
const User = require('../models/users');
const multer = require('multer'); // handlr uploads
const path = require('path'); ///
const fs = require('fs');

//image upload
const storage = multer.diskStorage({
    destination : function(req,file,cb){  ////req: The HTTP request object.
       // file: The file object containing information about the uploaded file.
        //cb: A callback function that should be called once the file name is determined. It follows the Node.js convention of (error, filename).
        cb(null, './uploads');
    },
   filename: function(req,file,cb) {
    const uniqueSuffix = Date.now()+ '-' + Math.round(Math.random()*1E9);  //unniquesuffic concatenated with a random number generated using Math.random() and rounded to the nearest billion 
    const ext = path.extname(file.originalname); //extract
    cb(null, file.fieldname+ '-'+uniqueSuffix+ext);
   }
});
 ///Multer configuration
const upload = multer({
    storage : storage,
    ///Optional : Limit file Types(e.g, allow only immages)
    fileFilter:function(req,file,cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'),false);
        }
        cb(null, true);

    }
});

//Insert an user into database user
router.post('/add', upload.single('image'), (req, res) => {
    // Check if req.file is defined (i.e., file was uploaded)
    if (!req.file) {
        req.session.message = { message: 'Please upload an image!', type: 'danger' };
        return res.redirect('/add');
    }

      // Access the uploaded file via req.file
      const user = new User({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        image: req.file.filename,

});

user.save()
        .then(() => {
            req.session.message = { message: 'User added successfully!', type: 'success' };
            res.redirect('/'); // Redirect to home page or any other appropriate route
        })
        .catch((err) => {
            // Handle error properly
            console.error(err);
            req.session.message = { message: err.message, type: 'danger' };
            res.redirect('/add'); // Redirect back to add user page
        });
});
// Serve uploaded images statically
router.use('/uploads', express.static('uploads'));




router.get("/",(req,res)=>{
    User.find()
        .then(users => {
            res.render('index', { title: 'Home Page', users: users });
        })
        .catch(err => {
            res.json({ message: err.message });
        });

});
router.get("/add",(req,res)=>{
    res.render("add_users",{title:"Add Users"});
});

 // Edit an user route
 router.get("/edit/:id", (req,res)=>{
    let id = req.params.id;
    User.findById(id)
        .then(user => {
            if (!user) {
                res.redirect("/");
            } else {
                res.render("edit_user", {
                    title: "Edit User",
                    user: user
                });
            }
        })
        .catch(err => {
            console.error(err);
            res.redirect("/");
        });

        }
    );
 

 //update user route 
 router.post('/update/:id',upload.single('image'),(req,res)=>{ ///defines a POST route with a parameter id.,Middleware:, It seems like it's handling file uploads and storing them in a directory called "uploads".
    let id = req.params.id;  /// This line extracts the id parameter from the request URL.
    let new_image = '';
 
    if(req.file){  /// condition checks if a file was uploaded.
        new_image = req.file.filename;
        try {
            fs.unlinkSync("./uploads/"+req.body.old_image); //This line attempts to delete the old image file synchronously using fs.unlinkSync. It uses req.body.old_image to get the filename of the old image. If a new image is uploaded, it's assumed that there's an old image to delete.
        }
        catch(err){
            console.log(err);
        }
    } else { //If no file was uploaded, this block executes.
        new_image = req.body.old_image; // //In this case, new_image is set to the filename of the old image, as it's assumed that the request does not include a new image to upload.
    }

    User.findByIdAndUpdate(id, {
        name : req.body.name,
        email : req.body.email,
        phone: req.body.phone,
        image: new_image,
    })
    .then((user)=>{
        req.session.message = { /// It sets a message in the session object to be displayed to the user on the next page load.
            type : 'success',
            message : "user updated successfully",
        };
        res.redirect('/');
    })
    .catch((err)=>{
      res.json({messgae:err.messgae,type:'danger'});
    });
    });
    //Server uploaded images statically
    router.use('/uploads', express.static('uploads'));/// is a middleware setup in Express that serves static files from the directory specified.  defines a middleware that will be triggered for any request that starts with /uploads./This means any file stored in the 'uploads' directory can be accessed via HTTP requests.

    //Delete user route
router.get('/delete/:id', (req, res) => {   //defines a route for handling GET requests to delete a user by their ID.                        
    let id = req.params.id; // id is declared here

    // Find the user by ID to get the image filename
    User.findById(id)
        .then(user => {
            if (!user) { // If the user is not found, it sets an error message in the session object and redirects the user to the home page.
                // User not found, redirect with an error message
                req.session.message = { message: 'User not found!', type: 'danger' };
                res.redirect('/');
            } else {
                // Delete the user from the database
                User.findByIdAndDelete(id) // id should be accessible here /: It attempts to find a user in the database with the given id.
                    .then(() => {
                        // Delete the image file from the uploads folder
                        const imagePath = path.join(__dirname, '../uploads', user.image); //It constructs the path to the image file associated with the user.
                        fs.unlink(imagePath, (err) => { // It attempts to delete the image file from the file system. If successful, it sets a success message in the session object and redirects the user to the home page. If an error occurs, it logs the error.
                            if (err) {
                                console.error('Error deleting image file:', err);
                            } else {
                                console.log('Image file deleted successfully');
                            }
                        });

                        // Set success message and redirect to home page
                        req.session.message = { message: 'User deleted successfully!', type: 'success' };
                        res.redirect('/');
                    })
                    .catch((err) => {
                        console.error('Error deleting user:', err);
                        req.session.message = { message: err.message, type: 'danger' };
                        res.redirect('/'); // Redirect back to home page with an error message
                    });
            }
        })
        .catch(err => {
            console.error('Error finding user:', err);
            req.session.message = { message: err.message, type: 'danger' };
            res.redirect('/');
        });
});





module.exports = router;