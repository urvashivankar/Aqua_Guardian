import React from 'react';
import { Mail, Phone, Globe, Shield, Droplets } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="ocean-card border-t mt-20">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-ocean-primary" />
              <span className="text-xl font-bold text-ocean-light">Aqua Guardian</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
              Protecting Water, Protecting Life. Join our mission to safeguard our planet's most precious resource.
            </p>
          </div>

          {/* Contact & Links */}
          <div className="md:text-right">
            <h3 className="text-lg font-semibold text-ocean-light mb-4">Get in Touch</h3>
            <div className="space-y-3 text-sm inline-block text-left md:text-right">
              <a href="mailto:support@aquaguardian.org" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors md:justify-end">
                <Mail className="h-4 w-4 text-ocean-primary" />
                <span>support@aquaguardian.org</span>
              </a>
              <div className="flex items-center space-x-2 text-muted-foreground md:justify-end">
                <Globe className="h-4 w-4 text-ocean-primary" />
                <span>aquaguardian.org</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © 2025 Aqua Guardian. All rights reserved.
          </div>

          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-ocean-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-ocean-primary transition-colors">Terms of Service</a>
          </div>
        </div>

        {/* Water Wave Animation */}
        <div className="absolute inset-x-0 bottom-0 h-1 wave-animation opacity-60"></div>
      </div>
    </footer>
  );
};

export default Footer;