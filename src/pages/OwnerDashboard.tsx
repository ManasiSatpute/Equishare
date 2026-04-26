import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Package, Truck, Trash2, IndianRupee, Plus, Edit2, CheckCircle2, RotateCcw, AlertTriangle } from "lucide-react";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";
import { useUser } from "@/context/UserContext";
import { Separator } from "@/components/ui/separator";

interface Equipment {
  id?: string;
  name: string;
  category: string;
  price: number;
  image_url?: string;
  location?: string;
  description?: string;
}

const OwnerDashboard = () => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    location: "",
    description: "",
    image: null as File | null,
  });
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    category: "",
    price: "",
    location: "",
    description: "",
    image: null as File | null,
  });

  const backendURL = API_BASE_URL;
  const navigate = useNavigate();
  const { user } = useUser();

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const res = await fetch(`${backendURL}/api/rentals/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (data.data.deliveries) setDeliveries(data.data.deliveries);
          if (data.data.notifications) setNotifications(data.data.notifications);
        }
      }

      const histRes = await fetch(`${backendURL}/api/rentals/owner-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (histRes.ok) {
        const histData = await histRes.json();
        if (histData.success) {
          setHistory(histData.data);
        }
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    }
  };

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${backendURL}/api/equipment/mine`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          setEquipment(data);
        }
      } catch (error) {
        toast.error("Could not fetch equipment");
      }
    };

    fetchEquipment();
    fetchDashboardData();
  }, [user, backendURL]);

  // SECURE HANDSHAKE: Verify OTP for Pickup
  const handleVerifyPickup = async (rentalId: number | string) => {
    const enteredOtp = prompt("AGENT VIEW: Enter the Owner's Pickup OTP to authorize collection (If N/A, type 'bypass'):");
    if (!enteredOtp) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${backendURL}/api/rentals/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rentalId, enteredOtp, type: 'PICKUP' }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Pickup Authorized! Status updated to Out for Delivery.");
        fetchDashboardData();
      } else {
        toast.error(data.message || "Invalid OTP");
      }
    } catch (err: any) {
      toast.error("Verification failed");
    }
  };

  const handleVerifyDelivery = async (rentalId: number | string) => {
    const enteredOtp = prompt("OWNER VIEW: Enter the Renter's Dropoff OTP to complete delivery (If N/A, type 'bypass'):");
    if (!enteredOtp) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${backendURL}/api/rentals/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rentalId, enteredOtp, type: 'DELIVERY' })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Delivery Verified! Status updated to Delivered.");
        fetchDashboardData();
      } else {
        toast.error(data.message || "Invalid OTP");
      }
    } catch (err) {
      toast.error("Verification failed");
    }
  };

  const updateDeliveryStatus = async (deliveryId: number | string, status: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${backendURL}/api/rentals/delivery-status/${deliveryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success(`Status updated to ${status.replace(/_/g, " ")}`);
        fetchDashboardData();
      }
    } catch (err: any) {
      toast.error("Failed to update status");
    }
  };

  const handleMarkDamaged = async (deliveryId: number | string) => {
    if (!confirm("Are you sure you want to mark this equipment as damaged? This will restrict its availability for future rentals.")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${backendURL}/api/rentals/mark-damaged/${deliveryId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.error("Equipment flagged as Damaged.");
        updateDeliveryStatus(deliveryId, 'returned');
      }
    } catch (err: any) {
      toast.error("Failed to flag as damaged");
    }
  };

  const getStatusStep = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (["pending", "agent_assigned"].includes(s)) return 1;
    if (["out_for_delivery"].includes(s)) return 2;
    if (["delivered"].includes(s)) return 3;
    if (["return_requested", "in_transit"].includes(s)) return 4;
    if (["returned", "damaged"].includes(s)) return 5;
    return 1;
  };

  const TrackingProgress = ({ status }: { status: string }) => {
    const currentStep = getStatusStep(status);
    return (
      <div className="py-6">
        <div className="flex items-center justify-between mb-2">
          <div className={`flex flex-col items-center ${currentStep >= 1 ? "text-primary" : "text-muted-foreground"}`}>
            <Package className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Pending/Packed</span>
          </div>
          <div className={`flex-1 h-1 mx-2 rounded ${currentStep >= 2 ? "bg-primary" : "bg-muted"}`} />
          <div className={`flex flex-col items-center ${currentStep >= 2 ? "text-primary" : "text-muted-foreground"}`}>
            <Truck className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Dispatched</span>
          </div>
          <div className={`flex-1 h-1 mx-2 rounded ${currentStep >= 3 ? "bg-primary" : "bg-muted"}`} />
          <div className={`flex flex-col items-center ${currentStep >= 3 ? "text-primary" : "text-muted-foreground"}`}>
            <CheckCircle2 className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">In Use</span>
          </div>
          <div className={`flex-1 h-1 mx-2 rounded ${currentStep >= 4 ? "bg-primary" : "bg-muted"}`} />
          <div className={`flex flex-col items-center ${currentStep >= 4 ? "text-primary" : "text-muted-foreground"}`}>
            <RotateCcw className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Return Req.</span>
          </div>
          <div className={`flex-1 h-1 mx-2 rounded ${currentStep >= 5 ? "bg-primary" : "bg-muted"}`} />
          <div className={`flex flex-col items-center ${currentStep >= 5 ? "text-primary" : "text-muted-foreground"}`}>
            <AlertTriangle className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Returned</span>
          </div>
        </div>
      </div>
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, image: e.target.files?.[0] || null });
  };

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const form = new FormData();
      form.append("name", formData.name);
      form.append("category", formData.category);
      form.append("price", formData.price);
      form.append("location", formData.location);
      form.append("description", formData.description);
      if (formData.image) form.append("image", formData.image);

      const res = await fetch(`${backendURL}/api/equipment`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      if (res.ok) {
        toast.success("Equipment added successfully!");
        setIsOpen(false);
        setFormData({ name: "", category: "", price: "", location: "", description: "", image: null });
        const data = await res.json();
        setEquipment((prev) => [...prev, data.data || data]);
      }
    } catch (err: any) {
      toast.error("Error creating equipment");
    }
  };

  const handleEditClick = (item: Equipment) => {
    setEditingId(item.id || null);
    setEditFormData({
      name: item.name,
      category: item.category,
      price: item.price.toString(),
      location: item.location || "",
      description: item.description || "",
      image: null
    });
    setIsEditOpen(true);
  };

  const handleUpdateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      const token = localStorage.getItem("token");
      const form = new FormData();
      form.append("name", editFormData.name);
      form.append("category", editFormData.category);
      form.append("price", editFormData.price);
      form.append("location", editFormData.location);
      form.append("description", editFormData.description);
      if (editFormData.image) form.append("image", editFormData.image);

      const res = await fetch(`${backendURL}/api/equipment/${editingId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      if (res.ok) {
        toast.success("Equipment updated successfully!");
        setIsEditOpen(false);
        const data = await res.json();
        setEquipment((prev) => prev.map(item => item.id === editingId ? { ...item, ...data.data } : item));
      } else {
        toast.error("Failed to update equipment");
      }
    } catch (err: any) {
      toast.error("Error updating equipment");
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id || !confirm("Delete this equipment?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${backendURL}/api/equipment/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setEquipment((prev) => prev.filter((item) => item.id !== id));
        toast.success("Deleted successfully!");
      }
    } catch (err: any) {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold mb-2">Owner Dashboard</h1>
            <p className="text-muted-foreground">Manage your equipment listings and handovers</p>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Add Equipment</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Equipment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddEquipment} className="space-y-4">
                <Input id="name" placeholder="Equipment Name" required value={formData.name} onChange={handleChange} />
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tractor">Tractor</SelectItem>
                    <SelectItem value="Harvester">Harvester</SelectItem>
                    <SelectItem value="Tiller">Tiller</SelectItem>
                    <SelectItem value="Sprayer">Sprayer</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="price" type="number" placeholder="Daily Rate (₹)" required className="pl-10" value={formData.price} onChange={handleChange} />
                </div>
                <Input id="location" placeholder="Location" required value={formData.location} onChange={handleChange} />
                <Textarea id="description" placeholder="Description" rows={3} value={formData.description} onChange={handleChange} />
                <Input id="image" type="file" accept="image/*" onChange={handleFileChange} />
                <Button type="submit" className="w-full">Add Equipment</Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Equipment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdateEquipment} className="space-y-4">
                <Input placeholder="Equipment Name" required value={editFormData.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} />
                <Select value={editFormData.category} onValueChange={(v) => setEditFormData({ ...editFormData, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tractor">Tractor</SelectItem>
                    <SelectItem value="Harvester">Harvester</SelectItem>
                    <SelectItem value="Tiller">Tiller</SelectItem>
                    <SelectItem value="Sprayer">Sprayer</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="number" placeholder="Daily Rate (₹)" required className="pl-10" value={editFormData.price} onChange={(e) => setEditFormData({...editFormData, price: e.target.value})} />
                </div>
                <Input placeholder="Location" required value={editFormData.location} onChange={(e) => setEditFormData({...editFormData, location: e.target.value})} />
                <Textarea placeholder="Description" rows={3} value={editFormData.description} onChange={(e) => setEditFormData({...editFormData, description: e.target.value})} />
                <Input type="file" accept="image/*" onChange={(e) => setEditFormData({...editFormData, image: e.target.files?.[0] || null})} />
                <Button type="submit" className="w-full">Update Equipment</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="equipment" className="mt-8">
          <TabsList>
            <TabsTrigger value="equipment">My Equipment</TabsTrigger>
            <TabsTrigger value="deliveries">Active Deliveries</TabsTrigger>
            <TabsTrigger value="history">Total Rentals</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="equipment">
            <Card>
              <CardHeader><CardTitle>My Equipment</CardTitle></CardHeader>
              <CardContent>
                {equipment.length === 0 ? (
                  <p className="text-muted-foreground text-center">No equipment added yet.</p>
                ) : (
                  equipment.map((item) => (
                    <div key={item.id} className="flex justify-between items-center border p-3 rounded-lg mb-2">
                      <div className="flex items-center gap-4">
                        <img src={item.image_url ? `${backendURL}${item.image_url}` : "https://via.placeholder.com/80"} alt={item.name} className="w-20 h-20 object-cover rounded" />
                        <div>
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">{item.category}</p>
                          <p className="text-sm text-primary font-bold">₹{item.price}/day</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditClick(item)}><Edit2 className="h-4 w-4 mr-1" /> Edit</Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deliveries">
            <Card>
              <CardHeader><CardTitle>Logistics Management</CardTitle></CardHeader>
              <CardContent>
                {deliveries.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No active deliveries.</p>
                ) : (
                  deliveries.map((delivery) => (
                    <div key={delivery.id} className="border rounded-xl p-6 mb-4 bg-white shadow-sm border-l-4 border-l-primary">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-lg">{delivery.equipment_name}</h3>
                        </div>
                        <Badge className="uppercase tracking-tighter">{delivery.delivery_status.replace(/_/g, " ")}</Badge>
                      </div>

                      <TrackingProgress status={delivery.delivery_status} />

                      {/* PICKUP SECURITY CARD */}
                      {['pending', 'agent_assigned'].includes(delivery.delivery_status) && (
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 my-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <ShieldCheck className="h-6 w-6 text-primary" />
                            <div>
                              <p className="text-[10px] font-bold text-primary uppercase">Pickup Security Code</p>
                              <p className="text-xs text-muted-foreground">Give this to the agent for collection</p>
                            </div>
                          </div>
                          <div className="text-2xl font-mono font-black tracking-widest text-primary px-4 py-1 bg-white border-2 border-primary rounded shadow-inner">
                            {delivery.pickup_otp || "N/A (Bypass Mode)"}
                          </div>
                        </div>
                      )}

                      <Separator className="my-4" />

                      <div className="flex flex-wrap items-center justify-between mt-2">
                        <div className="flex flex-col">
                           <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Current Stage</span>
                           <p className="text-sm font-bold capitalize text-primary">{delivery.delivery_status.replace(/_/g, " ")}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-end">
                          {['pending', 'agent_assigned'].includes(delivery.delivery_status) && (
                            <>
                              <Button size="sm" variant="default" onClick={() => handleVerifyPickup(delivery.id)}>
                                Verify Agent Pickup
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => updateDeliveryStatus(delivery.id, 'out_for_delivery')}>
                                Dispatch (Self-Delivery)
                              </Button>
                            </>
                          )}
                          
                          {delivery.delivery_status === 'out_for_delivery' && (
                            <>
                              <Button size="sm" variant="default" onClick={() => handleVerifyDelivery(delivery.id)}>
                                Verify Dropoff OTP
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => updateDeliveryStatus(delivery.id, 'delivered')}>
                                Force Mark Delivered
                              </Button>
                            </>
                          )}

                          {delivery.delivery_status === 'return_requested' && (
                            <>
                              <Button size="sm" variant="default" onClick={() => updateDeliveryStatus(delivery.id, 'returned')}>
                                Confirm Safe Return
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleMarkDamaged(delivery.id)}>
                                Report Damaged
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader><CardTitle>Total Rentals Till Date</CardTitle></CardHeader>
              <CardContent>
                <div className="mb-6 grid grid-cols-2 gap-4">
                   <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl text-center">
                     <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Total Completed</p>
                     <p className="text-3xl font-black text-primary mt-1">{history.length}</p>
                   </div>
                   <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl text-center">
                     <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Total Earnings</p>
                     <p className="text-3xl font-black text-primary mt-1">
                       ₹{history.reduce((sum, item) => sum + Number(item.total_amount || 0), 0)}
                     </p>
                   </div>
                </div>

                {history.length === 0 ? (
                  <p className="text-muted-foreground text-center">No completed rentals yet.</p>
                ) : (
                  <div className="space-y-3">
                  {history.map((item) => (
                    <div key={`hist-${item.id}`} className="flex justify-between items-center border p-4 rounded-lg bg-white shadow-sm">
                      <div>
                        <h3 className="font-semibold">{item.equipment_name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(item.start_date).toLocaleDateString()} to {new Date(item.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">₹{item.total_amount}</p>
                        <Badge className="opacity-70 mt-1">COMPLETED</Badge>
                      </div>
                    </div>
                  ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader><CardTitle>Rental Notifications</CardTitle></CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <p className="text-muted-foreground text-center">No new notifications.</p>
                ) : (
                  notifications.map((notif) => (
                    <div key={`notif-${notif.id}`} className="border p-4 rounded-lg mb-3 hover:bg-muted cursor-pointer" onClick={() => navigate(`/delivery-agents/${notif.id}`)}>
                      <h3 className="font-semibold text-primary">{notif.first_name} {notif.last_name}</h3>
                      <p className="text-sm">Requested <strong>{notif.equipment_name}</strong> for {notif.days} days.</p>
                      <p className="text-xs text-muted-foreground mt-2">{new Date(notif.created_at).toLocaleDateString()}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Internal Badge component if not imported
const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary ${className}`}>
    {children}
  </span>
);

export default OwnerDashboard;