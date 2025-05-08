import { db } from "./db";
import { 
  users, categories, products, 
  InsertCategory, InsertProduct 
} from "@shared/schema";

// Function to initialize the database with demo data
export async function initializeDatabase() {
  try {
    console.log("Initializing database with demo data...");
    
    // Check if data already exists
    const existingCategories = await db.select().from(categories);
    if (existingCategories.length > 0) {
      console.log("Database already contains data, skipping initialization.");
      return;
    }

    // Initialize categories
    const demoCategories: InsertCategory[] = [
      { 
        name: "Women", 
        slug: "women", 
        imageUrl: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600&q=80" 
      },
      { 
        name: "Men", 
        slug: "men", 
        imageUrl: "https://images.unsplash.com/photo-1520975661595-6453be3f7070?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600&q=80" 
      },
      { 
        name: "Accessories", 
        slug: "accessories", 
        imageUrl: "https://images.unsplash.com/photo-1556306535-0f09a537f0a3?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600&q=80" 
      },
      { 
        name: "Footwear", 
        slug: "footwear", 
        imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600&q=80" 
      }
    ];
    
    await db.insert(categories).values(demoCategories);
    console.log("Categories initialized successfully");

    // Initialize products with Indian Rupee prices
    const demoProducts: InsertProduct[] = [
      {
        name: "Denim Jacket",
        description: "Stylish denim jacket perfect for layering in all seasons.",
        price: "5999",
        compareAtPrice: "7499",
        imageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=650&q=80",
        category: "Women",
        tags: ["jacket", "denim", "women"],
        rating: "4.0",
        isNew: false,
        isSale: true,
        isFeatured: true,
        isTrending: false,
        stock: 15
      },
      {
        name: "White Shirt",
        description: "Classic white button-up shirt for formal occasions.",
        price: "3499",
        compareAtPrice: null,
        imageUrl: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=650&q=80",
        category: "Men",
        tags: ["shirt", "formal", "men"],
        rating: "4.5",
        isNew: false,
        isSale: false,
        isFeatured: true,
        isTrending: false,
        stock: 25
      },
      {
        name: "Leather Bag",
        description: "Premium leather crossbody bag in tan color.",
        price: "9999",
        compareAtPrice: null,
        imageUrl: "https://images.unsplash.com/photo-1591561954555-607968c989ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=650&q=80",
        category: "Accessories",
        tags: ["bag", "leather", "accessories"],
        rating: "5.0",
        isNew: true,
        isSale: false,
        isFeatured: true,
        isTrending: false,
        stock: 10
      },
      {
        name: "Knit Sweater",
        description: "Casual knit sweater in neutral beige tone.",
        price: "4999",
        compareAtPrice: null,
        imageUrl: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=650&q=80",
        category: "Women",
        tags: ["sweater", "knit", "women"],
        rating: "4.0",
        isNew: false,
        isSale: false,
        isFeatured: true,
        isTrending: false,
        stock: 18
      },
      {
        name: "Sunglasses",
        description: "Designer sunglasses with dark frames.",
        price: "6499",
        compareAtPrice: "8999",
        imageUrl: "https://images.pexels.com/photos/701877/pexels-photo-701877.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        category: "Accessories",
        tags: ["sunglasses", "accessories"],
        rating: "4.5",
        isNew: false,
        isSale: true,
        isFeatured: true,
        isTrending: false,
        stock: 22
      },
      {
        name: "White Sneakers",
        description: "Premium leather sneakers in white.",
        price: "7499",
        compareAtPrice: null,
        imageUrl: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=650&q=80",
        category: "Footwear",
        tags: ["sneakers", "footwear", "men"],
        rating: "4.0",
        isNew: false,
        isSale: false,
        isFeatured: true,
        isTrending: false,
        stock: 15
      },
      {
        name: "Leather Watch",
        description: "Classic wristwatch with leather strap.",
        price: "11999",
        compareAtPrice: null,
        imageUrl: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=650&q=80",
        category: "Accessories",
        tags: ["watch", "accessories", "men"],
        rating: "5.0",
        isNew: true,
        isSale: false,
        isFeatured: true,
        isTrending: false,
        stock: 8
      },
      {
        name: "Windbreaker Jacket",
        description: "Lightweight windbreaker jacket in navy blue.",
        price: "5999",
        compareAtPrice: null,
        imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=650&q=80",
        category: "Men",
        tags: ["jacket", "windbreaker", "men"],
        rating: "3.5",
        isNew: false,
        isSale: false,
        isFeatured: true,
        isTrending: false,
        stock: 12
      },
      {
        name: "Cashmere Sweater",
        description: "Premium cashmere sweater for ultimate comfort.",
        price: "8999",
        compareAtPrice: null,
        imageUrl: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150&q=80",
        category: "Women",
        tags: ["sweater", "cashmere", "women"],
        rating: "5.0",
        isNew: false,
        isSale: false,
        isFeatured: false,
        isTrending: true,
        stock: 7
      },
      {
        name: "Leather Wallet",
        description: "High quality leather wallet with card compartments.",
        price: "3999",
        compareAtPrice: null,
        imageUrl: "https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        category: "Accessories",
        tags: ["wallet", "leather", "accessories"],
        rating: "4.0",
        isNew: false,
        isSale: false,
        isFeatured: false,
        isTrending: true,
        stock: 20
      },
      {
        name: "Beanie Hat",
        description: "Knitted beanie hat in autumn colors.",
        price: "1999",
        compareAtPrice: "2999",
        imageUrl: "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150&q=80",
        category: "Accessories",
        tags: ["hat", "beanie", "accessories"],
        rating: "3.5",
        isNew: false,
        isSale: true,
        isFeatured: false,
        isTrending: true,
        stock: 30
      },
      {
        name: "Silver Jewelry Set",
        description: "Set of silver minimalist jewelry pieces.",
        price: "6999",
        compareAtPrice: null,
        imageUrl: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150&q=80",
        category: "Accessories",
        tags: ["jewelry", "silver", "accessories"],
        rating: "4.5",
        isNew: false,
        isSale: false,
        isFeatured: false,
        isTrending: true,
        stock: 15
      }
    ];

    await db.insert(products).values(demoProducts);
    console.log("Products initialized successfully");
    
    console.log("Database initialization completed successfully!");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}