import { Router } from 'express';
import healthRouter from './health.js';
import usersRouter from './users.js';
import studentsRouter from './students.js';
import staffRouter from './staff.js';
import classesRouter from './classes.js';
import subjectsRouter from './subjects.js';
import attendanceRouter from './attendance.js';
import gradesRouter from './grades.js';
import feesRouter from './fees.js';
import announcementsRouter from './announcements.js';
import timetableRouter from './timetable.js';
import uploadsRouter from './uploads.js';

const router = Router();

// Mount API routes
router.use('/health', healthRouter);
router.use('/users', usersRouter);
router.use('/students', studentsRouter);
router.use('/staff', staffRouter);
router.use('/classes', classesRouter);
router.use('/subjects', subjectsRouter);
router.use('/attendance', attendanceRouter);
router.use('/grades', gradesRouter);
router.use('/fees', feesRouter);
router.use('/announcements', announcementsRouter);
router.use('/timetable', timetableRouter);
router.use('/uploads', uploadsRouter);

export default router;
