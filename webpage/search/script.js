const searchBox = document.getElementById('searchBox');
const suggestions = document.getElementById('suggestions');
const detailsDiv = document.getElementById('studentDetails');
let activeIndex = -1;
let selectedId = null;

searchBox.addEventListener('input', async function () {
  const value = this.value.trim();
  selectedId = null;
  if (!value) return hideSuggestions();

  try {
    const res = await fetch(`http://localhost:3000/suggest?q=${encodeURIComponent(value)}`);
    const data = await res.json();
    if (!data.length) return hideSuggestions();

    suggestions.innerHTML = data.map((item, idx) => `
      <div class="suggestion" data-idx="${idx}" data-id="${item.id}">
        <span class="suggestion-name">${item.name}</span>
        <span class="suggestion-department">${item.department || ''}</span>
      </div>`).join('');
    suggestions.style.display = 'block';
    activeIndex = -1;
  } catch {
    hideSuggestions();
  }
});

suggestions.addEventListener('mousedown', function (e) {
  const suggestion = e.target.closest('.suggestion');
  if (!suggestion) return;
  selectSuggestion(suggestion);
});

searchBox.addEventListener('keydown', function (e) {
  const items = suggestions.querySelectorAll('.suggestion');
  if (!items.length) return;
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    activeIndex = (e.key === 'ArrowDown') ? (activeIndex + 1) % items.length : (activeIndex - 1 + items.length) % items.length;
    updateActive(items);
  } else if (e.key === 'Enter' && activeIndex >= 0) {
    e.preventDefault();
    selectSuggestion(items[activeIndex]);
  }
});

function updateActive(items) {
  items.forEach((item, idx) => item.classList.toggle('active', idx === activeIndex));
}

function selectSuggestion(item) {
  searchBox.value = item.querySelector('.suggestion-name').textContent.trim();
  selectedId = item.getAttribute('data-id');
  hideSuggestions();
  fetchStudentDetailsById(selectedId);
}

function hideSuggestions() {
  suggestions.style.display = 'none';
  suggestions.innerHTML = '';
}

document.addEventListener('click', e => {
  if (!suggestions.contains(e.target) && e.target !== searchBox) hideSuggestions();
});

function calculateAge(dob) {
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

function getDaysUntilNextBirthday(dob) {
  const today = new Date();
  const birthDate = new Date(dob);
  const next = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  if (today > next) next.setFullYear(today.getFullYear() + 1);
  return Math.ceil((next - today) / (1000 * 60 * 60 * 24));
}

async function fetchStudentDetailsById(id) {
  try {
    const res = await fetch(`http://localhost:3000/student?id=${encodeURIComponent(id)}`, { credentials: 'include' });
    detailsDiv.innerHTML = '';
    
    if (res.status === 401) {
      return window.location.href = 'http://127.0.0.1:3000/login';
    }
    
    if (res.status === 403) {
      const data = await res.json(); 
      detailsDiv.innerHTML = `
        <div class="student-card">
          <div class="privacy-notice">
            <h2 class="student-name">${data.name}</h2>
            <h3>🔒 Privacy Protected</h3>
            <p>This student has chosen to keep their information private.</p>
            <small>Please respect their privacy preference.</small>
            <button class="clear-btn" onclick="clearResults()">Back to Search</button>
          </div>
        </div>`;
      return;
    }
    
    if (res.status === 404) {
      detailsDiv.innerHTML = '<div class="student-card">Student not found.</div>';
      return;
    }
    if (!res.ok) {
      detailsDiv.innerHTML = '<div class="student-card">Error loading student details.</div>';
      return;
    }

    const data = await res.json();
    const student = Array.isArray(data) ? data[0] : data;
    if (!student || !student.name) {
      detailsDiv.innerHTML = '<div class="student-card">No student found.</div>';
      return;
    }

    const dobDate = new Date(student.date_of_birth);
    const is1970Date = dobDate.getFullYear() === 1970 && dobDate.getMonth() === 0 && dobDate.getDate() === 1;
    const age = (!is1970Date && student.date_of_birth) ? calculateAge(student.date_of_birth) : null;
    renderStudentDetails(student, is1970Date, age);

    if (student.Instagram_id) {
      const profile = await fetchInstagramProfile(student.Instagram_id);
      const status = document.querySelector('.instagram-status');
      if (profile && status) {
        status.innerHTML = `<span class="account-status ${profile.is_private ? 'private' : 'public'}">
          ${profile.is_private ? '🔒 Private' : '🌐 Public'}</span>`;
      }
    }
  } catch {
    detailsDiv.innerHTML = '<div class="student-card">Error loading student details.</div>';
  }
}

function renderStudentDetails(student, is1970Date, age) {
  detailsDiv.innerHTML = `
    <div class="student-card">
      <h2 class="student-name">${student.name}</h2>
      <div class="social-links">
        <div class="social-id">
          <span class="social-platform">Instagram</span>
          ${student.Instagram_id ? `
            <div class="instagram-info">
              <a href="https://instagram.com/${student.Instagram_id}" target="_blank"> @${student.Instagram_id}</a>
              <span class="instagram-status"></span>
            </div>` : 'Instagram ID not yet available 😢'}
        </div>
        <div class="social-id ">
          <span class="social-platform">Phone</span>
          ${student.father_mobile ? `<a href="tel:${student.father_mobile}">${student.father_mobile}</a>` : 'Phone number not available 📱'}
        </div>
        ${student.Snapchat_id ? `<div class="social-id"><span class="social-platform">Snapchat</span>${student.Snapchat_id}</div>` : ''}
      </div>
      <div class="student-info">
        ${is1970Date ? 'DOB not available' : `<p><strong>Date of Birth:</strong> ${new Date(student.date_of_birth).toLocaleDateString()} <span class="age-info">${age} years old${age < 18 ? ' 🚩' : ''}</span></p><p><strong>Days until next birthday:</strong> ${getDaysUntilNextBirthday(student.date_of_birth)} days</p>`}
      </div>
      <button class="clear-btn" onclick="clearResults()">Clear Results</button>
      <div class="opt-out">
        <button onclick="requestOptOut('${student.sr_no}')" class="opt-out-btn">Request to remove your data</button>
      </div>
    </div>`;
}

// Add this new function to handle opt-out requests
async function requestOptOut(srNo) {
  try {
    // First redirect to Google auth
    window.location.href = `http://localhost:3000/login?redirect=opt_out&sr_no=${srNo}`;
  } catch (error) {
    alert('Error processing your request');
    console.error('Opt-out error:', error);
  }
}

// Add some CSS for the opt-out button
const style = document.createElement('style');
style.textContent = `
  .opt-out-btn {
    background-color: #ff4444;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 10px;
  }
  .opt-out-btn:hover {
    background-color: #cc0000;
  }
`;
document.head.appendChild(style);

document.querySelector('form').addEventListener('submit', function (e) {
  e.preventDefault();
  if (selectedId) fetchStudentDetailsById(selectedId);
  else alert("Please select a student from the suggestions.");
});

function clearResults() {
  detailsDiv.innerHTML = '';
  searchBox.value = '';
  selectedId = null;
  searchBox.focus();
}

async function fetchInstagramProfile(username) {
  try {
    const res = await fetch(`https://instagram-looter2.p.rapidapi.com/profile?username=${username}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'instagram-looter2.p.rapidapi.com',
        'x-rapidapi-key': '88aeb65291msh5b235536e760ef3p1d760bjsn5e50da788f24'
      }
    });
    const data = await res.json();
    return { is_private: data.is_private, username: data.username };
  } catch {
    return null;
  }
}
