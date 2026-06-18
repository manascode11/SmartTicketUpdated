import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SignupPage() {
  const [form, setForm] = useState({ email: "", password: "", role: "user", staffToken: "", skills: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        email: form.email,
        password: form.password,
        role: form.role,
        ...(form.role !== "user" && { staffToken: form.staffToken }),
        ...(form.role === "moderator" && { 
          skills: form.skills.split(",").map(s => s.trim()).filter(Boolean) 
        })
      };

      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/");
      } else {
        alert(data.error || "Signup payload validation failed.");
      }
    } catch (err) {
      alert("Something went wrong creating user account module.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="card w-full max-w-md shadow-2xl bg-base-100 border border-base-200">
        <form onSubmit={handleSignup} className="card-body space-y-2">
          <h2 className="card-title justify-center text-xl font-black text-primary">Register Module Identity</h2>

          <input
            type="email"
            name="email"
            placeholder="Account Email"
            className="input input-bordered w-full"
            value={form.email}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Secure Password Key"
            className="input input-bordered w-full"
            value={form.password}
            onChange={handleChange}
            required
          />

          <div className="form-control">
            <label className="label"><span className="label-text font-bold text-xs uppercase opacity-70">Identity Matrix Role Assignment</span></label>
            <select name="role" className="select select-bordered w-full" value={form.role} onChange={handleChange}>
              <option value="user">Standard End-User Identity</option>
              <option value="moderator">Staff Triage Engineer (Moderator)</option>
              <option value="admin">Global Root System Administrator</option>
            </select>
          </div>

          {form.role !== "user" && (
            <div className="form-control bg-error/10 p-3 rounded-lg border border-error/20">
              <label className="label"><span className="label-text font-bold text-xs text-error uppercase">Staff Passcode Token Verification</span></label>
              <input
                type="password"
                name="staffToken"
                placeholder="Enter root infrastructure staff token string"
                className="input input-bordered border-error"
                value={form.staffToken}
                onChange={handleChange}
                required
              />
            </div>
          )}

          {form.role === "moderator" && (
            <div className="form-control bg-info/10 p-3 rounded-lg border border-info/20">
              <label className="label"><span className="label-text font-bold text-xs text-info uppercase">Expert Domain Routing Skill Tags</span></label>
              <input
                type="text"
                name="skills"
                placeholder="e.g. Redis, Node.js, Streams, Kafka"
                className="input input-bordered border-info"
                value={form.skills}
                onChange={handleChange}
                required
              />
              <span className="text-[10px] text-gray-500 mt-1">Isolate tracking tags strictly using comma spacing.</span>
            </div>
          )}

          <div className="form-control mt-4">
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? "Registering profile records..." : "Finalize Profile Registration"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}