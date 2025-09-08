import React from 'react';
import { Facebook, Twitter, Instagram } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="w-full bg-gray-800 text-gray-300 py-6">
            <div className="container mx-auto px-6 text-center">
                <div className="flex justify-center space-x-6 mb-4">
                    <a href="#" className="hover:text-white"><Facebook /></a>
                    <a href="#" className="hover:text-white"><Twitter /></a>
                    <a href="#" className="hover:text-white"><Instagram /></a>
                </div>
                <div className="text-sm text-gray-400">
                    © {new Date().getFullYear()} Your Institution. All rights reserved.
                </div>
                <div className="text-xs mt-2">
                    <a href="#" className="hover:underline">Privacy Policy</a>
                    <span className="mx-2">|</span>
                    <a href="#" className="hover:underline">Terms of Service</a>
                </div>
            </div>
        </footer>
    );
}