// Use this URL to fetch NASA APOD JSON data.
const apodData = 'https://cdn.jsdelivr.net/gh/GCA-Classroom/apod/data.json';

// DOM references
const getImageBtn = document.getElementById('getImageBtn');
const gallery = document.getElementById('gallery');

// Small set of fun space facts for the random fact feature
const spaceFacts = [
	"A day on Venus is longer than a year on Venus.",
	"Neutron stars can spin up to 716 times per second.",
	"There are more trees on Earth than stars in the Milky Way.",
	"A spoonful of neutron star would weigh about a billion tons.",
	"Space is not completely empty — it contains a few atoms per cubic meter.",
	"The footprints on the Moon will likely remain for millions of years.",
	"Jupiter's Great Red Spot is a storm larger than Earth and has lasted for centuries.",
];

// Helper: format date (YYYY-MM-DD -> more readable)
function formatDate(isoDate) {
	try {
		const d = new Date(isoDate);
		return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
	} catch (e) {
		return isoDate;
	}
}

// Show a short loading placeholder in the gallery
function showLoading() {
	gallery.innerHTML = '';
	const placeholder = document.createElement('div');
	placeholder.className = 'placeholder';
	placeholder.innerHTML = '<div class="placeholder-icon">🔄</div><p>Loading space photos…</p>';
	gallery.appendChild(placeholder);
}

// Show an error message in the gallery
function showError(message) {
	gallery.innerHTML = '';
	const err = document.createElement('div');
	err.className = 'placeholder';
	err.innerHTML = `<div class="placeholder-icon">⚠️</div><p>${message}</p>`;
	gallery.appendChild(err);
}

// Create and show a modal with given content (image or iframe) and details
function openModal({ mediaType, src, title, date, explanation }) {
	// overlay
	const overlay = document.createElement('div');
	overlay.className = 'modal-overlay';
	overlay.tabIndex = -1;

	// modal box
	const box = document.createElement('div');
	box.className = 'modal-box';

	// close button
	const closeBtn = document.createElement('button');
	closeBtn.className = 'modal-close';
	closeBtn.innerHTML = '✖';
	closeBtn.addEventListener('click', () => document.body.removeChild(overlay));

	// media container
	const mediaWrap = document.createElement('div');
	mediaWrap.className = 'modal-media';

			if (mediaType === 'video') {
				// Show a large thumbnail in the modal and provide a "Watch on YouTube" link.
				// Accept a `thumbnail` property when calling openModal (fallbacks below).
				const thumbUrl = (typeof thumbnail !== 'undefined' && thumbnail) || null;

				// Helper: extract YouTube watch URL from many APOD-provided URL formats
				function makeWatchUrl(url) {
					if (!url) return url;
					try {
						if (url.includes('youtube.com/watch')) return url;
						const idMatch = url.match(/(?:v=|embed\/|vi\/|youtu.be\/)([A-Za-z0-9_-]{6,})/);
						const id = idMatch ? idMatch[1] : null;
						if (id) return `https://www.youtube.com/watch?v=${id}`;
					} catch (e) {}
					return url;
				}

				// If no thumbnail provided, try to derive it from the YouTube id
				function makeYouTubeThumbFromUrl(url) {
					if (!url) return null;
					try {
						const idMatch = url.match(/(?:v=|embed\/|vi\/|youtu.be\/)([A-Za-z0-9_-]{6,})/);
						const id = idMatch ? idMatch[1] : null;
						if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
					} catch (e) {}
					return null;
				}

				const finalThumb = thumbUrl || makeYouTubeThumbFromUrl(src) || '';

				const thumbImg = document.createElement('img');
				thumbImg.src = finalThumb;
				thumbImg.alt = title || 'Video thumbnail';
				thumbImg.className = 'modal-image';
				mediaWrap.appendChild(thumbImg);

				// Centered big play overlay on the thumbnail
				const modalPlay = document.createElement('div');
				modalPlay.className = 'modal-play-overlay';
				modalPlay.textContent = '▶';
				mediaWrap.appendChild(modalPlay);

				// Watch button (opens new tab)
				const actions = document.createElement('div');
				actions.className = 'video-actions';
				const watchUrl = makeWatchUrl(src);
				const openBtn = document.createElement('a');
				openBtn.className = 'watch-btn';
				openBtn.href = watchUrl || src;
				openBtn.target = '_blank';
				openBtn.rel = 'noopener noreferrer';
				openBtn.textContent = 'Watch on YouTube';
				actions.appendChild(openBtn);
				mediaWrap.appendChild(actions);

				// Also open when clicking the thumbnail or play overlay
				function openExternal() {
					window.open(watchUrl || src, '_blank', 'noopener');
				}
				thumbImg.addEventListener('click', openExternal);
				modalPlay.addEventListener('click', openExternal);
			} else {
		const img = document.createElement('img');
		img.src = src;
		img.alt = title || 'APOD image';
		img.className = 'modal-image';
		mediaWrap.appendChild(img);
	}

	// details
	const details = document.createElement('div');
	details.className = 'modal-details';
	const h = document.createElement('h2');
	h.textContent = title || '';
	const d = document.createElement('p');
	d.className = 'modal-date';
	d.textContent = formatDate(date || '');
	const ex = document.createElement('p');
	ex.className = 'modal-expl';
	ex.textContent = explanation || '';

	details.appendChild(h);
	details.appendChild(d);
	details.appendChild(ex);

	box.appendChild(closeBtn);
	box.appendChild(mediaWrap);
	box.appendChild(details);
	overlay.appendChild(box);

	// close on overlay click (but not when clicking inside box)
	overlay.addEventListener('click', (e) => {
		if (e.target === overlay) document.body.removeChild(overlay);
	});

	// close on Escape
	function onEsc(e) {
		if (e.key === 'Escape') {
			if (document.body.contains(overlay)) document.body.removeChild(overlay);
			document.removeEventListener('keydown', onEsc);
		}
	}
	document.addEventListener('keydown', onEsc);

	document.body.appendChild(overlay);
}

