import React from 'react';
import { FaTimes, FaShoppingCart, FaCheckCircle } from 'react-icons/fa';

interface ShoppingCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: any[];
  currency: string;
  onRemoveFromCart: (botId: string) => void;
  onCheckout: () => void;
}

const ShoppingCartModal: React.FC<ShoppingCartModalProps> = ({
  isOpen,
  onClose,
  cart,
  currency,
  onRemoveFromCart,
  onCheckout,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-[#23263a] w-full max-w-md rounded-2xl p-8 relative border-4 border-[#00ffe7]/40 shadow-[0_0_48px_#00ffe7] hud-panel">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-[#181a23] p-2 rounded-full hover:bg-[#00ffe7] hover:text-[#181a23] text-[#00ffe7] border-2 border-[#00ffe7] transition-all text-xl"
          aria-label="Close"
        >
          <FaTimes />
        </button>
        <h2 className="text-2xl font-bold text-[#00ffe7] mb-4 flex items-center gap-2">
          <FaShoppingCart /> Shopping Cart
        </h2>
        {cart.length === 0 ? (
          <div className="text-[#e0e7ef] text-center py-8">
            Your cart is empty.
          </div>
        ) : (
          <>
            <ul className="divide-y divide-[#00ffe7]/20 mb-4">
              {cart.map((bot) => (
                <li
                  key={bot.id}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={bot.image}
                      alt={bot.name}
                      className="w-10 h-10 rounded-full border-2 border-[#00ffe7]/40"
                    />
                    <span className="text-[#00ffe7] font-bold">
                      {bot.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 font-bold">
                      {bot.price} {currency}
                    </span>
                    <button
                      onClick={() => onRemoveFromCart(bot.id)}
                      className="text-[#ff005c] hover:text-red-600 text-lg"
                      aria-label="Remove"
                    >
                      <FaTimes />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[#e0e7ef] font-bold">Total:</span>
              <span className="text-green-400 font-bold text-lg">
                {cart.reduce((sum, b) => sum + b.price, 0)} {currency}
              </span>
            </div>
            <button
              onClick={onCheckout}
              className="w-full hud-btn flex items-center justify-center gap-2 bg-[#00ffe7] text-[#181a23] px-4 py-3 rounded-lg font-bold uppercase shadow-[0_0_8px_#00ffe7] hover:bg-[#ff005c] hover:text-white hover:shadow-[0_0_16px_#ff005c] transition-all border-2 border-[#00ffe7] text-lg"
            >
              <FaCheckCircle />
              Checkout
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ShoppingCartModal;
