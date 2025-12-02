export interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  category: 'vegetables' | 'fruits';
  image?: string;
  discount?: number;
  description?: string;
}

export interface Category {
  id: string;
  name: string;
  image?: string;
}

export const categories: Category[] = [
  { id: 'vegetables', name: 'Vegetables' },
  { id: 'fruits', name: 'Fruits' },
];

export const products: Product[] = [
  // Vegetables
  {
    id: '1',
    name: 'Fresh Tomatoes',
    price: 50,
    unit: '500g',
    category: 'vegetables',
    discount: 10,
    description: 'Fresh, red, juicy tomatoes perfect for cooking',
  },
  {
    id: '2',
    name: 'Onions',
    price: 40,
    unit: '1kg',
    category: 'vegetables',
    description: 'Fresh onions for your daily cooking needs',
  },
  {
    id: '3',
    name: 'Potatoes',
    price: 35,
    unit: '1kg',
    category: 'vegetables',
    discount: 15,
    description: 'Fresh potatoes, great for all recipes',
  },
  {
    id: '4',
    name: 'Carrots',
    price: 60,
    unit: '500g',
    category: 'vegetables',
    description: 'Fresh, crunchy carrots',
  },
  {
    id: '5',
    name: 'Capsicum',
    price: 80,
    unit: '500g',
    category: 'vegetables',
    discount: 20,
    description: 'Fresh green capsicum',
  },
  {
    id: '6',
    name: 'Cauliflower',
    price: 45,
    unit: '1 piece',
    category: 'vegetables',
    description: 'Fresh cauliflower',
  },
  // Fruits
  {
    id: '7',
    name: 'Bananas',
    price: 60,
    unit: '1 dozen',
    category: 'fruits',
    discount: 10,
    description: 'Fresh, ripe bananas',
  },
  {
    id: '8',
    name: 'Apples',
    price: 120,
    unit: '500g',
    category: 'fruits',
    description: 'Fresh red apples',
  },
  {
    id: '9',
    name: 'Oranges',
    price: 80,
    unit: '1kg',
    category: 'fruits',
    discount: 15,
    description: 'Sweet and juicy oranges',
  },
  {
    id: '10',
    name: 'Mangoes',
    price: 150,
    unit: '1kg',
    category: 'fruits',
    description: 'Sweet, ripe mangoes',
  },
  {
    id: '11',
    name: 'Grapes',
    price: 100,
    unit: '500g',
    category: 'fruits',
    discount: 20,
    description: 'Fresh green grapes',
  },
  {
    id: '12',
    name: 'Watermelon',
    price: 50,
    unit: '1kg',
    category: 'fruits',
    description: 'Fresh, juicy watermelon',
  },
];

export const getProductsByCategory = (category: string): Product[] => {
  return products.filter((p) => p.category === category);
};

export const getProductById = (id: string): Product | undefined => {
  return products.find((p) => p.id === id);
};

