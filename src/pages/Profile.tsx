import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // ✅ Added for navigation
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { User, MapPin, Phone, ShieldCheck } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { useUser } from "@/context/UserContext";

const Profile = () => {
  const navigate = useNavigate(); // ✅ Hook for redirection
  const { user, setUser } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    alternate_phone: "",
    street_address: "",
    city: "",
    state: "",
    pincode: "",
    profileImage: "",
    selectedFile: null as File | null,
  });

  // ✅ Utility to get token safely
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("You are not logged in. Please log in again.");
      navigate("/auth");
      return {};
    }
    return { Authorization: `Bearer ${token}` };
  };

  // ✅ Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const headers = getAuthHeaders();
        const res = await fetch(`${API_BASE_URL}/api/users/profile`, { headers });
        const data = await res.json();

        if (res.ok) {
          setFormData({
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            email: data.email || "",
            phone: data.phone || "",
            alternate_phone: data.alternate_phone || "",
            street_address: data.street_address || "",
            city: data.city || "",
            state: data.state || "",
            pincode: data.pincode || "",
            profileImage: data.profile_image ? `${API_BASE_URL}/${data.profile_image}` : "",
            selectedFile: null,
          });
        } else {
          toast.error(data.message || "Failed to load profile");
        }
      } catch (err) {
        console.error("Error loading profile:", err);
        toast.error("Server error while loading profile");
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  // ✅ Role Switching Logic with Navigation Fix
  const handleRoleSwitch = async (targetRole: "user" | "owner") => {
    setIsLoading(true);
    try {
      const headers = {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      };

      const res = await fetch(`${API_BASE_URL}/api/auth/upgrade-to-owner`, {
        method: "POST",
        headers,
        body: JSON.stringify({ 
          role: targetRole,
          phone: formData.phone,
          city: formData.city,
          state: formData.state,             // ✅ Added
          street_address: formData.street_address, // ✅ Added
          pincode: formData.pincode
        }),
      });

      if (res.ok) {
        toast.success(`Account switched to ${targetRole === "owner" ? "Owner" : "Renter"} mode!`);
        
        // 1. Update Global State
        const updatedUser = { ...user, role: targetRole };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);

        // 2. Redirect (Prevents 404 by moving user to a valid route for their new role)
        if (targetRole === "user") {
          navigate("/"); // Go back to equipment listings
        } else {
          navigate("/owner-dashboard"); // Go to their new management area
        }
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || "Failed to switch role");
      }
    } catch (err) {
      toast.error("Server error during role switch");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Profile Update (Name/Email)
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const headers = { "Content-Type": "application/json", ...getAuthHeaders() };
      const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: "PUT",
        headers,
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Profile updated successfully!");
        const updatedUser = {
          ...user,
          first_name: formData.first_name,
          last_name: formData.last_name,
          name: `${formData.first_name} ${formData.last_name}`.trim(),
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      } else {
        toast.error("Failed to update profile");
      }
    } catch (err) {
      toast.error("Server error while updating profile");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Address Update
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const headers = { "Content-Type": "application/json", ...getAuthHeaders() };
      const res = await fetch(`${API_BASE_URL}/api/users/profile/address`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          street_address: formData.street_address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        }),
      });
      if (res.ok) toast.success("Address saved successfully!");
      else toast.error("Failed to save address");
    } catch (err) {
      toast.error("Server error while saving address");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Image Upload
  const handleImageUpload = async () => {
    if (!formData.selectedFile) return;
    const formDataToSend = new FormData();
    formDataToSend.append("profileImage", formData.selectedFile);

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/profile/upload`, {
        method: "POST",
        headers: getAuthHeaders(), 
        body: formDataToSend,
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Photo updated!");
        const updatedUser = { ...user, image: data.imagePath };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch (err) {
      toast.error("Upload error");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <Navbar />
      <div className="container max-w-3xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Profile</h1>
          <p className="text-muted-foreground">Manage your account information and preferences.</p>
        </div>

        <div className="grid gap-6">
          {/* ✅ Profile Picture Card */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={formData.profileImage} />
                <AvatarFallback><User className="h-12 w-12" /></AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Input type="file" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setFormData(p => ({ ...p, profileImage: URL.createObjectURL(file), selectedFile: file }));
                }}/>
                {formData.selectedFile && <Button onClick={handleImageUpload} size="sm">Save Photo</Button>}
              </div>
            </CardContent>
          </Card>

          {/* ✅ Role Management Card */}
          <Card className={user?.role === "owner" ? "border-primary bg-primary/5 shadow-sm" : ""}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className={user?.role === "owner" ? "text-primary" : "text-muted-foreground"} />
                <CardTitle>Account Role</CardTitle>
              </div>
              <CardDescription>
                {user?.role === "owner" 
                  ? "You are currently an Equipment Owner. You can list items for rent." 
                  : "List your equipment and start earning by becoming an owner."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user?.role === "owner" ? (
                <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-primary/20">
                  <span className="font-medium text-primary text-sm">Owner Mode Active</span>
                  <Button variant="outline" size="sm" onClick={() => handleRoleSwitch("user")} disabled={isLoading}>
                    {isLoading ? "Processing..." : "Switch to Renter Only"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Button className="w-full" onClick={() => handleRoleSwitch("owner")} disabled={isLoading || !formData.phone || !formData.city}>
                    {isLoading ? "Upgrading..." : "Become an Owner"}
                  </Button>
                  {(!formData.phone || !formData.city) && (
                    <p className="text-xs text-center text-destructive italic">
                      * Update your Phone and City in the forms below to enable Owner mode.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ✅ Personal Information */}
          <Card>
            <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>First Name</Label><Input value={formData.first_name} onChange={handleChange("first_name")} /></div>
                  <div className="space-y-2"><Label>Last Name</Label><Input value={formData.last_name} onChange={handleChange("last_name")} /></div>
                </div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={formData.email} disabled /></div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <div className="relative"><Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/><Input className="pl-10" value={formData.phone} onChange={handleChange("phone")} /></div>
                  </div>
                  <div className="space-y-2">
                    <Label>Alt Phone</Label>
                    <div className="relative"><Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/><Input className="pl-10" value={formData.alternate_phone} onChange={handleChange("alternate_phone")} /></div>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>Update Personal Details</Button>
              </form>
            </CardContent>
          </Card>

          {/* ✅ Address Information */}
          <Card>
            <CardHeader><CardTitle>Address Information</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSaveAddress} className="space-y-4">
                <div className="space-y-2"><Label>Street Address</Label><Input value={formData.street_address} onChange={handleChange("street_address")} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>City</Label><Input value={formData.city} onChange={handleChange("city")} /></div>
                  <div className="space-y-2"><Label>State</Label><Input value={formData.state} onChange={handleChange("state")} /></div>
                </div>
                <Button type="submit" className="w-full" variant="outline" disabled={isLoading}>Save Address</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;