import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Truck } from "lucide-react";
import { toast } from "sonner";

interface DeliveryAgent {
  id: number;
  name: string;
  company: string;
  phone: string;
  rating: number;
}

const demoAgents: DeliveryAgent[] = [
  {
    id: 1,
    name: "Rahul Patil",
    company: "QuickMove Logistics",
    phone: "9876543210",
    rating: 4.6,
   
  },
  {
    id: 2,
    name: "Amit Sharma",
    company: "FastTrack Delivery",
    phone: "9123456780",
    rating: 4.4,
   
  },
  {
    id: 3,
    name: "Sneha Kulkarni",
    company: "CityExpress Couriers",
    phone: "9988776655",
    rating: 4.8,
    
  }
];

const DeliveryAgents = () => {
  const { rentalId } = useParams();
  const navigate = useNavigate();
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);

  const assignAgent = async (agent: DeliveryAgent) => {
    setSelectedAgent(agent.id);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/rentals/delivery-status/${rentalId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "agent_assigned" }),
      });

      if (res.ok) {
        toast.success(`Agent ${agent.name} assigned for Order #${rentalId}`);
        // Navigate back to the owner dashboard after a short delay
        setTimeout(() => {
          navigate("/owner-dashboard");
        }, 1500);
      } else {
        toast.error("Failed to sync assignment with server");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during assignment");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container max-w-4xl py-8">
        <h1 className="text-3xl font-bold mb-6">
          Assign Delivery Agent
        </h1>

        <p className="text-muted-foreground mb-6">
          Select a third-party delivery partner for Order #{rentalId}
        </p>

        <div className="grid gap-4">
          {demoAgents.map((agent) => (
            <Card key={agent.id}>
              <CardContent className="p-5 flex justify-between items-center">
                
                <div className="flex gap-3 items-center">
                  <Truck className="h-6 w-6 text-primary" />

                  <div>
                    <p className="font-bold">{agent.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {agent.company}
                    </p>

                    <p className="text-sm mt-1">
                      Rating:  {agent.rating}
                    </p>

                   
                  </div>
                </div>

                <Button
                  disabled={selectedAgent === agent.id}
                  onClick={() => assignAgent(agent)}
                >
                  {selectedAgent === agent.id
                    ? "Assigned"
                    : "Assign"}
                </Button>

              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DeliveryAgents;