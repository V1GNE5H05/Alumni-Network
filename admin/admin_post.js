document.getElementById('showFormBtn').addEventListener('click', function() {
  var form = document.getElementById('postForm');
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
});

document.getElementById('postForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const description = document.getElementById('description').value;
  const imageUrl = document.getElementById('imageUrl').value;
  const author = "Mepco Schlenk Engineering College";
  const time = new Date().toLocaleString();

  fetch('http://localhost:5000/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ author, content: description, imageUrl, time })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      document.getElementById('result').innerHTML = "Post created successfully!";
      document.getElementById('postForm').reset();
      document.getElementById('postForm').style.display = 'none';
    } else {
      document.getElementById('result').innerHTML = "Error: " + (data.message || 'Could not create post');
    }
  })
  .catch(err => {
    document.getElementById('result').innerHTML = "Error: " + err;
  });
});
