#!/bin/bash

# Set environment variables for database and Redis
export DATABASE_URL="postgresql://aquaticadmin:npg_qPIdr6Ag7snK@ep-shrill-lake-a1e9dvdn-pooler.ap-southeast-1.aws.neon.tech/aquaticexotica?sslmode=require"
export REDIS_URL="redis://default:5mv30LZpIAHW1S5ayT5w6ZhqdfpAoGt1@redis-12665.c212.ap-south-1-1.ec2.redns.redis-cloud.com:12665"

# Use NODE_ENV from existing environment or default to development
export NODE_ENV="${NODE_ENV:-development}"

# Run the server
echo "Starting server with custom database and Redis configuration..."
echo "Database: $(echo $DATABASE_URL | sed 's/:[^:@]*@/:***@/')"
echo "Redis: $(echo $REDIS_URL | sed 's/:[^:@]*@/:***@/')"

# Run the server
node_modules/.bin/tsx server/index.ts