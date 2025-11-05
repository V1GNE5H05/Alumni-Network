
// Auto-detect API URL
const API_BASE_URL = window.API_BASE_URL || 'http://localhost:5000';

function login() {
    var identifier = document.getElementById("username").value.trim();
    var password = document.getElementById("password").value;

    // Client-side validation
    if (!identifier || !password) {
        alert("❌ Please enter both username and password!");
        return;
    }

    fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ identifier: identifier, password: password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Store identifier in sessionStorage
            sessionStorage.setItem('loggedInUser', identifier);
            if(identifier == "admin") {
                window.location.href = "../admin/admin_portal.html";
            }
            else {
                window.location.href = "../home page/home_page.html";
            }
        } else {
            // Show user-friendly error messages
            const errorMessage = data.message || "Invalid credentials. Please check your username and password.";
            alert("❌ " + errorMessage);
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("❌ An error occurred. Please check your internet connection and try again.");
    });
}

// Admin: Add new alumni user (userid and password same)
function addAlumniUser() {
    var userid = prompt("Enter new alumni userid:");
    if (!userid) return alert("Userid required");
    fetch(`${API_BASE_URL}/add-user`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ userid: userid })
    })
    .then(response => response.json())
    .then(data => {
        if (data.userid) {
            alert("Alumni user added: " + data.userid);
        } else {
            alert("Error: " + (data.message || data.error));
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("An error occurred. Please try again.");
    });
}