// Render gallery items given parsed JSON array
function renderGallery(items) {
	gallery.innerHTML = '';

	if (!Array.isArray(items) || items.length === 0) {
		showError('No images found.');
		return;
	}

	// create a grid of items
	items.forEach((item) => {
		const card = document.createElement('article');
		card.className = 'gallery-item';

		// thumbnail area
		const thumbWrap = document.createElement('div');
		thumbWrap.className = 'thumb-wrap';

		if (item.media_type === 'video') {
			const thumb = document.createElement('img');
			thumb.className = 'video-thumb';
			// prefer thumbnail_url, fallback to a placeholder
			thumb.src = item.thumbnail_url || item.url || '';
			thumb.alt = item.title || 'Video thumbnail';
			thumb.loading = 'lazy';
			// overlay play icon
			const play = document.createElement('div');
			play.className = 'play-overlay';
			play.textContent = '▶';
			thumbWrap.appendChild(thumb);
			thumbWrap.appendChild(play);
		} else {
			const img = document.createElement('img');
			img.src = item.url || item.hdurl || '';
			img.alt = item.title || 'Space image';
			img.loading = 'lazy';
			thumbWrap.appendChild(img);
		}

		// title & date
		const info = document.createElement('div');
		info.className = 'gallery-info';
		const t = document.createElement('p');
		t.className = 'gallery-title';
		t.textContent = item.title || '';
		const d = document.createElement('p');
		d.className = 'gallery-date';
		d.textContent = formatDate(item.date || '');
		info.appendChild(t);
		info.appendChild(d);

		card.appendChild(thumbWrap);
		card.appendChild(info);

		// click to open modal
			card.addEventListener('click', () => {
				if (item.media_type === 'video') {
					// open modal with thumbnail and external watch link
					openModal({ mediaType: 'video', src: item.url, thumbnail: item.thumbnail_url, title: item.title, date: item.date, explanation: item.explanation });
				} else {
					// prefer hdurl for modal if present
					openModal({ mediaType: 'image', src: item.hdurl || item.url, title: item.title, date: item.date, explanation: item.explanation });
				}
			});

		gallery.appendChild(card);
	});
}

// Insert random space fact above gallery
function showRandomFact() {
	// avoid duplicating if already present
	if (document.querySelector('.fact-box')) return;
	const factBox = document.createElement('div');
	factBox.className = 'fact-box';
	const fact = spaceFacts[Math.floor(Math.random() * spaceFacts.length)];
	factBox.innerHTML = `<strong>Did you know?</strong> ${fact}`;

	// Insert before gallery in the container
	const container = gallery.parentElement || document.body;
	container.insertBefore(factBox, gallery);
}

// Fetch data and render gallery — triggered by the button
async function fetchAndShow() {
	// prevent double clicks
	getImageBtn.disabled = true;
	showLoading();

	try {
		const res = await fetch(apodData);
		if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
		const data = await res.json();

		// show random fact (only once per load)
		showRandomFact();

		// Render the gallery
		renderGallery(data);
	} catch (err) {
		console.error(err);
		showError('Unable to load images. Please try again later.');
	} finally {
		getImageBtn.disabled = false;
	}
}

// Attach event
getImageBtn.addEventListener('click', fetchAndShow);

// Also show a random fact when page first loads
document.addEventListener('DOMContentLoaded', showRandomFact);