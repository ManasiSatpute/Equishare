import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { API_BASE_URL } from "@/lib/api";

interface EquipmentCardProps {
  id: string;
  name: string;
  category: string;
  price: number;
  location: string;
  image_url?: string;
  available: boolean;
}

const EquipmentCard = ({
  id,
  name,
  category,
  price,
  location,
  image_url,
  available,
}: EquipmentCardProps) => {
  const backendURL = API_BASE_URL; // centralized backend URL

  const imageUrl = image_url
    ? image_url.startsWith("http")
      ? image_url
      : `${backendURL}${image_url}`
    : "https://via.placeholder.com/300x200?text=No+Image";

  // ✅ Wishlist state
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(`${backendURL}/api/wishlist`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const items = await res.json();
        const found = items.some((w: any) => String(w.equipment_id) === String(id));
        setIsInWishlist(found);
      } catch {}
    };
    load();
  }, [backendURL, id]);

  // ✅ Toggle Wishlist
  const handleToggleWishlist = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login first!");
        return;
      }
      if (isInWishlist) {
        const res = await fetch(`${backendURL}/api/wishlist/remove/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Failed to remove from wishlist");
        setIsInWishlist(false);
        toast("Removed from wishlist ❌");
      } else {
        const res = await fetch(`${backendURL}/api/wishlist/add`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ equipmentId: id }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Failed to add to wishlist");
        setIsInWishlist(true);
        toast.success("Added to wishlist ❤️");
      }
    } catch (e: any) {
      toast.error(e.message || "Wishlist action failed");
    }
  };

  // ✅ Add to Cart Function
  const handleAddToCart = async () => {
    if (!available) {
      toast.error("Equipment is currently rented!");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login first!");
        return;
      }

      const response = await fetch(`${backendURL}/api/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ equipmentId: Number(id), days: 1, quantity: 1 }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("✅ Added to cart successfully!");
      } else {
        toast.error(data.message || "Failed to add to cart");
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
      toast.error("Server error while adding to cart");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48 bg-white">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-contain p-2"
        />

        {/* ❤️ Wishlist Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleWishlist}
          className={`absolute top-2 right-2 bg-background/80 hover:bg-background ${
            isInWishlist ? "text-red-500" : "text-gray-500"
          }`}
        >
          <Heart
            className={`h-4 w-4 ${
              isInWishlist ? "fill-red-500 text-red-500" : ""
            }`}
          />
        </Button>

        {!available && (
          <Badge className="absolute top-2 left-2 bg-destructive">
            Rented
          </Badge>
        )}
      </div>

      <CardContent className="p-4">

        <h3 className="font-semibold text-lg mb-1 truncate">{name}</h3>

        <div className="flex items-center text-sm text-muted-foreground mb-1">
          <MapPin className="h-3 w-3 mr-1" />
          <span className="truncate">{location}</span>
        </div>

        {/* <p className="text-xs text-muted-foreground mb-2 truncate">
          Uploaded by <span className="font-medium text-gray-800">Owner</span>
        </p> */}

        <p className="text-2xl font-bold text-primary">
          ₹{price}
          <span className="text-sm text-muted-foreground">/day</span>
        </p>
      </CardContent>

      <CardFooter className="p-4 pt-0 gap-2 flex flex-col">

        <div className="flex gap-2 w-full">
          <Link to={`/equipment/${id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              View
            </Button>
          </Link>
          <Button
            onClick={handleAddToCart}
            disabled={!available || loading}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            {loading ? "Adding..." : "Add to Cart"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default EquipmentCard;
