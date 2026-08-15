import { api } from './api.js'
import { renderNavbar } from './navbar.js'

export function renderAuthPage() {
  const isLogin = window.location.hash === '#/login'
  const title = isLogin ? 'Login' : 'Sign Up'
  const subtitle = isLogin ? 'Welcome back! Continue your Kathmandu food journey.' : 'Create an account to save favorite spots across Kathmandu.'
  const switchText = isLogin
    ? 'Don\'t have an account? <a id="switch-link">Sign Up</a>'
    : 'Already have an account? <a id="switch-link">Login</a>'

  document.querySelector('#app').innerHTML = `
    <div id="navbar"></div>
    <div class="auth-page">
      <h2>${title}</h2>
      <p class="subtitle">${subtitle}</p>
      <div id="auth-error"></div>
      <form id="auth-form">
        ${!isLogin ? `
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" id="auth-name" placeholder="Your name" />
          </div>
        ` : ''}
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="auth-email" placeholder="you@example.com" required />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="auth-password" placeholder="At least 6 characters" required />
        </div>
        <button type="submit" class="btn-primary">${title}</button>
      </form>
      <p class="switch-text">${switchText}</p>
    </div>
  `

  renderNavbar()

  document.querySelector('#switch-link').addEventListener('click', (e) => {
    e.preventDefault()
    window.location.hash = isLogin ? '#/register' : '#/login'
    renderAuthPage()
  })

  document.querySelector('#auth-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const errorEl = document.querySelector('#auth-error')
    errorEl.innerHTML = ''

    const email = document.querySelector('#auth-email').value.trim()
    const password = document.querySelector('#auth-password').value

    if (password.length < 6) {
      errorEl.innerHTML = '<div class="auth-error">Password must be at least 6 characters.</div>'
      return
    }

    try {
      if (isLogin) {
        await api.signIn(email, password)
      } else {
        const name = document.querySelector('#auth-name').value.trim()
        await api.signUp(name, email, password)
      }
      window.location.hash = '#/'
      window.location.reload()
    } catch (err) {
      errorEl.innerHTML = `<div class="auth-error">${err.message}</div>`
    }
  })
}
