
const identifier = sessionStorage.getItem('loggedInUser');
const API_URL = window.API_BASE_URL || 'http://localhost:5000';

// Fetch and display profile
fetch(`${API_URL}/profile/${identifier}`)
	.then(res => res.json())
	.then(profile => {
		document.getElementById("name").innerHTML = profile.name || identifier || "Username/Email";
		document.getElementById("alumni_id").innerHTML = profile.alumni_id || "Alumni ID";
		document.getElementById("batch").innerHTML = profile.batch || "Batch";
		document.getElementById("mail").innerHTML = profile.email || "Mail";
	});

// Fetch and display posts
fetch(`${API_URL}/posts`)
	.then(res => res.json())
	.then(posts => {
		let postsHtml = '';
		// Reverse posts array to display last posted first (stack order)
		posts.slice().reverse().forEach((post, idx) => {
			postsHtml += `<div class="post" data-idx="${idx}" style="margin-bottom:20px;padding:10px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.12);background:#fff;cursor:pointer;">
				<label style="font-weight:bold;">${post.author || 'Unknown'}</label><br><br>
				<label style="color:gray;">${post.time || ''}</label><br>
				${post.imageUrl ? `<img src="${API_URL}${post.imageUrl}" alt="user post" style="width: 500px; height: 400px; position:relative; left:150px; margin:25px;">` : `<img src="images/alternate.png" alt="alternate" style="width: 400px; height: 300px;">`}
				<p>${post.content || ''}</p>
			</div>`;
		});
		document.getElementById("post").innerHTML = postsHtml;
	});

// Fetch and display events
fetch(`${API_URL}/events`)
	.then(res => res.json())
	.then(events => {
		let eventsHtml = '';
		events.forEach(event => {
			eventsHtml += `<div class="event-details">
				<label class="event-label">${event.title || ''} 🔗</label>
				<label><a href="${event.link || '#'}" target="_blank">click here</a></label>
			</div>`;
		});
		document.querySelector('.event-lister').innerHTML += eventsHtml;
	});