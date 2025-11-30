// routes/webhooks.js
router.post('/webhooks/application-status', async (req, res) => {
  const { applicationId, status, remarks } = req.body;
  
  try {
    const application = await Application.findOne({ applicationId })
      .populate('user')
      .populate('scheme');
    
    if (application) {
      // Update application status
      await Application.findByIdAndUpdate(application._id, {
        status,
        reviewComments: remarks,
        reviewedAt: new Date()
      });
      
      // Send real-time notification
      await NotificationService.sendNotification(application.user, {
        type: `application_${status}`,
        variables: {
          schemeName: application.scheme.name,
          applicationId: application.applicationId
        }
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false });
  }
});