# Logging System Documentation

## Overview

This application uses Winston for structured logging with special considerations for Vercel deployment.

## Local Development

In development mode, logs are output to the console with:
- Colorized output for better readability
- Debug level logging
- Detailed timestamps and metadata

## Production / Vercel Deployment

### How Vercel Handles Logs

Vercel automatically captures all `console` output from your serverless functions and displays them in:
1. **Vercel Dashboard** → Your Project → Functions tab → Logs
2. **Vercel CLI**: `vercel logs`

### Our Logging Strategy

1. **Console-Only Output**: We use only console transports (no file logging) because:
   - Vercel functions are stateless
   - File system writes are not persisted
   - Vercel captures console output automatically

2. **Structured Logging**: All logs include:
   - Timestamp
   - Log level (info, warn, error, debug)
   - Module name
   - Metadata as JSON

3. **Production Optimizations**:
   - Info level and above only (no debug logs)
   - Error stack traces included
   - Direct console methods for critical logs

## Usage Examples

```typescript
import { createLogger } from './logger';

const logger = createLogger('my-module');

// Basic logging
logger.info('User logged in', { userId: 123 });
logger.error('Database connection failed', { error: err.message });
logger.warn('Rate limit approaching', { remaining: 10 });
logger.debug('Cache hit', { key: 'products' }); // Only in development

// For critical Vercel logs
import { logForVercel } from './logger';
logForVercel.error('Critical error', { stack: err.stack });
```

## Viewing Logs in Vercel

### Via Dashboard
1. Go to your Vercel project
2. Click on "Functions" tab
3. Select a function
4. View real-time logs

### Via CLI
```bash
# Install Vercel CLI
npm i -g vercel

# View logs
vercel logs

# Follow logs in real-time
vercel logs --follow

# Filter by function
vercel logs --filter="api/products"
```

## Log Levels

- **error**: Application errors, exceptions
- **warn**: Warning conditions, deprecations
- **info**: General informational messages
- **debug**: Detailed debugging (development only)

## Best Practices

1. **Use Structured Data**: Pass objects as metadata
   ```typescript
   logger.info('Order created', { orderId: 123, total: 99.99 });
   ```

2. **Include Context**: Use module-specific loggers
   ```typescript
   const logger = createLogger('payment-service');
   ```

3. **Log Errors Properly**: Include stack traces
   ```typescript
   logger.error('Payment failed', { 
     error: err.message, 
     stack: err.stack,
     orderId: 123 
   });
   ```

4. **Avoid Sensitive Data**: Don't log passwords, tokens, etc.

5. **Use Appropriate Levels**: 
   - Error: Must be investigated
   - Warn: Should be investigated
   - Info: Normal operations
   - Debug: Development troubleshooting

## Monitoring

For production monitoring beyond Vercel's built-in logs, consider:
- Sentry for error tracking
- Datadog for metrics
- LogDNA for advanced log analysis

These services can be integrated by adding their respective transports to Winston. 