// Navbar.js
import { Link } from "react-router-dom";

const Navbar = () => (
  <nav>
    <Link to="/" className="m-2">
      home
    </Link>
    <Link to="/create" className="m-2">
      createNote
    </Link>
    <Link to="/share" className="m-2">
      shareNote
    </Link>
    <Link to="/auth/login" className="m-2">
      login
    </Link>
    <Link to="/auth/register" className="m-2">
      register
    </Link>
    <Link to="/inbox" className="m-2">
      MyInbox
    </Link>
  </nav>
);

export default Navbar;
