import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Tickets() {
  const [form, setForm] = useState({ title: "", description: "" });
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const fetchTickets = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
        method: "GET",
      });
      const data = await res.json();
      // Safely handle if the backend returns the array directly or wrapped in an object
      setTickets(Array.isArray(data) ? data : data.tickets || []);
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setForm({ title: "", description: "" });
        
        // If your backend responds with { ticket: ... }
        if (data.ticket) {
          setTickets((prevTickets) => [data.ticket, ...prevTickets]);
        } else {
          fetchTickets();
        }
      } else {
        alert(data.error || data.message || "Ticket creation failed");
      }
    } catch (err) {
      alert("Error creating ticket");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadgeColor = (prio) => {
    switch (prio) {
      case "high": return "badge-error";
      case "medium": return "badge-warning";
      default: return "badge-info";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="card bg-base-100 border border-base-200 shadow-xl p-6">
        <h2 className="card-title text-xl font-bold border-b pb-2 mb-4 text-primary">➕ Create New Support Issue</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Ticket Title (e.g., Redis Cache Stampede)"
            className="input input-bordered w-full"
            required
          />
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Provide a detailed log output or architectural description..."
            className="textarea textarea-bordered w-full h-24"
            required
          />
          <button className="btn btn-primary w-full sm:w-auto" type="submit" disabled={loading}>
            {loading ? "Analyzing system telemetry..." : "Submit Ticket to Triage Loop"}
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-extrabold tracking-tight text-neutral-content">📋 System Incidents</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {tickets.map((ticket) => (
            <Link
              key={ticket._id}
              className="card bg-base-100 hover:bg-base-200 border border-base-200 shadow transition-all duration-200 cursor-pointer p-5 group"
              to={`/tickets/${ticket._id}`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-1">{ticket.title}</h3>
                <span className={`badge uppercase text-xs font-bold ${getPriorityBadgeColor(ticket.priority)}`}>
                  {ticket.priority || "triage"}
                </span>
              </div>
              <p className="text-sm text-neutral-content/70 line-clamp-2 mb-4 h-10">{ticket.description}</p>
              <div className="flex justify-between items-center text-xs text-gray-500 border-t pt-2 border-base-200">
                <span className="badge badge-neutral uppercase tracking-wider text-[10px] px-2 py-0.5">{ticket.status}</span>
                <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
        
        {tickets.length === 0 && (
          <p className="text-center text-sm text-gray-500 bg-base-100 p-8 rounded-xl border border-dashed border-base-200">
            No system logs or telemetry issues registered in the queue database yet.
          </p>
        )}
      </div>
    </div>
  ); 
}