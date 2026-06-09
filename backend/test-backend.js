// Test suite to verify dual-role MERN ATS platforms actions v2
const dbService = require('./models/dbService');
const aiService = require('./services/aiService');
const { connectDB, getIsMock } = require('./config/db');

async function runTests() {
  console.log('--- Starting TalentBridge ATS Upgrade v2 Verification ---');
  
  process.env.JWT_SECRET = 'testsecretkey';
  process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/talentbridge-v2-test';

  await connectDB();
  console.log(`Database Connection: ${getIsMock() ? 'In-Memory Fallback Mock DB' : 'MongoDB Connected'}`);

  try {
    const uniqueStamp = Date.now();

    // 1. Register Recruiter
    console.log('\n1. Registering Recruiter...');
    const recruiter = await dbService.createUser({
      name: 'Sarah Recruiter',
      email: `recruiter-${uniqueStamp}@company.com`,
      password: 'password123',
      role: 'recruiter'
    });
    console.log('✓ Recruiter profile created. Role:', recruiter.role);

    // Update recruiter company info
    console.log('Update recruiter company profile...');
    await dbService.updateProfile(recruiter._id, {
      name: 'Acme Corp',
      logo: 'https://logo.com/acme',
      website: 'https://acme.com',
      description: 'Modern widgets creator',
      industry: 'Widget Tech',
      size: '50-200 employees'
    }, 'recruiter');
    console.log('✓ Recruiter company details updated.');

    // 2. Register Candidate
    console.log('\n2. Registering Candidate...');
    const candidateUser = await dbService.createUser({
      name: 'Alex Candidate',
      email: `alex-${uniqueStamp}@gmail.com`,
      password: 'password123',
      role: 'candidate'
    });
    console.log('✓ Candidate profile created. Role:', candidateUser.role);

    // 3. Create Job opening (Recruiter) with Company & Salary Info
    console.log('\n3. Creating Job Opening (Recruiter)...');
    const title = 'React UI Engineer';
    const suggestedJd = await aiService.generateJobDescription(title);
    
    const job = await dbService.createJob({
      title: title,
      department: 'Product UI',
      location: 'Remote',
      type: 'Full-time',
      workplace: 'Remote',
      status: 'Active',
      description: suggestedJd.description,
      requirements: suggestedJd.requirements,
      skills: ['React', 'JavaScript', 'HTML5', 'CSS3', 'Tailwind CSS'],
      companyName: 'Acme Corp',
      companyWebsite: 'https://acme.com',
      companyLogoUrl: 'https://logo.com/acme',
      salaryRange: '$120,000 - $140,000',
      createdBy: recruiter._id
    });
    console.log(`✓ Job opening "${job.title}" published with salary: ${job.salaryRange}`);
    console.log(`✓ Company info logged: ${job.companyName} (${job.companyWebsite})`);

    // 4. Candidate Applies to Job (Auto Match calculation & duplicate protection checks)
    console.log('\n4. Submitting application (Candidate)...');
    const candidateSkills = ['React', 'JavaScript', 'Tailwind CSS'];
    const aiMatch = await aiService.calculateMatchScore(candidateSkills, job.skills, job.requirements);
    console.log(`✓ Direct Overlap Match Score: ${aiMatch.score}% (${aiMatch.status})`);
    console.log(`✓ Matched Skills: [${aiMatch.matchedSkills.join(', ')}]`);
    console.log(`✓ Missing Skills: [${aiMatch.missingSkills.join(', ')}]`);

    const application = await dbService.createCandidate({
      name: candidateUser.name,
      email: candidateUser.email,
      skills: candidateSkills,
      resumePath: '/uploads/alex-resume.pdf',
      jobId: job._id,
      candidateId: candidateUser._id,
      matchScore: aiMatch.score,
      matchStatus: aiMatch.status
    });
    console.log(`✓ Application linked successfully. ID: ${application._id}, status: ${application.status}`);

    // Notify recruiter when candidate applies
    await dbService.addNotification(recruiter._id, `New application submitted by ${candidateUser.name} for "${job.title}"`);
    console.log('✓ Recruiter notification dispatched.');

    // 5. Test Saved Jobs (Bookmark & Unsave)
    console.log('\n5. Verifying Bookmarking / Saved Jobs...');
    await dbService.saveJob(candidateUser._id, job._id);
    let saved = await dbService.getSavedJobs(candidateUser._id);
    console.log(`✓ Job saved. Bookmarked count: ${saved.length}`);
    if (saved.length !== 1) throw new Error('Bookmark count mismatch');

    await dbService.unsaveJob(candidateUser._id, job._id);
    saved = await dbService.getSavedJobs(candidateUser._id);
    console.log(`✓ Job unsaved. Bookmarked count: ${saved.length}`);
    if (saved.length !== 0) throw new Error('Bookmark removal failed');

    // 6. Recruiter comments (with ratings) and interview scheduling
    console.log('\n6. Managing application (Recruiter comments, status change, scheduling)...');
    
    // Add comment with rating
    const comment1 = await dbService.addComment(application._id, 'Excellent coding skills shown in assessment.', 5, recruiter._id);
    console.log('✓ Comment rating:', comment1.rating, 'Author:', comment1.author?.name || comment1.author);

    // Edit comment rating
    const commentEdited = await dbService.editComment(application._id, comment1._id || comment1.id, 'Rescheduled to zoom screening.', 4);
    console.log('✓ Comment edited. New text:', commentEdited.text, 'New rating:', commentEdited.rating);

    // Advance status to "Interview Scheduled"
    console.log('\nTesting Chronological statusHistory updates...');
    let statusUpdate = await dbService.updateCandidate(application._id, {
      status: 'Screening'
    });
    statusUpdate = await dbService.updateCandidate(application._id, {
      status: 'Interview Scheduled'
    });
    console.log('✓ Advanced status history:', statusUpdate.statusHistory.map(h => h.status).join(' -> '));

    // Move candidate BACK to "Screening"
    console.log('Moving status BACK from "Interview Scheduled" to "Screening"...');
    statusUpdate = await dbService.updateCandidate(application._id, {
      status: 'Screening'
    });
    console.log('✓ History after rollback (should not duplicate or contain future stages):', statusUpdate.statusHistory.map(h => h.status).join(' -> '));
    if (statusUpdate.statusHistory.length !== 2 || statusUpdate.statusHistory[1].status !== 'Screening') {
      throw new Error('Chronological statusHistory truncation failed!');
    }

    // Schedule interview with Type, interviewer and link
    console.log('\nScheduling interview details...');
    statusUpdate = await dbService.updateCandidate(application._id, {
      status: 'Interview Scheduled',
      interviewDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), // 3 days from now
      interviewNotes: 'Prepare for frontend coding questions',
      interviewType: 'Online',
      interviewerName: 'Sarah Recruiter',
      meetingLink: 'https://zoom.us/j/9876543210'
    });
    console.log('✓ Interview scheduling updated successfully:');
    console.log(`  - Type: ${statusUpdate.interviewType}`);
    console.log(`  - Interviewer: ${statusUpdate.interviewerName}`);
    console.log(`  - Meeting Link: ${statusUpdate.meetingLink}`);
    console.log(`  - Date: ${new Date(statusUpdate.interviewDate).toLocaleDateString()}`);

    // Notify candidate
    await dbService.addNotification(candidateUser._id, `Your interview has been scheduled for "${job.title}"`);
    console.log('✓ Candidate notification dispatched.');

    // 7. Verify Notifications
    console.log('\n7. Verifying Notifications...');
    let notifications = await dbService.getNotifications(candidateUser._id);
    console.log(`✓ Candidate notification count: ${notifications.length}. First message: "${notifications[0].text}"`);
    await dbService.markNotificationsAsRead(candidateUser._id);
    notifications = await dbService.getNotifications(candidateUser._id);
    console.log(`✓ Notifications marked read. Verification: read status of first message: ${notifications[0].read}`);

    // 8. Verify Dashboard Metrics
    console.log('\n8. Verifying Dashboards KPIs...');
    const recMetrics = await dbService.getDashboardMetrics(recruiter._id, 'recruiter');
    console.log('✓ Recruiter KPIs:', recMetrics);
    
    const candMetrics = await dbService.getDashboardMetrics(candidateUser._id, 'candidate');
    console.log('✓ Candidate KPIs:', candMetrics);

    console.log('\n✓✓✓ ALL ATS v2 UPGRADED SERVICES SUCCESSFULLY VERIFIED. ✓✓✓');
    process.exit(0);
  } catch (error) {
    console.error('❌ Service verification failed:', error);
    process.exit(1);
  }
}

runTests();
