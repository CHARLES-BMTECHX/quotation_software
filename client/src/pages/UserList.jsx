import React, { useEffect, useState } from "react";
import { getUsers, deleteUser, updateUser } from "../api/user";

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "" });

  const fetchUsers = async () => {
    const res = await getUsers();
    setUsers(res.data);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete user?")) {
      await deleteUser(id);
      fetchUsers();
    }
  };

  const handleEdit = (user) => {
    setEditingId(user._id);
    setEditForm({ name: user.name, email: user.email });
  };

  const handleUpdate = async (id) => {
    await updateUser(id, editForm);
    setEditingId(null);
    fetchUsers();
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="list-container">
      <h2>User List</h2>
      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Name</th><th>Email</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id}>
              <td>
                {editingId === u._id ? (
                  <input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                ) : (
                  u.name
                )}
              </td>
              <td>
                {editingId === u._id ? (
                  <input
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                ) : (
                  u.email
                )}
              </td>
              <td>
                {editingId === u._id ? (
                  <button onClick={() => handleUpdate(u._id)}>Save</button>
                ) : (
                  <button onClick={() => handleEdit(u)}>Edit</button>
                )}
                <button onClick={() => handleDelete(u._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
