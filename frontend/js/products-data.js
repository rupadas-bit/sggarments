// Products Listing Data

const PRODUCTS = [
  {
    id: 1,
    name: "Royal Heritage Embroidered Silk Kurta Set",
    price: 2999,
    originalPrice: 4499,
    discount: "33% OFF",
    category: "Ethnic Wear",
    images: [
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1597983073493-88cd35cf03b0?auto=format&fit=crop&w=800&q=80"
    ],
    shortDescription: "Handcrafted Dupion silk kurta featuring intricate thread embroidery on collar and cuffs with matching churidar.",
    fullDescription: "Elevate your festive wardrobe with the Royal Heritage Kurta Set from Sutorekha (সূত্ররেখা). Crafted from premium Dupion Silk, this set features elegant hand-stitch threadwork along the mandarin collar and front placket. Designed for supreme comfort and regal style, it comes paired with a matching cotton-silk churidar.",
    features: [
      "Premium Dupion Silk with Soft Pure Cotton Lining",
      "Handcrafted zari thread embroidered mandarin collar & cuffs",
      "Includes matching adjustable drawstring churidar pajama",
      "Side pockets for mobile and essentials",
      "Ideal for Weddings, Festivals, and Grand Celebrations"
    ],
    specs: {
      "Brand": "Sutorekha",
      "Fabric": "Dupion Silk & Cotton Blend",
      "Pattern": "Embroidered Collar & Placket",
      "Fit": "Regular Fit",
      "Sleeve": "Full Sleeves",
      "Wash Care": "Dry Clean Recommended"
    },
    variants: {
      colors: ["Royal Gold & Cream", "Emerald Green", "Maroon Velvet"],
      sizes: ["38 (S)", "40 (M)", "42 (L)", "44 (XL)", "46 (XXL)"]
    },
    availability: "In Stock (Fast Shipping)",
    rating: 4.9,
    reviewsCount: 210
  },
  {
    id: 2,
    name: "Pure Banarasi Chanderi Zari Saree",
    price: 4999,
    originalPrice: 7999,
    discount: "37% OFF",
    category: "Sarees & Lehengas",
    images: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80"
    ],
    shortDescription: "Traditional Banarasi Chanderi silk saree woven with antique gold zari motifs and rich pallu finish.",
    fullDescription: "Immerse in timeless grace with Sutorekha's Signature Banarasi Chanderi Saree. Features woven antique gold floral jaal work across the drape and a lavish heavy zari pallu. Comes with an unstitched contrast silk blouse piece.",
    features: [
      "100% Hand-woven Chanderi Silk Blend",
      "Intricate Gold Zari Jaal & Floral Motifs",
      "Includes 0.8 meter unstitched designer blouse piece",
      "Lightweight, breathable drape with regal sheen",
      "Handcrafted by master artisans"
    ],
    specs: {
      "Brand": "Sutorekha",
      "Fabric": "Pure Chanderi Silk",
      "Saree Length": "5.5 Meters",
      "Blouse Piece": "0.8 Meter Included",
      "Work": "Gold Zari Weaving",
      "Wash Care": "Dry Clean Only"
    },
    variants: {
      colors: ["Crimson Red & Gold", "Peacock Blue", "Mustard Yellow"],
      sizes: ["Free Size (With Blouse Piece)"]
    },
    availability: "In Stock",
    rating: 4.9,
    reviewsCount: 340
  },
  {
    id: 3,
    name: "Italian Cut Slim-Fit Tuxedo Blazer",
    price: 3499,
    originalPrice: 5299,
    discount: "34% OFF",
    category: "Formal & Suits",
    images: [
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80"
    ],
    shortDescription: "Italian-cut single-breasted tuxedo blazer with satin lapel collar for sharp formal occasions.",
    fullDescription: "Make a refined statement at black-tie galas and wedding receptions. Our Italian Cut Tuxedo Blazer is constructed with high-grade poly-viscose suiting fabric, structured shoulder padding, satin lapel piping, and smooth inner viscose lining.",
    features: [
      "Structured Italian Slim-Fit Silhouette",
      "Premium Poly-Viscose Crease-Resistant Suiting",
      "Satin Shawl Lapel Collar with Single Button Closure",
      "Dual Inner Pockets & Flap Waist Pockets",
      "Breathable Satin Lining for Sharp Comfort"
    ],
    specs: {
      "Brand": "Sutorekha",
      "Fabric": "Poly-Viscose Premium Suiting",
      "Fit": "Italian Slim Fit",
      "Lapel": "Satin Shawl Collar",
      "Closure": "Single Button",
      "Wash Care": "Dry Clean Only"
    },
    variants: {
      colors: ["Midnight Black", "Navy Blue", "Charcoal Grey"],
      sizes: ["38", "40", "42", "44"]
    },
    availability: "In Stock",
    rating: 4.8,
    reviewsCount: 156
  },
  {
    id: 4,
    name: "Handloom Premium Cotton Linen Shirt",
    price: 1299,
    originalPrice: 1999,
    discount: "35% OFF",
    category: "Casual & Shirts",
    images: [
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80"
    ],
    shortDescription: "Ultra-breathable 100% organic cotton-linen casual shirt with wooden buttons and regular fit.",
    fullDescription: "Stay effortlessly stylish in hot weather with Sutorekha's Handloom Cotton Linen Shirt. Pre-washed for superior softness, it features natural wooden accent buttons, a clean spread collar, and a patch chest pocket.",
    features: [
      "100% Organic Handloom Cotton-Linen Fabric",
      "Pre-shrunk & Bio-washed for extra softness",
      "Natural Eco-friendly Wooden Buttons",
      "Curved hemline — suitable tucked in or out",
      "Breathable weave perfect for tropical heat"
    ],
    specs: {
      "Brand": "Sutorekha",
      "Fabric": "60% Linen, 40% Cotton",
      "Fit": "Modern Regular Fit",
      "Sleeve": "Full Sleeve / Convertible",
      "Pattern": "Solid Textured Weave",
      "Wash Care": "Machine Wash Cold"
    },
    variants: {
      colors: ["Sand Beige", "Olive Green", "Sky Blue", "Crisp White"],
      sizes: ["S", "M", "L", "XL", "XXL"]
    },
    availability: "In Stock",
    rating: 4.7,
    reviewsCount: 188
  },
  {
    id: 5,
    name: "Floral Embroidered Anarkali Dress Set",
    price: 3299,
    originalPrice: 4999,
    discount: "34% OFF",
    category: "Ethnic Wear",
    images: [
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80"
    ],
    shortDescription: "Floor-length Georgette Anarkali suit with gold sequence neck work and organza dupatta.",
    fullDescription: "Grace any event with our stunning Floral Anarkali Dress Set. Crafted from flowy pure Georgette with a flared 4-meter ghera, thread embroidered bodice, matching pants, and a hand-painted organza dupatta with scalloped borders.",
    features: [
      "Premium Flowy Faux Georgette Fabric",
      "4-meter flared full-length silhouette with crepe lining",
      "Includes printed organza dupatta with gold zari border",
      "Comfortable elasticated straight pants included",
      "Padded bustline for effortless fitting"
    ],
    specs: {
      "Brand": "Sutorekha",
      "Fabric": "Georgette with Shantoon Lining",
      "Work": "Resham Thread & Sequence Embroidery",
      "Length": "52 Inches (Floor Length)",
      "Dupatta": "Printed Organza 2.25 Meters",
      "Wash Care": "Dry Clean Recommended"
    },
    variants: {
      colors: ["Blush Pink", "Pistachio Green", "Lavender Gold"],
      sizes: ["S", "M", "L", "XL", "XXL"]
    },
    availability: "In Stock",
    rating: 4.9,
    reviewsCount: 175
  },
  {
    id: 6,
    name: "Heritage Velvet Designer Sherwani Set",
    price: 8999,
    originalPrice: 13999,
    discount: "35% OFF",
    category: "Ethnic Wear",
    images: [
      "https://images.unsplash.com/photo-1597983073493-88cd35cf03b0?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80"
    ],
    shortDescription: "Royal velvet sherwani with handcrafted zardozi embroidery for groom & wedding wear.",
    fullDescription: "Fit for royalty, our Heritage Velvet Sherwani is crafted from rich micro-velvet fabric featuring intricate zardozi and antique gold sequin embroidery. Comes with a silk kurta, pajama, and embroidered stole.",
    features: [
      "Luxurious High-Density Micro-Velvet Fabric",
      "Handcrafted Zardozi & Antique Gold Sequin Detailing",
      "4-Piece Complete Set (Sherwani, Inner Kurta, Churidar, Stole)",
      "Metal Antique Designer Buttons",
      "Premium Retail Finish with Breathable Satin Lining"
    ],
    specs: {
      "Brand": "Sutorekha",
      "Fabric": "Micro-Velvet & Raw Silk",
      "Occasion": "Groom / Bridal Wedding Wear",
      "Set Includes": "Sherwani, Kurta, Churidar & Stole",
      "Wash Care": "Specialist Dry Clean Only"
    },
    variants: {
      colors: ["Royal Navy Gold", "Deep Maroon Gold", "Emerald Green"],
      sizes: ["38", "40", "42", "44", "46"]
    },
    availability: "In Stock (Ready to Ship)",
    rating: 5.0,
    reviewsCount: 94
  }
];

if (typeof window !== 'undefined') {
  window.PRODUCTS = PRODUCTS;
  window.getProductById = function(id) {
    const numId = parseInt(id, 10);
    return PRODUCTS.find(p => p.id === numId) || PRODUCTS[0];
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PRODUCTS };
}

