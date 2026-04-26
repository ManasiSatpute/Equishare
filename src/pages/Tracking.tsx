// import { useEffect, useState } from "react";
// import Navbar from "@/components/Navbar";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Package, Truck, CheckCircle2, RotateCcw, AlertTriangle } from "lucide-react";
// import { toast } from "sonner";
// import { API_BASE_URL } from "@/lib/api";
// import dayjs from "dayjs";
// import { Separator } from "@/components/ui/separator";
// import { Badge } from "@/components/ui/badge";

// interface RentalHistory {
//   rental_id: number;
//   equipment_name: string;
//   start_date: string;
//   end_date: string;
//   total_amount: string | number;
//   payment_status: string;
//   delivery_status: "pending" | "out_for_delivery" | "delivered" | "return_requested" | "returned";
//   record_source: "ACTIVE" | "DELETED";
// }

// const Tracking = () => {
//   const [rentals, setRentals] = useState<RentalHistory[]>([]);
//   const [loading, setLoading] = useState(true);

//   const fetchHistory = async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem("token");
//       if (!token) return;

//       const res = await fetch(`${API_BASE_URL}/api/rentals/history`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       const data = await res.json();
//       if (data.success && data.data?.history) {
//         setRentals(data.data.history);
//       }
//     } catch (err) {
//       console.error("Error fetching history", err);
//       toast.error("Failed to load tracking data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchHistory();
//   }, []);

//   const handleReturn = async (rentalId: number) => {
//     if (!confirm("Are you sure you want to request a return for this item?")) return;
//     const token = localStorage.getItem("token");
//     if (!token) return;

//     try {
//       const res = await fetch(`${API_BASE_URL}/api/rentals/return/${rentalId}`, {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`
//         },
//         body: JSON.stringify({ conditionNotes: "Returning in good condition" })
//       });
//       const data = await res.json();
//       if (res.ok || data.success) {
//         toast.success("Return requested successfully");
//         fetchHistory();
//       } else {
//         toast.error(data.message || "Failed to request return");
//       }
//     } catch (err) {
//       toast.error("Error processing return");
//     }
//   };

//   const getStatusStep = (status: string) => {
//     const s = status?.toLowerCase() || '';
//     if (["pending"].includes(s)) return 1;
//     if (["out_for_delivery"].includes(s)) return 2;
//     if (["delivered"].includes(s)) return 3;
//     if (["return_requested", "in_transit"].includes(s)) return 4;
//     if (["returned"].includes(s)) return 5;
//     return 1;
//   };

//   const activeRentals = rentals.filter(r => r.record_source === "ACTIVE" && r.delivery_status !== "returned");
//   const pastRentals = rentals.filter(r => r.record_source === "DELETED" || r.delivery_status === "returned");

//   // Render a progress bar tracking steps
//   const TrackingProgress = ({ status }: { status: string }) => {
//     const currentStep = getStatusStep(status);
    
//     return (
//       <div className="py-4">
//         <div className="flex items-center justify-between mb-2">
//           {/* Step 1 */}
//           <div className={`flex flex-col items-center ${currentStep >= 1 ? "text-primary" : "text-muted-foreground"}`}>
//             <Package className="h-6 w-6 mb-1" />
//             <span className="text-xs font-medium">Pending</span>
//           </div>
//           <div className={`flex-1 h-1 mx-2 rounded ${currentStep >= 2 ? "bg-primary" : "bg-muted"}`} />
//           {/* Step 2 */}
//           <div className={`flex flex-col items-center ${currentStep >= 2 ? "text-primary" : "text-muted-foreground"}`}>
//             <Truck className="h-6 w-6 mb-1" />
//             <span className="text-xs font-medium">Dispatched</span>
//           </div>
//           <div className={`flex-1 h-1 mx-2 rounded ${currentStep >= 3 ? "bg-primary" : "bg-muted"}`} />
//           {/* Step 3 */}
//           <div className={`flex flex-col items-center ${currentStep >= 3 ? "text-primary" : "text-muted-foreground"}`}>
//             <CheckCircle2 className="h-6 w-6 mb-1" />
//             <span className="text-xs font-medium">Delivered</span>
//           </div>
//           <div className={`flex-1 h-1 mx-2 rounded ${currentStep >= 4 ? "bg-primary" : "bg-muted"}`} />
//           {/* Step 4 */}
//           <div className={`flex flex-col items-center ${currentStep >= 4 ? "text-primary" : "text-muted-foreground"}`}>
//             <RotateCcw className="h-6 w-6 mb-1" />
//             <span className="text-xs font-medium">Returning</span>
//           </div>
//           <div className={`flex-1 h-1 mx-2 rounded ${currentStep >= 5 ? "bg-primary" : "bg-muted"}`} />
//           {/* Step 5 */}
//           <div className={`flex flex-col items-center ${currentStep >= 5 ? "text-primary" : "text-muted-foreground"}`}>
//             <AlertTriangle className="h-6 w-6 mb-1" />
//             <span className="text-xs font-medium">Returned</span>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="min-h-screen bg-background">
//       <Navbar />
//       <div className="container py-8 max-w-4xl">
//         <h1 className="text-3xl font-bold mb-6">Delivery Tracking</h1>

