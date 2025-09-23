# Google Analytics 4 Setup Guide

This guide will help you set up Google Analytics 4 for your Aquatic Exotica e-commerce website.

## 🚀 Quick Setup

### 1. Create Google Analytics 4 Property

1. Go to [Google Analytics](https://analytics.google.com)
2. Click "Start measuring" or "Create Account"
3. Set up your account:
   - **Account name**: Aquatic Exotica
   - **Property name**: Aquatic Exotica Website
   - **Reporting time zone**: Your timezone
   - **Currency**: USD
4. Choose your business information:
   - **Industry category**: Retail/E-commerce
   - **Business size**: Choose appropriate size
   - **How you plan to use Google Analytics**: Get baseline reports

### 2. Set Up Data Stream

1. In your GA4 property, go to **Admin** > **Data Streams**
2. Click **Add stream** > **Web**
3. Enter your website details:
   - **Website URL**: `https://your-domain.com`
   - **Stream name**: Aquatic Exotica Website
4. Click **Create stream**
5. **Copy your Measurement ID** (format: G-XXXXXXXXXX)

### 3. Configure Your Website

1. **Add Measurement ID to Environment Variables**:
   ```bash
   # Create or update your .env file
r   REACT_APP_GA4_MEASUREMENT_ID=G-NS31V1K0LZ
   REACT_APP_ENABLE_ANALYTICS=true
   ```

2. **Environment Variables Setup**:
   - Create a `.env` file in your project root
   - Add the variables above
   - The Measurement ID will be automatically loaded from environment variables
   - **Never commit the .env file to version control**

### 4. Enable Enhanced E-commerce

1. In GA4, go to **Admin** > **Data Streams** > **Web** > Your stream
2. Click **Configure tag settings**
3. Enable **Enhanced measurement**:
   - ✅ Page views
   - ✅ Scrolls
   - ✅ Outbound clicks
   - ✅ Site search
   - ✅ Video engagement
   - ✅ File downloads

### 5. Set Up E-commerce Events

1. Go to **Admin** > **Data Display** > **Events**
2. Mark these events as conversions:
   - `purchase`
   - `add_to_cart`
   - `begin_checkout`
   - `search`

### 6. Create Custom Dimensions (Optional)

1. Go to **Admin** > **Data Display** > **Custom Definitions**
2. Create custom dimensions:
   - **User Type**: `user_type` (User-scoped)
   - **Product Category**: `product_category` (Event-scoped)
   - **Cart Value**: `cart_value` (Event-scoped)
   - **Checkout Step**: `checkout_step` (Event-scoped)

## 📊 What Gets Tracked

### Automatic Tracking
- ✅ Page views
- ✅ User sessions
- ✅ User demographics
- ✅ Traffic sources
- ✅ Device information
- ✅ Geographic data

### E-commerce Tracking
- ✅ Product page views
- ✅ Add to cart events
- ✅ Remove from cart events
- ✅ Cart abandonment
- ✅ Checkout process
- ✅ Purchase completions
- ✅ Revenue tracking

### Custom Events
- ✅ Search queries
- ✅ Category views
- ✅ User engagement
- ✅ Error tracking
- ✅ Performance metrics

## 🔧 Integration Points

The analytics are integrated into these components:

### Product Pages
- Product view tracking
- Add to cart tracking
- Product interaction tracking

### Cart & Checkout
- Cart view tracking
- Checkout step tracking
- Purchase completion tracking
- Cart abandonment tracking

### Search & Navigation
- Search query tracking
- Category view tracking
- Navigation tracking

### User Behavior
- User engagement tracking
- Error tracking
- Performance tracking

## 🧪 Testing Your Setup

### 1. Real-time Testing
1. Go to **Reports** > **Realtime** in GA4
2. Visit your website
3. Perform actions (view products, add to cart, etc.)
4. Check if events appear in real-time

### 2. Debug Mode
1. Set `REACT_APP_ENABLE_ANALYTICS=true` in your .env file
2. Open browser console
3. Look for analytics debug messages:
   - `🔍 GA4 initialized with measurement ID: G-XXXXXXXXXX`
   - `📄 Page view tracked: /shop`
   - `🎯 Event tracked: add_to_cart`

### 3. Google Analytics Debugger
1. Install [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna) Chrome extension
2. Enable it on your website
3. Check the console for detailed GA4 events

## 📈 Key Reports to Monitor

### E-commerce Reports
- **Monetization** > **E-commerce purchases**
- **Monetization** > **Publisher ads**
- **Engagement** > **Events** > **purchase**

### User Behavior
- **Engagement** > **Pages and screens**
- **Engagement** > **Events**
- **Demographics** > **Demographics details**

### Conversion Funnels
- **Monetization** > **E-commerce purchases**
- **Engagement** > **Events** > **begin_checkout**
- **Engagement** > **Events** > **add_to_cart**

## 🚨 Troubleshooting

### Common Issues

1. **No data appearing**:
   - Check if Measurement ID is correct
   - Verify environment variables are set
   - Check browser console for errors

2. **Events not tracking**:
   - Ensure Enhanced measurement is enabled
   - Check if events are marked as conversions
   - Verify custom event names match GA4 setup

3. **Real-time data not showing**:
   - Wait 5-10 minutes for data to appear
   - Check if ad blockers are interfering
   - Verify website is publicly accessible

### Debug Commands

```javascript
// Check if GA4 is loaded
console.log(window.gtag);

// Check data layer
console.log(window.dataLayer);

// Manually trigger an event
gtag('event', 'test_event', {
  event_category: 'test',
  event_label: 'manual_test'
});
```

## 📚 Additional Resources

- [Google Analytics 4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- [GA4 E-commerce Setup](https://support.google.com/analytics/answer/9216061)
- [GA4 Events Reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/events)
- [GA4 Custom Dimensions](https://support.google.com/analytics/answer/10075209)

## 🎯 Next Steps

After basic setup:
1. Set up **Google Tag Manager** for advanced tracking
2. Configure **Google Ads** integration
3. Set up **Custom Reports** and **Dashboards**
4. Implement **Enhanced E-commerce** features
5. Set up **Audience** definitions for remarketing

---

**Need Help?** Check the browser console for debug messages or refer to the Google Analytics Help Center.
