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
  quantity?: number;
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
    quantity: "",
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
    quantity: "",   // ✅ included in state
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
        if (histData.success) setHistory(histData.data);
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
      } catch {
        toast.error("Could not fetch equipment");
      }
    };

    fetchEquipment();
    fetchDashboardData();
  }, [user, backendURL]);

  /* ── OTP / Status helpers ── */

  const handleVerifyPickup = async (rentalId: number | string) => {
    const enteredOtp = prompt("AGENT VIEW: Enter the Owner's Pickup OTP to authorize collection (If N/A, type 'bypass'):");
    if (!enteredOtp) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${backendURL}/api/rentals/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rentalId, enteredOtp, type: "PICKUP" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Pickup Authorized! Status updated to Out for Delivery.");
        fetchDashboardData();
      } else {
        toast.error(data.message || "Invalid OTP");
      }
    } catch {
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
        body: JSON.stringify({ rentalId, enteredOtp, type: "DELIVERY" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Delivery Verified! Status updated to Delivered.");
        fetchDashboardData();
      } else {
        toast.error(data.message || "Invalid OTP");
      }
    } catch {
      toast.error("Verification failed");
    }
  };

  const updateDeliveryStatus = async (deliveryId: number | string, status: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${backendURL}/api/rentals/delivery-status/${deliveryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success(`Status updated to ${status.replace(/_/g, " ")}`);
        fetchDashboardData();
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleMarkDamaged = async (deliveryId: number | string) => {
    if (!confirm("Are you sure you want to mark this equipment as damaged?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${backendURL}/api/rentals/mark-damaged/${deliveryId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.error("Equipment flagged as Damaged.");
        updateDeliveryStatus(deliveryId, "returned");
      }
    } catch {
      toast.error("Failed to flag as damaged");
    }
  };

  /* ── Tracking UI ── */

  const getStatusStep = (status: string) => {
    const s = status?.toLowerCase() || "";
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
          {[
            { icon: Package, label: "Pending/Packed", step: 1 },
            { icon: Truck, label: "Dispatched", step: 2 },
            { icon: CheckCircle2, label: "In Use", step: 3 },
            { icon: RotateCcw, label: "Return Req.", step: 4 },
            { icon: AlertTriangle, label: "Returned", step: 5 },
          ].map(({ icon: Icon, label, step }, idx, arr) => (
            <div key={step} className="contents">
              <div className={`flex flex-col items-center ${currentStep >= step ? "text-primary" : "text-muted-foreground"}`}>
                <Icon className="h-6 w-6 mb-1" />
                <span className="text-xs font-medium">{label}</span>
              </div>
              {idx < arr.length - 1 && (
                <div className={`flex-1 h-1 mx-2 rounded ${currentStep > step ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  /* ── Add Equipment ── */

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
      form.append("quantity", formData.quantity);
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
        setFormData({ name: "", category: "", price: "", quantity: "", location: "", description: "", image: null });
        const data = await res.json();
        setEquipment((prev) => [...prev, data.data || data]);
      } else {
        const data = await res.json();
        toast.error(data.message || "Error creating equipment");
      }
    } catch {
      toast.error("Error creating equipment");
    }
  };

  /* ── Edit Equipment ── */

  const handleEditClick = (item: Equipment) => {
    setEditingId(item.id || null);
    setEditFormData({
      name: item.name,
      category: item.category,
      price: item.price.toString(),
      quantity: item.quantity?.toString() ?? "",   // ✅ safe null guard
      location: item.location || "",
      description: item.description || "",
      image: null,
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
      form.append("quantity", editFormData.quantity);    // ✅ was missing before
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
        setEquipment((prev) =>
          prev.map((item) => (item.id === editingId ? { ...item, ...data.data } : item))
        );
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to update equipment");
      }
    } catch {
      toast.error("Error updating equipment");
    }
  };

  /* ── Delete Equipment ── */

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
    } catch {
      toast.error("Delete failed");
    }
  };

  /* ── UI ── */

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold mb-2">Owner Dashboard</h1>
            <p className="text-muted-foreground">Manage your equipment listings and handovers</p>
          </div>

          {/* ── Add Equipment Dialog ── */}
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Add Equipment</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Equipment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddEquipment} className="space-y-4">
                <div>
                  <Label htmlFor="name">Equipment Name</Label>
                  <Input id="name" placeholder="e.g. John Deere Tractor" required value={formData.name} onChange={handleChange} />
                </div>

                <div>
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tractor">Tractor</SelectItem>
                      <SelectItem value="Harvester">Harvester</SelectItem>
                      <SelectItem value="Tiller">Tiller</SelectItem>
                      <SelectItem value="Sprayer">Sprayer</SelectItem>
                      <SelectItem value="Hand tool">Hand Tool</SelectItem>
                      <SelectItem value="Gardening">Gardening Tool</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Daily Rate (₹)</Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="price" type="number" min="1" placeholder="500" required className="pl-10" value={formData.price} onChange={handleChange} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="quantity">Quantity Available</Label>
                    <Input id="quantity" type="number" min="1" placeholder="1" required value={formData.quantity} onChange={handleChange} />
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" placeholder="e.g. Pune, Maharashtra" required value={formData.location} onChange={handleChange} />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Describe the equipment, condition, specs..." rows={3} value={formData.description} onChange={handleChange} />
                </div>

                <div>
                  <Label htmlFor="image">Equipment Image</Label>
                  <Input id="image" type="file" accept="image/*" onChange={handleFileChange} />
                </div>

                <Button type="submit" className="w-full">Add Equipment</Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* ── Edit Equipment Dialog ── */}
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Equipment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdateEquipment} className="space-y-4">
                <div>
                  <Label>Equipment Name</Label>
                  <Input
                    placeholder="Equipment Name"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Category</Label>
                  <Select value={editFormData.category} onValueChange={(v) => setEditFormData({ ...editFormData, category: v })}>
                    <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tractor">Tractor</SelectItem>
                      <SelectItem value="Harvester">Harvester</SelectItem>
                      <SelectItem value="Tiller">Tiller</SelectItem>
                      <SelectItem value="Sprayer">Sprayer</SelectItem>
                      <SelectItem value="Hand tool">Hand Tool</SelectItem>
                      <SelectItem value="Gardening">Gardening Tool</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* ✅ Price + Quantity side by side — quantity was missing before */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Daily Rate (₹)</Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min="1"
                        placeholder="Daily Rate (₹)"
                        required
                        className="pl-10"
                        value={editFormData.price}
                        onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* ✅ THIS WAS MISSING FROM THE EDIT FORM */}
                  <div>
                    <Label>Quantity Available</Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Quantity"
                      required
                      value={editFormData.quantity}
                      onChange={(e) => setEditFormData({ ...editFormData, quantity: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Location</Label>
                  <Input
                    placeholder="Location"
                    required
                    value={editFormData.location}
                    onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Description"
                    rows={3}
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Replace Image (optional)</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setEditFormData({ ...editFormData, image: e.target.files?.[0] || null })}
                  />
                </div>

                <Button type="submit" className="w-full">Update Equipment</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* ── Tabs ── */}
        <Tabs defaultValue="equipment" className="mt-8">
          <TabsList>
            <TabsTrigger value="equipment">My Equipment</TabsTrigger>
            <TabsTrigger value="deliveries">Active Deliveries</TabsTrigger>
            <TabsTrigger value="history">Total Rentals</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          {/* MY EQUIPMENT */}
          <TabsContent value="equipment">
            <Card>
              <CardHeader><CardTitle>My Equipment</CardTitle></CardHeader>
              <CardContent>
                {equipment.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No equipment added yet.</p>
                ) : (
                  equipment.map((item) => (
                    <div key={item.id} className="flex justify-between items-center border p-3 rounded-lg mb-2">
                      <div className="flex items-center gap-4">
                        <img
                          src={item.image_url ? `${backendURL}${item.image_url}` : "https://via.placeholder.com/80"}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded"
                        />
                        <div>
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">{item.category}</p>
                          <p className="text-sm text-primary font-bold">₹{item.price}/day</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity ?? "—"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditClick(item)}>
                          <Edit2 className="h-4 w-4 mr-1" /> Edit
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ACTIVE DELIVERIES */}
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
                        <h3 className="font-bold text-lg">{delivery.equipment_name}</h3>
                        <Badge className="uppercase tracking-tighter">
                          {delivery.delivery_status.replace(/_/g, " ")}
                        </Badge>
                      </div>

                      <TrackingProgress status={delivery.delivery_status} />

                      {["pending", "agent_assigned"].includes(delivery.delivery_status) && (
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 my-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <ShieldCheck className="h-6 w-6 text-primary" />
                            <div>
                              <p className="text-[10px] font-bold text-primary uppercase">Pickup Security Code</p>
                              <p className="text-xs text-muted-foreground">Give this to the agent for collection</p>
                            </div>
                          </div>
                          <div className="text-2xl font-mono font-black tracking-widest text-primary px-4 py-1 bg-white border-2 border-primary rounded shadow-inner">
                            {delivery.pickup_otp || "N/A"}
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
                          {["pending", "agent_assigned"].includes(delivery.delivery_status) && (
                            <>
                              <Button size="sm" onClick={() => handleVerifyPickup(delivery.id)}>Verify Agent Pickup</Button>
                              <Button size="sm" variant="outline" onClick={() => updateDeliveryStatus(delivery.id, "out_for_delivery")}>Dispatch (Self-Delivery)</Button>
                            </>
                          )}
                          {delivery.delivery_status === "out_for_delivery" && (
                            <>
                              <Button size="sm" onClick={() => handleVerifyDelivery(delivery.id)}>Verify Dropoff OTP</Button>
                              <Button size="sm" variant="outline" onClick={() => updateDeliveryStatus(delivery.id, "delivered")}>Force Mark Delivered</Button>
                            </>
                          )}
                          {delivery.delivery_status === "return_requested" && (
                            <>
                              <Button size="sm" onClick={() => updateDeliveryStatus(delivery.id, "returned")}>Confirm Safe Return</Button>
                              <Button size="sm" variant="destructive" onClick={() => handleMarkDamaged(delivery.id)}>Report Damaged</Button>
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

          {/* HISTORY */}
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
                            {new Date(item.start_date).toLocaleDateString()} → {new Date(item.end_date).toLocaleDateString()}
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

          {/* NOTIFICATIONS */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader><CardTitle>Rental Notifications</CardTitle></CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <p className="text-muted-foreground text-center">No new notifications.</p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={`notif-${notif.id}`}
                      className="border p-4 rounded-lg mb-3 hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => navigate(`/delivery-agents/${notif.id}`)}
                    >
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

const Badge = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary ${className}`}>
    {children}
  </span>
);

export default OwnerDashboard;