//         {loading ? (
//           <div className="text-center py-10">Loading tracking details...</div>
//         ) : (
//           <div className="space-y-8">
//             {/* Active Orders */}
//             <section>
//               <h2 className="text-xl font-semibold mb-4">Active Orders</h2>
//               {activeRentals.length === 0 ? (
//                 <Card><CardContent className="py-8 text-center text-muted-foreground">No active rentals to track.</CardContent></Card>
//               ) : (
//                 <div className="grid gap-4">
//                   {activeRentals.map(rental => (
//                     <Card key={`active-${rental.rental_id}`} className="overflow-hidden">
//                       <div className="bg-muted px-4 py-2 flex justify-between items-center text-sm">
//                         <span className="font-semibold">Order #{rental.rental_id}</span>
//                         <span>{dayjs(rental.start_date).format("MMM D, YYYY")} - {dayjs(rental.end_date).format("MMM D, YYYY")}</span>
//                       </div>
//                       <CardContent className="p-4">
//                         <div className="flex justify-between items-start mb-4">
//                           <div>
//                             <h3 className="font-bold text-lg">{rental.equipment_name}</h3>
//                             <p className="text-muted-foreground mt-1">₹{rental.total_amount}</p>
//                           </div>
//                           <Badge variant={rental.payment_status === "paid" ? "default" : "secondary"}>
//                             {rental.payment_status.toUpperCase()}
//                           </Badge>
//                         </div>
                        
//                         <Separator className="my-4" />
//                         <TrackingProgress status={rental.delivery_status} />
//                         <Separator className="my-4" />
                        
//                         <div className="flex justify-between items-center">
//                           <p className="text-sm font-medium capitalize">Status: <span className="text-primary">{rental.delivery_status.replace(/_/g, " ")}</span></p>
//                           {rental.delivery_status?.toLowerCase() === "delivered" && (
//                             <Button size="sm" onClick={() => handleReturn(rental.rental_id)}>
//                               Request Return
//                             </Button>
//                           )}
//                           {rental.delivery_status?.toLowerCase() === "return_requested" && (
//                             <Button size="sm" variant="secondary" disabled>Return Requested</Button>
//                           )}
//                         </div>
//                       </CardContent>
//                     </Card>
//                   ))}
//                 </div>
//               )}
//             </section>

//             {/* Past Orders */}
//             <section>
//               <h2 className="text-xl font-semibold mb-4">Past Orders</h2>
//               {pastRentals.length === 0 ? (
//                 <p className="text-muted-foreground">No past orders.</p>
//               ) : (
//                 <div className="grid gap-4">
//                   {pastRentals.map(rental => (
//                     <Card key={`past-${rental.rental_id}`}>
//                       <CardContent className="p-4 flex items-center justify-between">
//                         <div>
//                           <p className="font-bold">{rental.equipment_name} <span className="text-sm font-normal text-muted-foreground">(Order #{rental.rental_id})</span></p>
//                           <p className="text-sm text-muted-foreground mt-1">{dayjs(rental.start_date).format("MMM D")} - {dayjs(rental.end_date).format("MMM D, YYYY")}</p>
//                         </div>
//                         <Badge variant="outline">RETURNED</Badge>
//                       </CardContent>
//                     </Card>
//                   ))}
//                 </div>
//               )}
//             </section>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Tracking;


import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Truck, CheckCircle2, RotateCcw, AlertTriangle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";
import dayjs from "dayjs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface RentalHistory {
  id: number;
  equipment_name: string;
  start_date: string;
  end_date: string;
  total_amount: string | number;
  payment_status: string;
  delivery_status: "pending" | "out_for_delivery" | "delivered" | "return_requested" | "returned";
  record_source: "ACTIVE" | "DELETED";
  dropoff_otp?: string; // New field from updated backend
}

