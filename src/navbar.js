import { api } from './api.js'
import { renderAuthPage } from './auth.js'

export async function renderNavbar() {
  const user = await api.getCurrentUser()

  const nav = document.querySelector('#navbar')
  if (!nav) return

  if (user) {
    nav.innerHTML = `
      <a class="logo" data-route="home">�️ Kathmandu Eats</a>
      <nav>
        <a data-route="home">Home</a>
        <a data-route="favorites">Favorites</a>
        <a data-route="profile">Profile</a>
        <button class="btn-logout" id="logout-btn">Log out</button>
      </nav>
    `
    document.querySelector('#logout-btn').addEventListener('click', () => {
      api.signOut()
      window.location.hash = '#/login'
      renderAuthPage()
    })
  } else {
    nav.innerHTML = `
      <a class="logo" data-route="home">🏔️ Kathmandu Eats</a>
      <nav>
        <a data-route="home">Home</a>
        <a data-route="login">Login</a>
        <a data-route="register">Sign Up</a>
      </nav>
    `
  }

  nav.querySelectorAll('[data-route]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault()
      const route = a.getAttribute('data-route')
      if (route === 'home') {
        window.location.hash = '#/'
      } else if (route === 'login') {
        window.location.hash = '#/login'
      } else if (route === 'register') {
        window.location.hash = '#/register'
      } else if (route === 'favorites') {
        window.location.hash = '#/favorites'
      } else if (route === 'profile') {
        window.location.hash = '#/profile'
      }
    })
  })
}
