// services/chatbotService.js
class ChatbotService {
  static async handleMessage(userId, message, language = 'ta') {
    // Connect to Rasa chatbot
    const response = await axios.post('http://localhost:5005/webhooks/rest/webhook', {
      sender: userId,
      message: message,
      metadata: { language }
    });
    
    return response.data;
  }
  
  static async startApplicationFlow(userId, schemeId) {
    // Initialize application chatbot session
    const scheme = await Scheme.findById(schemeId);
    const user = await User.findById(userId);
    
    return {
      step: 'verify_info',
      message: `Shall we start your ${scheme.name} application? I'll help you fill the form.`,
      data: {
        scheme: scheme._id,
        prefillData: this.prefillUserData(user)
      }
    };
  }
}