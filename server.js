const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'notes.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure data directory and file exist
function ensureDataFile() {
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
  }
}

// Read notes from file
function readNotes() {
  ensureDataFile();
  const data = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(data);
}

// Write notes to file
function writeNotes(notes) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(notes, null, 2));
}

// GET all notes (sorted by date, newest first)
app.get('/api/notes', (req, res) => {
  try {
    const notes = readNotes();
    notes.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json({ success: true, notes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch notes.' });
  }
});

// POST a new note
app.post('/api/notes', (req, res) => {
  try {
    const { date, text } = req.body;

    if (!date || !text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Date and note text are required.' });
    }

    const notes = readNotes();
    const newNote = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      date,
      text: text.trim(),
      createdAt: new Date().toISOString()
    };

    notes.push(newNote);
    writeNotes(notes);

    res.status(201).json({ success: true, note: newNote });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to save note.' });
  }
});

// DELETE a note by ID
app.delete('/api/notes/:id', (req, res) => {
  try {
    const { id } = req.params;
    let notes = readNotes();
    const originalLength = notes.length;

    notes = notes.filter(note => note.id !== id);

    if (notes.length === originalLength) {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }

    writeNotes(notes);
    res.json({ success: true, message: 'Note deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete note.' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✨ Daily Notes server running at http://localhost:${PORT}`);
});
