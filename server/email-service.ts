import sgMail from '@sendgrid/mail';
import { Order } from '@shared/schema';
import { log } from './vite';

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  log('SendGrid initialized', 'email-service');
} else {
  log('WARNING: SendGrid API key not found. Email notifications will not be sent.', 'email-service');
}

// Define email sender address - Update with your verified sender
const FROM_EMAIL = 'notifications@yourdomain.com';
// Define admin email to receive notifications - Update with your admin email
const ADMIN_EMAIL = 'admin@example.com';

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
  if (!process.env.SENDGRID_API_KEY) {
    log('Email not sent: SendGrid API key not configured', 'email-service');
    return false;
  }

  try {
    await sgMail.send({
      to: options.to,
      from: FROM_EMAIL,
      subject: options.subject,
      html: options.html,
      text: options.text || '',
    });
    
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
  // Format items for email
  const itemsList = JSON.parse(order.items as unknown as string)
    .map((item: any) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">₹${item.price}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">₹${item.price * item.quantity}</td>
      </tr>
    `)
    .join('');

  // Parse shipping address
  const shippingAddress = JSON.parse(order.shippingAddress as unknown as string);
  
  // Create HTML email content
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="background-color: #4f46e5; color: white; padding: 20px; text-align: center;">New Order Received!</h1>
      
      <div style="padding: 20px;">
        <h2>Order #${order.id} Details</h2>
        <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
        <p><strong>Total Amount:</strong> ₹${order.total}</p>
        <p><strong>Customer:</strong> ${shippingAddress.firstName} ${shippingAddress.lastName}</p>
        <p><strong>Email:</strong> ${shippingAddress.email}</p>
        <p><strong>Phone:</strong> ${shippingAddress.phone}</p>
        
        <h3>Shipping Address</h3>
        <p>
          ${shippingAddress.address}<br>
          ${shippingAddress.city}, ${shippingAddress.state}<br>
          ${shippingAddress.zipCode}, ${shippingAddress.country}
        </p>
        
        <h3>Order Items</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #ddd;">Product</th>
              <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #ddd;">Price</th>
              <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #ddd;">Quantity</th>
              <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #ddd;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsList}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding: 12px 8px; text-align: right;"><strong>Total:</strong></td>
              <td style="padding: 12px 8px;"><strong>₹${order.total}</strong></td>
            </tr>
          </tfoot>
        </table>
        
        <div style="margin-top: 30px; background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
          <p style="margin: 0;">Please check this order and contact the customer via WhatsApp to confirm stock availability.</p>
        </div>
      </div>
      
      <div style="background-color: #4f46e5; color: white; padding: 15px; text-align: center;">
        <p style="margin: 0;">© ${new Date().getFullYear()} Your Store Name. All rights reserved.</p>
      </div>
    </div>
  `;

  // Simplified text version for email clients that don't support HTML
  const text = `
    New Order Received!
    
    Order #${order.id} Details
    Date: ${new Date(order.createdAt).toLocaleString()}
    Total Amount: ₹${order.total}
    Customer: ${shippingAddress.firstName} ${shippingAddress.lastName}
    
    Please log in to your admin dashboard to see full details.
  `;

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `New Order #${order.id} Received`,
    html,
    text,
  });
}

/**
 * Send notification about stock update to customers
 */
export async function sendStockNotification(email: string, productName: string): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="background-color: #4f46e5; color: white; padding: 20px; text-align: center;">Product Now Available!</h1>
      
      <div style="padding: 20px;">
        <h2>Good News!</h2>
        <p>We're happy to inform you that <strong>${productName}</strong> is now back in stock.</p>
        <p>Visit our store to place your order before it's gone again!</p>
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="https://yourstore.com/product" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Shop Now
          </a>
        </div>
        
        <p>Thank you for your patience and continued interest in our products.</p>
      </div>
      
      <div style="background-color: #4f46e5; color: white; padding: 15px; text-align: center;">
        <p style="margin: 0;">© ${new Date().getFullYear()} Your Store Name. All rights reserved.</p>
      </div>
    </div>
  `;

  const text = `
    Product Now Available!
    
    Good News!
    We're happy to inform you that ${productName} is now back in stock.
    
    Visit our store to place your order before it's gone again!
    
    Thank you for your patience and continued interest in our products.
  `;

  return sendEmail({
    to: email,
    subject: `${productName} Is Now Available!`,
    html,
    text,
  });
}