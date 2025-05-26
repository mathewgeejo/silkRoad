const searchBox = document.getElementById('searchBox');
const suggestions = document.getElementById('suggestions');
let activeIndex = -1;
let selectedId = null;

searchBox.addEventListener('input', async function() {
  const value = this.value.trim();
  selectedId = null; 
  if (!value) {
    suggestions.style.display = 'none';
    suggestions.innerHTML = '';
    return;
  }
// Get suggestions from API
  try {
    const res = await fetch(`https://carbon-advise-diet-enabling.trycloudflare.com/suggest?q=${encodeURIComponent(value)}`);
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
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    suggestions.style.display = 'none';
    suggestions.innerHTML = '';
  }
});

suggestions.addEventListener('mousedown', function(e) {
  if (e.target.classList.contains('suggestion')) {
    searchBox.value = e.target.textContent;
    selectedId = e.target.getAttribute('data-id');
    suggestions.style.display = 'none';
    // Automatically fetch student details when suggestion is clicked
    fetchStudentDetailsById(selectedId);
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
      selectedId = items[activeIndex].getAttribute('data-id');
      suggestions.style.display = 'none';
      fetchStudentDetailsById(selectedId);
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

// Calculate age from date of birth
function calculateAge(dateOfBirth) {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

// Fetch and display student details by id
async function fetchStudentDetailsById(id) {
  try {
    const res = await fetch(`https://carbon-advise-diet-enabling.trycloudflare.com/student?id=${encodeURIComponent(id)}`);
    const data = await res.json();
    const detailsDiv = document.getElementById('studentDetails');
    if (data.length) {
      const student = data[0];
      const dobDate = new Date(student.date_of_birth);
      const is1970Date = dobDate.getFullYear() === 1970 && dobDate.getMonth() === 0 && dobDate.getDate() === 1;
      const age = !is1970Date && student.date_of_birth ? calculateAge(student.date_of_birth) : null;
      
      detailsDiv.innerHTML = `
        <div class="student-card">
          <h2 class="student-name">${student.name}</h2>
          <div class="social-links">
            ${student.Instagram_id ? `
              <div class="social-item">
                <span class="social-platform">Instagram</span>
                <span class="social-id">@${student.Instagram_id}</span>
              </div>
            ` : ''}
            ${student.Snapchat_id ? `
              <div class="social-item">
                <span class="social-platform">Snapchat</span>
                <span class="social-id">${student.Snapchat_id}</span>
              </div>
            ` : ''}
          </div>
          <div class="student-info">
            ${is1970Date ? 
              `<p>DOB not available</p>` : 
              student.date_of_birth ? 
                `<p><strong>Date of Birth:</strong> ${new Date(student.date_of_birth).toLocaleDateString()}${age !== null ? `<span class="age-info">${age} years old</span>` : ''}</p>` : 
                ''}
          </div>
          <button class="clear-btn" onclick="clearResults()">Clear Results</button>
        </div>
      `;
    } else {
      detailsDiv.innerHTML = `<div class="student-card">No student found.</div>`;
    }
  } catch (error) {
    console.error('Error fetching student details:', error);
    document.getElementById('studentDetails').innerHTML = `<div class="student-card">Error loading student details.</div>`;
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

function clearResults() {
  document.getElementById('studentDetails').innerHTML = '';
  searchBox.value = '';
  selectedId = null;
  searchBox.focus();
}