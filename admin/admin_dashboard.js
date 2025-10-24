document.addEventListener("DOMContentLoaded", () => {
  fetch("http://localhost:5000/students")
    .then(res => res.json())
    .then(data => {
      let table = document.getElementById("studentTable");

      data.forEach(student => {
        let row = `
          <tr>
            <td>${student.alumni_id}</td>
            <td>${student.name}</td>
            <td>${student.dob}</td>
            <td>${student.department}</td>
            <td>${student.batch}</td>
            <td>${student.contact}</td>
            <td>${student.status}</td>
          </tr>`;
        table.innerHTML += row;
      });
    })
    .catch(err => console.error("Error fetching students:", err));
});
function addStudent(event) {
  event.preventDefault();

  let alumni_id = document.getElementById('alumni_id').value;
  let name = document.getElementById('name').value;
  let dob = document.getElementById('dob').value;
  let department = document.getElementById('department').value;
  let batch = document.getElementById('batch').value;
  let contact = document.getElementById('contact').value;
  let status = document.getElementById('status').value;

  const studentdata = {
    alumni_id,
    name,
    dob,
    department,
    batch,
    contact,
    status
  };

  fetch("http://localhost:5000/student", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(studentdata)
  })
  .then(res => res.json())
  .then(data => {
    console.log("✅ Server response:", data);

    // Add new row to table instantly
    let table = document.getElementById("studentTable");
    let row = `
      <tr>
        <td>${studentdata.alumni_id}</td>
        <td>${studentdata.name}</td>
        <td>${studentdata.dob}</td>
        <td>${studentdata.department}</td>
        <td>${studentdata.batch}</td>
        <td>${studentdata.contact}</td>
        <td>${studentdata.status}</td>
      </tr>`;
    table.innerHTML += row;

    // Reset form
    document.getElementById("studentForm").reset();
  })
  .catch(err => {
    console.error("❌ Error adding student:", err);
  });
  closeModal();
}
function openModal() {
  document.getElementById("studentModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("studentModal").style.display = "none";
}

// Close modal if clicked outside
window.onclick = function(event) {
  let modal = document.getElementById("studentModal");
  if (event.target === modal) {
    closeModal();
  }
}
