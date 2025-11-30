import nodemailer from 'nodemailer';

// ✅ Email functions ko export karo, transporter ko nahi
export const createTransporter = () => {
  console.log('📧 Creating email transporter with config:', {
    user: process.env.EMAIL_USER ? '✅ Set' : '❌ Missing',
    password: process.env.EMAIL_PASSWORD ? '✅ Set' : '❌ Missing'
  });

return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use TLS
    requireTLS: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Welcome Email
export const sendWelcomeEmail = async (user) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Mental Wellness" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: '🎉 Welcome to Mental Wellness - Account Created Successfully!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🧠 Mental Wellness</h1>
              <p>Your Journey to Better Mental Health Starts Here</p>
            </div>
            <div class="content">
              <h2>Welcome, ${user.name}! 👋</h2>
              <p>Your account has been successfully created with Mental Wellness.</p>
              
              <p><strong>What you can do:</strong></p>
              <ul>
                <li>📊 Track your daily moods</li>
                <li>📝 Write personal journals</li>
                <li>🤖 Chat with our AI therapist</li>
                <li>🧘 Practice meditation exercises</li>
                <li>📈 Monitor your progress</li>
              </ul>
              
              <p>We're excited to support you on your mental wellness journey! 🌟</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Start Your Journey</a>
              </div>
              
              <p><strong>Need help?</strong> Our support team is here for you.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 Mental Wellness. All rights reserved.</p>
              <p>This is an automated email, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent successfully to:', user.email);
    return true;
  } catch (error) {
    console.error('❌ Welcome email error:', error);
    throw error;
  }
};

// Password Reset Email
export const sendPasswordResetEmail = async (user, resetToken) => {
  try {
    const transporter = createTransporter();
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `"Mental Wellness" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: '🔒 Reset Your Password - Mental Wellness',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { background: #ff6b6b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .token { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center; font-family: monospace; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔒 Password Reset</h1>
            </div>
            <div class="content">
              <h2>Hello ${user.name},</h2>
              <p>We received a request to reset your password for your Mental Wellness account.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" class="button">Reset Your Password</a>
              </div>
              
              <p>Or copy and paste this link in your browser:</p>
              <div class="token">${resetLink}</div>
              
              <p><strong>This link will expire in 1 hour.</strong></p>
              
              <p>If you didn't request this reset, please ignore this email. Your account is secure.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 Mental Wellness. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent successfully to:', user.email);
    return true;
  } catch (error) {
    console.error('❌ Password reset email error:', error);
    throw error;
  }
};

// Existing functions ke saath

// Weekly Progress Email
export const sendWeeklyProgressEmail = async (user, progressData) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Mental Wellness" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: '📊 Your Weekly Progress Report - Mental Wellness',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .stat-card { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .stat-number { font-size: 2rem; font-weight: bold; color: #667eea; }
            .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🧠 Mental Wellness</h1>
              <p>Your Weekly Progress Report</p>
              <p><small>${progressData.weekRange}</small></p>
            </div>
            <div class="content">
              <h2>Hello ${user.name}! 👋</h2>
              <p>Here's your weekly mental wellness summary:</p>
              
              <div class="stat-card">
                <h3>😊 Mood Tracking</h3>
                <div class="stat-number">${progressData.totalMoods}</div>
                <p>mood entries this week</p>
                ${progressData.averageMood > 0 ? `<p>Average mood: ${progressData.averageMood}/5</p>` : ''}
              </div>
              
              <div class="stat-card">
                <h3>📖 Journal Entries</h3>
                <div class="stat-number">${progressData.totalJournals}</div>
                <p>journal entries written</p>
              </div>
              
              <div class="stat-card">
                <h3>🧘 Meditation</h3>
                <div class="stat-number">${progressData.totalMeditationMinutes}</div>
                <p>minutes of meditation</p>
              </div>
              
              <div class="stat-card">
                <h3>🔥 Current Streak</h3>
                <div class="stat-number">${progressData.streak} days</div>
                <p>consistent activity streak</p>
              </div>
              
              <p>Keep up the great work! Your consistency is key to mental wellness. 🌟</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/progress" class="button">View Detailed Progress</a>
              </div>
              
              <p><small>You're receiving this email because you have weekly progress reports enabled in your settings.</small></p>
            </div>
            <div class="footer">
              <p>&copy; 2024 Mental Wellness. All rights reserved.</p>
              <p>This is an automated email, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Weekly progress email sent to:', user.email);
    return true;
  } catch (error) {
    console.error('❌ Weekly progress email error:', error);
    throw error;
  }
};