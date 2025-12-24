const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const mongoose = require('mongoose');

// Helper function to check if users have appointments together
const checkAppointmentRelation = async (userId1, userId2) => {
  try {
    // Check if there's an appointment between these users
    const appointment = await Appointment.findOne({
      $or: [
        { patient: userId1, doctor: userId2 },
        { patient: userId2, doctor: userId1 }
      ]
    });
    
    return !!appointment; // Returns true if appointment exists
  } catch (error) {
    console.error('Error checking appointment relation:', error);
    return false;
  }
};

// @route   GET /api/chat/messages/:userId
// @desc    Get chat messages between current user and another user
// @access  Private
router.get('/messages/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if users have appointment relationship
    const hasAppointment = await checkAppointmentRelation(req.userId, userId);
    if (!hasAppointment) {
      return res.status(403).json({ 
        message: 'Access denied. You can only chat with doctors/patients you have appointments with.' 
      });
    }
    
    const messages = await ChatMessage.find({
      $or: [
        { senderId: req.userId, receiverId: userId },
        { senderId: userId, receiverId: req.userId }
      ]
    }).sort({ timestamp: 1 });
    
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/chat/send
// @desc    Send a chat message
// @access  Private
router.post('/send', auth, async (req, res) => {
  try {
    const { receiverId, message, senderName, receiverName } = req.body;
    
    if (!receiverId || !message) {
      return res.status(400).json({ message: 'Receiver ID and message are required' });
    }
    
    // Check if users have appointment relationship
    const hasAppointment = await checkAppointmentRelation(req.userId, receiverId);
    if (!hasAppointment) {
      return res.status(403).json({ 
        message: 'Access denied. You can only send messages to doctors/patients you have appointments with.' 
      });
    }
    
    const chatMessage = new ChatMessage({
      senderId: req.userId,
      receiverId,
      message,
      senderName: senderName || 'User',
      receiverName: receiverName || 'User',
      timestamp: new Date(),
      read: false,
      delivered: true
    });
    
    await chatMessage.save();
    
    res.status(201).json(chatMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/chat/mark-read/:messageId
// @desc    Mark a message as read
// @access  Private
router.put('/mark-read/:messageId', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await ChatMessage.findByIdAndUpdate(
      messageId,
      { read: true, readAt: new Date() },
      { new: true }
    );
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    res.json(message);
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/chat/mark-all-read/:userId
// @desc    Mark all messages from a user as read
// @access  Private
router.put('/mark-all-read/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if users have appointment relationship
    const hasAppointment = await checkAppointmentRelation(req.userId, userId);
    if (!hasAppointment) {
      return res.status(403).json({ 
        message: 'Access denied. You can only mark messages as read from doctors/patients you have appointments with.' 
      });
    }
    
    await ChatMessage.updateMany(
      { senderId: userId, receiverId: req.userId, read: false },
      { read: true, readAt: new Date() }
    );
    
    res.json({ message: 'All messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/chat/conversations
// @desc    Get all conversations for current user
// @access  Private
router.get('/conversations', auth, async (req, res) => {
  try {
    // Convert userId to ObjectId for proper comparison in aggregation
    const userObjectId = new mongoose.Types.ObjectId(req.userId);
    
    console.log('Getting conversations for userId:', req.userId, 'as ObjectId:', userObjectId);
    
    const conversations = await ChatMessage.aggregate([
      {
        $match: {
          $or: [
            { senderId: userObjectId },
            { receiverId: userObjectId }
          ]
        }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', userObjectId] },
              '$receiverId',
              '$senderId'
            ]
          },
          lastMessage: { $first: '$message' },
          lastMessageTime: { $first: '$timestamp' },
          otherUserName: {
            $first: {
              $cond: [
                { $eq: ['$senderId', userObjectId] },
                '$receiverName',
                '$senderName'
              ]
            }
          }
        }
      },
      {
        $sort: { lastMessageTime: -1 }
      }
    ]);
    
    console.log('Found', conversations.length, 'conversations from aggregation');
    
    // Filter conversations to only include users with appointment relationships
    const validConversations = [];
    for (const conversation of conversations) {
      const hasAppointment = await checkAppointmentRelation(req.userId, conversation._id);
      console.log('Checking appointment for conversation with:', conversation._id, '- has appointment:', hasAppointment);
      if (hasAppointment) {
        validConversations.push(conversation);
      }
    }
    
    console.log('Returning', validConversations.length, 'valid conversations');
    
    res.json(validConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/chat/conversation/:userId
// @desc    Delete conversation with a user
// @access  Private
router.delete('/conversation/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    await ChatMessage.deleteMany({
      $or: [
        { senderId: req.userId, receiverId: userId },
        { senderId: userId, receiverId: req.userId }
      ]
    });
    
    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
