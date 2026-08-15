import { api } from './api.js'
import { renderNavbar } from './navbar.js'
import { renderStars, formatDate, getRatingFromRestaurant, getCategoryIcon } from './utils.js'

let activeTab = 'menu'

export async function renderRestaurantDetail(id) {
  document.querySelector('#app').innerHTML = `
    <div id="navbar"></div>
    <div class="container">
      <div class="loading">Loading restaurant details...</div>
    </div>
  `
  renderNavbar()

  let restaurant
  try {
    restaurant = await api.getRestaurant(id)
  } catch (err) {
    document.querySelector('.container').innerHTML = `
      <div class="empty-state"><div class="icon">😕</div><p>Restaurant not found.</p></div>
    `
    return
  }

  const { avg, count } = getRatingFromRestaurant(restaurant)

  const user = await api.getCurrentUser()
  let isFavorited = false
  if (user) {
    try {
      isFavorited = await api.checkFavorite(id)
    } catch {
      // ignore favorite check errors
    }
  }

  const icon = restaurant.categories?.icon || '🍽️'

  document.querySelector('.container').innerHTML = `
    <a class="back-btn" id="back-btn">← Back to restaurants</a>
    <div class="detail-header">
      <h1>${icon} ${restaurant.name}</h1>
      <div class="detail-meta">
        <span>${renderStars(avg)} ${avg.toFixed(1)} (${count} reviews)</span>
        <span>${restaurant.price_range}</span>
        <span>${restaurant.categories?.name || 'Uncategorized'}</span>
      </div>
      <div class="detail-desc">${restaurant.description}</div>
      <div class="detail-info">
        <span>📍 ${restaurant.address}</span>
        <span>📞 ${restaurant.phone}</span>
        <span>🕒 ${restaurant.hours}</span>
      </div>
      ${user ? `<button class="btn-favorite ${isFavorited ? 'favorited' : ''}" id="fav-btn">
        ${isFavorited ? '♥ Favorited' : '♡ Add to Favorites'}
      </button>` : ''}
    </div>

    <div class="tabs">
      <div class="tab ${activeTab === 'menu' ? 'active' : ''}" data-tab="menu">📋 Menu</div>
      <div class="tab ${activeTab === 'reviews' ? 'active' : ''}" data-tab="reviews">⭐ Reviews</div>
      <div class="tab ${activeTab === 'map' ? 'active' : ''}" data-tab="map">🗺️ Location</div>
    </div>
    <div class="tab-content" id="tab-content"></div>
  `

  document.querySelector('#back-btn').addEventListener('click', () => {
    window.location.hash = '#/'
  })

  if (user) {
    document.querySelector('#fav-btn').addEventListener('click', () => toggleFavorite(id))
  }

  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      activeTab = tab.getAttribute('data-tab')
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'))
      tab.classList.add('active')
      loadTabContent(id, restaurant, user)
    })
  })

  loadTabContent(id, restaurant, user)
}

async function loadTabContent(id, restaurant, user) {
  const content = document.querySelector('#tab-content')
  if (activeTab === 'menu') {
    await loadMenu(id, content)
  } else if (activeTab === 'reviews') {
    await loadReviews(id, content, user)
  } else if (activeTab === 'map') {
    loadMap(restaurant, content)
  }
}

async function loadMenu(id, content) {
  try {
    const items = await api.getMenu(id)

    if (!items || items.length === 0) {
      content.innerHTML = `<div class="empty-state"><div class="icon">📋</div><p>No menu items available.</p></div>`
      return
    }

    const grouped = {}
    items.forEach(item => {
      if (!grouped[item.category]) grouped[item.category] = []
      grouped[item.category].push(item)
    })

    const order = ['Appetizers', 'Mains', 'Sides', 'Desserts', 'Drinks']
    const categories = [...order.filter(c => grouped[c]), ...Object.keys(grouped).filter(c => !order.includes(c))]

    let html = '<div class="menu-list">'
    categories.forEach(cat => {
      html += `<div class="menu-section-title">${cat}</div>`
      grouped[cat].forEach(item => {
        html += `
          <div class="menu-item">
            <div class="item-info">
              <div class="item-name">
                ${item.is_vegetarian ? '<span class="veg-badge" title="Vegetarian"></span>' : ''}
                ${item.name}
              </div>
              <div class="item-desc">${item.description}</div>
            </div>
            <div class="item-price">$${Number(item.price).toFixed(2)}</div>
          </div>
        `
      })
    })
    html += '</div>'
    content.innerHTML = html
  } catch (err) {
    content.innerHTML = `<div class="empty-state">Error loading menu: ${err.message}</div>`
  }
}

