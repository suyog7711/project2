/*
# Food Discovery and Review Platform - Database Schema

1. New Tables
- `categories` - Food categories (e.g. Italian, Chinese, Indian, Mexican)
  - id (uuid, primary key)
  - name (text, unique, not null)
  - icon (text, emoji icon for category)
- `restaurants` - Restaurant listings
  - id (uuid, primary key)
  - name (text, not null)
  - description (text)
  - category_id (uuid, references categories)
  - address (text)
  - phone (text)
  - image_url (text)
  - latitude (numeric, for map)
  - longitude (numeric, for map)
  - price_range (text: $, $$, $$$, $$$$)
  - hours (text)
  - user_id (uuid, owner/creator, defaults to auth.uid())
  - created_at (timestamp)
- `menu_items` - Food menu items for each restaurant
  - id (uuid, primary key)
  - restaurant_id (uuid, references restaurants, cascade delete)
  - name (text, not null)
  - description (text)
  - price (numeric, not null)
  - category (text, e.g. Appetizers, Mains, Desserts, Drinks)
  - image_url (text)
  - is_vegetarian (boolean, default false)
- `reviews` - User reviews and ratings
  - id (uuid, primary key)
  - restaurant_id (uuid, references restaurants, cascade delete)
  - user_id (uuid, defaults to auth.uid())
  - rating (integer, 1-5)
  - comment (text)
  - created_at (timestamp)
- `favorites` - User's favorited restaurants
  - id (uuid, primary key)
  - user_id (uuid, defaults to auth.uid())
  - restaurant_id (uuid, references restaurants, cascade delete)
  - created_at (timestamp)
  - UNIQUE(user_id, restaurant_id)

2. Security
- Enable RLS on all tables.
- categories, restaurants, menu_items: publicly readable (anon+authenticated) since browsing is public.
- restaurants: insert/update/delete by authenticated owner only.
- menu_items: insert/update/delete by authenticated owner of the parent restaurant.
- reviews: public read; insert/update/delete by authenticated owner.
- favorites: read/insert/delete by authenticated owner only (private).
*/

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  icon text DEFAULT '🍽️'
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_categories" ON categories;
CREATE POLICY "read_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

-- Restaurants
CREATE TABLE IF NOT EXISTS restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  address text DEFAULT '',
  phone text DEFAULT '',
  image_url text DEFAULT '',
  latitude numeric DEFAULT 0,
  longitude numeric DEFAULT 0,
  price_range text DEFAULT '$$',
  hours text DEFAULT '',
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_restaurants" ON restaurants;
CREATE POLICY "read_restaurants" ON restaurants FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_restaurants" ON restaurants;
CREATE POLICY "insert_restaurants" ON restaurants FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_restaurants" ON restaurants;
CREATE POLICY "update_restaurants" ON restaurants FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_restaurants" ON restaurants;
CREATE POLICY "delete_restaurants" ON restaurants FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Menu Items
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  category text DEFAULT 'Mains',
  image_url text DEFAULT '',
  is_vegetarian boolean DEFAULT false
);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_menu_items" ON menu_items;
CREATE POLICY "read_menu_items" ON menu_items FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_menu_items" ON menu_items;
CREATE POLICY "insert_menu_items" ON menu_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = menu_items.restaurant_id AND restaurants.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_menu_items" ON menu_items;
CREATE POLICY "update_menu_items" ON menu_items FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = menu_items.restaurant_id AND restaurants.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = menu_items.restaurant_id AND restaurants.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_menu_items" ON menu_items;
CREATE POLICY "delete_menu_items" ON menu_items FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = menu_items.restaurant_id AND restaurants.user_id = auth.uid())
  );

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_reviews" ON reviews;
CREATE POLICY "read_reviews" ON reviews FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_reviews" ON reviews;
CREATE POLICY "insert_reviews" ON reviews FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_reviews" ON reviews;
CREATE POLICY "update_reviews" ON reviews FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_reviews" ON reviews;
CREATE POLICY "delete_reviews" ON reviews FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Favorites
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, restaurant_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_favorites" ON favorites;
CREATE POLICY "read_favorites" ON favorites FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_favorites" ON favorites;
CREATE POLICY "insert_favorites" ON favorites FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_favorites" ON favorites;
CREATE POLICY "delete_favorites" ON favorites FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_restaurants_category ON restaurants(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant ON reviews(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_restaurant ON favorites(restaurant_id);
