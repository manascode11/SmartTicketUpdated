import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/");
      } else {
        alert(data.error || "Invalid credential alignment parameters.");
      }
    } catch (err) {
      alert("Something went wrong logging in.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="card w-full max-w-sm shadow-2xl bg-base-100 border border-base-200">
        <form onSubmit={handleLogin} className="card-body">
          <h2 className="card-title justify-center text-xl font-black text-primary">Access Gateway</h2>
          <div className="form-control">
            <input
              type="email"
              name="email"
              placeholder="System Email"
              className="input input-bordered mt-2"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-control">
            <input
              type="password"
              name="password"
              placeholder="Account Password"
              className="input input-bordered mt-2"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-control mt-6">
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? "Authenticating security handshakes..." : "Login"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}