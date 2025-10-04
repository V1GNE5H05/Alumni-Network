
const loggedInUser = sessionStorage.getItem('loggedInUser');
console.log("Fetching profile for:", loggedInUser);
fetch(`http://localhost:5000/profile/${loggedInUser}`)
  .then(response => {
    console.log("Profile response status:", response.status);
    return response.json();
  })
  .then(data => {
    console.log("Profile data:", data);
    if (!data || data.message === 'Profile not found') {
      document.getElementById('alumni_name').textContent = 'Profile not found';
      // Optionally clear other fields or show an error message
      return;
    }
  document.getElementById('alumni_name').textContent = data.name || '';
  document.getElementById('alumni_gender').textContent = data.gender || '';
  document.getElementById('alumni_dob').textContent = data.dob || '';
  document.getElementById('alumni_id').textContent = data.alumni_id || '';
  document.getElementById('alumni_batch').textContent = data.batch || '';
  document.getElementById('alumni_department').textContent = data.department || '';
  document.getElementById('alumni_address').textContent = data.address || '';
  document.getElementById('alumni_city').textContent = data.city || '';
  document.getElementById('alumni_district').textContent = data.district || '';
  document.getElementById('alumni_pincode').textContent = data.pincode || '';
  document.getElementById('alumni_phone').textContent = data.phone || '';
  document.getElementById('alumni_email').textContent = data.email || '';
  document.getElementById('alumni_designation').textContent = data.designation || '';
  document.getElementById('alumni_company').textContent = data.company || '';

  // Fill edit form fields as well
  document.getElementById('edit_name').value = data.name || '';
  document.getElementById('edit_gender').value = data.gender || '';
  document.getElementById('edit_dob').value = data.dob || '';
  document.getElementById('edit_id').value = data.alumni_id || '';
  document.getElementById('edit_batch').value = data.batch || '';
  document.getElementById('edit_department').value = data.department || '';
  document.getElementById('edit_address').value = data.address || '';
  document.getElementById('edit_city').value = data.city || '';
  document.getElementById('edit_district').value = data.district || '';
  document.getElementById('edit_pincode').value = data.pincode || '';
  document.getElementById('edit_phone').value = data.phone || '';
  document.getElementById('edit_email').value = data.email || '';
  document.getElementById('edit_designation').value = data.designation || '';
  document.getElementById('edit_company').value = data.company || '';
  })
  .catch(err => {
    document.getElementById('alumni_name').textContent = 'Error fetching profile';
    console.error('Error fetching alumni profile:', err);
  });
