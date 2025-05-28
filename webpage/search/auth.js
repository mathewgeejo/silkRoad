async function checkAuthState() {
    try {
        const response = await fetch('http://127.0.0.1:3000/auth/status', {
            credentials: 'include'
        });
        
        const data = await response.json();
        const userProfilePic = document.getElementById('userProfilePic');
        const loginBtn = document.getElementById('loginBtn');

        if (data.authenticated && data.user) {
            userProfilePic.src = data.user.picture;
            userProfilePic.style.display = 'block';
            loginBtn.style.display = 'none';
        } else {
            userProfilePic.style.display = 'none';
            loginBtn.style.display = 'block';
        }
    } catch (error) {
        console.error('Error checking auth state:', error);
    }
}

// Check auth state when page loads
document.addEventListener('DOMContentLoaded', checkAuthState);