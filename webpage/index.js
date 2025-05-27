// Fetch student statistics from the backend
async function fetchStatistics() {
    try {
        const response = await fetch('http://localhost:3000/statistics');
        const data = await response.json();
        
        // Update the statistics on the page
        document.getElementById('studentCount').textContent = data.studentCount.toLocaleString();
        document.getElementById('departmentCount').textContent = data.departmentCount.toLocaleString();
    } catch (error) {
        console.error('Error fetching statistics:', error);
        // Set fallback values if the fetch fails
        document.getElementById('studentCount').textContent = '500+';
        document.getElementById('departmentCount').textContent = '10+';
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    fetchStatistics();
});