const Tracking = () => {
  const [rentals, setRentals] = useState<RentalHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/rentals/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data?.history) {
        setRentals(data.data.history);
      }
    } catch (err) {
      console.error("Error fetching history", err);
      toast.error("Failed to load tracking data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleAgentVerifySimulation = async (rentalId: number) => {
    const enteredOtp = prompt("AGENT VIEW: Enter the Renter's Dropoff OTP to complete delivery:");
    if (!enteredOtp) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/rentals/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rentalId, enteredOtp, type: 'DELIVERY' })
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success("Verification successful! Item marked as Delivered.");
        fetchHistory();
      } else {
        toast.error(data.message || "Invalid OTP entered.");
      }
    } catch (err) {
      toast.error("Error during verification simulation.");
    }
  };

  const handleReturn = async (rentalId: number) => {
    if (!confirm("Are you sure you want to request a return?")) return;
    const token = localStorage.getItem("token");
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/rentals/return/${rentalId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ conditionNotes: "Returning in good condition" })
      });
      if (res.ok) {
        toast.success("Return requested successfully");
        fetchHistory();
      }
    } catch (err) {
      toast.error("Error processing return");
    }
  };

  const getStatusStep = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s === "pending") return 1;
    if (s === "out_for_delivery") return 2;
    if (s === "delivered") return 3;
    if (["return_requested", "in_transit"].includes(s)) return 4;
    if (s === "returned") return 5;
    return 1;
  };

  const activeRentals = rentals.filter(r => r.delivery_status !== "returned");
  const pastRentals = rentals.filter(r => r.delivery_status === "returned");

  const TrackingProgress = ({ status }: { status: string }) => {
    const currentStep = getStatusStep(status);
    return (
      <div className="py-4">
        <div className="flex items-center justify-between mb-2">
          <div className={`flex flex-col items-center ${currentStep >= 1 ? "text-primary" : "text-muted-foreground"}`}>
            <Package className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Pending</span>
          </div>
          <div className={`flex-1 h-1 mx-2 rounded ${currentStep >= 2 ? "bg-primary" : "bg-muted"}`} />
          <div className={`flex flex-col items-center ${currentStep >= 2 ? "text-primary" : "text-muted-foreground"}`}>
            <Truck className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Dispatched</span>
          </div>
          <div className={`flex-1 h-1 mx-2 rounded ${currentStep >= 3 ? "bg-primary" : "bg-muted"}`} />
          <div className={`flex flex-col items-center ${currentStep >= 3 ? "text-primary" : "text-muted-foreground"}`}>
            <CheckCircle2 className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Delivered</span>
          </div>
          <div className={`flex-1 h-1 mx-2 rounded ${currentStep >= 4 ? "bg-primary" : "bg-muted"}`} />
          <div className={`flex flex-col items-center ${currentStep >= 4 ? "text-primary" : "text-muted-foreground"}`}>
            <RotateCcw className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Returning</span>
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Delivery Tracking</h1>

        {loading ? (
          <div className="text-center py-10 text-muted-foreground italic">Loading tracking details...</div>
        ) : (
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4">Active Orders</h2>
              {activeRentals.length === 0 ? (
                <Card><CardContent className="py-8 text-center text-muted-foreground">No active rentals to track.</CardContent></Card>
              ) : (
                <div className="grid gap-4">
                  {activeRentals.map(rental => (
                    <Card key={`active-${rental.id}`} className="overflow-hidden border-2 transition-all hover:border-primary/50">
                      <div className="bg-muted px-4 py-2 flex justify-between items-center text-xs text-muted-foreground">
                        <span className="font-bold text-foreground">ORDER #{rental.id}</span>
                        <span>{dayjs(rental.start_date).format("MMM D")} - {dayjs(rental.end_date).format("MMM D, YYYY")}</span>
                      </div>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <h3 className="font-bold text-xl">{rental.equipment_name}</h3>
                            <p className="text-primary font-semibold text-lg mt-1">₹{rental.total_amount}</p>
                          </div>
                          <Badge variant={rental.payment_status === "paid" ? "default" : "secondary"}>
                            {rental.payment_status.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <Separator className="my-4" />
                        <TrackingProgress status={rental.delivery_status} />
                        
                        {/* OTP SECURITY SECTION - ONLY SHOWN WHEN OUT FOR DELIVERY */}
                        {rental.delivery_status === "out_for_delivery" && (
                          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 my-6 flex items-center justify-between shadow-sm">
                            <div className="flex gap-3 items-center">
                              <ShieldCheck className="h-8 w-8 text-primary" />
                              <div>
                                <p className="text-sm font-bold text-primary">Security Handoff Code</p>
                                <p className="text-xs text-muted-foreground">Give this to the driver upon arrival</p>
                              </div>
                            </div>
                            <div className="bg-background border-2 border-primary px-5 py-2 rounded-lg font-mono text-2xl font-black tracking-[0.3em] text-primary shadow-inner">
                              {rental.dropoff_otp || "----"}
                            </div>
                          </div>
                        )}

                        <Separator className="my-4" />
                        
                        <div className="flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Current Stage</span>
                            <p className="text-sm font-bold capitalize text-primary">{rental.delivery_status.replace(/_/g, " ")}</p>
                          </div>
                          
                          <div className="flex gap-2">
                            {/* SIMULATION BUTTON FOR TEACHER DEMO */}
                            {rental.delivery_status === "out_for_delivery" && (
                              <Button variant="outline" size="sm" onClick={() => handleAgentVerifySimulation(rental.id)}>
                                Driver View: Verify OTP
                              </Button>
                            )}

                            {rental.delivery_status === "delivered" && (
                              <Button size="sm" onClick={() => handleReturn(rental.id)}>
                                Request Return
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 text-muted-foreground">Order History</h2>
              <div className="grid gap-3">
                {pastRentals.map(rental => (
                  <Card key={`past-${rental.id}`} className="bg-muted/30 border-dashed">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-muted-foreground">{rental.equipment_name} <span className="text-xs font-normal opacity-70">(#{rental.id})</span></p>
                        <p className="text-xs text-muted-foreground">{dayjs(rental.start_date).format("MMM D")} - {dayjs(rental.end_date).format("MMM D, YYYY")}</p>
                      </div>
                      <Badge variant="outline" className="opacity-60">ARCHIVED</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tracking;