import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const CartContext = createContext();

const initialState = {
  items: [],
  total: 0,
  count: 0,
  loading: false
};

function cartReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_CART':
      return {
        ...state,
        items: action.payload.items,
        total: parseFloat(action.payload.total),
        count: action.payload.count,
        loading: false
      };
    case 'CLEAR_CART':
      return { ...initialState };
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { isAuthenticated, token } = useAuth();

  // Load cart when user is authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      loadCart();
    } else {
      dispatch({ type: 'CLEAR_CART' });
    }
  }, [isAuthenticated, token]);

  const loadCart = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await api.get('/cart');
      dispatch({ type: 'SET_CART', payload: response.data });
    } catch (error) {
      console.error('Load cart error:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return { success: false };
    }

    try {
      // Check if offline and queue the operation
      if (!navigator.onLine) {
        await queueCartOperation('POST', '/api/cart/add', { productId, quantity });
        toast.success('Item will be added when you\'re back online');
        return { success: true };
      }

      await api.post('/cart/add', { productId, quantity });
      await loadCart();
      toast.success('Item added to cart');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add item to cart';
      toast.error(message);
      return { success: false, message };
    }
  };

  const updateCartItem = async (cartItemId, quantity) => {
    try {
      if (!navigator.onLine) {
        await queueCartOperation('PUT', `/api/cart/update/${cartItemId}`, { quantity });
        toast.success('Cart will be updated when you\'re back online');
        return { success: true };
      }

      await api.put(`/cart/update/${cartItemId}`, { quantity });
      await loadCart();
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update cart';
      toast.error(message);
      return { success: false, message };
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      if (!navigator.onLine) {
        await queueCartOperation('DELETE', `/api/cart/remove/${cartItemId}`);
        toast.success('Item will be removed when you\'re back online');
        return { success: true };
      }

      await api.delete(`/cart/remove/${cartItemId}`);
      await loadCart();
      toast.success('Item removed from cart');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to remove item';
      toast.error(message);
      return { success: false, message };
    }
  };

  const clearCart = async () => {
    try {
      if (!navigator.onLine) {
        await queueCartOperation('DELETE', '/api/cart/clear');
        toast.success('Cart will be cleared when you\'re back online');
        return { success: true };
      }

      await api.delete('/cart/clear');
      dispatch({ type: 'CLEAR_CART' });
      toast.success('Cart cleared');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to clear cart';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Queue cart operations for offline sync
  const queueCartOperation = async (method, url, body = null) => {
    try {
      const db = await openDB();
      const tx = db.transaction(['cartQueue'], 'readwrite');
      const store = tx.objectStore('cartQueue');
      
      const operation = {
        method,
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: body ? JSON.stringify(body) : null,
        timestamp: Date.now()
      };

      await store.add(operation);
      
      // Register background sync
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('cart-sync');
      }
    } catch (error) {
      console.error('Failed to queue cart operation:', error);
    }
  };

  // IndexedDB helper
  const openDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('PWAEcommerceDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('cartQueue')) {
          db.createObjectStore('cartQueue', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  };

  const value = {
    ...state,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    loadCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}