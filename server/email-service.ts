import sgMail from '@sendgrid/mail';
import { log } from './vite';
import { Order } from '@shared/schema';

// Initialize SendGrid with API key
try {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn("SENDGRID_API_KEY is not set. Email functionality will be disabled.");
  } else if (!process.env.SENDGRID_API_KEY.startsWith('SG.')) {
    console.warn("Invalid SENDGRID_API_KEY format. Email functionality will be disabled.");
  } else {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    log('SendGrid initialized successfully', 'email-service');
  }
} catch (error) {
  console.warn("SendGrid initialization failed. Email functionality will be disabled.", error);
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using SendGrid
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.error("Cannot send email: SENDGRID_API_KEY is not set");
      return false;
    }

    const msg = {
      to: options.to,
      from: 'info@elegantclothing.in', // Replace with your verified sender
      subject: options.subject,
      text: options.text || 'Please view this email in a modern email client that supports HTML',
      html: options.html,
    };

    await sgMail.send(msg);
    log(`Email sent to ${options.to}`, 'email-service');
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

/**
 * Notify admin about a new order
 */
export async function sendOrderNotification(order: Order): Promise<boolean> {
  // Parse the order items as JSON if it's a string
  const items = typeof order.items === 'string' 
    ? JSON.parse(order.items as string) 
    : (order.items as any[] || []);
    
  // Format order items for the email
  const orderItemsHtml = items
    .map((item: any) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">₹${Number(item.price).toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">₹${(Number(item.price) * item.quantity).toFixed(2)}</td>
      </tr>
    `)
    .join('');

  // Parse shipping address if it's a string
  const shippingAddressObj = typeof order.shippingAddress === 'string'
    ? JSON.parse(order.shippingAddress as string)
    : (order.shippingAddress as any || {});

  // Format the address for display
  const shippingAddress = shippingAddressObj && Object.keys(shippingAddressObj).length > 0 
    ? `${shippingAddressObj.addressLine1 || ''}, 
       ${shippingAddressObj.addressLine2 ? shippingAddressObj.addressLine2 + ', ' : ''}
       ${shippingAddressObj.city || ''}, ${shippingAddressObj.state || ''}, 
       ${shippingAddressObj.pinCode || ''}` 
    : 'Not provided';

  // Get customer information from order or use placeholders
  const customerName = order.customerName || 'Customer';
  const customerEmail = order.customerEmail || 'Not provided';
  const customerPhone = order.customerPhone || 'Not provided';
  
  // Calculate total amount
  const totalAmount = order.totalAmount || Number(order.total) || 0;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 2px solid #eeeeee; padding-bottom: 10px;">
        New Order #${order.id}
      </h2>
      
      <p>A new order has been placed on Elegant Clothing.</p>
      
      <h3 style="color: #555;">Order Details:</h3>
      <p><strong>Order ID:</strong> ${order.id}</p>
      <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString('en-IN', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      })}</p>
      <p><strong>Customer:</strong> ${customerName}</p>
      <p><strong>Email:</strong> ${customerEmail}</p>
      <p><strong>Phone:</strong> ${customerPhone}</p>
      <p><strong>Total Amount:</strong> ₹${typeof totalAmount === 'number' ? totalAmount.toFixed(2) : totalAmount}</p>
      
      <h3 style="color: #555;">Shipping Address:</h3>
      <p>${shippingAddress}</p>
      
      <h3 style="color: #555;">Order Items:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Product</th>
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Quantity</th>
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Price</th>
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${orderItemsHtml}
        </tbody>
      </table>
      
      <p style="margin-top: 30px; padding-top: 10px; border-top: 1px solid #eee;">
        Please log in to the admin dashboard to process this order.
      </p>
    </div>
  `;

  return sendEmail({
    to: 'admin@elegantclothing.in', // Change to the actual admin email
    subject: `New Order #${order.id} - Elegant Clothing`,
    html: emailHtml
  });
}

/**
 * Send notification about stock update to customers
 */
export async function sendStockNotification(email: string, productName: string): Promise<boolean> {
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 2px solid #eeeeee; padding-bottom: 10px;">
        Product Back in Stock!
      </h2>
      
      <p>Good news! The product you were interested in is now back in stock:</p>
      
      <div style="background-color: #f9f9f9; border-radius: 5px; padding: 15px; margin: 20px 0;">
        <h3 style="color: #333; margin-top: 0;">${productName}</h3>
        <p>This item is now available for purchase on our website.</p>
      </div>
      
      <p>
        <a href="https://elegantclothing.in" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
          Shop Now
        </a>
      </p>
      
      <p style="color: #777; font-size: 0.9em; margin-top: 30px;">
        This is an automated notification. You received this email because you requested to be notified when this product became available again.
      </p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `${productName} is Back in Stock! - Elegant Clothing`,
    html: emailHtml
  });
}