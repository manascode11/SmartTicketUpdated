import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const token = localStorage.getItem("token");
  let user = localStorage.getItem("user");
  if (user) user = JSON.parse(user);
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="navbar bg-base-200 border-b border-base-100 px-6 shadow-md">
      <div className="flex-1">
        <Link to="/" className="btn btn-ghost text-xl font-black text-primary tracking-wider">
          🎫 TICKET.AI
        </Link>
      </div>
      <div className="flex items-center gap-4">
        {!token ? (
          <div className="flex gap-2">
            <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
            <Link to="/signup" className="btn btn-primary btn-sm">Sign Up</Link>
          </div>
        ) : (
          <>
            <div className="hidden sm:flex flex-col items-end text-xs">
              <span className="font-semibold text-base-content">{user?.email}</span>
              <span className="badge badge-outline badge-xs text-neutral-content opacity-70 uppercase tracking-widest">{user?.role}</span>
            </div>
            {user?.role === "admin" && (
              <Link to="/admin" className="btn btn-accent btn-sm shadow-sm">
                ⚙️ Admin Panel
              </Link>
            )}
            <button onClick={logout} className="btn btn-outline btn-error btn-sm">
              Logout
            </button>
          </>
        )}
      </div>
    </div>
  );
}