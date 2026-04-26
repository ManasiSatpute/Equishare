import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Heart, User, Menu, LogOut, Package, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useUser } from "@/context/UserContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { API_BASE_URL } from "@/lib/api";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useUser();

  const handleLogout = () => {
    logout();
    localStorage.removeItem("token");
    navigate("/auth");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center justify-between">
        
        {/* LEFT SECTION: LOGO + NAVIGATION */}
        <div className="flex items-center space-x-8">
          {/* LOGO */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-heading text-2xl font-bold text-primary">
              EquiShare
            </span>
          </Link>
          {/* DESKTOP NAVIGATION */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/equipment" className="text-sm font-medium hover:text-primary transition-colors">
              Browse Equipment
            </Link>

            {user?.role === "owner" && (
              <Link to="/owner-dashboard" className="text-sm font-medium hover:text-primary transition-colors">
                Owner Dashboard
              </Link>
            )}
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="flex items-center space-x-4">
          
          {/*  REAL WORLD ADDITION: The "Owner" entry point */}
          {!user && (
            <Link to="/auth?role=owner" className="hidden lg:block">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                <PlusCircle className="mr-2 h-4 w-4" />
                List Your Equipment
              </Button>
            </Link>
          )}

          {user?.role === "user" && (
            <>
              <Link to="/wishlist">
                <Button variant="ghost" size="icon">
                  <Heart className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/tracking">
                <Button variant="ghost" size="icon" title="Track Rentals">
                  <Package className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/cart">
                <Button variant="ghost" size="icon">
                  <ShoppingCart className="h-5 w-5" />
                </Button>
              </Link>
            </>
          )}

          {/*  AFTER LOGIN SECTION */}
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {user.image ? (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image.startsWith('http') ? user.image : `${API_BASE_URL}${user.image.startsWith('/') ? '' : '/'}${user.image}`} />
                    <AvatarFallback><User className="h-4 w-4 text-primary" /></AvatarFallback>
                  </Avatar>
                ) : (
                  <User className="h-5 w-5 text-primary" />
                )}
                <span className="hidden md:inline text-sm font-medium">
                  Hi, {user.name || "User"}
                </span>
              </div>

              <Link to="/profile">
                <Button variant="outline" size="sm">Profile</Button>
              </Link>

              <Button variant="destructive" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            </div>
          ) : (
            <Link to="/auth?role=user">
              <Button>Sign In</Button>
            </Link>
          )}

          {/* MOBILE MENU */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="flex flex-col space-y-4 mt-8">
                {!user && (
                   <Link to="/auth?role=owner" className="w-full">
                    <Button variant="outline" className="w-full">List Equipment</Button>
                   </Link>
                )}
                {/* Always show Browse Equipment for all users in mobile menu */}
                <Link to="/equipment" className="text-lg font-medium hover:text-primary">
                  Browse Equipment
                </Link>
                {user ? (
                  <>
                    <Link to="/profile">
                      <Button className="w-full" variant="outline">Profile</Button>
                    </Link>
                    <Button className="w-full" variant="destructive" onClick={handleLogout}>
                      Logout
                    </Button>
                  </>
                ) : (
                  <Link to="/auth">
                    <Button className="w-full">Sign In</Button>
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;