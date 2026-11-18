document.addEventListener('DOMContentLoaded', function () {
    const resetForm = document.getElementById('resetForm');
    const resetMessage = document.getElementById('resetMessage');
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userId = urlParams.get('id');

    resetForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const password = document.getElementById('password').value;

        if (password.length < 8) {
            resetMessage.textContent = 'Password must be at least 8 characters.';
            return;
        }

        try {
            const response = await fetch('/reset/resetPassword', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password, token, userId })
            });

            const jsonResponse = await response.json();

            if (response.status === 200) {
                resetMessage.textContent = jsonResponse.message;
            } else {
                resetMessage.textContent = jsonResponse.message || jsonResponse.error || 'An error occurred. Please try again.';
            }
        } catch (error) {
            console.error(error);
            resetMessage.textContent = 'An error occurred. Please try again.';
        }
    });
});
