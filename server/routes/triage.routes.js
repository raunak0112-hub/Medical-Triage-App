const express=require('express')
const router=express.Router()
const { GoogleGenerativeAI } =require('@google/generative-ai')
const SymptomCheck=require('../models/SymptomCheck.js')
const auth=require('../middleware/auth.middleware.js')
const { create } = require('../models/User.js')

const genAI=new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

router.post('/analyze', auth, async (req, res) => {
    try {
        const {symptoms,checkId} = req.body
        if(!symptoms ||  symptoms.trim() === ""){
            return res
                    .status(400)
                    .json({message: 'Please describe your symptoms. '})
        }

        let previousContext = "";
        let existingCheck = null;

        if (checkId) {
            existingCheck = await SymptomCheck.findById(checkId);
            if (existingCheck) {
            previousContext = `
                PREVIOUS SYMPTOMS/CONTEXT: ${existingCheck.symptoms}
                PREVIOUS AI QUESTIONS ASKED: ${existingCheck.followUpQuestions.join(', ')}
                USER'S NEW ANSWER: 
            `;
            }
        }

        const model=genAI.getGenerativeModel({
            model:"gemini-3.1-flash-lite",
            systemInstruction: "You are an expert AI medical triage assistant. Analyze the user's symptoms",
            generationConfig:{
                responseMimeType: "application/json",
                temperature: 0.1,
            }
        })


        const prompt = `
            ${previousContext}
        
            Analyze the following symptoms: "${symptoms}"
    
            You MUST output a JSON object that exactly matches this structure and add emergency number of India if needed:
            {
                "urgencyLevel": "low", // MUST be exactly one of: "low", "medium", "high", "emergency"
                "possibleConditions": ["Condition 1", "Condition 2"],
                "recommendedAction": "A clear, actionable recommendation",
                "followUpQuestions": ["Question 1?", "Question 2?"]
            }`

        const result= await model.generateContent(prompt);
        if (!result.response.candidates || result.response.candidates[0].finishReason === 'SAFETY') {
            return res.status(400).json({ message: 'The AI declined to process this request due to medical safety guidelines.' });
        }
        let responseText= result.response.text();
        responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        const aiAssessment= JSON.parse(responseText)


        //Force lowercase on the urgency level to prevent Mongoose Validation Errors
        const safeUrgencyLevel = aiAssessment.urgencyLevel ? aiAssessment.urgencyLevel.toLowerCase() : "medium";
        if (existingCheck) {
            //existing database record
            existingCheck.symptoms = existingCheck.symptoms + " | Follow-up: " + symptoms;
            existingCheck.urgencyLevel = safeUrgencyLevel;
            existingCheck.possibleConditions = aiAssessment.possibleConditions;
            existingCheck.recommendedAction = aiAssessment.recommendedAction;
            existingCheck.followUpQuestions = aiAssessment.followUpQuestions;
            
            await existingCheck.save();
            
            // Send back assessment + the existing ID
            return res.json({ ...aiAssessment, _id: existingCheck._id });
        } 
        else {
            // CREATE new database record
            const newCheck = new SymptomCheck({
                userId: req.user.id,
                symptoms: symptoms,
                urgencyLevel: safeUrgencyLevel,
                possibleConditions: aiAssessment.possibleConditions,
                recommendedAction: aiAssessment.recommendedAction,
                followUpQuestions: aiAssessment.followUpQuestions
            });
        await newCheck.save();

        //send data back to frontend 
        return res.json({ ...aiAssessment, _id: newCheck._id });
        }
    } 
    catch (err){
        // Log the full error to your Node terminal so you can see EXACTLY what failed
        console.error('🚨 Triage Error Trace:', err);
        if(err instanceof SyntaxError) {
            return res
            .status(500)
            .json({ message: 'AI returned malformed data. Please try again.' });
        }
        // If Mongoose throws a validation error, send it to the frontend
        if (err.name === 'ValidationError') {
            return res
            .status(400)
            .json({ message: 'Database validation failed.', details: err.message });
        }
        res
        .status(500)
        .json({ message: 'Server Error', error: err.message });
    }
});

//history 
router.get('/history',auth, async(req,res)=>{
    try {
        const history= await SymptomCheck.find({
            userId: req.user.id
        })
        .sort({createdAt: -1})
        res.json(history);
    } 
    catch(err){
        console.error(err.message)
        res.status(500).send('Server Error')
    }
})

module.exports=router;