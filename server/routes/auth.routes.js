const express=require('express')
const router=express.Router();
const bcrypt=require('bcryptjs')
const jwt=require('jsonwebtoken')
const User=require('../models/User.js')
const validator = require("validator");
//register
router.post('/register',(async (req,res)=>{
    try {
        const {name,email,password}=req.body;
        if(!password){
            return res
                    .status(400)
                    .json({message: 'Please enter the password'})
        }

        if(!email){
            return res
                    .status(400)
                    .json({message: 'Please enter the email'})
        }
        if(!name){
            return res
                .status(400)
                .json({message: 'Please enter the name'})
        }
        //verify if email is in email format
        if (!validator.isEmail(email)) {
            return res
            .status(400)
            .json({message: "Please enter a valid email"});
        }
        const normalizedEmail = email.toLowerCase().trim();
        let user=await User.findOne({email:normalizedEmail});
        if(user){
            return res
                .status(400)
                .json({
                    message: "User already exists"
                })
        }
        //hash password 
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        user = new User({
            name,
            email:normalizedEmail,
            passwordHash,
        });

        await user.save();

        //Genterating JWT
        const payload={user:{id: user.id}}
        const token=jwt.sign(payload,process.env.JWT_SECRET,{expiresIn: '1h'})
        return res
            .status(201)
            .json(
                {
                    token,
                    user:{
                        id:user.id,
                        name:user.name,
                        email: user.email
                    }
                }
            )
    }
    catch (err) {
        console.error(err)
        return res
            .status(500)
            .send("Server Error")
    }
}))

//login
router.post('/login',async (req,res)=>{
    try {
        const {email,password}=req.body;
        if(!password){
            return res
                    .status(400)
                    .json({message: 'Please enter the password'})
        }

        if(!email){
            return res
                    .status(400)
                    .json({message: 'Please enter the email'})
        }

        if (!validator.isEmail(email)) {
            return res
            .status(400)
            .json({message: "Please enter a valid email"});
        }
        const normalizedEmail = email.toLowerCase().trim();

        const user=await User.findOne({email:normalizedEmail})
        if(!user){
            return res
                    .status(400)
                    .json({message:'Invalid credentials '})
        }

        //validating pass
        const isMatch= await bcrypt.compare(password, user.passwordHash);
        if(!isMatch){
            return res
                    .status(400)
                    .json({message: `Invalid credentials ` })
        }

        //generate jwt
        const payload={user:{id:user.id}};
        const token=jwt.sign(payload,process.env.JWT_SECRET, {expiresIn: '1h'})

        return res
            .json(
                {
                    token,
                    user: {
                        id:user.id,
                        name: user.name,
                        email: user.email
                    }
                }
            )
    }
    catch (err){
        console.error(err);
        return res
            .status(500)
            .send('Server Error')
    }
})

module.exports=router;