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
    const res = await fetch(`http://localhost:3000/suggest?q=${encodeURIComponent(value)}`);
    const data = await res.json();
    if (!data.length) {
      suggestions.style.display = 'none';
      suggestions.innerHTML = '';
      return;
    }
    suggestions.innerHTML = data.map((item, idx) =>
      `<div class="suggestion" data-idx="${idx}" data-id="${item.id}">
        <span class="suggestion-name">${item.name}</span>
        <span class="suggestion-department">${item.department || ''}</span>
       </div>`
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
  if (e.target.closest('.suggestion')) {
    const suggestion = e.target.closest('.suggestion');
    const nameElement = suggestion.querySelector('.suggestion-name');
    searchBox.value = nameElement.textContent.trim();
    selectedId = suggestion.getAttribute('data-id');
    suggestions.style.display = 'none';
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
      const selectedItem = items[activeIndex];
      const nameElement = selectedItem.querySelector('.suggestion-name');
      searchBox.value = nameElement.textContent.trim();
      selectedId = selectedItem.getAttribute('data-id');
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

function getDaysUntilNextBirthday(dateOfBirth) {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  const nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());

  if (today > nextBirthday) {
    nextBirthday.setFullYear(today.getFullYear() + 1);
  }
  const diffTime = nextBirthday - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));  
  return diffDays;
}

// Fetch and display student details by id
async function fetchStudentDetailsById(id) {
  try {
    const res = await fetch(`http://localhost:3000/student?id=${encodeURIComponent(id)}`);
    const data = await res.json();
    const detailsDiv = document.getElementById('studentDetails');
    if (data.length) {
      const student = data[0];
      const dobDate = new Date(student.date_of_birth);
      const is1970Date = dobDate.getFullYear() === 1970 && dobDate.getMonth() === 0 && dobDate.getDate() === 1;
      const age = !is1970Date && student.date_of_birth ? calculateAge(student.date_of_birth) : null;
      
      // Render initial content
      renderStudentDetails(student, is1970Date, age, detailsDiv);
      
      // Fetch Instagram data separately
      if (student.Instagram_id) {
        fetchInstagramProfile(student.Instagram_id).then(instagramProfile => {
          if (instagramProfile) {
            const statusElement = document.querySelector('.instagram-status');
            if (statusElement) {
              statusElement.innerHTML = `
                <span class="account-status ${instagramProfile.is_private ? 'private' : 'public'}">
                  ${instagramProfile.is_private ? '🔒 Private' : '🌐 Public'}
                </span>`;
            }
          }
        });
      }
    } else {
      detailsDiv.innerHTML = `<div class="student-card">No student found.</div>`;
    }
  } catch (error) {
    console.error('Error fetching student details:', error);
    document.getElementById('studentDetails').innerHTML = `<div class="student-card">Error loading student details.</div>`;
  }
}

// Add this new function to handle the rendering
function renderStudentDetails(student, is1970Date, age, detailsDiv) {
  detailsDiv.innerHTML = `
    <div class="student-card">
      <h2 class="student-name">${student.name}</h2>
      <div class="social-links">
        ${student.Instagram_id ? `
          <div class="social-item">
            <span class="social-platform">Instagram</span>
            <div class="instagram-info">
              <span class="social-id">
                <a href="https://instagram.com/${student.Instagram_id}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation();">
                  @${student.Instagram_id}
                </a>
                <span class="instagram-status"></span>
              </span>
            </div>
          </div>
        ` : `
          <div class="social-item">
            <span class="social-platform">Instagram</span>
            <span class="social-id">Instagram ID not yet available 😢</span>
          </div>
        `}
        ${student.father_mobile ? `
          <div class="social-item">
            <span class="social-platform">Phone</span>
            <div class="phone-info">
              <span class="social-id">
                <a href="tel:${student.father_mobile}" onclick="event.stopPropagation();">
                 ${student.father_mobile}
                </a>
              </span>
            </div>
          </div>
        ` : `
          <div class="social-item">
            <span class="social-platform">Phone</span>
            <span class="social-id">Phone number not available 📱</span>
          </div>
        `}
        ${student.Snapchat_id ? `
          <div class="social-item">
            <span class="social-platform">Snapchat</span>
            <span class="social-id">${student.Snapchat_id}</span>
          </div>
        ` : ``}
      </div>
      <div class="student-info">
        ${is1970Date ? 
          `<p>DOB not available</p>` : 
          student.date_of_birth ? 
            `<p><strong>Date of Birth:</strong> ${new Date(student.date_of_birth).toLocaleDateString()}${age !== null ? `<span class="age-info">${age} years old${age < 18 ? ' 🚩' : ''}</span>` : ''}</p>
             <p><strong>Days until next birthday:</strong> ${getDaysUntilNextBirthday(student.date_of_birth)} days</p>` : 
            ''}
      </div>
      <button class="clear-btn" onclick="clearResults()">Clear Results</button>
      <div class="opt-out">
        <a href="https://forms.gle/your-opt-out-form" target="_blank" rel="noopener noreferrer">
          🔒 Request to remove your data
        </a>
      </div>
    </div>
  `;
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

// Add this function after the existing code

async function fetchInstagramProfile(username) {
  try {
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'instagram-looter2.p.rapidapi.com',
        'x-rapidapi-key': '88aeb65291msh5b235536e760ef3p1d760bjsn5e50da788f24'
      }
    };
    const response = await fetch(`https://instagram-looter2.p.rapidapi.com/profile?username=${username}`, options);
    const data = await response.json();
    return {
      is_private: data.is_private,
      username: data.username
    };
  } catch (error) {
    console.error('Error fetching Instagram profile:', error);
    return null;
  }
}