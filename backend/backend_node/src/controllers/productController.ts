import { Request, Response } from 'express';
import prisma from '../config/db';

export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products' });
  }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid product ID' });
      return;
    }

    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    // Generate highly rich Specifications, Supplier Data, and Reviews based on Category
    let specifications: Record<string, string> = {};
    let supplier = {};
    let reviews: any[] = [];
    let rating = 4.5; // Default overall rating

    if (product.category === 'Electronics') {
      specifications = {
        'Brand': product.name.includes('MacBook') ? 'Apple' : product.name.includes('iPhone') ? 'Apple' : product.name.includes('Sony') ? 'Sony' : 'Generic',
        'Warranty': '1 Year Manufacturer Warranty',
        'Connectivity': 'Bluetooth 5.3, Wi-Fi 6E, USB-C High Speed',
        'Processor': product.name.includes('MacBook') ? 'M3 Pro Chip (8-Core CPU)' : product.name.includes('iPhone') ? 'A17 Pro Bionic' : 'Custom ANC Sound Chip',
        'Battery Life': product.name.includes('Headphones') ? 'Up to 30 Hours (ANC On)' : 'Up to 18 Hours video playback',
        'Material': product.name.includes('iPhone') ? 'Aerospace-grade Titanium' : 'Eco-conscious Recycled Aluminum'
      };
      supplier = {
        name: 'Silicon Valley Wholesale Tech',
        origin: 'San Francisco, California',
        dispatchSpeed: 'Ships within 24 Hours',
        rating: 4.8
      };
      reviews = [
        { reviewer: 'Alex Mercer', rating: 5, comment: 'Absolutely incredible performance. Compiles my code in seconds and battery is an absolute beast.', date: '2026-05-12' },
        { reviewer: 'Sarah Chen', rating: 4, comment: 'Gorgeous product, premium packaging. The price is slightly high, but the titanium feel makes up for it.', date: '2026-05-20' },
        { reviewer: 'Dave K.', rating: 5, comment: 'Best purchase of this year. Highly recommended for developers and designers alike.', date: '2026-05-28' }
      ];
      rating = 4.7;
    } else if (product.category === 'Clothing') {
      specifications = {
        'Material': '100% Premium Organic Denim Cotton',
        'Fit': 'Original Straight Fit',
        'Care Instructions': 'Machine wash cold, air dry recommended',
        'Weave': '14oz Durable Heavyweight Cotton',
        'Closure': 'Classic Button Fly',
        'Pockets': '5-Pocket Design'
      };
      supplier = {
        name: 'Vanguard Denim Distributors',
        origin: 'Austin, Texas',
        dispatchSpeed: 'Ships within 2-3 Days',
        rating: 4.5
      };
      reviews = [
        { reviewer: 'Jordan K.', rating: 5, comment: 'Durable heavyweight cotton, fits exactly as advertised. Very pleased with the vintage indigo color.', date: '2026-05-18' },
        { reviewer: 'Emma Watson', rating: 4, comment: 'Slightly stiff initially, but softened beautifully after the first wash. Highly durable.', date: '2026-05-24' }
      ];
      rating = 4.5;
    } else if (product.category === 'Footwear') {
      specifications = {
        'Cushioning': 'Responsive Energy-Return Boost Sole',
        'Upper Material': 'Breathable Primeknit Fiber Mesh',
        'Closure': 'Secure Lace-up Structure',
        'Pronation': 'Neutral stability support',
        'Outsole': 'Continental Rubber Grip Outsole',
        'Weight': '310g (Size 9)'
      };
      supplier = {
        name: 'Apex Activewear & Sports',
        origin: 'Portland, Oregon',
        dispatchSpeed: 'Ships within 24 Hours',
        rating: 4.9
      };
      reviews = [
        { reviewer: 'Marcus A.', rating: 5, comment: 'I run 10k daily and these are the most responsive shoes I have ever owned. High energy return!', date: '2026-05-22' },
        { reviewer: 'Liam N.', rating: 5, comment: 'Extremely comfortable. Feels like walking on clouds. Excellent heel locking support.', date: '2026-05-27' }
      ];
      rating = 5.0;
    } else {
      // General categories fallback
      specifications = {
        'Category': product.category,
        'Condition': 'New in Box',
        'Availability': 'In Stock',
        'Warranty': '30-Day Money-Back Guarantee'
      };
      supplier = {
        name: 'MegaMart Global Fullfillment',
        origin: 'Chicago, Illinois',
        dispatchSpeed: 'Ships within 48 Hours',
        rating: 4.4
      };
      reviews = [
        { reviewer: 'Customer One', rating: 4, comment: 'Great product, matches description perfectly.', date: '2026-05-10' }
      ];
      rating = 4.0;
    }

    res.json({
      ...product,
      specifications,
      supplier,
      reviews,
      rating
    });

  } catch (error) {
    res.status(500).json({ message: 'Error fetching product detail', error });
  }
};