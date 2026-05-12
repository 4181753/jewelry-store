const fs = require('fs');

const brands = [
  { id: 'louis-vuitton', name: 'Louis Vuitton' },
  { id: 'fred', name: 'FRED' },
  { id: 'bvlgari', name: 'Bvlgari' },
  { id: 'cartier', name: 'Cartier' }
];

const products = [];

brands.forEach(brand => {
  for (let i = 1; i <= 20; i++) {
    const originalPrice = 15000000 + Math.floor(Math.random() * 35000000);
    const salePrice = Math.floor(originalPrice * 0.7);
    
    products.push({
      id: `${brand.id}-${i}`,
      brandId: brand.id,
      name: `${brand.name} ${['Ring', 'Necklace', 'Bracelet', 'Earrings'][i % 4]} Collection #${i}`,
      originalPrice: `Rp ${originalPrice.toLocaleString('id-ID')}`,
      salePrice: `Rp ${salePrice.toLocaleString('id-ID')}`,
      rating: 5,
      images: [
        `/images/products/${brand.id}-${i}.jpg`,
        `/images/products/${brand.id}-${i}-hover.jpg`
      ]
    });
  }
});

const content = {
  site: {
    name: "Luxury Redefined",
    tagline: "Crafting Excellence, Inspiring Confidence.",
    conversion: {
      emotional: {
        title: "Original Mold, Original Craft.",
        description: "Every curve and detail is meticulously recreated from the original boutique piece, ensuring an authentic look and feel."
      },
      technical: {
        title: "Uncompromising Quality",
        description: "Indistinguishable from the original. We use V-Gold heavy plating for years of color preservation and D-Color Moissanite that passes diamond testers."
      },
      cta: {
        title: "Master Craftsman Limited Edition",
        description: "These are not factory-mass-produced items. Each piece is a limited stock from our master craftsmen. WhatsApp us for a real-shot video."
      }
    }
  },
  brands: [
    {
      id: "louis-vuitton",
      name: "Louis Vuitton",
      image: "/images/brands/lv.jpg",
      description: "Modern Parisian luxury and timeless design."
    },
    {
      id: "fred",
      name: "FRED",
      image: "/images/brands/fred.jpg",
      description: "The French Riviera's spirit in every piece."
    },
    {
      id: "bvlgari",
      name: "Bvlgari",
      image: "/images/brands/bvlgari.jpg",
      description: "Italian boldness and exquisite craftsmanship."
    },
    {
      id: "cartier",
      name: "Cartier",
      image: "/images/brands/cartier.jpg",
      description: "The jeweler of kings and the king of jewelers."
    }
  ],
  products: products
};

fs.writeFileSync('D:/copy/005/src/data/site-content.json', JSON.stringify(content, null, 2));
console.log('Generated 80 products in src/data/site-content.json');
