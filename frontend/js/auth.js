document.getElementById("loginForm").addEventListener("submit", async function (e) {

  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {

    const response = await fetch("http://localhost:5000/api/auth/login", {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        email,
        password
      })

    });

    const data = await response.json();

    if (response.ok) {

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      document.getElementById("message").innerText =
        "Login successful! Redirecting...";

      setTimeout(() => {

        if (data.user.role === "admin") {
          window.location.href = "admin.html";
        } else {
          window.location.href = "dashboard.html";
        }

      }, 1000);

    } else {

      document.getElementById("message").innerText =
        data.message || "Login failed";

    }

  } catch (error) {

    document.getElementById("message").innerText = "Server error";

  }

});