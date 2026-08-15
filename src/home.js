import { api } from './api.js'
import { renderNavbar } from './navbar.js'
import { renderStars, getCategoryIcon, getRatingFromRestaurant } from './utils.js'

let activeCategory = null
let searchQuery = ''
let priceFilter = ''
let sortBy = 'name'

export async function renderHomePage() {
  document.querySelector('#app').innerHTML = `
    <div id="navbar"></div>
    <div class="hero">
      <div class="hero-inner">
        <span class="hero-badge">Kathmandu food guide</span>
        <h1>Discover Kathmandu’s Best Flavors</h1>
        <p>Explore cozy eateries, mountain-view cafes, and iconic Nepali dishes across Kathmandu Valley.</p>
        <div class="hero-pills">
          <span>🥟 Momos</span>
          <span>🍛 Dal Bhat</span>
          <span>☕ Cafés</span>
          <span>🌄 Viewpoints</span>
        </div>
        <div class="search-bar">
          <input type="text" id="search-input" placeholder="Search Kathmandu food, momo, dal bhat, cafe..." />
          <button id="search-btn">Explore</button>
        </div>
      </div>
    </div>
    <div class="container">
      <h2 class="section-title">Browse by Category</h2>
      <div class="categories" id="categories"></div>

      <h2 class="section-title" id="results-title">Kathmandu Restaurants</h2>
      <div class="filters">
        <label>Price:</label>
        <select id="price-filter">
          <option value="">All Prices</option>
          <option value="$">$</option>
          <option value="$$">$$</option>
          <option value="$$$">$$$</option>
          <option value="$$$$">$$$$</option>
        </select>
        <label>Sort by:</label>
        <select id="sort-by">
          <option value="name">Name</option>
          <option value="rating">Rating</option>
        </select>
      </div>
      <div class="restaurant-grid" id="restaurant-grid">
        <div class="loading">Loading Kathmandu restaurants...</div>
      </div>
    </div>
  `

  renderNavbar()
  await loadCategories()
  await loadRestaurants()

  document.querySelector('#search-btn').addEventListener('click', () => {
    searchQuery = document.querySelector('#search-input').value.trim()
    loadRestaurants()
  })

  document.querySelector('#search-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      searchQuery = e.target.value.trim()
      loadRestaurants()
    }
  })

  document.querySelector('#price-filter').addEventListener('change', (e) => {
    priceFilter = e.target.value
    loadRestaurants()
  })

  document.querySelector('#sort-by').addEventListener('change', (e) => {
    sortBy = e.target.value
    loadRestaurants()
  })
}

async function loadCategories() {
  try {
    const data = await api.getCategories()
    const container = document.querySelector('#categories')
    let html = `<div class="category-card ${activeCategory === null ? 'active' : ''}" data-cat="">
      <div class="icon">🍽️</div>
      <div class="name">All</div>
    </div>`
    data.forEach(cat => {
      html += `<div class="category-card ${activeCategory === cat.id ? 'active' : ''}" data-cat="${cat.id}">
        <div class="icon">${cat.icon}</div>
        <div class="name">${cat.name}</div>
      </div>`
    })
    container.innerHTML = html

    container.querySelectorAll('.category-card').forEach(card => {
      card.addEventListener('click', () => {
        activeCategory = card.getAttribute('data-cat') || null
        loadCategories()
        loadRestaurants()
      })
    })
  } catch (err) {
    document.querySelector('#categories').innerHTML = `<div class="empty-state">Error loading categories: ${err.message}</div>`
  }
}

async function loadRestaurants() {
  const grid = document.querySelector('#restaurant-grid')
  const titleEl = document.querySelector('#results-title')

  try {
    const params = {}
    if (activeCategory) params.categoryId = activeCategory
    if (searchQuery) params.search = searchQuery
    if (priceFilter) params.price = priceFilter
    if (sortBy === 'rating') params.sort = 'rating'

    const restaurants = await api.getRestaurants(params)

    if (searchQuery) {
      titleEl.textContent = `Results for "${searchQuery}" in Kathmandu`
    } else if (activeCategory) {
      const cat = restaurants[0]?.categories
      titleEl.textContent = cat ? `${cat.name} in Kathmandu` : 'Kathmandu Restaurants'
    } else {
      titleEl.textContent = 'Kathmandu Restaurants'
    }

    if (restaurants.length === 0) {
      grid.innerHTML = `<div class="empty-state"><div class="icon">🍽️</div><p>No restaurants found in Kathmandu. Try a different search or filter.</p></div>`
      return
    }

    let html = ''
    for (const r of restaurants) {
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
    grid.innerHTML = html

    grid.querySelectorAll('.restaurant-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id')
        window.location.hash = '#/restaurant/' + id
      })
    })
  } catch (err) {
    grid.innerHTML = `<div class="empty-state">Error loading restaurants: ${err.message}</div>`
  }
}
