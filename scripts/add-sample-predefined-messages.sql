-- Add sample predefined messages for testing
-- Note: Replace 'your-user-id' with an actual user ID from your app_users table

INSERT INTO predefined_messages (title, message, category, created_by) VALUES
('Welcome Message', 'Hello! Thank you for your interest in Roshni Solar. How can I assist you today?', 'initial_contact', 'your-user-id'),
('Follow Up Call', 'Hi! This is a follow-up call regarding your solar installation inquiry. Are you still interested?', 'follow_up', 'your-user-id'),
('Appointment Confirmation', 'Great! I have scheduled your appointment for solar consultation on {date} at {time}. Please confirm.', 'appointment', 'your-user-id'),
('Quote Follow Up', 'Hi! I sent you a quote for your solar installation. Do you have any questions about the pricing?', 'quote', 'your-user-id'),
('Installation Update', 'Your solar installation is scheduled for {date}. Our team will arrive between 9 AM - 11 AM.', 'installation', 'your-user-id'),
('Support Inquiry', 'I understand you have a support request. Can you please provide more details about the issue?', 'support', 'your-user-id'),
('Referral Request', 'Thank you for choosing Roshni Solar! If you know anyone interested in solar, please refer them to us.', 'referral', 'your-user-id'),
('Special Offer', 'Limited time offer! Get 10% off on solar installation when you book this month.', 'promotion', 'your-user-id'),
('General Inquiry', 'Thank you for contacting Roshni Solar. How may I help you today?', 'general', 'your-user-id'); 