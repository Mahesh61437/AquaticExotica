/**
 * Stock notification system
 * This service manages customer email notifications for when products come back in stock.
 */

import { db, pool } from './db';
import { sql } from 'drizzle-orm';
import { sendStockNotification } from './email-service';
import { log } from './vite';

// Store notification subscriptions in memory for simplicity
// In a production system, this would be stored in the database
interface StockNotificationSubscription {
  email: string;
  productId: number;
  productName: string;
  createdAt: Date;
}

// In-memory store of notification requests
const stockNotifications: StockNotificationSubscription[] = [];

/**
 * Subscribe a user to receive notifications when a product is back in stock
 */
export async function subscribeToStockNotification(
  email: string,
  productId: number,
  productName: string
): Promise<boolean> {
  try {
    // Check if the user is already subscribed for this product
    const existingSubscription = stockNotifications.find(
      sub => sub.email === email && sub.productId === productId
    );
    
    if (existingSubscription) {
      log(`User ${email} is already subscribed to notifications for product ${productId}`, 'stock-notifications');
      return true; // Already subscribed, consider it a success
    }
    
    // Add new subscription
    stockNotifications.push({
      email,
      productId,
      productName,
      createdAt: new Date()
    });
    
    log(`User ${email} subscribed to notifications for product ${productId}`, 'stock-notifications');
    return true;
  } catch (error) {
    console.error("Error subscribing to stock notification:", error);
    return false;
  }
}

/**
 * Get all subscribers for a specific product
 */
export function getProductSubscribers(productId: number): StockNotificationSubscription[] {
  return stockNotifications.filter(sub => sub.productId === productId);
}

/**
 * Mark a product as back in stock and notify all subscribers
 */
export async function notifyProductBackInStock(productId: number, productName: string): Promise<boolean> {
  try {
    const subscribers = getProductSubscribers(productId);
    
    if (subscribers.length === 0) {
      log(`No subscribers found for product ${productId}`, 'stock-notifications');
      return true; // Nothing to do
    }
    
    log(`Notifying ${subscribers.length} subscribers about product ${productId}`, 'stock-notifications');
    
    // Send notifications to all subscribers
    const notificationPromises = subscribers.map(subscriber => 
      sendStockNotification(subscriber.email, productName)
    );
    
    // Wait for all notifications to be sent
    await Promise.all(notificationPromises);
    
    // Clear subscriptions for this product since it's now in stock
    const newNotificationsList = stockNotifications.filter(
      sub => sub.productId !== productId
    );
    
    // Update the notifications list
    stockNotifications.length = 0;
    stockNotifications.push(...newNotificationsList);
    
    log(`Successfully notified subscribers about product ${productId}`, 'stock-notifications');
    return true;
  } catch (error) {
    console.error("Error notifying about product back in stock:", error);
    return false;
  }
}