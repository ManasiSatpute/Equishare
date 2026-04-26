import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import EquipmentCard from "@/components/EquipmentCard";
import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/api";

const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);

  //  Load wishlist from backend
  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/api/wishlist`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const items = await res.json();
        setWishlistItems(items.map((w: any) => ({
          id: w.equipment_id,
          name: w.name,
          price: w.price,
          image_url: w.image_url,
          location: "",
          category: "",
          available: true,
        })));
      } catch {}
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-8">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold mb-2">My Wishlist</h1>
          <p className="text-muted-foreground">
            Equipment you want to rent later
          </p>
        </div>

        {wishlistItems.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Your wishlist is empty
              </h3>
              <p className="text-muted-foreground mb-6">
                Save equipment you're interested in for later
              </p>
              <Link to="/user-dashboard">
                <Button>Browse Equipment</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((item) => (
              <EquipmentCard key={item.id} {...item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
