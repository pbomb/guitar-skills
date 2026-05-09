import { NavLink } from 'react-router-dom';
import './Nav.css';

export default function Nav() {
  return (
    <nav className="site-nav">
      <NavLink to="/" end className={({ isActive }) => `site-nav__link${isActive ? ' site-nav__link--active' : ''}`}>
        Chord Practice
      </NavLink>
      <NavLink to="/arpeggios" className={({ isActive }) => `site-nav__link${isActive ? ' site-nav__link--active' : ''}`}>
        Arpeggio Practice
      </NavLink>
    </nav>
  );
}
