import { api } from './api.js'
import { renderNavbar } from './navbar.js'
import { renderStars, getRatingFromRestaurant, getCategoryIcon } from './utils.js'

export async function renderFavoritesPage() {
  const user = await api.getCurrentUser()
  if (!user) {
    window.location.hash = '#/login'
    return
  }

  document.querySelector('#app').innerHTML = `
    <div id="navbar"></div>
    <div class="container">
      <h2 class="section-title">♥ My Favorite Kathmandu Spots</h2>
      <div class="restaurant-grid" id="favorites-grid">
        <div class="loading">Loading your favorite places...</div>
      </div>
    </div>
  `
  renderNavbar()

  try {
    const favorites = await api.getFavorites()

    if (!favorites || favorites.length === 0) {
      document.querySelector('#favorites-grid').innerHTML = `
        <div class="empty-state">
          <div class="icon">♡</div>
          <p>You haven't added any favorites yet.</p>
          <p>Browse restaurants and click "Add to Favorites" to save them here.</p>
        </div>
      `
      return
    }

    let html = ''
    for (const r of favorites) {
      const { avg, count } = getRatingFromRestaurant(r)
      const icon = r.categories?.icon || getCategoryIcon(r.categories?.name)
      html += `
        <div class="restaurant-card" data-id="${r.id}">
          <div class="card-image">${icon}</div>
          <div class="card-body">
            <div class="card-title">${r.name}</div>
            <div class="card-desc">${r.description}</div>
            <div class="card-meta">
              <span class="price">${r.price_range}</span>
              <span class="rating">${count > 0 ? renderStars(avg) + ' (' + count + ')' : 'No reviews yet'}</span>
            </div>
          </div>
        </div>
      `
    }
    document.querySelector('#favorites-grid').innerHTML = html

    document.querySelectorAll('.restaurant-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id')
        window.location.hash = '#/restaurant/' + id
      })
    })
  } catch (err) {
    document.querySelector('#favorites-grid').innerHTML = `<div class="empty-state">Error loading favorites: ${err.message}</div>`
  }
}
