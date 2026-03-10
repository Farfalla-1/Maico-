import { Link } from "react-router-dom";

const GALLERY_IMAGES = [
  { src: "/images/78004882-839a-4249-bed4-15ffff06cd92.jpeg", alt: "Panadería Maico" },
  { src: "/images/9c1529f0-4adf-48b3-a78a-2e3a3c67eb17.jpeg", alt: "Nuestros productos" },
  { src: "/images/c7231779-c3e0-49ca-b7a1-2b0f70123231.jpeg", alt: "El equipo" },
];

const QUICK_LINKS = [
  { to: "/ingredients", label: "Ingredientes", desc: "Gestionar materia prima y precios" },
  { to: "/recipes", label: "Recetas", desc: "Ver y crear recetas" },
  { to: "/calculator", label: "Calculadora", desc: "Calcular costos y márgenes" },
];

function HomePage() {
  return (
    <div className="home">
      {/* Hero */}
      <section className="home-hero">
        <img src="/logo crema.png" alt="Maico" className="home-hero-logo" />
        <h1>Bienvenidos a Maico</h1>
        <p>Sistema de gestión para nuestra panadería</p>
      </section>

      {/* Quick links */}
      <section className="home-section">
        <h2>Acceso rápido</h2>
        <div className="home-quick-links">
          {QUICK_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className="home-quick-card">
              <h3>{link.label}</h3>
              <p>{link.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Gallery */}
      <section className="home-section">
        <h2>Nuestra panadería</h2>
        <div className="home-gallery">
          {GALLERY_IMAGES.map((img, i) => (
            <div key={i} className="home-gallery-item">
              <img
                src={img.src}
                alt={img.alt}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Info */}
      <section className="home-section">
        <div className="home-info-grid">
          {/* Horarios */}
          <div className="home-info-card">
            <h3>Horarios</h3>
            <ul className="home-hours">
              <li><span>Lunes a Viernes</span><span>6:00 - 20:00</span></li>
              <li><span>Sábados</span><span>7:00 - 14:00</span></li>
              <li><span>Domingos</span><span>Cerrado</span></li>
            </ul>
          </div>

          {/* Ubicación */}
          <div className="home-info-card">
            <h3>Ubicación</h3>
            <p className="home-address">
              📍 Dirección de la panadería
            </p>
            <a
              href="https://maps.google.com/?q=panaderia+maico"
              target="_blank"
              rel="noopener noreferrer"
              className="home-map-link"
            >
              Ver en Google Maps
            </a>
          </div>

          {/* Redes */}
          <div className="home-info-card">
            <h3>Redes sociales</h3>
            <div className="home-socials">
              <a
                href="https://www.instagram.com/soy.maico?igsh=ZWg4Y3E0dHJzcDlu"
                target="_blank"
                rel="noopener noreferrer"
                className="home-social-link instagram"
              >
                Instagram
              </a>
              <a
                href="https://facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="home-social-link facebook"
              >
                Facebook
              </a>
              <a
                href="https://wa.me/549XXXXXXXXXX"
                target="_blank"
                rel="noopener noreferrer"
                className="home-social-link whatsapp"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
