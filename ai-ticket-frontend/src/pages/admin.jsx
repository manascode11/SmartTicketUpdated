import { useEffect, useState } from "react";

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ role: "", skills: "" });
  const [searchQuery, setSearchQuery] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data);
        setFilteredUsers(data);
      } else {
        console.error(data.error);
      }
    } catch (err) {
      console.error("Error fetching users", err);
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user.email);
    setFormData({
      role: user.role,
      skills: user.skills?.join(", ") || "",
    });
  };

  const handleUpdate = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/update-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: editingUser,
          role: formData.role,
          skills: formData.skills.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to update user parameters.");
        return;
      }

      // 💡 Sync client localStorage if the admin edited their own role profile mid-session
      const currentLoggedUser = JSON.parse(localStorage.getItem("user"));
      if (currentLoggedUser && currentLoggedUser.email === editingUser) {
        currentLoggedUser.role = formData.role;
        localStorage.setItem("user", JSON.stringify(currentLoggedUser));
      }

      setEditingUser(null);
      setFormData({ role: "", skills: "" });
      fetchUsers();
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    setFilteredUsers(users.filter((user) => user.email.toLowerCase().includes(query)));
  };

  return (
    <div className="max-w-4xl mx-auto bg-base-100 p-6 rounded-2xl border border-base-200 shadow-xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-primary tracking-tight">Identity Registry Management</h1>
        <p className="text-xs opacity-60">Alter cluster access hierarchies and dynamic triage matrix targeting keywords.</p>
      </div>

      <input
        type="text"
        className="input input-bordered w-full"
        placeholder="Filter identity strings by email..."
        value={searchQuery}
        onChange={handleSearch}
      />

      <div className="space-y-3">
        {filteredUsers.map((user) => (
          <div key={user._id} className="bg-base-200 rounded-xl p-4 border border-base-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold">{user.email}</span>
                <span className="badge badge-sm badge-outline uppercase tracking-wider text-[9px]">{user.role}</span>
              </div>
              <p className="text-xs text-neutral-content/60">
                <strong>Skills Matrix:</strong> {user.skills?.length > 0 ? user.skills.join(", ") : "None Registered"}
              </p>
            </div>

            {editingUser === user.email ? (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <select
                  className="select select-bordered select-sm"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="user">User</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>

                <input
                  type="text"
                  placeholder="Skills (comma separated)"
                  className="input input-bordered input-sm"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                />

                <div className="flex gap-1">
                  <button className="btn btn-success btn-sm text-xs" onClick={handleUpdate}>Save</button>
                  <button className="btn btn-ghost btn-sm text-xs" onClick={() => setEditingUser(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <button className="btn btn-neutral btn-sm self-start sm:self-auto text-xs" onClick={() => handleEditClick(user)}>
                Modify Perms
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}