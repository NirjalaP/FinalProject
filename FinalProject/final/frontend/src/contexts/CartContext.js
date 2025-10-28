import React, { createContext, useContext, useReducer, useEffect } from "react";
import api from "../config/axios";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

const CartContext = createContext();

const initialState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
  isLoading: false,
};

const cartReducer = (state, action) => {
  switch (action.type) {
    case "SET_CART":
      return {
        ...state,
        items: action.payload.items || [],
        totalItems: action.payload.totalItems || 0,
        totalPrice: action.payload.totalPrice || 0,
      };
    case "ADD_ITEM":
      return {
        ...state,
        items: [...state.items, action.payload],
        totalItems: state.totalItems + action.payload.quantity,
        totalPrice:
          state.totalPrice + action.payload.price * action.payload.quantity,
      };
    case "UPDATE_ITEM":
      return {
        ...state,
        items: state.items.map((item) =>
          item.product._id === action.payload.productId
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
        totalItems:
          state.totalItems -
          action.payload.oldQuantity +
          action.payload.quantity,
        totalPrice:
          state.totalPrice -
          action.payload.price * action.payload.oldQuantity +
          action.payload.price * action.payload.quantity,
      };
    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter(
          (item) => item.product._id !== action.payload.productId
        ),
        totalItems: state.totalItems - action.payload.quantity,
        totalPrice:
          state.totalPrice - action.payload.price * action.payload.quantity,
      };
    case "CLEAR_CART":
      return {
        ...state,
        items: [],
        totalItems: 0,
        totalPrice: 0,
      };
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { isAuthenticated, user } = useAuth();

  // Fetch cart when user logs in
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      // Clear cart when user logs out
      dispatch({ type: "CLEAR_CART" });
    }
  }, [isAuthenticated]);

  const fetchCart = async () => {
    if (!isAuthenticated) return;

    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await api.get("/cart");
      dispatch({ type: "SET_CART", payload: response.data.cart });
    } catch (error) {
      console.error("Failed to fetch cart:", error);
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      toast.error("Please login to add items to cart");
      return { success: false };
    }

    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await api.post("/cart/add", {
        productId,
        quantity,
      });

      // Update cart state
      dispatch({ type: "SET_CART", payload: response.data.cart });
      toast.success("Item added to cart!");
      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to add item to cart";
      toast.error(message);
      return { success: false, error: message };
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (!isAuthenticated) return { success: false };

    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await api.put(`/cart/update/${productId}`, {
        quantity,
      });

      // Update cart state
      dispatch({ type: "SET_CART", payload: response.data.cart });
      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to update quantity";
      toast.error(message);
      return { success: false, error: message };
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const removeFromCart = async (productId) => {
    if (!isAuthenticated) return { success: false };

    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await api.delete(`/cart/remove/${productId}`);

      // Update cart state
      dispatch({ type: "SET_CART", payload: response.data.cart });
      toast.success("Item removed from cart");
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to remove item";
      toast.error(message);
      return { success: false, error: message };
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) return { success: false };

    try {
      dispatch({ type: "SET_LOADING", payload: true });
      await api.delete("/cart/clear");
      dispatch({ type: "CLEAR_CART" });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to clear cart";
      toast.error(message);
      return { success: false, error: message };
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const getCartCount = async () => {
    if (!isAuthenticated) return 0;

    try {
      const response = await api.get("/cart/count");
      return response.data.count;
    } catch (error) {
      console.error("Failed to get cart count:", error);
      return 0;
    }
  };

  const mergeGuestCart = async (guestCartItems) => {
    if (!isAuthenticated || !guestCartItems?.length) return { success: false };

    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await api.post("/cart/merge", {
        guestCartItems,
      });

      dispatch({ type: "SET_CART", payload: response.data.cart });
      return { success: true };
    } catch (error) {
      console.error("Failed to merge cart:", error);
      return { success: false };
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const value = {
    ...state,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartCount,
    mergeGuestCart,
    fetchCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
