const searchBox = document.getElementById('searchBox');
const suggestions = document.getElementById('suggestions');
let activeIndex = -1;
let selectedId = null; // Store selected student id

searchBox.addEventListener('input', async function() {
  const value = this.value.trim();
  selectedId = null; // Reset selectedId on input
  if (!value) {
    suggestions.style.display = 'none';
    suggestions.innerHTML = '';
    return;
  }
  // Fetch suggestions from API
  const res = await fetch(`http://localhost:3000/suggest?q=${encodeURIComponent(value)}`);
  const data = await res.json();
  if (!data.length) {
    suggestions.style.display = 'none';
    suggestions.innerHTML = '';
    return;
  }
  suggestions.innerHTML = data.map((item, idx) =>
    `<div class="suggestion" data-idx="${idx}" data-id="${item.id}">${item.name}</div>`
  ).join('');
  suggestions.style.display = 'block';
  activeIndex = -1;
});

suggestions.addEventListener('mousedown', function(e) {
  if (e.target.classList.contains('suggestion')) {
    searchBox.value = e.target.textContent;
    selectedId = e.target.getAttribute('data-id'); // Store selected id
    suggestions.style.display = 'none';
  }
});

searchBox.addEventListener('keydown', function(e) {
  const items = suggestions.querySelectorAll('.suggestion');
  if (!items.length) return;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    activeIndex = (activeIndex + 1) % items.length;
    updateActive(items);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    activeIndex = (activeIndex - 1 + items.length) % items.length;
    updateActive(items);
  } else if (e.key === 'Enter') {
    if (activeIndex >= 0) {
      e.preventDefault();
      searchBox.value = items[activeIndex].textContent;
      selectedId = items[activeIndex].getAttribute('data-id'); // Store selected id
      suggestions.style.display = 'none';
    }
  }
});

function updateActive(items) {
  items.forEach((item, idx) => {
    item.classList.toggle('active', idx === activeIndex);
  });
}

document.addEventListener('click', function(e) {
  if (!suggestions.contains(e.target) && e.target !== searchBox) {
    suggestions.style.display = 'none';
  }
});

// Fetch and display student details by id
async function fetchStudentDetailsById(id) {
  const res = await fetch(`http://localhost:3000/student?id=${encodeURIComponent(id)}`);
  const data = await res.json();
  const detailsDiv = document.getElementById('studentDetails');
  if (data.length) {
    // Format details as HTML
    const student = data[0];
    detailsDiv.innerHTML = `
      <div class="student-card">
        <h2>${student.name}</h2>
        <pre>${JSON.stringify(student, null, 2)}</pre>
      </div>
    `;
  } else {
    detailsDiv.innerHTML = `<div class="student-card">No student found.</div>`;
  }
}

// Update form submission to use the selected id
document.querySelector('form').addEventListener('submit', function(e) {
  e.preventDefault();
  if (selectedId) {
    fetchStudentDetailsById(selectedId);
  } else {
    alert("Please select a student from the suggestions.");
  }
});