async function loadReviews(id, content, user) {
  try {
    const reviews = await api.getReviews(id)

    let html = ''

    if (user) {
      html += `
        <div class="review-form">
          <h3>Write a Review</h3>
          <div class="rating-input" id="rating-input">
            <span data-val="1">★</span>
            <span data-val="2">★</span>
            <span data-val="3">★</span>
            <span data-val="4">★</span>
            <span data-val="5">★</span>
          </div>
          <textarea id="review-comment" placeholder="Share your experience..."></textarea>
          <button class="btn-primary" id="submit-review">Submit Review</button>
        </div>
      `
    } else {
      html += `
        <div class="login-prompt">
          Please <a id="login-link">login</a> to write a review.
        </div>
      `
    }

    if (!reviews || reviews.length === 0) {
      html += `<div class="empty-state"><div class="icon">⭐</div><p>No reviews yet. Be the first to review!</p></div>`
    } else {
      reviews.forEach(review => {
        const authorName = review.user_name || 'Anonymous'
        html += `
          <div class="review-item">
            <div class="review-header">
              <span class="review-author">${authorName}</span>
              <span class="review-date">${formatDate(review.created_at)}</span>
            </div>
            <div>${renderStars(review.rating)}</div>
            <div class="review-comment">${review.comment}</div>
          </div>
        `
      })
    }

    content.innerHTML = html

    if (user) {
      let selectedRating = 0
      const stars = content.querySelectorAll('#rating-input span')
      stars.forEach(span => {
        span.addEventListener('mouseover', () => {
          const val = parseInt(span.getAttribute('data-val'))
          stars.forEach((s, i) => s.classList.toggle('active', i < val))
        })
        span.addEventListener('mouseout', () => {
          stars.forEach((s, i) => s.classList.toggle('active', i < selectedRating))
        })
        span.addEventListener('click', () => {
          selectedRating = parseInt(span.getAttribute('data-val'))
          stars.forEach((s, i) => s.classList.toggle('active', i < selectedRating))
        })
      })

      content.querySelector('#submit-review').addEventListener('click', async () => {
        const comment = content.querySelector('#review-comment').value.trim()
        if (selectedRating === 0) {
          alert('Please select a rating.')
          return
        }
        try {
          await api.addReview(id, selectedRating, comment)
          activeTab = 'reviews'
          renderRestaurantDetail(id)
        } catch (err) {
          alert('Error submitting review: ' + err.message)
        }
      })
    } else {
      content.querySelector('#login-link').addEventListener('click', () => {
        window.location.hash = '#/login'
      })
    }
  } catch (err) {
    content.innerHTML = `<div class="empty-state">Error loading reviews: ${err.message}</div>`
  }
}

