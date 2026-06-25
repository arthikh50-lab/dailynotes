

const API_URL = '/api/notes';

// DOM Elements
const noteForm = document.getElementById('noteForm');
const noteDateInput = document.getElementById('noteDate');
const noteTextInput = document.getElementById('noteText');
const submitBtn = document.getElementById('submitBtn');
const notesGrid = document.getElementById('notesGrid');
const emptyState = document.getElementById('emptyState');
const noteCount = document.getElementById('noteCount');
const toast = document.getElementById('toast');
const deleteModal = document.getElementById('deleteModal');
const confirmDeleteBtn = document.getElementById('confirmDelete');
const cancelDeleteBtn = document.getElementById('cancelDelete');

let noteToDelete = null;

// ---- Initialize ----
document.addEventListener('DOMContentLoaded', () => {
  // Set today's date as default
  const today = new Date().toISOString().split('T')[0];
  noteDateInput.value = today;

  fetchNotes();
});

// ---- Fetch & Render Notes ----
async function fetchNotes() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    if (data.success) {
      renderNotes(data.notes);
    }
  } catch (err) {
    showToast('Failed to load notes. Is the server running?', 'error');
  }
}

function renderNotes(notes) {
  notesGrid.innerHTML = '';

  if (notes.length === 0) {
    emptyState.classList.remove('hidden');
    noteCount.textContent = '0 notes';
    return;
  }

  emptyState.classList.add('hidden');
  noteCount.textContent = `${notes.length} note${notes.length !== 1 ? 's' : ''}`;

  notes.forEach((note, index) => {
    const card = createNoteCard(note, index);
    notesGrid.appendChild(card);
  });
}

function createNoteCard(note, index) {
  const card = document.createElement('div');
  card.className = 'note-card';
  card.style.animationDelay = `${index * 0.06}s`;

  const formattedDate = formatDate(note.date);

  card.innerHTML = `
    <div class="note-card-header">
      <span class="note-date">
        <span class="note-date-icon">📅</span>
        ${formattedDate}
      </span>
      <button class="note-delete-btn" data-id="${note.id}" title="Delete note" aria-label="Delete note">
        🗑️
      </button>
    </div>
    <p class="note-text">${escapeHtml(note.text)}</p>
  `;

  // Attach delete handler
  const deleteBtn = card.querySelector('.note-delete-btn');
  deleteBtn.addEventListener('click', () => {
    noteToDelete = note.id;
    openModal();
  });

  return card;
}

// ---- Form Submission ----
noteForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const date = noteDateInput.value;
  const text = noteTextInput.value.trim();

  if (!date || !text) return;

  submitBtn.disabled = true;
  submitBtn.querySelector('.btn-text').textContent = 'Saving…';

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, text }),
    });

    const data = await res.json();

    if (data.success) {
      noteTextInput.value = '';
      showToast('Note saved successfully! ✨', 'success');
      fetchNotes();
    } else {
      showToast(data.message || 'Failed to save note.', 'error');
    }
  } catch (err) {
    showToast('Network error. Please try again.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.querySelector('.btn-text').textContent = 'Save Note';
  }
});

// ---- Delete Note ----
confirmDeleteBtn.addEventListener('click', async () => {
  if (!noteToDelete) return;

  try {
    const res = await fetch(`${API_URL}/${noteToDelete}`, {
      method: 'DELETE',
    });

    const data = await res.json();

    if (data.success) {
      showToast('Note deleted.', 'info');
      fetchNotes();
    } else {
      showToast(data.message || 'Failed to delete note.', 'error');
    }
  } catch (err) {
    showToast('Network error. Please try again.', 'error');
  } finally {
    noteToDelete = null;
    closeModal();
  }
});

cancelDeleteBtn.addEventListener('click', () => {
  noteToDelete = null;
  closeModal();
});

// Close modal on overlay click
deleteModal.addEventListener('click', (e) => {
  if (e.target === deleteModal) {
    noteToDelete = null;
    closeModal();
  }
});

// ---- Modal Helpers ----
function openModal() {
  deleteModal.classList.remove('hidden');
  // Force reflow for animation
  deleteModal.offsetHeight;
  deleteModal.classList.add('show');
}

function closeModal() {
  deleteModal.classList.remove('show');
  setTimeout(() => {
    deleteModal.classList.add('hidden');
  }, 300);
}

// ---- Toast Notification ----
function showToast(message, type = 'info') {
  toast.textContent = message;
  toast.className = `toast ${type}`;

  // Force reflow
  toast.offsetHeight;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}

// ---- Utility Functions ----
function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
