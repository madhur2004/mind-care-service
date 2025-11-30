import cron from 'node-cron';
import User from '../models/User.js';
import JournalEntry from '../models/Journal.js';
import MoodEntry from '../models/Mood.js';
import Meditation from '../models/Meditation.js';
import { sendWeeklyProgressEmail } from './emailServices.js';

// Weekly progress report scheduler
export const startWeeklyReports = () => {
  // Har Sunday ko 9 AM par run karega
  cron.schedule('0 9 * * 0', async () => {
    try {
      console.log('📊 Starting weekly progress reports...');
      
      // Sab users ko fetch karo jinke email updates enabled hain
      const users = await User.find({ 
        'settings.emailUpdates': true,
        email: { $exists: true, $ne: null }
      });

      for (const user of users) {
        try {
          // Last 7 days ki data fetch karo
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

          const [journals, moods, meditations] = await Promise.all([
            JournalEntry.find({ 
              user: user._id, 
              createdAt: { $gte: oneWeekAgo } 
            }),
            MoodEntry.find({ 
              user: user._id, 
              createdAt: { $gte: oneWeekAgo } 
            }),
            Meditation.find({ 
              user: user._id, 
              createdAt: { $gte: oneWeekAgo } 
            })
          ]);

          // Progress data prepare karo
          const progressData = {
            totalJournals: journals.length,
            totalMoods: moods.length,
            totalMeditationMinutes: meditations.reduce((total, session) => total + (session.duration || 0), 0),
            averageMood: moods.length > 0 ? 
              (moods.reduce((sum, mood) => sum + (mood.intensity || 0), 0) / moods.length).toFixed(1) : 0,
            streak: calculateStreak(moods, journals),
            weekRange: `${oneWeekAgo.toLocaleDateString()} - ${new Date().toLocaleDateString()}`
          };

          // Email bhejo agar koi data hai
          if (journals.length > 0 || moods.length > 0 || meditations.length > 0) {
            await sendWeeklyProgressEmail(user, progressData);
            console.log(`✅ Weekly report sent to: ${user.email}`);
          }

        } catch (error) {
          console.error(`❌ Failed to send weekly report to ${user.email}:`, error);
        }
      }

      console.log('✅ Weekly progress reports completed');
    } catch (error) {
      console.error('❌ Weekly reports scheduler error:', error);
    }
  });
};

// Streak calculate karo
function calculateStreak(moods, journals) {
  // Simple streak calculation - last 7 days mein kitne consecutive days activity hai
  const activityDays = new Set();
  
  [...moods, ...journals].forEach(entry => {
    const date = new Date(entry.createdAt).toDateString();
    activityDays.add(date);
  });

  let currentStreak = 0;
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const dateStr = checkDate.toDateString();
    
    if (activityDays.has(dateStr)) {
      currentStreak++;
    } else {
      break;
    }
  }
  
  return currentStreak;
}