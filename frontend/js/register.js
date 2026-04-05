document.getElementById("registerForm").addEventListener("submit", async function(e) {

  e.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value;

  try {

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        email,
        password,
        role
      })
    });

    const data = await response.json();

    if (response.ok) {

      document.getElementById("message").innerText =
        "Registration successful! Redirecting to login...";

      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);

    } else {
      document.getElementById("message").innerText = data.message;
    }

  } catch (error) {
    document.getElementById("message").innerText = "Server error";
  }

});