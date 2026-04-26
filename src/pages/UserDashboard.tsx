
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import EquipmentCard from "@/components/EquipmentCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, MapPin, SlidersHorizontal, Navigation, PackageSearch } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Internal component for the Map to prevent map container re-initialization errors
const EquipmentMap = ({ equipment }: { equipment: any[] }) => {
  useEffect(() => {
    // Override leaflet default icons pointing to broken paths
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);

  const center: [number, number] = [18.5204, 73.8567]; // Base center: Pune, IN

  return (
    <MapContainer center={center} zoom={11} style={{ height: "450px", width: "100%", zIndex: 0 }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {equipment.map((eq, i) => {
        // Scatter pseudo-randomly around the central base
        const lat = center[0] + (Math.sin(i * 123) * 0.1);
        const lng = center[1] + (Math.cos(i * 321) * 0.1);
        
        return (
          <Marker key={eq._id || eq.id} position={[lat, lng]}>
            <Popup>
              <div className="p-1 min-w-[120px]">
                <h4 className="font-bold text-sm mb-1">{eq.name}</h4>
                <p className="text-primary font-bold text-xs mb-2">₹{eq.price}/day</p>
                <p className="text-xs text-muted-foreground flex items-center">
                  <MapPin className="w-3 h-3 mr-1 inline" /> {eq.location}
                </p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};


const UserDashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [maxPrice, setMaxPrice] = useState<number>(Infinity);
  const navigate = useNavigate();

  //  Fetch equipment data from backend
  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/equipment`);
        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          if (response.ok) {
            setEquipmentList(data);
          } else {
            toast.error(data.message || "Failed to load equipment");
          }
        } else {
          const text = await response.text();
          console.error("❌ Unexpected response:", text);
          toast.error("Server returned non-JSON response");
        }
      } catch (error) {
        console.error("Error fetching equipment:", error);
        toast.error("Server error while fetching equipment");
      } finally {
        setLoading(false);
      }
    };

    fetchEquipment();
  }, []);

  //  Filter equipment by search and category
  const filteredEquipment = equipmentList.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" ||
      item.category?.toLowerCase() === selectedCategory.toLowerCase();
    const matchesPrice = item.price <= maxPrice;

    return matchesSearch && matchesCategory && matchesPrice;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-8">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold mb-2">
            Browse Equipment
          </h1>
          <p className="text-muted-foreground">
            Find the perfect equipment for your farming needs
          </p>
        </div>

            {/* Search and Filters */}
            <div className="bg-card p-6 rounded-lg shadow-sm mb-8">
              <div className="grid md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search equipment..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="tractor">Tractors</SelectItem>
                    <SelectItem value="harvester">Harvesters</SelectItem>
                    <SelectItem value="tiller">Tillers</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={maxPrice.toString()} onValueChange={(v) => setMaxPrice(Number(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Max Price" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Infinity">Any Price</SelectItem>
                    <SelectItem value="1000">Under ₹1000/day</SelectItem>
                    <SelectItem value="5000">Under ₹5000/day</SelectItem>
                    <SelectItem value="10000">Under ₹10000/day</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button className="mt-4 w-full md:w-auto">
                    <MapPin className="mr-2 h-4 w-4" />
                    Find Near Me
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-background">
                  <DialogHeader className="px-6 pt-6 pb-2">
                    <DialogTitle className="text-2xl font-bold flex items-center">
                      <MapPin className="mr-2 text-primary" /> Nearby Equipment Map
                    </DialogTitle>
                  </DialogHeader>
                  <div className="w-full relative border-t mt-2">
                    <EquipmentMap equipment={filteredEquipment} />
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/*  Equipment Grid */}
            {loading ? (
              <div className="text-center py-20 text-muted-foreground">
                Loading equipment...
              </div>
            ) : filteredEquipment.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredEquipment.map((equipment) => (
                  <EquipmentCard
                    key={equipment._id || equipment.id}
                    id={equipment._id || equipment.id}
                    name={equipment.name}
                    category={equipment.category}
                    price={equipment.price}
                    location={equipment.location}
                    available={equipment.available}
                    image_url={
                      equipment.image_url?.startsWith("http")
                        ? equipment.image_url
                        : `${API_BASE_URL}${equipment.image_url}`
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                No equipment found.
              </div>
            )}
      </div>
    </div>
  );
};

export default UserDashboard;
