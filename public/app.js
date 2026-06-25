const API_URL = '/api/notes';
// DOM Elements
const noteForm = document.getElementById('noteForm');
const noteDateInput = document.getElementById('noteDate');
const noteNameInput = document.getElementById('noteName');
const noteTextInput = document.getElementById('noteText');
const submitBtn = document.getElementById('submitBtn');
const notesGrid = document.getElementById('notesGrid');
const emptyState = document.getElementById('emptyState');
const noteCount = document.getElementById('noteCount');
const toast = document.getElementById('toast');
const deleteModal = document.getElementById('deleteModal');
const confirmDeleteBtn = document.getElementById('confirmDelete');
const cancelDeleteBtn = document.getElementById('cancelDelete');
const searchInput = document.getElementById('searchInput');
const filterDateInput = document.getElementById('filterDate');
const clearSearchBtn = document.getElementById('clearSearch');
const clearDateBtn = document.getElementById('clearDate');
const noResults = document.getElementById('noResults');
let noteToDelete = null;
let allNotes = [];
// ---- Initialize ----
document.addEventListener('DOMContentLoaded', () => {
  // Set today's date as default
  const today = new Date().toISOString().split('T')[0];
  noteDateInput.value = today;
  fetchNotes();
  // ---- Filter Event Listeners ----
  searchInput.addEventListener('input', debounce(applyFilters, 200));
  filterDateInput.addEventListener('change', applyFilters);
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.classList.add('hidden');
    applyFilters();
  });
  clearDateBtn.addEventListener('click', () => {
    filterDateInput.value = '';
    clearDateBtn.classList.add('hidden');
    applyFilters();
  });
});
// ---- Fetch & Render Notes ----
async function fetchNotes() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    if (data.success) {
      allNotes = data.notes;
      applyFilters();
    }
  } catch (err) {
    showToast('Failed to load notes. Is the server running?', 'error');
  }
}
// ---- Filter Logic ----
function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();
  const dateFilter = filterDateInput.value;
  // Toggle clear buttons
  clearSearchBtn.classList.toggle('hidden', !query);
  clearDateBtn.classList.toggle('hidden', !dateFilter);
  let filtered = allNotes;
  if (query) {
    filtered = filtered.filter(note =>
      note.text.toLowerCase().includes(query) ||
      (note.name && note.name.toLowerCase().includes(query)) ||
      formatDate(note.date).toLowerCase().includes(query)
    );
  }
  if (dateFilter) {
    filtered = filtered.filter(note => note.date === dateFilter);
  }
  renderNotes(filtered, query);
}
function renderNotes(notes, searchQuery = '') {
  notesGrid.innerHTML = '';
  const isFiltering = searchInput.value.trim() || filterDateInput.value;
  if (allNotes.length === 0) {
    emptyState.classList.remove('hidden');
    noResults.classList.add('hidden');
    noteCount.textContent = '0 notes';
    return;
  }
  emptyState.classList.add('hidden');
  if (notes.length === 0 && isFiltering) {
    noResults.classList.remove('hidden');
    noteCount.textContent = `0 of ${allNotes.length}`;
    return;
  }
  noResults.classList.add('hidden');
  noteCount.textContent = isFiltering
    ? `${notes.length} of ${allNotes.length}`
    : `${notes.length} note${notes.length !== 1 ? 's' : ''}`;
  notes.forEach((note, index) => {
    const card = createNoteCard(note, index, searchQuery);
    notesGrid.appendChild(card);
  });
}
function createNoteCard(note, index, searchQuery = '') {
  const card = document.createElement('div');
  card.className = 'note-card';
  card.style.animationDelay = `${index * 0.06}s`;
  const formattedDate = formatDate(note.date);
  const noteName = note.name || 'Untitled';
  const displayName = searchQuery
    ? highlightText(escapeHtml(noteName), searchQuery)
    : escapeHtml(noteName);
  const displayText = searchQuery
    ? highlightText(escapeHtml(note.text), searchQuery)
    : escapeHtml(note.text);
  card.innerHTML = `
    <div class="note-card-header">
      <div class="note-card-meta">
        <span class="note-name">${displayName}</span>
        <span class="note-date">
          <span class="note-date-icon">📅</span>
          ${formattedDate}
        </span>
      </div>
      <button class="note-delete-btn" data-id="${note.id}" title="Delete note" aria-label="Delete note">
        🗑️
      </button>
    </div>
    <p class="note-text">${displayText}</p>
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
  const name = noteNameInput.value.trim();
  const text = noteTextInput.value.trim();
  if (!date || !name || !text) return;
  submitBtn.disabled = true;
  submitBtn.querySelector('.btn-text').textContent = 'Saving…';
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, name, text }),
    });
    const data = await res.json();
    if (data.success) {
      noteNameInput.value = '';
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
function highlightText(html, query) {
  if (!query) return html;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return html.replace(regex, '<span class="search-highlight">$1</span>');
}
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
