const express = require('express');
const router = express.Router();
const ChatLog = require('../models/ChatLog');
const { auth, authorize } = require('../middleware/auth');

// @route   POST /api/chatlogs
// @desc    Create chat log
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { userMessage, botResponse, intent, confidence, isResolved, sessionId } = req.body;

    const chatLog = new ChatLog({
      user: req.userId,
      userMessage,
      botResponse,
      intent,
      confidence,
      isResolved: isResolved !== undefined ? isResolved : true,
      needsReview: confidence < 0.5 || !isResolved,
      sessionId
    });

    await chatLog.save();
    res.status(201).json(chatLog);
  } catch (error) {
    console.error('Error creating chat log:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/chatlogs
// @desc    Get chat logs
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'admin') {
      const { needsReview } = req.query;
      if (needsReview) {
        query.needsReview = needsReview === 'true';
      }
    } else {
      query.user = req.userId;
    }

    const chatLogs = await ChatLog.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(chatLogs);
  } catch (error) {
    console.error('Error fetching chat logs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/chatlogs/:id/review
// @desc    Mark chat log as reviewed
// @access  Private (Admin)
router.put('/:id/review', auth, authorize('admin'), async (req, res) => {
  try {
    const chatLog = await ChatLog.findById(req.params.id);
    
    if (!chatLog) {
      return res.status(404).json({ message: 'Chat log not found' });
    }

    chatLog.needsReview = false;
    await chatLog.save();

    res.json(chatLog);
  } catch (error) {
    console.error('Error updating chat log:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/chatlogs/feedback
// @desc    Submit feedback for a chat response
// @access  Private
router.post('/feedback', auth, async (req, res) => {
  try {
    const { sessionId, feedback, message } = req.body;

    // Find the most recent chat log for this session
    const chatLog = await ChatLog.findOne({ 
      sessionId,
      user: req.userId
    }).sort({ createdAt: -1 });

    if (chatLog) {
      chatLog.feedback = feedback;
      await chatLog.save();
      
      res.json({ message: 'Feedback recorded successfully', chatLog });
    } else {
      // Create a new feedback log if original log not found
      const newLog = new ChatLog({
        user: req.userId,
        userMessage: 'Feedback submitted',
        botResponse: message || 'N/A',
        feedback,
        sessionId,
        needsReview: feedback === 'negative'
      });
      
      await newLog.save();
      res.json({ message: 'Feedback recorded successfully', chatLog: newLog });
    }
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/chatlogs/unknown
// @desc    Get unknown/low confidence queries for retraining
// @access  Private (Admin)
router.get('/unknown', auth, authorize('admin'), async (req, res) => {
  try {
    const unknownQueries = await ChatLog.find({
      $or: [
        { confidence: { $lt: 0.5 } },
        { needsReview: true },
        { feedback: 'negative' }
      ]
    })
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(unknownQueries);
  } catch (error) {
    console.error('Error fetching unknown queries:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
