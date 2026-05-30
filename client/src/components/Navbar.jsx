import { Link, NavLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <header className="navbar">
      <Link to="/" className="brand">
        Jai&apos;s Arcade
      </Link>
      <nav>
        <NavLink to="/" end>
          Lobby
        </NavLink>
        <NavLink to="/auth">Auth</NavLink>
      </nav>
    </header>
  );
}
