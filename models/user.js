// Handle Sign Up form submission
if (document.getElementById('signupForm')) {
    document.getElementById('signupForm').addEventListener('submit', async function(event) {
        event.preventDefault();

        const newUsername = document.getElementById('new-username').value;
        const newPassword = document.getElementById('new-password').value;

        // Password validation
        const passwordCriteria = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%?&])[A-Za-z\d@$!%?&]{8,}$/;


        if (!passwordCriteria.test(newPassword)) {
            document.getElementById('error-message').innerText = 'Password does not meet criteria.';
            return;
        }

        try {
            const response = await fetch('/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: newUsername, password: newPassword })
            });

            if (response.ok) {
                alert('Account successfully created!');
                window.location.href = 'login.html'; // Redirect to login page
            } else {
                const error = await response.json();
                document.getElementById('error-message').innerText = error.error;
            }
        } catch (error) {
            document.getElementById('error-message').innerText = 'An error occurred while signing up.';
        }
    });
}

// Handle Login form submission
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async function(event) {
        event.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                alert('Login successful!');
                window.location.href = 'main.html'; // Redirect to main program page
            } else {
                const error = await response.json();
                document.getElementById('error-message').innerText = error.error;
            }
        } catch (error) {
            document.getElementById('error-message').innerText = 'An error occurred while logging in.';
        }
    });
}


