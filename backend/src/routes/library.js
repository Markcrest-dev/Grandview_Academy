import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '../config/database.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { validateRequired, parsePagination } from '../utils/validators.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = Router();
const DB_PATH = path.resolve(process.cwd(), 'src/data/library.json');

// Helper to read database
function readDb() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading library DB, resetting:', err);
    return { books: [], borrow_records: [] };
  }
}

// Helper to write database
function writeDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing library DB:', err);
    return false;
  }
}

/**
 * GET /api/library/books
 * List all library books with optional search.
 */
router.get('/books', requireAuth, (req, res) => {
  try {
    const { search } = req.query;
    const db = readDb();
    let results = db.books;

    if (search) {
      const q = search.toLowerCase();
      results = results.filter(
        b =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q) ||
          b.isbn.includes(q)
      );
    }

    sendSuccess(res, {
      data: results,
      message: 'Library books catalog retrieved successfully.'
    });
  } catch (err) {
    sendError(res, { message: `Internal server error: ${err.message}`, statusCode: 500 });
  }
});

/**
 * POST /api/library/books
 * Add a new book to the library inventory.
 * Restricted to Librarian and Admin.
 */
router.post('/books', requireAuth, requireRoles('admin', 'non_teaching_staff'), (req, res) => {
  try {
    const { title, author, isbn, category, total_copies } = req.body;
    const errors = validateRequired(req.body, ['title', 'author', 'isbn', 'category', 'total_copies']);
    if (errors) {
      return sendError(res, { message: 'Validation failed', errors, statusCode: 400 });
    }

    const db = readDb();

    // Check if ISBN already exists
    const exists = db.books.find(b => b.isbn === isbn);
    if (exists) {
      return sendError(res, { message: 'A book with this ISBN already exists in the catalog.', statusCode: 400 });
    }

    const newBook = {
      id: `book-${Date.now()}`,
      title,
      author,
      isbn,
      category,
      total_copies: parseInt(total_copies),
      available_copies: parseInt(total_copies)
    };

    db.books.push(newBook);
    writeDb(db);

    sendSuccess(res, {
      data: newBook,
      message: `"${title}" has been added to the library catalog successfully.`,
      statusCode: 201
    });
  } catch (err) {
    sendError(res, { message: `Internal server error: ${err.message}`, statusCode: 500 });
  }
});

/**
 * GET /api/library/borrow
 * List borrowing transactions.
 */
router.get('/borrow', requireAuth, (req, res) => {
  try {
    const db = readDb();
    sendSuccess(res, {
      data: db.borrow_records,
      message: 'Borrow transactions retrieved successfully.'
    });
  } catch (err) {
    sendError(res, { message: `Internal server error: ${err.message}`, statusCode: 500 });
  }
});

/**
 * POST /api/library/borrow
 * Issue a book to a student.
 * Restricted to Librarian and Admin.
 */
router.post('/borrow', requireAuth, requireRoles('admin', 'non_teaching_staff'), async (req, res) => {
  try {
    const { book_id, admission_number, remarks } = req.body;
    const errors = validateRequired(req.body, ['book_id', 'admission_number']);
    if (errors) {
      return sendError(res, { message: 'Validation failed', errors, statusCode: 400 });
    }

    // 1. Verify student exists in Supabase
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id, first_name, last_name')
      .eq('admission_number', admission_number)
      .maybeSingle();

    if (studentError || !student) {
      return sendError(res, { message: `Student with Admission Number "${admission_number}" not found.`, statusCode: 404 });
    }

    const db = readDb();

    // 2. Verify book exists and has available copies
    const bookIndex = db.books.findIndex(b => b.id === book_id);
    if (bookIndex === -1) {
      return sendError(res, { message: 'Book not found in library catalog.', statusCode: 404 });
    }

    const book = db.books[bookIndex];
    if (book.available_copies <= 0) {
      return sendError(res, { message: `All copies of "${book.title}" are currently borrowed.`, statusCode: 400 });
    }

    // 3. Prevent student from borrowing the same book twice concurrently
    const alreadyBorrowed = db.borrow_records.find(
      r => r.book_id === book_id && r.admission_number === admission_number && r.status === 'borrowed'
    );
    if (alreadyBorrowed) {
      return sendError(res, { message: 'This student has already borrowed a copy of this book and has not returned it.', statusCode: 400 });
    }

    // 4. Issue the book: decrement available copies, create record
    db.books[bookIndex].available_copies -= 1;

    const record = {
      id: `borrow-${Date.now()}`,
      book_id,
      book_title: book.title,
      student_id: student.id,
      student_name: `${student.first_name} ${student.last_name}`,
      admission_number,
      borrow_date: new Date().toISOString().split('T')[0],
      return_date: null,
      status: 'borrowed',
      remarks: remarks || null
    };

    db.borrow_records.unshift(record);
    writeDb(db);

    sendSuccess(res, {
      data: record,
      message: `Book "${book.title}" successfully issued to ${student.first_name} ${student.last_name}.`,
      statusCode: 201
    });
  } catch (err) {
    sendError(res, { message: `Internal server error: ${err.message}`, statusCode: 500 });
  }
});

/**
 * PUT /api/library/borrow/:id/return
 * Return an issued book.
 * Restricted to Librarian and Admin.
 */
router.put('/borrow/:id/return', requireAuth, requireRoles('admin', 'non_teaching_staff'), (req, res) => {
  try {
    const { id } = req.params;
    const db = readDb();

    // 1. Locate record
    const recordIndex = db.borrow_records.findIndex(r => r.id === id);
    if (recordIndex === -1) {
      return sendError(res, { message: 'Borrowing transaction record not found.', statusCode: 404 });
    }

    const record = db.borrow_records[recordIndex];
    if (record.status === 'returned') {
      return sendError(res, { message: 'This book has already been registered as returned.', statusCode: 400 });
    }

    // 2. Locate book in catalog
    const bookIndex = db.books.findIndex(b => b.id === record.book_id);
    if (bookIndex !== -1) {
      // Increment copies count (ensure it doesn't exceed total)
      if (db.books[bookIndex].available_copies < db.books[bookIndex].total_copies) {
        db.books[bookIndex].available_copies += 1;
      }
    }

    // 3. Mark record as returned
    db.borrow_records[recordIndex].status = 'returned';
    db.borrow_records[recordIndex].return_date = new Date().toISOString().split('T')[0];

    writeDb(db);

    sendSuccess(res, {
      data: db.borrow_records[recordIndex],
      message: `Book "${record.book_title}" has been successfully returned and logged.`
    });
  } catch (err) {
    sendError(res, { message: `Internal server error: ${err.message}`, statusCode: 500 });
  }
});

export default router;
