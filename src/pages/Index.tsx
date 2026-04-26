import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, Tractor, MapPin, IndianRupee, ShieldCheck, Sprout } from "lucide-react";
import Navbar from "@/components/Navbar";
import EquipmentCard from "@/components/EquipmentCard";
import heroFarm from "@/assets/hero-farm.jpg";
import { API_BASE_URL } from "@/lib/api";

const Index = () => {
  const [featuredEquipment, setFeaturedEquipment] = useState<any[]>([]);

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/equipment`);
        if (response.ok) {
          const data = await response.json();
          // Filter out rented/unavailable tools and get top 8
          const availableOnly = data.filter((item: any) => item.available);
          setFeaturedEquipment(availableOnly.slice(0, 8));
        }
      } catch (error) {
        console.error("Error fetching featured equipment:", error);
      }
    };
    fetchEquipment();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[650px] flex items-center justify-center">
        <div className="absolute inset-0">
          <img src={heroFarm} alt="Indian farming" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/30" />
        </div>
        <div className="relative z-10 container text-center md:text-left">
          <h1 className="font-heading text-6xl md:text-7xl font-extrabold mb-4 drop-shadow-md leading-tight">
            EquiShare<br />
            <span className="text-primary block text-3xl md:text-5xl mt-4 font-bold tracking-tight">
              Share Tools. Save Money. Build More.
            </span>
          </h1>
          <p className="text-lg md:text-2xl text-foreground mb-10 max-w-2xl font-medium drop-shadow-sm opacity-90 leading-relaxed">
            Access high-quality agricultural machinery and specialized tools instantly. 
            Empower your operations without heavy capital investments.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <Link to="/equipment">
              <Button size="lg" className="w-full sm:w-auto shadow-xl hover:scale-105 transition-transform duration-200 text-lg h-14 px-8">
                <Search className="mr-2 h-5 w-5" />
                Browse Equipment Catalog
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 bg-muted/40">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="font-heading text-4xl font-bold mb-4">How EquiShare Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">Get the equipment you need delivered to your farm in three simple steps.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-8 bg-card rounded-3xl shadow-sm border hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
                <Search className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold mb-4">1. Search & Compare</h3>
              <p className="text-muted-foreground text-md leading-relaxed">Browse our vast network of verified heavy machinery and specialized farming tools.</p>
            </div>
            <div className="p-8 bg-card rounded-3xl shadow-sm border hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
                <MapPin className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold mb-4">2. Book Locally</h3>
              <p className="text-muted-foreground text-md leading-relaxed">Find equipment near your location from trusted providers and verified owners.</p>
            </div>
            <div className="p-8 bg-card rounded-3xl shadow-sm border hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
                <Tractor className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold mb-4">3. Work & Return</h3>
              <p className="text-muted-foreground text-md leading-relaxed">Get your work done efficiently and seamlessly return the equipment when finished.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Equipment Floating Cards */}
      {featuredEquipment.length > 0 && (
        <section className="py-20 bg-background overflow-hidden">
          <div className="container mb-12">
            <h2 className="font-heading text-4xl font-bold mb-4">Trending on EquiShare</h2>
            <p className="text-muted-foreground text-lg">Top-rated machinery available right now in your area.</p>
          </div>
          
          <div className="relative w-full">
            <div className="flex gap-6 px-4 md:px-12 pb-8 overflow-x-auto snap-x snap-mandatory flex-nowrap" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <style>{`.overflow-x-auto::-webkit-scrollbar { display: none; }`}</style>
              {featuredEquipment.map((equipment) => (
                <div key={equipment._id || equipment.id} className="min-w-[240px] md:min-w-[280px] snap-center shrink-0 transform transition-transform duration-300 hover:-translate-y-2 cursor-pointer mt-2 mb-2">
                  <div className="bg-card rounded-2xl overflow-hidden border shadow-md group h-full">
                    <div className="h-48 overflow-hidden bg-muted">
                      <img 
                        src={equipment.image_url?.startsWith("http") ? equipment.image_url : `${API_BASE_URL}${equipment.image_url}`} 
                        alt={equipment.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                      />
                    </div>
                    <div className="p-4 text-center">
                      <h3 className="font-bold text-lg mb-1 truncate">{equipment.name}</h3>
                      <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold capitalize tracking-wide">
                        {equipment.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Soft fade edges to indicate it is scrollable */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-12 md:w-32 bg-gradient-to-r from-background to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-12 md:w-32 bg-gradient-to-l from-background to-transparent" />
          </div>
        </section>
      )}

      {/* CTA Section */}
      {!localStorage.getItem("token") && (
        <section className="py-20 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <Tractor className="w-64 h-64" />
          </div>
          <div className="container text-center relative z-10">
            <h2 className="font-heading text-4xl font-bold mb-6">Ready to Supercharge Your Farm?</h2>
            <p className="text-xl mb-10 max-w-3xl mx-auto opacity-95">
              Join thousands of forward-thinking farmers across India who are maximizing output and saving capital with EquiShare.
            </p>
            <Link to="/auth">
              <Button size="lg" variant="secondary" className="h-14 px-10 text-lg shadow-xl hover:scale-105 transition-transform duration-200">
                Create Your Free Account
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-card py-16 border-t mt-auto">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-1">
              <h3 className="font-heading text-2xl font-bold mb-4 text-primary">EquiShare</h3>
              <p className="text-muted-foreground leading-relaxed">
                Reimagining agriculture by making modern farm equipment accessible, affordable, and shared.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-6 text-lg">Quick Links</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li><Link to="/equipment" className="hover:text-primary transition-colors">Browse Equipment</Link></li>
                <li><Link to="/user-dashboard" className="hover:text-primary transition-colors">Renter Dashboard</Link></li>
                <li><Link to="/owner-dashboard" className="hover:text-primary transition-colors">Owner Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-6 text-lg">Support</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li><Link to="#" className="hover:text-primary transition-colors">Help Center</Link></li>
                <li><Link to="#" className="hover:text-primary transition-colors">Contact Us</Link></li>
                <li><Link to="#" className="hover:text-primary transition-colors">Safety Hub</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-6 text-lg">Contact Us</h4>
              <p className="text-muted-foreground leading-relaxed">
                Email: support@equishare.in<br />
                Phone: +91 1800 123 4567<br />
                Address: Pune, Maharashtra
              </p>
            </div>
          </div>
          <div className="border-t mt-12 pt-8 text-center text-muted-foreground flex flex-col md:flex-row justify-between items-center">
            <p>© 2026 EquiShare Platform. All rights reserved.</p>
            <p className="mt-4 md:mt-0 text-sm">Made with &hearts; for Indian Agriculture</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
