document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('certificateForm');
    const previewName = document.getElementById('previewName');
    const previewCourse = document.getElementById('previewCourse');
    const previewDate = document.getElementById('previewDate');
    const previewType = document.getElementById('previewType');

    // Update preview as user types
    document.getElementById('fullName').addEventListener('input', (e) => {
        previewName.textContent = e.target.value || 'Your Name';
    });

    document.getElementById('courseTitle').addEventListener('input', (e) => {
        previewCourse.textContent = e.target.value || 'Course Title';
    });

    document.getElementById('completionDate').addEventListener('input', (e) => {
        const date = new Date(e.target.value);
        previewDate.textContent = date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    });

    document.getElementById('certificateType').addEventListener('change', (e) => {
        previewType.textContent = e.target.options[e.target.selectedIndex].text;
    });

    // Handle form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Certificate generation feature coming soon!');
    });
});
