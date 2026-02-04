import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
}

interface Variant {
  variantType: string;
  offerPrice: string;
}

interface CartItem {
  id: number;
  productName: string;
  quantity: number;
  imageUrl: string;
  cart: {
    id: number;
    user: User;
  };
  variant: Variant;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  count: number;
  results: CartItem[];
}

interface GroupedCart {
  cartId: number;
  user: User;
  items: CartItem[];
  totalQty: number;
  lastActivity: string;
}


// ---- MOCK API RESPONSE (replace with real API call) ----


// ---- GROUP BY CART ID ----
const groupAbandonedCarts = (
  response: ApiResponse
): GroupedCart[] => {
  const grouped: Record<number, GroupedCart> = {};

  response.results.forEach((item) => {
    const cartId = item.cart.id;

    if (!grouped[cartId]) {
      grouped[cartId] = {
        cartId,
        user: item.cart.user,
        items: [],
        totalQty: 0,
        lastActivity: item.updatedAt,
      };
    }

    grouped[cartId].items.push(item);
    grouped[cartId].totalQty += item.quantity;
  });

  return Object.values(grouped);
};


export default function AbandonedCartUI() {
  const [carts, setCarts] = useState<GroupedCart[]>([]);
  const [selectedCart, setSelectedCart] = useState<GroupedCart | null>(null);
  const [openedCarts, setOpenedCarts] = useState<Set<number>>(new Set());


  const {data: abandonedCartResponse, isLoading } = useQuery<ApiResponse>({
      queryKey: ["/api/abandoned-cart"],
      queryFn: async () => {
        return await apiRequest("/api/abandoned-cart");
      },
    // enabled: !!currentUser, // Only fetch if user is authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
  if (!abandonedCartResponse) return;

  const grouped = groupAbandonedCarts(abandonedCartResponse);
    setCarts(grouped);
    }, [abandonedCartResponse]);


  return (
    <div className="grid grid-cols-3 gap-6 p-6 bg-gray-100 min-h-screen">
      {/* LEFT: USERS TABLE */}
      <div className="col-span-2 bg-white rounded-2xl shadow p-5">
        <h2 className="text-xl font-semibold mb-4">Abandoned Carts</h2>

        <table className="w-full border-collapse table-fixed">
          <colgroup>
    <col className="w-[20%]" /> {/* Customer */}
    <col className="w-[15%]" /> {/* Contact */}
    <col className="w-[25%]" /> {/* Email */}
    <col className="w-[10%]" /> {/* Total */}
    <col className="w-[15%]" /> {/* Last Activity */}
    <col className="w-[15%]" /> {/* Cart */}
  </colgroup>
          <thead>
            <tr className="border-b text-sm text-gray-500">
              <th className="text-left">Customer</th>
              <th className="text-left">Customer contact</th>
              <th className="text-left">Customer email</th>
              <th className="text-left">Total Items</th>
              <th className="text-left">Last Activity</th>
              <th className="text-left">Cart</th>
            </tr>
          </thead>

          <tbody>
            {carts.map((cart) => (
              <tr
                key={cart.cartId}
                className="border-b hover:bg-gray-50"
              >
                <td className="py-3 font-medium">
                  {cart.user.firstName} {cart.user.lastName}
                </td>
                <td>{cart.user.phone ?? "—"}</td>
                <td className="break-all whitespace-normal">{cart.user.email ?? "--"}</td>
                <td>{cart.totalQty}</td>
                <td className="text-sm text-gray-600">
                  {formatDistanceToNow(new Date(cart.lastActivity), { addSuffix: true })}
                </td>
                <td className="text-right">
                  <button
                    onClick={() => {
                      setSelectedCart(cart);
                      setOpenedCarts((prev) => new Set(prev).add(cart.cartId));}}
                    className={`
                        px-3 py-1 text-sm rounded-md border transition
                        ${
                          openedCarts.has(cart.cartId)
                            ? "bg-gray-200 text-gray-600 border-gray-300 hover:bg-gray-300"
                            : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                        }
                      `}                  >
                    View Cart
                  </button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* RIGHT: ORDER SUMMARY */}
      {/* <div className="bg-white rounded-2xl shadow p-5">
        <h2 className="text-lg font-semibold mb-4">Order Summary</h2> */}

        {/* {!selectedCart && (
          <p className="text-sm text-gray-500">
            Select a cart to view details
          </p>
        )} */}

      {selectedCart && (
        <div
          className="
            fixed z-50 bg-white shadow-xl
            inset-x-0 bottom-0 h-[70vh]
            md:static md:h-auto md:w-[380px]
            rounded-t-2xl md:rounded-xl
            overflow-y-auto
          "
        >
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-semibold">Order Summary</h2>
            <button
              onClick={() => setSelectedCart(null)}
              className="text-gray-500 text-xl"
            >
              ✕
            </button>
          </div>

          {/* Cart Items */}
          <div className="p-4 space-y-4">
            {selectedCart.items.map((item) => (
              <div key={item.id} className="flex gap-3">
                <img
                  src={item.imageUrl}
                  className="w-14 h-14 rounded-lg object-cover"
                />

                <div className="flex-1">
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-sm text-gray-500">
                    {item.variant.variantType}
                  </p>
                  <p className="text-sm">Qty: {item.quantity}</p>
                </div>

                <div className="font-semibold">
                  ₹{item.variant.offerPrice}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    // </div>
  );
}
