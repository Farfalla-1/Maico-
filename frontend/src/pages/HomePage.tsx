import { useState } from "react";

const GALLERY_ITEMS = [
  { src: "/images/78004882-839a-4249-bed4-15ffff06cd92.jpeg", title: "Nuestras creaciones" },
  { src: "/images/9c1529f0-4adf-48b3-a78a-2e3a3c67eb17.jpeg", title: "Productos artesanales" },
  { src: "/images/c7231779-c3e0-49ca-b7a1-2b0f70123231.jpeg", title: "Hecho con amor" },
  { src: "/images/1d6da227-f5b7-43ef-a297-98c93c11d256.jpeg", title: "Dulzura artesanal" },
  { src: "/images/83c27828-1959-4ccc-9204-e148eebff7fc.jpeg", title: "Nuestro trabajo" },
  { src: "/images/a82b2e9d-109d-43eb-a416-79e592941628.jpeg", title: "Sabor casero" },
];

function HomePage() {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  return (
    <div className="home-v2">
      {/* Hero */}
      <section className="hero-v2">
        <div className="hero-v2-bg">
          <img src="/images/7d8168b9-6144-4efd-b5bc-448e08168aff.jpeg" alt="" />
          <div className="hero-v2-overlay" />
        </div>
        <div className="hero-v2-content">
          <img src="/logo crema.png" alt="Maico" className="hero-v2-logo" />
          <h1 className="hero-v2-title">Maico</h1>
          <p className="hero-v2-subtitle">Pastelería Artesanal</p>
          <div className="hero-v2-info">
            <div className="hero-v2-info-item">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
              </svg>
              <span>Lun - Vie: 6:00 - 20:00</span>
            </div>
            <div className="hero-v2-info-item">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              <span>Villa Ballester, Buenos Aires</span>
            </div>
          </div>
          <div className="hero-v2-scroll">
            <div className="hero-v2-scroll-indicator">
              <div className="hero-v2-scroll-dot" />
            </div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="gallery-v2">
        <div className="gallery-v2-header">
          <p className="gallery-v2-label">Nuestros productos</p>
          <h2 className="gallery-v2-title">Dulzura en cada creación</h2>
        </div>
        <div className="gallery-v2-grid">
          {GALLERY_ITEMS.map((item, i) => (
            <div
              key={i}
              className="gallery-v2-item"
              onMouseEnter={() => setHoveredId(i)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <img
                src={item.src}
                alt={item.title}
                className={`gallery-v2-img ${hoveredId === i ? "zoomed" : ""}`}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <div className={`gallery-v2-overlay ${hoveredId === i ? "visible" : ""}`} />
              <div className={`gallery-v2-caption ${hoveredId === i ? "visible" : ""}`}>
                <h3>{item.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Instagram */}
      <section className="instagram-v2">
        <div className="instagram-v2-icon">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
          </svg>
        </div>
        <p className="instagram-v2-label">Seguinos</p>
        <h2 className="instagram-v2-handle">@soy.maico</h2>
        <p className="instagram-v2-desc">
          Descubrí nuestras novedades, recetas del día y momentos especiales en nuestra panadería.
        </p>
        <a
          href="https://www.instagram.com/soy.maico?igsh=ZWg4Y3E0dHJzcDlu"
          target="_blank"
          rel="noopener noreferrer"
          className="instagram-v2-btn"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
          </svg>
          Ver en Instagram
        </a>
      </section>
    </div>
  );
}

export default HomePage;
