document.addEventListener("DOMContentLoaded", function () {
    const resetButton = document.getElementById("resetButton");
    const emailInput = document.getElementById("email");
    const responseMessage = document.getElementById("responseMessage");

    resetButton.addEventListener("click", async () => {
        const email = emailInput.value;
        if (!email) {
            responseMessage.textContent = "Please enter your email.";
            return;
        }

        try {
            resetButton.disabled = true;
            resetButton.textContent = "Loading...";

            const response = await fetch("/reset/requestResetPassword", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                resetButton.textContent = "Request Sent!";
                responseMessage.textContent = "Password reset request sent.";
                let countdown = 5;
                const countdownInterval = setInterval(() => {
                    responseMessage.textContent = `Password reset request sent. Redirecting to homepage in ${countdown} seconds...`;
                    countdown -= 1;
                    if (countdown === 0) {
                        clearInterval(countdownInterval);
                        window.location.href = "/authpage";
                    }
                }, 1000);
            } else {
                responseMessage.textContent = data.message || "Error occurred.";
                resetButton.disabled = false;
                resetButton.textContent = "Reset Password";
            }
        } catch (error) {
            console.error(error);
            responseMessage.textContent = "An error occurred.";
            resetButton.disabled = false;
            resetButton.textContent = "Reset Password";
        }
    });
});
