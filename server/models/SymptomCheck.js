const mongoose = require('mongoose');

const symptomCheckSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  symptoms: { 
    type: String, 
    required: true 
  },
  urgencyLevel: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'emergency'],
    required: true
  },
  possibleConditions: [String],
  recommendedAction: String,
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  followUpQuestions: [String],
    },
    { 
        timestamps: true 
    }
);

module.exports = mongoose.model('SymptomCheck', symptomCheckSchema);