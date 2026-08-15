import { api } from './api.js'
import { renderNavbar } from './navbar.js'
import { formatDate } from './utils.js'

export async function renderProfilePage() {
  const user = await api.getCurrentUser()
  if (!user) {
    window.location.hash = '#/login'
    return
  }

  const fullName = user.user_metadata?.full_name || 'User'
  const email = user.email
  const initial = fullName.charAt(0).toUpperCase()
  const joinDate = user.created_at ? formatDate(user.created_at) : ''

  document.querySelector('#app').innerHTML = `
    <div id="navbar"></div>
    <div class="container">
      <h2 class="section-title">My Kathmandu Profile</h2>
      <div class="profile-info">
        <div class="avatar">${initial}</div>
        <div class="profile-email">${fullName}</div>
        <div class="profile-meta">${email}</div>
        <div class="profile-meta">Member since ${joinDate}</div>
      </div>

      <h2 class="section-title">My Reviews</h2>
      <div id="my-reviews">
        <div class="loading">Loading your reviews...</div>
      </div>

      <h2 class="section-title" style="margin-top:30px">My Favorite Places</h2>
      <div id="my-fav-count">
        <div class="loading">Loading...</div>
      </div>
    </div>
  `
  renderNavbar()

  try {
    const profile = await api.getProfile()

    const reviewsEl = document.querySelector('#my-reviews')
    if (!profile.reviews || profile.reviews.length === 0) {
      reviewsEl.innerHTML = `<div class="empty-state"><div class="icon">⭐</div><p>You haven't written any reviews yet.</p></div>`
    } else {
      let html = ''
      profile.reviews.forEach(review => {
        const rName = review.restaurant_name || 'Unknown Restaurant'
        html += `
          <div class="review-item" style="background:#fff;border-radius:8px;padding:16px;margin-bottom:10px;">
            <div class="review-header">
              <span class="review-author">${rName}</span>
              <span class="review-date">${formatDate(review.created_at)}</span>
            </div>
            <div class="stars">${'★'.repeat(review.rating)}<span class="empty">${'★'.repeat(5 - review.rating)}</span></div>
            <div class="review-comment">${review.comment || 'No comment'}</div>
          </div>
        `
      })
      reviewsEl.innerHTML = html
    }

    const favEl = document.querySelector('#my-fav-count')
    const count = profile.favorite_count || 0
    favEl.innerHTML = `
      <div class="profile-info">
        <p>You have <strong>${count}</strong> favorite restaurant${count === 1 ? '' : 's'}.</p>
        <a data-route="favorites" style="color:#e63946;cursor:pointer;font-weight:600;">View favorites →</a>
      </div>
    `
    const link = favEl.querySelector('[data-route="favorites"]')
    if (link) {
      link.addEventListener('click', (e) => {
        e.preventDefault()
        window.location.hash = '#/favorites'
      })
    }
  } catch (err) {
    document.querySelector('#my-reviews').innerHTML = `<div class="empty-state">Error loading profile: ${err.message}</div>`
    document.querySelector('#my-fav-count').innerHTML = `<div class="empty-state">Error loading data.</div>`
  }
}
