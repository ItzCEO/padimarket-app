"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

type CartItem = {
  id: string;
  title: string;
  price: number;
  image_url?: string | null;
  quantity: number;
  stock: number;
  seller_id: string;
  seller_name?: string | null;
};

type CartProduct = Omit<CartItem, "quantity">;

type PendingProduct = CartProduct & {
  currentSellerName?: string | null;
};

type CartContextType = {
  cart: CartItem[];
  cartSellerId: string | null;
  cartSellerName: string | null;
  pendingProduct: PendingProduct | null;
  addToCart: (product: CartProduct) => void;
  confirmAddDifferentSellerProduct: () => void;
  cancelAddDifferentSellerProduct: () => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<PendingProduct | null>(null);

  useEffect(() => {
    const savedCart = localStorage.getItem("padimarket-cart");

    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);

        const cleanCart = parsedCart.map((item: any) => ({
          ...item,
          quantity: Number(item.quantity) > 0 ? Number(item.quantity) : 1,
          stock: Number(item.stock) > 0 ? Number(item.stock) : 1,
          seller_id: item.seller_id || "",
          seller_name: item.seller_name || null,
        }));

        setCart(cleanCart);
      } catch {
        setCart([]);
      }
    }

    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("padimarket-cart", JSON.stringify(cart));
    }
  }, [cart, isLoaded]);

  const cartSellerId = cart.length > 0 ? cart[0].seller_id : null;
  const cartSellerName = cart.length > 0 ? cart[0].seller_name || null : null;

  function addProduct(product: CartProduct) {
    const stock = Math.max(Number(product.stock || 1), 0);

    if (stock === 0) {
      return;
    }

    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);

      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: Math.min(item.quantity + 1, stock),
              }
            : item
        );
      }

      return [
        ...current,
        {
          ...product,
          stock,
          quantity: 1,
        },
      ];
    });
  }

  const addToCart = (product: CartProduct) => {
    const stock = Math.max(Number(product.stock || 1), 0);

    if (stock === 0) {
      return;
    }

    if (cart.length === 0) {
      addProduct(product);
      return;
    }

    const currentSellerId = cart[0].seller_id;

    if (product.seller_id === currentSellerId) {
      addProduct(product);
      return;
    }

    setPendingProduct({
      ...product,
      currentSellerName: cart[0].seller_name || "another seller",
    });
  };

  const confirmAddDifferentSellerProduct = () => {
    if (!pendingProduct) return;

    const productToAdd = pendingProduct;

    setCart([]);
    setPendingProduct(null);

    setTimeout(() => {
      addProduct(productToAdd);
    }, 0);
  };

  const cancelAddDifferentSellerProduct = () => {
    setPendingProduct(null);
  };

  const removeFromCart = (id: string) => {
    setCart((current) => current.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    setCart((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: Math.min(Math.max(quantity, 1), item.stock),
            }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartSellerId,
        cartSellerName,
        pendingProduct,
        addToCart,
        confirmAddDifferentSellerProduct,
        cancelAddDifferentSellerProduct,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}

            {pendingProduct && (
        <div className="seller-cart-notice-overlay">
          <div className="seller-cart-notice">
            <h3>One seller per cart</h3>

            <p>
              Your cart can only contain items from one seller at a time. To
              shop from another seller, clear your current cart first.
            </p>

            <p>
              Your cart currently contains items from{" "}
              <strong>
                {pendingProduct.currentSellerName || "another seller"}
              </strong>
              .
            </p>

            <p>
              To add <strong>{pendingProduct.title}</strong> from{" "}
              <strong>
                {pendingProduct.seller_name || "another seller"}
              </strong>
              , you must clear your current cart.
            </p>

            <div className="seller-cart-notice-actions">
              <button
                type="button"
                onClick={cancelAddDifferentSellerProduct}
                className="seller-cart-cancel-button"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmAddDifferentSellerProduct}
                className="seller-cart-confirm-button"
              >
                Clear cart and add item
              </button>
            </div>
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}