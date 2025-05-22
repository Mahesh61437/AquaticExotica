#!/bin/bash

# Set development mode
export NODE_ENV=development

# Database configuration
export DATABASE_URL="postgresql://neondb_owner:npg_Mw67crQZDhNs@ep-late-art-a6wv8fao.us-west-2.aws.neon.tech/neondb?sslmode=require"
export PGHOST="ep-late-art-a6wv8fao.us-west-2.aws.neon.tech"
export PGPORT=5432
export PGUSER="neondb_owner"
export PGPASSWORD="npg_Mw67crQZDhNs"
export PGDATABASE="neondb"

# Firebase configuration
export VITE_FIREBASE_API_KEY="AIzaSyCKNnGmzKQl39oq5s9tceHHagD7tZTQsms"
export VITE_FIREBASE_AUTH_DOMAIN="aqua-india-61437.firebaseapp.com"
export VITE_FIREBASE_PROJECT_ID="aqua-india-61437"
export VITE_FIREBASE_STORAGE_BUCKET="aqua-india-61437.firebasestorage.app"
export VITE_FIREBASE_MESSAGING_SENDER_ID="562620265018"
export VITE_FIREBASE_APP_ID="1:562620265018:web:805f156d3f2416dd15bb03"

# SendGrid API Key for email notifications
export SENDGRID_API_KEY="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"

# Session configuration
export SESSION_SECRET="b2wR5uSmwK2ypApT7GSVy60/UlsbMbSiOGFduP+WEedMh/c0fmvExyV8/PTeDZgG6jG9JT+/uqXCIfHS9wOEWQ=="

# Redis configuration for caching (from your scratchpad)
export REDIS_URL="redis://default:5mv30LZpIAHW1S5ayT5w6ZhqdfpAoGt1@redis-12665.c212.ap-south-1-1.ec2.redns.redis-cloud.com:12665"

# Port configuration
export PORT=5000

# Start the development server
echo "Starting the application in development mode..."
npm run dev