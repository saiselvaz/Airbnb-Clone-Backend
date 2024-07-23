const UserSchema = require('../mongodb/models/UserSchema')
const PlaceSchema = require('../mongodb/models/PlaceSchema')
const BookingSchema = require('../mongodb/models/BookingSchema')
const bcrypt = require('bcrypt')
const express = require('express')
const router = express.Router()
const imageDownloader = require('image-downloader')
const path = require('path');
const multer = require('multer');
const fs = require('fs');


router.get("/", (req, res) => {
  res.json("Hello World");
})

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body

  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, Password and email are required' })


  const user = await UserSchema.findOne({ email }) // finding user in db
  if (user) return res.status(400).json({ error: 'User already exists' })

  const newUser = new UserSchema({ name, email, password })
  // hasing the password
  bcrypt.hash(password, 10, async (err, hash) => {
    if (err)
      return res.status(400).json({ error: 'error while saving the password' });

    newUser.password = hash
    const savedUserRes = await newUser.save();

    if (savedUserRes)
      return res.status(200).json({ message: 'User is successfully saved' })
  })
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).json({ error: 'Something missing' })
  }
  try {


    const user = await UserSchema.findOne({ email: email }) // finding user in db
    if (!user) {
      return res.status(400).json({ error: 'User not found' })
    }

    const matchPassword = await bcrypt.compare(password, user.password)
    if (matchPassword) {
      const userSession = { email: user.email, name: user.name } // creating user session to keep user loggedin also on refresh
      req.session.user = userSession // attach user session to session object from express-session

      return res
        .status(200)
        .json({ msg: 'You have logged in successfully', userSession }) // attach user session id to the response. It will be transfer in the cookies
    } else {
      return res.status(401).json({ error: 'Invalid credential' })
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred');
  }
})

router.get('/isAuth',(req, res) => {
  try {
    if (req.session.user) {
      res.json(req.session.user);
    } else {
      //401 error user not logged in 
      res.json('Unauthorized');
     
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
})


router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error(err);
      res.status(500).send('An error occurred');
    } else {
      res.send('Logged out successfully');
    }
  });
})


router.post('/upload-by-link', async (req, res) => {
  const { link } = req.body;
  console.log(link);
  if (link !== undefined) {
    const newName = 'photo' + Date.now() + '.jpg';
    await imageDownloader.image({
      url: link,
      dest: path.join(__dirname, '../uploads/', newName)
    });

    res.json(newName);

  } else {
    res.status(400).json('please enter a valid link');
  }

})

const photoMiddleware = multer({ dest: 'uploads/' });
router.post('/upload', photoMiddleware.array('photos', 100), (req, res) => {
  const uploadedFiles = [];
  // console.log(req.files);
  for (let i = 0; i < req.files.length; i++) {
    const { path, originalname } = req.files[i];
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];
    const newPath = path + '.' + ext;
    fs.renameSync(path, newPath);
    uploadedFiles.push(newPath.replace('uploads/', ''));
  }
  res.json(uploadedFiles);
})


router.post('/places', async (req, res) => {
  try {
    const userEmail = req.session.user.email;
    const userData = await UserSchema.findOne({ email: userEmail });
    const userId = userData.id;
    const placeObj = req.body;

    if (placeObj === {}) {
      return res.status(400).json({ message: 'Place object is empty.' });
    }

    const {
      title, address, addedPhotos, description,
      perks, extraInfo, checkIn, checkOut, maxGuests, price
    } = placeObj;

    const newPlace = new PlaceSchema({
      owner: userId,
      title, address, photos: addedPhotos, description,
      perks, extraInfo, checkIn, checkOut, maxGuests, price
    });

    const savedPlaceRes = await newPlace.save();

    if (savedPlaceRes)
      return res.status(200).json({ message: 'Place is successfully saved', savedPlace: savedPlaceRes });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Failed to create place.' });
  }


})

router.get('/user-places', async (req, res) => {

  const userEmail = req.session.user.email;
  const userData = await UserSchema.findOne({ email: userEmail });
  const { id } = userData;
  res.json(await PlaceSchema.find({ owner: id }));

})

router.get('/places/:id', async (req, res) => {
  try {
    const { id } = req.params;
    res.json(await PlaceSchema.findById(id));

  } catch (error) {
    console.log(error);
    res.status(500).json('not connected!');

  }
})


router.put('/places', async (req, res) => {
  try {
    const userEmail = req.session.user.email;
    const userData = await UserSchema.findOne({ email: userEmail });
    const placeObj = req.body;
    const {
      id, title, address, addedPhotos, description,
      perks, extraInfo, checkIn, checkOut, maxGuests, price
    } = placeObj;

    const placeDoc = await PlaceSchema.findById(id);


    if (userData.id === placeDoc.owner.toString()) {

      placeDoc.set({

        title, address, photos: addedPhotos, description,
        perks, extraInfo, checkIn, checkOut, maxGuests, price
      });

      const savedPlaceRes = await placeDoc.save();

      if (savedPlaceRes)
        return res.status(200).json('ok');

    }

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Failed to update place.' });
  }

})

router.get('/places', async (req, res) => {
  res.json(await PlaceSchema.find());
})

router.post('/bookings', async (req, res) => {
  try {

    const userEmail = req.session.user.email;
    const userData = await UserSchema.findOne({ email: userEmail });
    const {
      place, checkIn, checkOut, numberOfGuests, name, phone, price,
    } = req.body;

    const newBooking = new BookingSchema({
      place, checkIn, checkOut, numberOfGuests, name, phone, price,
      user: userData.id,
    });

    const savedBookingRes = await newBooking.save();

    if (savedBookingRes)
      return res.status(200).json(savedBookingRes);



  } catch (error) {
    console.log(error);
    res.status(500).json('Error while booking!');
  }
})



router.get('/bookings', async (req, res) => {
  try {
    const userEmail = req.session.user.email;
    const userData = await UserSchema.findOne({ email: userEmail });
    const bookings = await BookingSchema.find({ user: userData.id }).populate('place');
    res.json(bookings);
  } catch (error) {
    console.log(error);
    res.status(500).json('Error while showing bookings!');
  }
})

module.exports = router