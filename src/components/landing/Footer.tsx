const footerLinks = {
  Product: ["Features", "Pricing", "Documentation", "API"],
  Company: ["About", "Blog", "Careers", "Contact"],
  Legal: ["Privacy Policy", "Terms of Service", "Cookie Policy"],
  Support: ["Help Centre", "Status", "Community"],
};

const Footer = () => (
  <footer className="border-t py-16 px-4">
    <div className="container mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2 md:col-span-1">
          <a href="#" className="font-display text-xl font-bold text-foreground">
            Void<span className="text-primary">Zero</span>
          </a>
          <p className="text-sm text-muted-foreground mt-3">
            The property turnover marketplace connecting agents and contractors.
          </p>
        </div>
        {Object.entries(footerLinks).map(([category, links]) => (
          <div key={category}>
            <h4 className="font-display font-semibold text-foreground text-sm mb-4">{category}</h4>
            <ul className="space-y-2.5">
              {links.map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t mt-12 pt-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} VoidZero. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
