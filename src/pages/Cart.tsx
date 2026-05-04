import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Trash2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_BASE_URL } from "@/lib/api";

interface CartItem {
  id: number;
  name: string;
  price: number;
  days: number;
  quantity: number;
  equipment_id: number;
  image_url: string;
  isRemoving?: boolean;
}

const Cart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<'CREDIT_CARD'|'DEBIT_CARD'|'UPI'|'CASH_ON_DELIVERY'|''>("");

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchCart = async () => {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_BASE_URL}/api/cart`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (Array.isArray(data)) {
      setCartItems(data);
    } else {
      setCartItems([]);
    }
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchCart();
}, []);

  const handleRemove = async (cartItemId: number | undefined) => {
    try {
      console.log('[Cart] Attempting to remove cart item:', cartItemId);
      if (!cartItemId) {
        toast.error("Invalid cart item");
        return;
      }

      if (!confirm("Remove this item from cart?")) return;

      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("You must be logged in to remove items from cart");
        return;
      }

      // Set loading state for removed item
      setCartItems(prev => prev.map(item => 
        item.id === cartItemId 
          ? { ...item, isRemoving: true }
          : item
      ));

      const res = await fetch(`${API_BASE_URL}/api/cart/remove/${cartItemId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('[Cart] Remove response status:', res.status);
      const data = await res.json();
      console.log('[Cart] Remove response data:', data);

      if (res.ok) {
        await fetchCart();
        toast.success(data.message || "Removed from cart");
      } else {
        // Revert loading state if failed
        setCartItems(prev => prev.map(item => 
          item.id === cartItemId 
            ? { ...item, isRemoving: false }
            : item
        ));
        toast.error(data.message || "Failed to remove item");
        console.error("Remove failed:", data);
      }
    } catch (err) {
      // Revert loading state on error
      setCartItems(prev => prev.map(item => 
        item.id === cartItemId 
          ? { ...item, isRemoving: false }
          : item
      ));
      console.error("Error removing item:", err);
      toast.error("Server error while removing item");
    }
  };

  const handleUpdateItem = (id: number, field: 'days' | 'quantity', value: number) => {
    if (value < 1) return;
    setCartItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handlePayment = async () => {
    if (!cartItems.length) {
      toast.error("Your cart is empty");
      return;
    }
    if (!address || !startDate || !endDate) {
      toast.error("Please fill in all required fields");
      return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const minStart = new Date(today);
    minStart.setDate(minStart.getDate() + 3);

    if (start < minStart) {
      toast.error("Please select a start date at least 3 days from today to allow for delivery.");
      return;
    }

    if (end <= start) {
      toast.error("End date must be after start date");
      return;
    }
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to continue");
      return;
    }
    // Show the dummy payment gateway modal instead of immediately processing
    setShowPaymentModal(true);
  };

  const confirmMockPayment = async () => {
    try {
      setIsProcessing(true);
      
      const token = localStorage.getItem("token");
      const totalAmount = cartItems.reduce(
        (sum, item) => sum + item.price * item.days * (item.quantity || 1),
        0
      );

      // Add a slight delay to simulate processing
      await new Promise(r => setTimeout(r, 1500));

      const res = await fetch(`${API_BASE_URL}/api/rentals/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: cartItems,
          address,
          startDate,
          endDate,
          totalAmount,
          paymentMethod
        }),
      });

      const data = await res.json();
      if (res.ok) {
        if (paymentMethod === 'CASH_ON_DELIVERY') {
          toast.success("Order placed successfully! You will pay cash on delivery.");
        } else {
          toast.success("Payment successful and order placed!");
        }
        setCartItems([]);
        setAddress("");
        setStartDate("");
        setEndDate("");
        setPaymentMethod("");
        setShowPaymentModal(false);
      } else {
        toast.error(data.message || "Payment failed");
        console.error("Payment failed:", data);
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Server error while processing payment");
    } finally {
      setIsProcessing(false);
    }
  };

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.price * item.days * (item.quantity || 1),
    0
  );

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        Loading cart...
      </div>
    );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-4">Your Cart</h1>

        {cartItems.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p>Your cart is empty.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <img
                      src={
                        item.image_url?.startsWith("http")
                          ? item.image_url
                          : `${API_BASE_URL}${item.image_url}`
                      }
                      alt={item.name}
                      className="w-24 h-24 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <div className="flex flex-wrap gap-3 items-center mt-2">
                        <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded">₹{item.price} / day</span>
                        
                        <div className="flex items-center gap-2 bg-muted/30 px-2 py-1 rounded">
                          <Label className="text-xs font-medium text-muted-foreground whitespace-nowrap">Days:</Label>
                          <Input 
                            type="number" 
                            min={1} 
                            max={30} 
                            value={item.days} 
                            onChange={(e) => handleUpdateItem(item.id, 'days', Number(e.target.value))} 
                            className="w-14 h-6 text-xs p-1 bg-background text-center" 
                          />
                        </div>

                        <div className="flex items-center gap-2 bg-muted/30 px-2 py-1 rounded">
                          <Label className="text-xs font-medium text-muted-foreground whitespace-nowrap">Qty:</Label>
                          <Input 
                            type="number" 
                            min={1} 
                            max={100} 
                            value={item.quantity || 1} 
                            onChange={(e) => handleUpdateItem(item.id, 'quantity', Number(e.target.value))} 
                            className="w-14 h-6 text-xs p-1 bg-background text-center" 
                          />
                        </div>
                        <span className="font-bold text-sm ml-auto text-primary">
                          = ₹{item.price * item.days * (item.quantity || 1)}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(item.id)}
                      disabled={item.isRemoving === true}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div>
              <Card className="p-6 space-y-4">
                <h3 className="font-semibold text-lg">Order Summary</h3>
                <Separator />
                <p>Subtotal: ₹{totalAmount}</p>

                <Label>Start Date</Label>
                <p className="text-xs text-muted-foreground mb-1">Note: Delivery takes 2-3 days. Please select a date at least 3 days from today.</p>
                <Input
                  type="date"
                  min={new Date(new Date().setDate(new Date().getDate() + 3)).toISOString().split('T')[0]}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mb-2"
                />
                
                <Label>End Date</Label>
                <p className="text-xs text-muted-foreground mb-1">Note: Returns require 2-3 days processing time after the end date.</p>
                <Input
                  type="date"
                  min={startDate || new Date(new Date().setDate(new Date().getDate() + 4)).toISOString().split('T')[0]}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mb-4"
                />
                
                <Label>Delivery Address</Label>
                <Input
                  placeholder="Enter delivery address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />

                <Separator className="my-2" />
                <h4 className="font-medium">Payment method</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      value="CREDIT_CARD"
                      checked={paymentMethod === 'CREDIT_CARD'}
                      onChange={() => setPaymentMethod('CREDIT_CARD')}
                    />
                    <span>Credit Card</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      value="DEBIT_CARD"
                      checked={paymentMethod === 'DEBIT_CARD'}
                      onChange={() => setPaymentMethod('DEBIT_CARD')}
                    />
                    <span>Debit Card</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      value="UPI"
                      checked={paymentMethod === 'UPI'}
                      onChange={() => setPaymentMethod('UPI')}
                    />
                    <span>UPI</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      value="CASH_ON_DELIVERY"
                      checked={paymentMethod === 'CASH_ON_DELIVERY'}
                      onChange={() => setPaymentMethod('CASH_ON_DELIVERY')}
                    />
                    <span>Cash on Delivery</span>
                  </label>
                </div>

                <Button className="w-full mt-4" onClick={handlePayment}>
                  Proceed to Payment
                </Button>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Fake Payment Gateway Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Complete Payment</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowPaymentModal(false)} disabled={isProcessing}>✕</Button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="bg-muted p-4 rounded-md">
                <div className="flex justify-between mb-1 text-sm font-medium">
                  <span>Total Amount</span>
                  <span>₹{totalAmount}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Items: {cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0)} (Quantity)</span>
                  <span>Method: {paymentMethod.replace(/_/g, ' ')}</span>
                </div>
              </div>

              {paymentMethod === 'CREDIT_CARD' || paymentMethod === 'DEBIT_CARD' ? (
                <>
                  <div>
                    <Label>Card Number</Label>
                    <Input placeholder="XXXX XXXX XXXX XXXX" disabled={isProcessing} value="4111 1111 1111 1111" readOnly />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Expiry Date</Label>
                      <Input placeholder="MM/YY" disabled={isProcessing} value="12/26" readOnly />
                    </div>
                    <div>
                      <Label>CVV</Label>
                      <Input type="password" placeholder="123" disabled={isProcessing} value="123" readOnly />
                    </div>
                  </div>
                </>
              ) : paymentMethod === 'UPI' ? (
                <div>
                  <Label>UPI ID</Label>
                  <Input placeholder="username@upi" disabled={isProcessing} value="user@fakeupi" readOnly />
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  You will pay ₹{totalAmount} in cash when the item is delivered.
                </div>
              )}
            </div>

            <Button 
              className="w-full" 
              onClick={confirmMockPayment}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : `Pay ₹${totalAmount}`}
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-4">
              Safe & Secure Dummy Gateway
            </p>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Cart;
