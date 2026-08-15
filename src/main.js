import './style.css'
import { api } from './api.js'
import { renderAuthPage } from './auth.js'
import { renderHomePage } from './home.js'
import { renderRestaurantDetail } from './restaurantDetail.js'
import { renderFavoritesPage } from './favorites.js'
import { renderProfilePage } from './profile.js'

async function router() {
  const app = document.querySelector('#app')
  if (!app) return

  try {
    const hash = window.location.hash.replace('#', '') || '/'

    if (hash === '/login' || hash === '/register') {
      renderAuthPage()
      return
    }

    if (hash === '/favorites') {
      await renderFavoritesPage()
      return
    }

    if (hash === '/profile') {
      await renderProfilePage()
      return
    }

    if (hash.startsWith('/restaurant/')) {
      const id = hash.replace('/restaurant/', '')
      await renderRestaurantDetail(id)
      return
    }

    await renderHomePage()
  } catch (error) {
    console.error('Routing failed:', error)
    app.innerHTML = `
      <div class="container" style="padding: 48px 20px; text-align: center;">
        <h2>Something went wrong</h2>
        <p>${error.message || 'The app could not load correctly.'}</p>
      </div>
    `
  }
}

window.addEventListener('hashchange', router)
window.addEventListener('DOMContentLoaded', router)

if (document.readyState !== 'loading') {
  router()
}
