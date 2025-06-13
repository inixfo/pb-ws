import React, { createContext, useContext, useState } from 'react';

interface CartItem {
  productId: number;
  quantity: number;
  variationId?: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (productId: number, quantity: number, variationId?: number) => void;
  removeFromCart: (productId: number, variationId?: number) => void;
  updateQuantity: (productId: number, quantity: number, variationId?: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (productId: number, quantity: number, variationId?: number) => {
    setItems(currentItems => {
      // Find existing item with same product and variation
      const existingItemIndex = currentItems.findIndex(
        item => item.productId === productId && item.variationId === variationId
      );

      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        const newItems = [...currentItems];
        newItems[existingItemIndex].quantity += quantity;
        return newItems;
      } else {
        // Add new item
        return [...currentItems, { productId, quantity, variationId }];
      }
    });
  };

  const removeFromCart = (productId: number, variationId?: number) => {
    setItems(currentItems => 
      currentItems.filter(item => 
        !(item.productId === productId && item.variationId === variationId)
      )
    );
  };

  const updateQuantity = (productId: number, quantity: number, variationId?: number) => {
    setItems(currentItems => {
      const newItems = [...currentItems];
      const itemIndex = newItems.findIndex(
        item => item.productId === productId && item.variationId === variationId
      );
      if (itemIndex >= 0) {
        newItems[itemIndex].quantity = quantity;
      }
      return newItems;
    });
  };

  const clearCart = () => {
    setItems([]);
  };

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 