import sgMail from '@sendgrid/mail';
import { log } from './vite';
import { Order } from '@shared/schema';

// Initialize SendGrid with API key
if (!process.env.SENDGRID_API_KEY) {
  console.error("SENDGRID_API_KEY is not set in environment variables");
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  log('SendGrid initialized', 'email-service');
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
      from: 'mahesh@aquaticexotica.com', // Sender email
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
 * Send contact form message to site admin
 */
export async function sendContactFormMessage(
  name: string,
  email: string,
  subject: string,
  message: string
): Promise<boolean> {
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 2px solid #eeeeee; padding-bottom: 10px;">
        New Contact Form Message
      </h2>
      
      <p><strong>From:</strong> ${name} (${email})</p>
      <p><strong>Subject:</strong> ${subject}</p>
      
      <div style="background-color: #f9f9f9; border-radius: 5px; padding: 15px; margin: 20px 0;">
        <h3 style="color: #333; margin-top: 0;">Message:</h3>
        <p>${message.replace(/\n/g, '<br/>')}</p>
      </div>
      
      <p style="color: #777; font-size: 0.9em; margin-top: 30px;">
        This message was sent from the contact form on AquaticExotica website.
      </p>
    </div>
  `;

  return sendEmail({
    to: 'mahesh@aquaticexotica.com',
    subject: `Contact Form: ${subject}`,
    html: emailHtml
  });
}

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

  // Send to admin
  await sendEmail({
    to: 'mahesh@aquaticexotica.com',
    subject: `New Order #${order.id} - AquaticExotica`,
    html: emailHtml
  });
  
  // If customer email is provided, also send confirmation to customer
  if (customerEmail && customerEmail !== 'Not provided' && customerEmail !== 'guest@example.com') {
    const customerEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #eeeeee; padding-bottom: 10px;">
          Thank You for Your Order #${order.id}
        </h2>
        
        <p>Dear ${customerName},</p>
        
        <p>Thank you for your order with AquaticExotica. We have received your order and it is currently being processed.</p>
        
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
          We'll update you when your order status changes. If you have any questions, please contact us at <a href="mailto:mahesh@aquaticexotica.com">mahesh@aquaticexotica.com</a> or call us at +91 8074751370.
        </p>
        
        <p style="margin-top: 20px;">
          Thank you for shopping with AquaticExotica!
        </p>
      </div>
    `;
    
    await sendEmail({
      to: customerEmail,
      subject: `Your Order Confirmation #${order.id} - AquaticExotica`,
      html: customerEmailHtml
    });
  }
  
  return true;
}

/**
 * Send notification to customer when order status changes
 */
export async function sendOrderStatusUpdate(order: Order, newStatus: string): Promise<boolean> {
  // Don't send for non-meaningful status changes
  if (!order || !newStatus || newStatus === 'pending') {
    return false;
  }
  
  // Get customer information from order
  const customerName = order.customerName || 'Customer';
  const customerEmail = order.customerEmail || null;
  
  // Skip if no valid email
  if (!customerEmail || customerEmail === 'Not provided' || customerEmail === 'guest@example.com') {
    console.log(`No valid customer email for order #${order.id}, skipping status update email`);
    return false;
  }
  
  // Get a friendly status description
  let statusTitle = '';
  let statusDescription = '';
  
  if (newStatus === 'processing') {
    statusTitle = 'Your Order is Being Processed';
    statusDescription = 'Great news! We are now processing your order and preparing your items for shipping.';
  } else if (newStatus === 'shipped') {
    statusTitle = 'Your Order Has Been Shipped';
    statusDescription = 'Your order has been shipped and is on its way to you!';
  } else if (newStatus === 'delivered') {
    statusTitle = 'Your Order Has Been Delivered';
    statusDescription = 'Your order has been marked as delivered. We hope you enjoy your purchase!';
  } else if (newStatus === 'cancelled') {
    statusTitle = 'Your Order Has Been Cancelled';
    statusDescription = 'Your order has been cancelled. If you have any questions, please contact our customer service.';
  } else {
    statusTitle = `Order Status Update: ${newStatus}`;
    statusDescription = `Your order status has been updated to "${newStatus}".`;
  }
  
  // Create email content
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 2px solid #eeeeee; padding-bottom: 10px;">
        ${statusTitle}
      </h2>
      
      <p>Dear ${customerName},</p>
      
      <p>${statusDescription}</p>
      
      <div style="background-color: #f9f9f9; border-radius: 5px; padding: 15px; margin: 20px 0;">
        <h3 style="color: #333; margin-top: 0;">Order Information:</h3>
        <p><strong>Order ID:</strong> #${order.id}</p>
        <p><strong>Status:</strong> ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</p>
      </div>
      
      <p style="margin-top: 30px;">
        If you have any questions about your order, please contact us at 
        <a href="mailto:mahesh@aquaticexotica.com">mahesh@aquaticexotica.com</a> or call us at +91 8074751370.
      </p>
      
      <p style="margin-top: 20px;">
        Thank you for shopping with AquaticExotica!
      </p>
    </div>
  `;
  
  return sendEmail({
    to: customerEmail,
    subject: `${statusTitle} - Order #${order.id} - AquaticExotica`,
    html: emailHtml
  });
}

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