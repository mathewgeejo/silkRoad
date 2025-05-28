async function checkAuthState() {
    try {
        const response = await fetch('http://127.0.0.1:3000/', {
            credentials: 'include'
        });
        const data = await response.json();
        
        const authLinks = document.getElementById('authLinks');
        if (data.user) {
            authLinks.innerHTML = `
                <div class="user-profile">
                    <img src="${data.user.picture}" alt="Profile" class="profile-pic">
                    <div class="profile-dropdown">
                        <span>${data.user.name}</span>
                        <a href="#" onclick="logout()">Logout</a>
                    </div>
                </div>
            `;
        } else {
            authLinks.innerHTML = `
                <a href="http://127.0.0.1:3000/login" class="login-btn">Login with Google</a>
            `;
        }
    } catch (error) {
        console.error('Auth check failed:', error);
    }
}

async function logout() {
    try {
        await fetch('http://127.0.0.1:3000/logout', {
            credentials: 'include'
        });
        window.location.reload();
    } catch (error) {
        console.error('Logout failed:', error);
    }
}

// Check auth state on page load
document.addEventListener('DOMContentLoaded', checkAuthState);