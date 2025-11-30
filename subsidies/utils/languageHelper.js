const languageStrings = {
  en: {
    // Authentication
    'auth.register.success': 'User registered successfully! 🎉',
    'auth.login.success': 'Login successful! ✅',
    'auth.login.invalid_credentials': 'Invalid email or password',
    'auth.token.missing': 'No token provided. Please login first.',
    'auth.token.invalid': 'Invalid or expired token',
    'auth.user.not_found': 'User not found',
    
    // Validation
    'validation.required_fields': 'Please provide all required fields: {fields}',
    'validation.email.registered': 'Email already registered',
    'validation.phone.registered': 'Phone number already registered',
    
    // Applications
    'application.submit.success': 'Application submitted successfully! 📝',
    'application.submit.duplicate': 'You have already applied for this scheme',
    'application.not_found': 'Application not found',
    
    // Schemes
    'scheme.add.success': 'Scheme added successfully! 🎉',
    'scheme.update.success': 'Scheme updated successfully! ✅',
    'scheme.delete.success': 'Scheme deleted successfully! 🗑️',
    'scheme.not_found': 'Scheme not found',
    'scheme.recommendations.found': 'Found {count} schemes you\'re eligible for! 🎯',
    'scheme.recommendations.none': 'No schemes found matching your profile. Try updating your financial profile.',
    'scheme.eligible': 'You\'re eligible for {schemeName}! Match score: {score}% 🎉',
    'scheme.not_eligible': 'You\'re not eligible for {schemeName}. {reasons}',
    
    // Users
    'user.profile.update.success': 'Profile updated successfully! ✅',
    'user.documents.update.success': 'Documents updated successfully! 📄',
    'user.kyc.verify.success': 'KYC verified successfully! ✅',
    'user.kyc.remove.success': 'KYC verification removed',
    
    // General
    'server.health': 'Server is healthy',
    'server.error': 'Something went wrong!',
    'route.not_found': 'Route not found',

    'ocr.process.success': 'Document processed successfully! 📄',
'ocr.process.failed': 'Failed to process document',
'ocr.process.multiple.success': 'Successfully processed {count} documents!',
'ocr.process.multiple.failed': 'Failed to process some documents',
'ocr.autoFill.success': 'Profile updated with {fields} fields from your documents! 🎯',
'ocr.autoFill.failed': 'Failed to auto-fill profile from documents',

'notification.application.submitted.title': 'Application Submitted ✅',
'notification.application.submitted.body': 'Your {schemeName} application has been submitted successfully!',
'notification.application.submitted.email_subject': 'Application Submitted - {schemeName}',
'notification.application.submitted.email_body': 'Dear {userName},\n\nYour application for {schemeName} has been submitted successfully.\nApplication ID: {applicationId}\nExpected processing time: {processingTime}\n\nYou can track your application status in your dashboard.',
'notification.application.submitted.sms': 'App submitted for {schemeName}. ID: {applicationId}. Track at agrovihan.com',

'notification.application.approved.title': 'Application Approved! 🎉',
'notification.application.approved.body': 'Your {schemeName} application has been approved!',
'notification.application.approved.email_subject': 'Congratulations! Your Application Approved - {schemeName}',
'notification.application.approved.email_body': 'Dear {userName},\n\nGreat news! Your application for {schemeName} has been approved.\nBenefit Amount: ₹{amount}\nNext Steps: {nextSteps}\n\nThank you for using AgroVihan.',
'notification.application.approved.sms': 'Approved! {schemeName}. ₹{amount} approved. Check email for details.',

'notification.scheme.recommendation.title': 'New Scheme Recommendations! 🎯',
'notification.scheme.recommendation.body': 'We found {count} new schemes matching your profile!',
'notification.scheme.recommendation.email_subject': '{count} New Scheme Recommendations For You',
'notification.scheme.recommendation.email_body': 'Dear {userName},\n\nBased on your profile, we found {count} government schemes you are eligible for:\n\n{schemesList}\n\nLogin to apply now!',
'notification.scheme.recommendation.sms': '{count} new schemes found! Check AgroVihan app.',

'notification.kyc.verified.title': 'KYC Verified ✅',
'notification.kyc.verified.body': 'Your KYC verification is complete! Eligibility score: {score}',
'notification.kyc.verified.email_subject': 'KYC Verification Successful',
'notification.kyc.verified.email_body': 'Dear {userName},\n\nYour KYC verification has been completed successfully.\nYour eligibility score is now: {score}\n\nYou can now apply for more schemes with higher approval chances.',
'notification.kyc.verified.sms': 'KYC verified! Score: {score}. Apply for schemes now.',

'notification.payment.disbursed.title': 'Payment Received! 💰',
'notification.payment.disbursed.body': '₹{amount} has been disbursed to your account for {schemeName}',
'notification.payment.disbursed.email_subject': 'Payment Disbursed - ₹{amount}',
'notification.payment.disbursed.email_body': 'Dear {userName},\n\nWe are pleased to inform you that ₹{amount} has been successfully disbursed to your bank account for {schemeName}.\nTransaction ID: {transactionId}\nDate: {date}\n\nThank you for being part of AgroVihan.',
'notification.payment.disbursed.sms': '₹{amount} received for {schemeName}. Txn: {transactionId}',
  },
  ta: {
    // Authentication
    'auth.register.success': 'பயனர் வெற்றிகரமாக பதிவு செய்யப்பட்டார்! 🎉',
    'auth.login.success': 'உள்நுழைவு வெற்றிகரமாக! ✅',
    'auth.login.invalid_credentials': 'தவறான மின்னஞ்சல் அல்லது கடவுச்சொல்',
    'auth.token.missing': 'டோக்கன் வழங்கப்படவில்லை. முதலில் உள்நுழையவும்.',
    'auth.token.invalid': 'தவறான அல்லது காலாவதியான டோக்கன்',
    'auth.user.not_found': 'பயனர் காணப்படவில்லை',
    
    // Validation
    'validation.required_fields': 'தேவையான அனைத்து புலங்களையும் வழங்கவும்: {fields}',
    'validation.email.registered': 'மின்னஞ்சல் ஏற்கனவே பதிவு செய்யப்பட்டது',
    'validation.phone.registered': 'தொலைபேசி எண் ஏற்கனவே பதிவு செய்யப்பட்டது',
    
    // Applications
    'application.submit.success': 'விண்ணப்பம் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது! 📝',
    'application.submit.duplicate': 'இந்த திட்டத்திற்கு நீங்கள் ஏற்கனவே விண்ணப்பித்துள்ளீர்கள்',
    'application.not_found': 'விண்ணப்பம் காணப்படவில்லை',
    
    // Schemes
    'scheme.add.success': 'திட்டம் வெற்றிகரமாக சேர்க்கப்பட்டது! 🎉',
    'scheme.update.success': 'திட்டம் வெற்றிகரமாக புதுப்பிக்கப்பட்டது! ✅',
    'scheme.delete.success': 'திட்டம் வெற்றிகரமாக நீக்கப்பட்டது! 🗑️',
    'scheme.not_found': 'திட்டம் காணப்படவில்லை',
    'scheme.recommendations.found': 'உங்களுக்கு தகுதியுள்ள {count} திட்டங்கள் கிடைத்தன! 🎯',
    'scheme.recommendations.none': 'உங்கள் சுயவிவரத்துடன் பொருந்தக்கூடிய திட்டங்கள் எதுவும் இல்லை. உங்கள் நிதி சுயவிவரத்தை புதுப்பிக்க முயற்சிக்கவும்.',
    'scheme.eligible': 'நீங்கள் {schemeName} திட்டத்திற்கு தகுதியானவர்! பொருத்தம்: {score}% 🎉',
    'scheme.not_eligible': 'நீங்கள் {schemeName} திட்டத்திற்கு தகுதியானவர் அல்ல. {reasons}',
    
    // Users
    'user.profile.update.success': 'சுயவிவரம் வெற்றிகரமாக புதுப்பிக்கப்பட்டது! ✅',
    'user.documents.update.success': 'ஆவணங்கள் வெற்றிகரமாக புதுப்பிக்கப்பட்டன! 📄',
    'user.kyc.verify.success': 'KYC வெற்றிகரமாக சரிபார்க்கப்பட்டது! ✅',
    'user.kyc.remove.success': 'KYC சரிபார்ப்பு நீக்கப்பட்டது',
    
    // General
    'server.health': 'சர்வர் ஆரோக்கியமாக உள்ளது',
    'server.error': 'ஏதோ தவறு நடந்துவிட்டது!',
    'route.not_found': 'பாதை காணப்படவில்லை',

    'ocr.process.success': 'ஆவணம் வெற்றிகரமாக செயலாக்கப்பட்டது! 📄',
'ocr.process.failed': 'ஆவணத்தை செயலாக்க முடியவில்லை',
'ocr.process.multiple.success': '{count} ஆவணங்கள் வெற்றிகரமாக செயலாக்கப்பட்டன!',
'ocr.process.multiple.failed': 'சில ஆவணங்களை செயலாக்க முடியவில்லை',
'ocr.autoFill.success': 'உங்கள் ஆவணங்களிலிருந்து {fields} புலங்கள் சுயவிவரத்தில் புதுப்பிக்கப்பட்டன! 🎯',
'ocr.autoFill.failed': 'ஆவணங்களிலிருந்து சுயவிவரத்தை தானாக நிரப்ப முடியவில்லை',



'notification.application.submitted.title': 'விண்ணப்பம் சமர்ப்பிக்கப்பட்டது ✅',
'notification.application.submitted.body': 'உங்கள் {schemeName} விண்ணப்பம் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது!',
'notification.application.submitted.email_subject': 'விண்ணப்பம் சமர்ப்பிக்கப்பட்டது - {schemeName}',
'notification.application.submitted.email_body': 'அன்புள்ள {userName},\n\nஉங்கள் {schemeName} விண்ணப்பம் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது.\nவிண்ணப்ப ஐடி: {applicationId}\nஎதிர்பார்க்கப்படும் செயலாக்க நேரம்: {processingTime}\n\nஉங்கள் விண்ணப்ப நிலையை உங்கள் டாஷ்போர்டில் கண்காணிக்கலாம்.',
'notification.application.submitted.sms': '{schemeName} விண்ணப்பம் சமர்ப்பிக்கப்பட்டது. ஐடி: {applicationId}',

'notification.application.approved.title': 'விண்ணப்பம் அனுமதிக்கப்பட்டது! 🎉',
'notification.application.approved.body': 'உங்கள் {schemeName} விண்ணப்பம் அனுமதிக்கப்பட்டது!',
'notification.application.approved.email_subject': 'வாழ்த்துகள்! உங்கள் விண்ணப்பம் அனுமதிக்கப்பட்டது - {schemeName}',
'notification.application.approved.email_body': 'அன்புள்ள {userName},\n\nநல்ல செய்தி! உங்கள் {schemeName} விண்ணப்பம் அனுமதிக்கப்பட்டது.\nநன்மை தொகை: ₹{amount}\nஅடுத்த நடவடிக்கைகள்: {nextSteps}\n\nஅக்ரோவிஹானைப் பயன்படுத்தியதற்கு நன்றி.',
'notification.application.approved.sms': 'அனுமதிக்கப்பட்டது! {schemeName}. ₹{amount} அனுமதிக்கப்பட்டது.',

'notification.scheme.recommendation.title': 'புதிய திட்ட பரிந்துரைகள்! 🎯',
'notification.scheme.recommendation.body': 'உங்கள் சுயவிவரத்துடன் பொருந்தும் {count} புதிய திட்டங்களைக் கண்டறிந்தோம்!',
'notification.scheme.recommendation.email_subject': 'உங்களுக்கான {count} புதிய திட்ட பரிந்துரைகள்',
'notification.scheme.recommendation.email_body': 'அன்புள்ள {userName},\n\nஉங்கள் சுயவிவரத்தின் அடிப்படையில், உங்களுக்குத் தகுதியுள்ள {count} அரசு திட்டங்களைக் கண்டறிந்தோம்:\n\n{schemesList}\n\nஇப்போது விண்ணப்பிக்க உள்நுழையவும்!',
'notification.scheme.recommendation.sms': '{count} புதிய திட்டங்கள் கிடைத்தன! அக்ரோவிஹான் ஆப்பைப் பாருங்கள்.',

'notification.kyc.verified.title': 'KYC சரிபார்க்கப்பட்டது ✅',
'notification.kyc.verified.body': 'உங்கள் KYC சரிபார்ப்பு நிறைவடைந்தது! தகுதி மதிப்பெண்: {score}',
'notification.kyc.verified.email_subject': 'KYC சரிபார்ப்பு வெற்றிகரமானது',
'notification.kyc.verified.email_body': 'அன்புள்ள {userName},\n\nஉங்கள் KYC சரிபார்ப்பு வெற்றிகரமாக நிறைவடைந்தது.\nஉங்கள் தகுதி மதிப்பெண்: {score}\n\nஅதிக அனுமதி வாய்ப்புகளுடன் அதிக திட்டங்களுக்கு இப்போது விண்ணப்பிக்கலாம்.',
'notification.kyc.verified.sms': 'KYC சரிபார்க்கப்பட்டது! மதிப்பெண்: {score}. இப்போது திட்டங்களுக்கு விண்ணப்பிக்கவும்.',

'notification.payment.disbursed.title': 'கட்டணம் பெறப்பட்டது! 💰',
'notification.payment.disbursed.body': 'உங்கள் கணக்கில் {schemeName}க்காக ₹{amount} வழங்கப்பட்டது',
'notification.payment.disbursed.email_subject': 'கட்டணம் வழங்கப்பட்டது - ₹{amount}',
'notification.payment.disbursed.email_body': 'அன்புள்ள {userName},\n\nஉங்கள் {schemeName} திட்டத்திற்காக ₹{amount} உங்கள் வங்கிக் கணக்கில் வெற்றிகரமாக வழங்கப்பட்டுள்ளதாக தெரிவித்து மகிழ்ச்சி அடைகிறோம்.\nபரிவர்த்தனை ஐடி: {transactionId}\nதேதி: {date}\n\nஅக்ரோவிஹானின் ஒரு பகுதியாக இருப்பதற்கு நன்றி.',
'notification.payment.disbursed.sms': '{schemeName}க்காக ₹{amount} பெறப்பட்டது. Txn: {transactionId}',

  }
};

const getString = (key, lang = 'ta', variables = {}) => {
  const strings = languageStrings[lang] || languageStrings.ta;
  let text = strings[key] || languageStrings.en[key] || key;
  
  // Replace variables like {count}, {fields}, etc.
  Object.keys(variables).forEach(variable => {
    text = text.replace(`{${variable}}`, variables[variable]);
  });
  
  return text;
};

// Helper to get language from request
const getLanguageFromRequest = (req) => {
  return req.user?.language || req.query.lang || 'ta';
};

module.exports = { getString, getLanguageFromRequest };