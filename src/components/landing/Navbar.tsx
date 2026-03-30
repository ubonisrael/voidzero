import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const navItems = ["Features", "How It Works", "For Agents", "For Contractors"];

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
      <div className="container mx-auto flex items-center justify-between h-16">
        <Link to="/" className="font-display text-xl font-bold tracking-tight text-foreground">
          Void<span className="text-primary">Zero</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {item}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild><Link to="/login">Login</Link></Button>
          <Button size="sm" asChild><Link to="/signup">Sign Up</Link></Button>
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t bg-background px-4 pb-4 space-y-3">
          {navItems.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
              className="block py-2 text-sm font-medium text-muted-foreground"
              onClick={() => setOpen(false)}
            >
              {item}
            </a>
          ))}
          <div className="flex gap-2 pt-2">
            <Button variant="ghost" size="sm" className="flex-1" asChild><Link to="/login">Login</Link></Button>
            <Button size="sm" className="flex-1" asChild><Link to="/signup">Sign Up</Link></Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
