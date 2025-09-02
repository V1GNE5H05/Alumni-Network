function login() {
    var email = document.getElementById("username").value;
    var password = document.getElementById("password").value;

    if (email == "al" && password=="al") {
        window.location.href = "../home page/home_page.html";
    }
    else if(email == "admin" && password == "admin") {
        window.location.href = "../admin/admin_portal.html";
    }
    else {
         alert("Invalid credentials");
    }
    /*fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: email, password: password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if(email == "admin") {
                window.location.href = "../admin/admin_portal.html";
            }
            else {
                window.location.href = "../home page/home_page.html";
            }
        } else {
            alert("Invalid credentials");
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("An error occurred. Please try again.");
    });*/
}