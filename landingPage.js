document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('journal-btn').addEventListener('click', function() {
        window.location.href = '/Journal.html'; 
    });
    document.getElementById('budget-btn').addEventListener('click', function() {
        window.location.href = '/Budget.html'; 
    });
    document.getElementById('travelPlan-btn').addEventListener('click', function() {
        window.location.href = 'TravelPlanner.html'; 
    });
    document.getElementById('destination-btn').addEventListener('click', function() {
        window.location.href = 'Destination.html'; 
    });
    document.getElementById('review-btn').addEventListener('click', function() {
        window.location.href = 'Reviews.html'; 
    });

    document.getElementById('logout-btn').addEventListener('click', function() {
        fetch('/logout', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        })
        .then(response => {
            if (response.ok) {
                window.location.href = '/';
            } else {
                alert('Failed to logout');
            }
        })
        .catch(error => console.error('Error logging out:', error));
    });

    document.getElementById('deleteUser-btn').addEventListener('click', function() {
        fetch('/deleteUser', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'User deleted successfully') {
                window.location.href = '/';
            } else {
                alert('Failed to delete user');
            }
        })
        .catch(error => console.error('Error deleting user:', error));
    });
});
