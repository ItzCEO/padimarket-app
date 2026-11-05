"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <header className="site-navbar">
      <div className="shell navbar-inner">
        <nav className="desktop-nav">
          <Link href="/favourites" className="nav-icon">
            ❤️
          </Link>

          <Link href="/notifications" className="nav-icon">
            🔔
          </Link>

          <a href="/help">Help</a>
        </nav>
      </div>
    </header>
  );
}