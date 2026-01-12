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
    <Link to="/upload" className="m-2">
      Upload
    </Link>
    <Link to="/myfiles" className="m-2">
      My Files
    </Link>
    <Link to="/myfilesss" className="m-2">
      My Files2
    </Link>
  </nav>
);

export default Navbar;
