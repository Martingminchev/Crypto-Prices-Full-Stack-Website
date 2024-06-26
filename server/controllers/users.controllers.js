const User = require("../models/users.models");
const argon2 = require("argon2"); //https://github.com/ranisalt/node-argon2/wiki/Options
const jwt = require("jsonwebtoken");
const validator = require("validator");
const jwt_secret = process.env.JWT_SECRET;
// the client is sending this body object
//  {
//     email: form.email,
//     password: form.password,
//     password2: form.password2
//  }
const register = async (req, res) => {
  // this salt can be truly random with one of available npm packages
  const salt = "321dsa";
  const { email, password, password2 } = req.body;
  if (!email || !password || !password2) {
    return res.json({ ok: false, message: "All fields required" });
  }
  if (password !== password2) {
    return res.json({ ok: false, message: "Passwords must match" });
  }
  if (!validator.isEmail(email)) {
    return res.json({ ok: false, message: "Invalid email" });
  }
  try {
    const user = await User.findOne({ email });
    if (user) return res.json({ ok: false, message: "User exists!" });
    const hash = await argon2.hash(password, salt);
    // not salted, salt is appending a random string to a password to strengthen the hash
    const hash2 = await argon2.hash(password);
    // we cna see that hashes for salted and unsalted are different
    console.log("hash ==>", hash);
    console.log("hash2 ==>", hash2);
    const newUser = {
      email,
      password: hash,
    };
    await User.create(newUser);
    res.json({ ok: true, message: "Successfully registered" });
  } catch (error) {
    console.log(error);
    res.json({ ok: false, error });
  }
};
// the client is sending this body object
//  {
//     email: form.email,
//     password: form.password
//  }
const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.json({ ok: false, message: "All fields are required" });
  }
  if (!validator.isEmail(email)) {
    return res.json({ ok: false, message: "Invalid email provided" });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) return res.json({ ok: false, message: "Invalid user provided" });
    const match = await argon2.verify(user.password, password);
    if (match) {
      // once user is verified and confirmed we send back the token to keep in localStorage in the client and in this token we can add some data -- payload -- to retrieve from the token in the client and see, for example, which user is logged in exactly. The payload would be the first argument in .sign() method. In the following example we are sending an object with key userEmail and the value of email coming from the "user" found in line 47
      const token = jwt.sign({ userEmail: user.email }, jwt_secret, {
        expiresIn:'365d',
      }); //{expiresIn:'365d'}
      // after we send the payload to the client you can see how to get it in the client's Login component inside handleSubmit function
      res.json({ ok: true, message: "Successfully logged in.", token, user });
    } else return res.json({ ok: false, message: "Invalid data provided" });
  } catch (error) {
    res.json({ ok: false, error });
  }
};

const verify_token = (req, res) => {
  console.log(req.headers.authorization);
  const token = req.headers.authorization;
  jwt.verify(token, jwt_secret, (err, succ) => {
    err
      ? res.json({ ok: false, message: "Token is corrupted" })
      : res.json({ ok: true, succ });
  });
};

const add_to_watchlist = async (req, res) => {
  const { email, item } = req.body; 
  if (!email || !item) {
    return res.json({ ok: false, message: "All fields are required" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) return res.json({ ok: false, message: "Invalid user provided" });

    if(!user.watchlist.includes(item)){
    user.watchlist.push(item);
    await user.save();

    res.json({ ok: true, message: `${item} added to watchlist` , watchlist: user.watchlist });}

     else if(user.watchlist.includes(item)){
      res.json({ ok: true, message: `${item} already exists in your watchlist`, watchlist: user.watchlist });}
     }


   catch (error) {
    console.log(error);
    res.json({ ok: false, error });
  }
};

const remove_from_watchlist = async (req, res) => {
  const { email, item } = req.body; 
  if (!email || !item) {
    return res.json({ ok: false, message: "All fields are required" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) return res.json({ ok: false, message: "Invalid user provided" });

    if(user.watchlist.includes(item)){
      const index = user.watchlist.indexOf(item);
      user.watchlist.splice(index, 1);
      await user.save();

      res.json({ ok: true, message: `${item} removed from watchlist` , watchlist: user.watchlist });
    }

    else if(!user.watchlist.includes(item)){
      res.json({ ok: true, message: `${item} is not on your watchlist.`, watchlist: user.watchlist });
    }
  }

  catch (error) {
    console.log(error);
    res.json({ ok: false, error });
  }
};


const get_watchlist = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.json({ ok: false, message: "Email is required" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) return res.json({ ok: false, message: "Invalid user provided" });

    res.json({ ok: true, message: "Watchlist fetched successfully", watchlist: user.watchlist });
  } catch (error) {
    console.log(error);
    res.json({ ok: false, error });
  }
};


module.exports = { register, login, verify_token, add_to_watchlist, remove_from_watchlist, get_watchlist };
