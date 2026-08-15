# Food Discovery and Review Platform — Setup Guide

This app uses **PHP + MySQL** for the backend and **JavaScript (Vite)** for the frontend.

## Prerequisites

- PHP 7.4 or higher (with PDO MySQL extension)
- MySQL 5.7 or higher (or MariaDB)
- Node.js 18+ and npm

You can use **XAMPP**, **WAMP**, or **MAMP** to get PHP + MySQL running easily on your computer.

---

## Step 1: Set Up the MySQL Database

1. Open phpMyAdmin (usually at `http://localhost/phpmyadmin`) or the MySQL command line.
2. Import the file `backend/database.sql` — this creates the `food_finds` database with all tables and seed data (restaurants, menu items, reviews, categories, and a demo user).

   **From command line:**
   ```
   mysql -u root -p < backend/database.sql
   ```

   **From phpMyAdmin:** Click "Import" → choose `backend/database.sql` → click "Go".

---

## Step 2: Configure the PHP Backend

1. Open `backend/config.php` and update the database credentials if needed:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'food_finds');
   define('DB_USER', 'root');      // your MySQL username
   define('DB_PASS', '');           // your MySQL password
   ```

2. Place the `backend/` folder in your PHP server's web root:
   - **XAMPP:** copy `backend/` to `C:\xampp\htdocs\food-app\backend\`
   - **WAMP:** copy `backend/` to `C:\wamp\www\food-app\backend\`
   - **MAMP:** copy `backend/` to `/Applications/MAMP/htdocs/food-app/backend/`

3. Make sure your PHP server is running (start Apache and MySQL from the XAMPP/WAMP control panel).

4. Test the backend by visiting: `http://localhost/food-app/backend/api/categories.php` — you should see JSON output with the categories.

---

## Step 3: Configure the Frontend API URL

1. Open `src/api.js` and update `API_BASE` to point to your PHP server:
   ```javascript
   const API_BASE = 'http://localhost/food-app/backend/api'
   ```
   Adjust the path to match where you placed the `backend/` folder.

---

## Step 4: Run the Frontend

1. Install dependencies:
   ```
   npm install
   ```

2. Start the dev server:
   ```
   npm run dev
   ```

3. Open the URL shown in the terminal (usually `http://localhost:5173`).

---

## Demo Account

A demo user is already created in the database:
- **Email:** demo@foodapp.com
- **Password:** password123

You can also create a new account from the Sign Up page.

---

## Project Structure

```
backend/
  config.php           — Database config and helper functions
  database.sql         — MySQL schema + seed data (import this first)
  api/
    login.php          — POST: user login
    register.php       — POST: user sign up
    me.php             — GET: get current logged-in user
    categories.php     — GET: list all food categories
    restaurants.php    — GET: list restaurants (with search, filter, sort)
    restaurant.php     — GET: single restaurant details
    menu.php           — GET: menu items for a restaurant
    reviews.php        — GET: list reviews / POST: add a review
    favorites.php      — GET/POST/DELETE: manage user favorites
    profile.php        — GET: user's reviews + favorite count

src/
  api.js               — Frontend API client (talks to PHP backend)
  auth.js              — Login & Sign Up pages
  home.js              — Home page with search, categories, filters
  restaurantDetail.js  — Restaurant detail (menu, reviews, map tabs)
  favorites.js         — User's favorite restaurants
  profile.js           — User profile page
  navbar.js            — Top navigation bar
  utils.js             — Helper functions (stars, dates, etc.)
  style.css            — All styling
  main.js              — Router and entry point
```

---

## Features

- Register / Login with email and password
- Search restaurants by name or description
- Filter by category and price range
- Sort by name or rating
- View restaurant details with menu, prices, and vegetarian indicators
- View restaurant location on a map
- Read and write reviews with 1-5 star ratings
- Add restaurants to favorites
- View your profile with review history and favorite count
- Logout
