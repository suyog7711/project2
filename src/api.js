// API client for PHP backend.
// Prefer the project folder name used in this workspace, but keep a few fallbacks.
function resolveApiBase() {
  const configured = import.meta.env?.VITE_API_BASE
  if (configured) return String(configured).replace(/\/+$/, '')

  return 'http://localhost/project2/backend/api'
}

const API_BASE = resolveApiBase()

// Token management - stored in localStorage
function getToken() {
  return localStorage.getItem('food_token')
}

function setToken(token) {
  localStorage.setItem('food_token', token)
}

function clearToken() {
  localStorage.removeItem('food_token')
}

function getAuthHeaders() {
  const token = getToken()
  if (!token) return { 'Content-Type': 'application/json' }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

// Generic API request helper
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}/${endpoint}`

  try {
    const response = await fetch(url, {
      ...options,
      headers: getAuthHeaders(),
    })

    const contentType = response.headers.get('content-type') || ''
    const data = contentType.includes('application/json')
      ? await response.json()
      : await response.text()

    if (!response.ok) {
      const message = typeof data === 'object' && data && data.error
        ? data.error
        : `Request failed (${response.status})`
      throw new Error(message)
    }

    return data
  } catch (err) {
    const message = String(err?.message || err)

    if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
      throw new Error('Cannot connect to the server. Start your PHP backend and confirm the API URL matches this project setup.')
    }

    if (message.includes('Unexpected token') || message.includes('JSON')) {
      throw new Error('The backend responded with an invalid format. Check the PHP API endpoint.')
    }

    throw err
  }
}

// === Auth API ===
export const api = {
  async signUp(name, email, password) {
    const data = await apiRequest('register.php', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    })
    setToken(data.token)
    return data.user
  },

  async signIn(email, password) {
    const data = await apiRequest('login.php', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    setToken(data.token)
    return data.user
  },

  signOut() {
    clearToken()
  },

  async getCurrentUser() {
    const token = getToken()
    if (!token) return null
    try {
      const data = await apiRequest('me.php')
      return data.user
    } catch {
      clearToken()
      return null
    }
  },

  // === Categories ===
  async getCategories() {
    return await apiRequest('categories.php')
  },

  // === Restaurants ===
  async getRestaurants(params = {}) {
    const query = new URLSearchParams()
    if (params.categoryId) query.set('category_id', params.categoryId)
    if (params.search) query.set('search', params.search)
    if (params.price) query.set('price', params.price)
    if (params.sort) query.set('sort', params.sort)
    const qs = query.toString()
    return await apiRequest(`restaurants.php${qs ? '?' + qs : ''}`)
  },

  async getRestaurant(id) {
    return await apiRequest(`restaurant.php?id=${id}`)
  },

  // === Menu ===
  async getMenu(restaurantId) {
    return await apiRequest(`menu.php?restaurant_id=${restaurantId}`)
  },

  // === Reviews ===
  async getReviews(restaurantId) {
    return await apiRequest(`reviews.php?restaurant_id=${restaurantId}`)
  },

  async addReview(restaurantId, rating, comment) {
    return await apiRequest('reviews.php', {
      method: 'POST',
      body: JSON.stringify({ restaurant_id: restaurantId, rating, comment }),
    })
  },

  // === Favorites ===
  async getFavorites() {
    return await apiRequest('favorites.php')
  },

  async addFavorite(restaurantId) {
    return await apiRequest('favorites.php', {
      method: 'POST',
      body: JSON.stringify({ restaurant_id: restaurantId }),
    })
  },

  async removeFavorite(restaurantId) {
    return await apiRequest(`favorites.php?restaurant_id=${restaurantId}`, {
      method: 'DELETE',
    })
  },

  async checkFavorite(restaurantId) {
    const favorites = await this.getFavorites()
    return favorites.some(f => f.id == restaurantId)
  },

  // === Profile ===
  async getProfile() {
    return await apiRequest('profile.php')
  },
}
