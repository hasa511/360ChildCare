/* eslint-disable no-console */
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Child from '../models/Child.js';
import Classroom from '../models/Classroom.js';
import Attendance from '../models/Attendance.js';
import ActivityLog from '../models/ActivityLog.js';
import Incident from '../models/Incident.js';
import Invoice from '../models/Invoice.js';
import Announcement from '../models/Announcement.js';
import Message from '../models/Message.js';
import { toDateStr } from '../utils/helpers.js';

const models = [User, Child, Classroom, Attendance, ActivityLog, Incident, Invoice, Announcement, Message];

const daysAgo = (n, hour = 8, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d;
};
const yearsAgo = (y, m = 0) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - y);
  d.setMonth(d.getMonth() - m);
  return d;
};
const period = (offsetMonths = 0) => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offsetMonths);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
const pickRand = (arr) => arr[Math.floor(Math.random() * arr.length)];

export async function seed() {
  await Promise.all(models.map((m) => m.deleteMany({})));

  // ---------- Users ----------
  // create() runs the password-hashing hook for each user
  const [admin, ...staff] = await User.create([
    { name: 'Nadeesha Perera', email: 'admin@childcare360.com', password: 'admin123', role: 'admin', phone: '0771234567', position: 'Centre Director' },
    { name: 'Kumudu Silva', email: 'kumudu@childcare360.com', password: 'staff123', role: 'staff', phone: '0712345678', position: 'Lead Teacher' },
    { name: 'Ruwan Jayasinghe', email: 'ruwan@childcare360.com', password: 'staff123', role: 'staff', phone: '0723456789', position: 'Caregiver' },
    { name: 'Dilini Fernando', email: 'dilini@childcare360.com', password: 'staff123', role: 'staff', phone: '0754567890', position: 'Infant Specialist' },
    { name: 'Tharindu Bandara', email: 'tharindu@childcare360.com', password: 'staff123', role: 'staff', phone: '0765678901', position: 'Assistant Teacher' },
  ]);

  const parents = await User.create([
    { name: 'Sanjaya Wickramasinghe', email: 'parent@childcare360.com', password: 'parent123', role: 'parent', phone: '0779876543', address: '12 Lake Rd, Maharagama' },
    { name: 'Ishara Gunawardena', email: 'ishara@example.com', password: 'parent123', role: 'parent', phone: '0718765432', address: '45 Temple Rd, Nugegoda' },
    { name: 'Malith Rathnayake', email: 'malith@example.com', password: 'parent123', role: 'parent', phone: '0727654321', address: '8 Flower Ave, Kottawa' },
    { name: 'Chathurika Herath', email: 'chathurika@example.com', password: 'parent123', role: 'parent', phone: '0756543210', address: '21 Station Rd, Pannipitiya' },
    { name: 'Asanka Dissanayake', email: 'asanka@example.com', password: 'parent123', role: 'parent', phone: '0765432109', address: '3 Park St, Boralesgamuwa' },
    { name: 'Hiruni Senanayake', email: 'hiruni@example.com', password: 'parent123', role: 'parent', phone: '0774321098', address: '67 Hill St, Dehiwala' },
  ]);

  // ---------- Classrooms ----------
  const classrooms = await Classroom.create([
    { name: 'Little Sprouts', ageGroup: 'Infants (6-18 months)', capacity: 8, monthlyFee: 2000, roomNumber: 'A1', staff: [staff[2]._id], description: 'Calm, nurturing room for our youngest learners.' },
    { name: 'Busy Bees', ageGroup: 'Toddlers (18 months-3 years)', capacity: 12, monthlyFee: 2000, roomNumber: 'A2', staff: [staff[1]._id], description: 'Sensory play, early language and lots of movement.' },
    { name: 'Rainbow Room', ageGroup: 'Preschool (3-4 years)', capacity: 15, monthlyFee: 2000, roomNumber: 'B1', staff: [staff[0]._id, staff[3]._id], description: 'Play-based learning, art and early numeracy.' },
    { name: 'Explorers', ageGroup: 'Pre-K (4-5 years)', capacity: 15, monthlyFee: 2000, roomNumber: 'B2', staff: [staff[0]._id], description: 'School readiness, reading and outdoor discovery.' },
  ]);
  const [sprouts, bees, rainbow, explorers] = classrooms;

  // ---------- Children ----------
  const ec = (p) => [{ name: p.name, relationship: 'Parent', phone: p.phone }];
  const childData = [
    ['Senuli', 'Wickramasinghe', yearsAgo(4, 2), 'female', explorers, [parents[0]], ['Peanuts'], 'O+'],
    ['Kavin', 'Wickramasinghe', yearsAgo(2, 1), 'male', bees, [parents[0]], [], 'O+'],
    ['Ayeth', 'Gunawardena', yearsAgo(3, 5), 'male', rainbow, [parents[1]], ['Dairy'], 'A+'],
    ['Nethmi', 'Rathnayake', yearsAgo(1, 0), 'female', sprouts, [parents[2]], [], 'B+'],
    ['Thisal', 'Rathnayake', yearsAgo(4, 6), 'male', explorers, [parents[2]], [], 'B+'],
    ['Yasara', 'Herath', yearsAgo(3, 1), 'female', rainbow, [parents[3]], ['Eggs', 'Shellfish'], 'AB+'],
    ['Dinuk', 'Dissanayake', yearsAgo(2, 6), 'male', bees, [parents[4]], [], 'O-'],
    ['Methsara', 'Dissanayake', yearsAgo(0, 10), 'female', sprouts, [parents[4]], [], 'O-'],
    ['Chanuli', 'Senanayake', yearsAgo(3, 8), 'female', rainbow, [parents[5]], [], 'A-'],
    ['Oshan', 'Senanayake', yearsAgo(4, 9), 'male', explorers, [parents[5]], ['Gluten'], 'A-'],
    ['Sithmi', 'Gunawardena', yearsAgo(2, 2), 'female', bees, [parents[1]], [], 'A+'],
    ['Lakindu', 'Herath', yearsAgo(1, 4), 'male', sprouts, [parents[3]], [], 'AB+'],
  ];
  const children = await Child.create(
    childData.map(([firstName, lastName, dob, gender, room, ps, allergies, bloodGroup]) => ({
      firstName,
      lastName,
      dateOfBirth: dob,
      gender,
      classroom: room._id,
      parents: ps.map((p) => p._id),
      allergies,
      bloodGroup,
      medicalNotes: allergies.length ? `Avoid all ${allergies.join(', ').toLowerCase()} products.` : '',
      emergencyContacts: [...ec(ps[0]), { name: 'Grandparent', relationship: 'Grandparent', phone: '0112233445' }],
      authorizedPickups: [{ name: ps[0].name, relationship: 'Parent', phone: ps[0].phone }],
      enrollmentDate: daysAgo(120),
    }))
  );

  // ---------- Attendance (last 10 weekdays, plus today) ----------
  const attendance = [];
  for (let n = 10; n >= 0; n -= 1) {
    const day = daysAgo(n);
    const dow = day.getDay();
    if (dow === 0 || dow === 6) continue;
    for (const child of children) {
      const parent = parents.find((p) => String(p._id) === String(child.parents[0]));
      if (n === 0) {
        // Today: most kids checked in, a few not yet marked
        if (Math.random() < 0.2) continue;
      }
      if (Math.random() < 0.1) {
        attendance.push({ child: child._id, date: toDateStr(day), status: 'absent', absenceReason: pickRand(['Sick', 'Family trip', 'Doctor appointment']), reportedBy: parent._id });
        continue;
      }
      const rec = {
        child: child._id,
        date: toDateStr(day),
        status: 'present',
        checkInTime: daysAgo(n, 7, 15 + Math.floor(Math.random() * 60)),
        checkedInBy: pickRand(staff)._id,
        droppedOffBy: parent.name,
      };
      if (n > 0) {
        Object.assign(rec, { checkOutTime: daysAgo(n, 16, Math.floor(Math.random() * 59)), checkedOutBy: pickRand(staff)._id, pickedUpBy: parent.name });
      }
      attendance.push(rec);
    }
  }
  await Attendance.insertMany(attendance);

  // ---------- Activity logs (today & yesterday) ----------
  const templates = [
    { time: '08:30', type: 'meal', title: 'Breakfast', details: 'String hoppers with dhal and banana', mealAmount: 'most' },
    { time: '09:30', type: 'activity', title: 'Circle time', details: 'Sang songs and learned about colours', mood: 'happy' },
    { time: '10:30', type: 'activity', title: 'Outdoor play', details: 'Sandpit and slides in the garden', mood: 'excited' },
    { time: '12:00', type: 'meal', title: 'Lunch', details: 'Rice, chicken curry and pumpkin', mealAmount: 'all' },
    { time: '13:00', type: 'nap', title: 'Afternoon nap', details: 'Slept peacefully', durationMins: 75 },
    { time: '15:00', type: 'mood', title: 'Afternoon mood', details: 'Played well with friends', mood: 'calm' },
  ];
  const logs = [];
  for (const n of [1, 0]) {
    const date = toDateStr(daysAgo(n));
    for (const child of children) {
      const count = n === 0 ? 3 : templates.length;
      templates.slice(0, count).forEach((t) => logs.push({ ...t, child: child._id, date, recordedBy: pickRand(staff)._id }));
    }
  }
  await ActivityLog.insertMany(logs);

  // ---------- Incidents ----------
  await Incident.create([
    { child: children[1]._id, date: daysAgo(1, 10, 20), type: 'injury', severity: 'low', location: 'Playground', description: 'Tripped while running and scraped left knee.', actionTaken: 'Cleaned the wound and applied a plaster. Comforted and returned to play.', parentNotified: true, reportedBy: staff[1]._id },
    { child: children[2]._id, date: daysAgo(3, 12, 10), type: 'illness', severity: 'medium', location: 'Rainbow Room', description: 'Mild fever (37.9°C) after lunch.', actionTaken: 'Parent called and child was picked up early.', parentNotified: true, reportedBy: staff[0]._id, acknowledgedBy: parents[1]._id, acknowledgedAt: daysAgo(3, 18), parentComment: 'Thank you, he is feeling better.' },
    { child: children[0]._id, date: daysAgo(5, 11, 0), type: 'behavior', severity: 'low', location: 'Explorers', description: 'Disagreement with a friend over a toy; some pushing.', actionTaken: 'Talked through sharing and feelings; both children apologised.', parentNotified: true, reportedBy: staff[0]._id },
  ]);

  // ---------- Invoices ----------
  const lastPeriod = period(-1);
  const thisPeriod = period(0);
  const due = (p, day) => new Date(`${p}-${String(day).padStart(2, '0')}T00:00:00`);
  for (const child of children) {
    const room = classrooms.find((c) => String(c._id) === String(child.classroom));
    const base = { child: child._id, parent: child.parents[0], createdBy: admin._id };
    await Invoice.create({
      ...base,
      period: lastPeriod,
      items: [{ description: `Monthly tuition - ${room.name}`, amount: room.monthlyFee }],
      dueDate: due(lastPeriod, 10),
      status: 'paid',
      paidAt: due(lastPeriod, 8),
      paymentMethod: pickRand(['cash', 'bank_transfer', 'online']),
    });
    const paid = Math.random() < 0.35;
    await Invoice.create({
      ...base,
      period: thisPeriod,
      items: [{ description: `Monthly tuition - ${room.name}`, amount: room.monthlyFee }],
      dueDate: due(thisPeriod, 10),
      status: paid ? 'paid' : 'unpaid',
      ...(paid ? { paidAt: new Date(), paymentMethod: 'online' } : {}),
    });
  }

  // ---------- Announcements ----------
  const nextWeek = daysAgo(-7, 9);
  await Announcement.create([
    { title: 'Welcome to 360ChildCare!', body: 'We are delighted to launch our new parent portal. You can now view daily activity updates, attendance, invoices and message our team directly.', category: 'general', audience: 'all', pinned: true, author: admin._id },
    { title: 'Annual Sports Day', body: 'Join us for our annual sports day at the centre garden. Children should wear their house colours and comfortable shoes. Parents are warmly invited!', category: 'event', audience: 'all', eventDate: nextWeek, author: admin._id },
    { title: 'Health reminder: hand-foot-mouth disease', body: 'A few cases have been reported in the area. Please keep your child at home if they have a fever or rash and inform us.', category: 'health', audience: 'parents', author: staff[0]._id },
    { title: 'Staff meeting on Friday', body: 'Monthly staff meeting at 4:30 PM in the office. We will review the new activity curriculum.', category: 'reminder', audience: 'staff', eventDate: daysAgo(-3, 16, 30), author: admin._id },
    { title: 'Poya holiday closure', body: 'The centre will be closed on the upcoming Poya day. Regular hours resume the next day.', category: 'holiday', audience: 'all', eventDate: daysAgo(-12, 0), author: admin._id },
  ]);

  // ---------- Messages ----------
  await Message.create([
    { sender: parents[0]._id, recipient: staff[0]._id, body: 'Hi Ms. Kumudu, Senuli has a slight cough today. Could you keep an eye on her?', createdAt: daysAgo(1, 7, 40), readAt: daysAgo(1, 8) },
    { sender: staff[0]._id, recipient: parents[0]._id, body: 'Of course! She has been playing happily. We will let you know if anything changes.', createdAt: daysAgo(1, 10, 5) },
    { sender: admin._id, recipient: parents[0]._id, body: 'Reminder: this month\'s invoice is now available in the Billing section.', createdAt: daysAgo(0, 8, 0) },
    { sender: parents[1]._id, recipient: admin._id, body: 'Can I pay this month\'s fees by bank transfer?', createdAt: daysAgo(2, 19, 0) },
  ]);

  return { users: 5 + parents.length, children: children.length, classrooms: classrooms.length };
}

async function run() {
  await connectDB();
  if (process.argv.includes('--destroy')) {
    await Promise.all(models.map((m) => m.deleteMany({})));
    console.log('All data removed.');
  } else {
    const result = await seed();
    console.log('Database seeded:', result);
    console.log('\nDemo logins:');
    console.log('  Admin  -> admin@childcare360.com / admin123');
    console.log('  Staff  -> kumudu@childcare360.com / staff123');
    console.log('  Parent -> parent@childcare360.com / parent123');
  }
  await mongoose.disconnect();
}

// Run only when executed directly (not when imported by tests)
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}