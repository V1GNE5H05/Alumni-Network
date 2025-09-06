
const userEmail = localStorage.getItem('email');

// Fetch and display profile
fetch(`http://localhost:5000/profile/${userEmail}`)
	.then(res => res.json())
	.then(profile => {
		document.getElementById("name").innerHTML = profile.name || "Username";
		document.getElementById("batch").innerHTML = profile.batch || "Batch";
		document.getElementById("mail").innerHTML = profile.email || "Mail";
		// Optionally update profile image if available
		// document.querySelector('.profile img').src = profile.imageUrl || "images/user.png";
	});

// Fetch and display posts
fetch('http://localhost:5000/posts')
	.then(res => res.json())
	.then(posts => {
		let postsHtml = '';
		posts.forEach((post, idx) => {
			postsHtml += `<div class="post" data-idx="${idx}" style="margin-bottom:20px;padding:10px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.12);background:#fff;cursor:pointer;">
				<label style="font-weight:bold;">${post.author || 'Unknown'}</label><br>
				<label style="color:gray;">${post.time || ''}</label><br>
				${post.imageUrl ? `<img src="http://localhost:5000${post.imageUrl}" alt="user post" style="width: 400px; height: 300px;">` : `<img src="images/alternate.png" alt="alternate" style="width: 400px; height: 300px;">`}
				<p>${post.content || ''}</p>
			</div>`;
		});
		document.getElementById("post").innerHTML = postsHtml;

		// Add click event to each post
		/*document.querySelectorAll('.post').forEach((el, i) => {
			el.addEventListener('click', function() {
				// Hide right-side event div
				document.querySelector('.event-lister').style.display = 'none';
				// Show post details in right side
				let post = posts[i];
				/*let detailHtml = `<div class="post-detail" style="margin:15px;padding:20px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.12);background:#fff;">
					<h2>Post Details</h2>
					<label style="font-weight:bold;">${post.author || 'Unknown'}</label><br>
					<label style="color:gray;">${post.time || ''}</label><br>
					${post.imageUrl ? `<img src="${post.imageUrl}" alt="user post" style="width: 400px; height: 300px;">` : ''}
					<p>${post.content || ''}</p>
					<button id="closeDetail">Close</button>
				</div>`;
				// Insert into right side
				let mainContent = document.querySelector('.main-content');
				let oldDetail = document.getElementById('post-detail-right');
				if (oldDetail) oldDetail.remove();
				let detailDiv = document.createElement('div');
				detailDiv.id = 'post-detail-right';
				detailDiv.innerHTML = detailHtml;
				detailDiv.style.width = '300px';
				mainContent.appendChild(detailDiv);
				// Close button restores event-lister
				document.getElementById('closeDetail').onclick = function() {
					detailDiv.remove();
					document.querySelector('.event-lister').style.display = '';
				};
			});
		});*/
	});

// Fetch and display events
fetch('http://localhost:5000/events')
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