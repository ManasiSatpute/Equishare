
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { API_BASE_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, Calendar, Shield, Truck } from "lucide-react";
import { toast } from "sonner";

const Equipment = () => {
  const { id } = useParams();
  const [equipment, setEquipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rentalDays, setRentalDays] = useState(1);
  const [rentalQuantity, setRentalQuantity] = useState(1);

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/equipment/${id}`);
        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          if (response.ok) {
            setEquipment(data);
          } else {
            toast.error(data.message || "Failed to load equipment details");
          }
        } else {
          const text = await response.text();
          console.error("❌ Unexpected response:", text);
          toast.error("Server returned non-JSON response. Check backend route.");
        }
      } catch (error) {
        console.error("Error fetching equipment:", error);
        toast.error("Server error while fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchEquipment();
  }, [id]);

  const handleAddToCart = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ equipmentId: id, days: rentalDays, quantity: rentalQuantity }),
      });

      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (response.ok) {
          toast.success("Added to cart!");
        } else {
          toast.error(data.message || "Failed to add to cart");
        }
      } else {
        const text = await response.text();
        console.error("❌ Unexpected response:", text);
        toast.error("Server returned non-JSON response for Add to Cart");
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      toast.error("Server error while adding to cart");
    }
  };

  const handleAddToWishlist = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/wishlist/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ equipmentId: id }),
      });

      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (response.ok) {
          toast.success("Added to wishlist!");
        } else {
          toast.error(data.message || "Failed to add to wishlist");
        }
      } else {
        const text = await response.text();
        console.error("❌ Unexpected response:", text);
        toast.error("Server returned non-JSON response for Wishlist");
      }
    } catch (error) {
      console.error("Add to wishlist error:", error);
      toast.error("Server error while adding to wishlist");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading equipment details...</p>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-destructive">Equipment not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image */}
          <div>
            <div className="relative rounded-lg overflow-hidden">
              <img
                src={
                  equipment.image_url
                    ? equipment.image_url.startsWith("http")
                      ? equipment.image_url
                      : `${API_BASE_URL}${equipment.image_url}`
                    : "/placeholder.jpg"
                }
                alt={equipment.name}
                className="w-full aspect-square object-cover"
              />
              {!equipment.available && (
                <Badge className="absolute top-4 left-4 bg-destructive">
                  Currently Rented
                </Badge>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <Badge variant="secondary" className="mb-2">
                {equipment.category}
              </Badge>
              <h1 className="font-heading text-3xl font-bold mb-2">
                {equipment.name}
              </h1>
              <div className="flex items-center text-muted-foreground mb-4">
                <MapPin className="h-4 w-4 mr-1" />
                {equipment.location}
              </div>
              <p className="text-4xl font-bold text-primary">
                ₹{equipment.price}
                <span className="text-lg text-muted-foreground">/day</span>
              </p>
            </div>

            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold">About this equipment</h3>
                <p className="text-sm text-muted-foreground">
                  {equipment.description}
                </p>

                {equipment.specifications && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Specifications</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {equipment.specifications.map(
                        (spec: any, index: number) => (
                          <div key={index} className="text-sm">
                            <span className="text-muted-foreground">
                              {spec.label}:
                            </span>
                            <span className="ml-2 font-medium">
                              {spec.value}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">Owner Details</h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">
                      {equipment.owner?.name?.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{equipment.owner?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ⭐ {equipment.owner?.rating} •{" "}
                      {equipment.owner?.totalRentals} rentals
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-4 py-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Rent Days</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={rentalDays}
                  onChange={(e) => setRentalDays(Number(e.target.value))}
                  className="w-24 h-10 border rounded px-3 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Quantity</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={rentalQuantity}
                  onChange={(e) => setRentalQuantity(Number(e.target.value))}
                  className="w-24 h-10 border rounded px-3 text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={handleAddToWishlist}
              >
                <Heart className="mr-2 h-5 w-5" />
                Add to Wishlist
              </Button>
              <Button
                size="lg"
                className="flex-1"
                disabled={!equipment.available || equipment.quantity < rentalQuantity}
                onClick={handleAddToCart}
              >
                {equipment.available ? "Add to Cart" : "Currently Unavailable"}
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center">
                <Calendar className="h-6 w-6 mx-auto text-primary mb-2" />
                <p className="text-sm font-medium">Flexible Rental</p>
              </div>
              <div className="text-center">
                <Truck className="h-6 w-6 mx-auto text-primary mb-2" />
                <p className="text-sm font-medium">Home Delivery</p>
              </div>
              <div className="text-center">
                <Shield className="h-6 w-6 mx-auto text-primary mb-2" />
                <p className="text-sm font-medium">Insured</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Equipment;
