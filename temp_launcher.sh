#!/bin/bash
export DATABASE_URL="postgresql://aquaticadmin:npg_qPIdr6Ag7snK@ep-shrill-lake-a1e9dvdn-pooler.ap-southeast-1.aws.neon.tech/aquaticexotica?sslmode=require"
export REDIS_URL="redis://default:5mv30LZpIAHW1S5ayT5w6ZhqdfpAoGt1@redis-12665.c212.ap-south-1-1.ec2.redns.redis-cloud.com:12665"

# Run the original command
node_modules/.bin/tsx server/index.ts
