document.addEventListener('DOMContentLoaded', function() {
    fetch('/getCurrentUser') 
        .then(response => response.json())
        .then(data => {
            document.getElementById('username').textContent = data.username || 'Guest';
        })
        .catch(error => {
            console.error('Error fetching user data:', error);
            document.getElementById('username').textContent = '';
        });

    document.getElementById('journal-btn').addEventListener('click', function() {
        window.location.href = '/Journal.html'; 
    });
    document.getElementById('budget-btn').addEventListener('click', function() {
        window.location.href = '/Budget.html'; 
    });
});