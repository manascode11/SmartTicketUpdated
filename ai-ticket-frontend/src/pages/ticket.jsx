import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";

export default function TicketDetailsPage() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/tickets/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setTicket(data.ticket);
        } else {
          alert(data.message || "Failed to fetch ticket");
        }
      } catch (err) {
        console.error(err);
        alert("Something went wrong loading details");
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [id]);

  if (loading) return <div className="text-center mt-20 loading loading-dots loading-lg text-primary block mx-auto"></div>;
  if (!ticket) return <div className="text-center mt-10 text-error">Incident not located in current cluster matrix.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/" className="btn btn-ghost btn-sm gap-2">⬅️ Return to Main Queue</Link>
      
      <div className="card bg-base-100 border border-base-200 shadow-xl p-6 space-y-6">
        <div>
          <span className="text-xs uppercase tracking-widest text-primary font-black">LOG ANALYSIS RUNBOOK</span>
          <h1 className="text-2xl font-black tracking-tight mt-1">{ticket.title}</h1>
        </div>

        <div className="bg-base-200 p-4 rounded-xl text-sm font-mono border border-base-100 whitespace-pre-wrap">
          {ticket.description}
        </div>

        <div className="grid sm:grid-cols-3 gap-4 border-y border-base-200 py-4 text-sm">
          <div><strong>Status Flag:</strong> <span className="badge badge-neutral uppercase tracking-wider font-bold ml-2">{ticket.status}</span></div>
          <div><strong>Priority Level:</strong> <span className="badge badge-error uppercase font-black ml-2">{ticket.priority || "Triage In Progress"}</span></div>
          <div><strong>Assigned Overseer:</strong> <span className="text-info font-medium ml-1">{ticket.assignedTo?.email || "Fallback Queue (Admin)"}</span></div>
        </div>

        {ticket.relatedSkills?.length > 0 && (
          <div>
            <h4 className="font-bold text-xs uppercase text-gray-400 tracking-wider mb-2">Automated Meta Skill Extraction</h4>
            <div className="flex flex-wrap gap-1.5">
              {ticket.relatedSkills.map((skill, index) => (
                <span key={index} className="badge badge-outline text-xs text-primary font-semibold px-3 py-1">{skill}</span>
              ))}
            </div>
          </div>
        )}

        {ticket.helpfulNotes && (
          <div className="space-y-2 border-t pt-4 border-base-200">
            <h3 className="font-black text-sm uppercase text-accent tracking-widest">🧠 AI Co-Pilot Mitigation Blueprints</h3>
            <div className="prose max-w-none bg-base-200 p-5 rounded-xl border border-base-100 text-sm leading-relaxed text-base-content shadow-inner">
              <ReactMarkdown>{ticket.helpfulNotes}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}