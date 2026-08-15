export function renderStars(rating) {
  const full = Math.floor(rating)
  const empty = 5 - full
  return '<span class="stars">' + '★'.repeat(full) + '<span class="empty">' + '★'.repeat(empty) + '</span></span>'
}

export function getCategoryIcon(name) {
  const icons = {
    'Italian': '🍝', 'Chinese': '🥡', 'Indian': '🍛', 'Mexican': '🌮',
    'American': '🍔', 'Japanese': '🍣', 'Thai': '🍜', 'Desserts': '🍰'
  }
  return icons[name] || '🍽️'
}

export function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function getRatingFromRestaurant(r) {
  return { avg: r.avg_rating || 0, count: r.review_count || 0 }
}