function loadMap(restaurant, content) {
  const lat = restaurant.latitude || 40.7128
  const lng = restaurant.longitude || -74.0060
  const destQuery = encodeURIComponent(`${lat},${lng}`)
  const destName = encodeURIComponent(restaurant.name + ' ' + restaurant.address)

  content.innerHTML = `
    <div class="map-container" id="map-container">
      <div id="map-loading" class="loading">Loading map...</div>
    </div>
    <div class="map-controls">
      <div class="map-address">
        <strong>Address:</strong> ${restaurant.address}<br>
        <span id="map-distance"></span>
      </div>
      <button class="btn-primary" id="get-directions">Get Directions</button>
    </div>
  `

  const leafletCss = document.createElement('link')
  leafletCss.rel = 'stylesheet'
  leafletCss.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
  if (!document.querySelector('link[href*="leaflet.css"]')) {
    document.head.appendChild(leafletCss)
  }

  import('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js').then(() => {
    initLeafletMap(lat, lng, restaurant)
  }).catch(() => {
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => initLeafletMap(lat, lng, restaurant)
    document.head.appendChild(script)
  })

  document.querySelector('#get-directions').addEventListener('click', () => {
    const osrmUrl = `https://routing.openstreetmap.de/?z=14&lat=${lat}&lon=${lng}&hl=en`
    window.open(osrmUrl, '_blank', 'noopener')
  })
}

function initLeafletMap(destLat, destLng, restaurant) {
  const L = window.L
  if (!L) return

  const container = document.querySelector('#map-container')
  if (!container) return
  container.innerHTML = ''

  const map = L.map('map-container').setView([destLat, destLng], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map)

  const destIcon = L.divIcon({
    className: 'dest-marker',
    html: '<div style="font-size:28px;line-height:1;">📍</div>',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  })

  const destMarker = L.marker([destLat, destLng], { icon: destIcon }).addTo(map)
  destMarker.bindPopup(`<strong>${restaurant.name}</strong><br>${restaurant.address}`)

  const userIcon = L.divIcon({
    className: 'user-marker',
    html: '<div style="font-size:28px;line-height:1;">👤</div>',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })

  const routeLine = L.polyline([], { color: '#e63946', weight: 5, opacity: 0.8, dashArray: '10, 8' }).addTo(map)
  let userMarker = null

  const distanceEl = document.querySelector('#map-distance')

  function showPosition(pos) {
    const userLat = pos.coords.latitude
    const userLng = pos.coords.longitude

    if (userMarker) {
      map.removeLayer(userMarker)
    }
    userMarker = L.marker([userLat, userLng], { icon: userIcon }).addTo(map)
    userMarker.bindPopup('You are here')

    fetchRoute(userLat, userLng, destLat, destLng, routeLine, map)

    const dist = calculateDistance(userLat, userLng, destLat, destLng)
    if (distanceEl) {
      const miles = (dist * 0.621371).toFixed(1)
      const km = dist.toFixed(1)
      distanceEl.innerHTML = `<strong>Distance:</strong> ~${miles} miles (${km} km) from your location`
    }

    const bounds = L.latLngBounds([[userLat, userLng], [destLat, destLng]])
    map.fitBounds(bounds, { padding: [60, 60] })
  }

  function showError(err) {
    if (distanceEl) {
      distanceEl.innerHTML = '<em>Could not get your location. Click "Get Directions" to open the route in a new tab.</em>'
    }
    destMarker.openPopup()
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition, showError, { timeout: 10000 })
  } else {
    showError()
  }
}

async function fetchRoute(userLat, userLng, destLat, destLng, routeLine, map) {
  const url = `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${destLng},${destLat}?overview=full&geometries=geojson`
  try {
    const response = await fetch(url)
    const data = await response.json()
    if (data && data.routes && data.routes[0]) {
      const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]])
      routeLine.setLatLngs(coords)
    }
  } catch {
    const directLine = [[userLat, userLng], [destLat, destLng]]
    routeLine.setLatLngs(directLine)
  }
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

async function toggleFavorite(restaurantId) {
  const btn = document.querySelector('#fav-btn')
  try {
    const isFav = btn.classList.contains('favorited')
    if (isFav) {
      await api.removeFavorite(restaurantId)
      btn.classList.remove('favorited')
      btn.innerHTML = '♡ Add to Favorites'
    } else {
      await api.addFavorite(restaurantId)
      btn.classList.add('favorited')
      btn.innerHTML = '♥ Favorited'
    }
  } catch (err) {
    alert('Error updating favorite: ' + err.message)
  }
}
