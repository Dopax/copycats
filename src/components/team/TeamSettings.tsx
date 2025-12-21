"use client";

import { useState, useEffect } from "react";
import { useBrand } from "@/context/BrandContext";

interface TeamMember {
    id: string;
    name: string | null;
    email: string;
    role: string;
    ratePerBatch: number | null;
}

export default function TeamSettings() {
    const { selectedBrand } = useBrand();
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form States
    const [newName, setNewName] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newPassword, setNewPassword] = useState(""); // Simplified for prototype
    const [newRole, setNewRole] = useState("VIDEO_EDITOR");
    const [newRate, setNewRate] = useState("0");

    const [editRate, setEditRate] = useState("0");
    const [editRole, setEditRole] = useState("VIDEO_EDITOR");

    useEffect(() => {
        if (selectedBrand) {
            fetchMembers();
        }
    }, [selectedBrand]);

    const fetchMembers = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`/api/users?brandId=${selectedBrand?.id}`);
            if (res.ok) {
                const data = await res.json();
                setMembers(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBrand) return;

        try {
            const res = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newName,
                    email: newEmail,
                    password: newPassword,
                    role: newRole,
                    ratePerBatch: parseFloat(newRate),
                    brandId: selectedBrand.id,
                }),
            });

            if (res.ok) {
                await fetchMembers();
                setIsAdding(false);
                setNewName("");
                setNewEmail("");
                setNewPassword("");
                setNewRate("0");
            } else {
                alert("Failed to create user");
            }
        } catch (err) {
            console.error(err);
            alert("Error creating user");
        }
    };

    const startEditing = (member: TeamMember) => {
        setEditingId(member.id);
        setEditRole(member.role);
        setEditRate(member.ratePerBatch?.toString() || "0");
    };

    const saveEdit = async (id: string) => {
        try {
            const res = await fetch(`/api/users/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    role: editRole,
                    ratePerBatch: parseFloat(editRate),
                }),
            });

            if (res.ok) {
                setEditingId(null);
                await fetchMembers();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const deleteMember = async (id: string) => {
        if (!confirm("Are you sure you want to remove this team member?")) return;
        try {
            await fetch(`/api/users/${id}`, { method: "DELETE" });
            await fetchMembers();
        } catch (err) {
            console.error(err);
        }
    };

    if (!selectedBrand) return <div className="p-4 text-zinc-500">Please select a brand.</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        Team Members
                    </h2>
                    <p className="text-sm text-zinc-500 mt-1">Manage editors, strategists, and their rates.</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add Member
                </button>
            </div>

            {isAdding && (
                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-xl border border-zinc-200 dark:border-zinc-700 animate-in fade-in slide-in-from-top-2">
                    <h3 className="text-sm font-bold uppercase text-zinc-400 mb-4 tracking-wider">New Member Details</h3>
                    <form onSubmit={handleAddMember} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="Name"
                            className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            required
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Temporary Password"
                            className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                        <select
                            className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                        >
                            <option value="VIDEO_EDITOR">Video Editor</option>
                            <option value="CREATIVE_STRATEGIST">Creative Strategist</option>
                            <option value="OWNER">Owner</option>
                            <option value="CREATOR">Creator (External)</option>
                        </select>

                        {(newRole === "VIDEO_EDITOR" || newRole === "CREATIVE_STRATEGIST") && (
                            <div className="flex flex-col">
                                <label className="text-xs text-zinc-500 mb-1">Rate per Batch ($)</label>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                                    value={newRate}
                                    onChange={(e) => setNewRate(e.target.value)}
                                />
                            </div>
                        )}

                        <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                                Create User
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                        <tr>
                            <th className="px-6 py-4 font-medium text-zinc-500 dark:text-zinc-400">Name</th>
                            <th className="px-6 py-4 font-medium text-zinc-500 dark:text-zinc-400">Role</th>
                            <th className="px-6 py-4 font-medium text-zinc-500 dark:text-zinc-400">Rate / Batch</th>
                            <th className="px-6 py-4 font-medium text-zinc-500 dark:text-zinc-400 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {isLoading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-zinc-500">Loading team...</td></tr>
                        ) : members.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-zinc-500">No team members found. Add one above.</td></tr>
                        ) : members.map((member) => (
                            <tr key={member.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                            {member.name ? member.name.charAt(0).toUpperCase() : "?"}
                                        </div>
                                        <div>
                                            <div className="font-medium text-zinc-900 dark:text-white">{member.name || "Unnamed"}</div>
                                            <div className="text-xs text-zinc-500">{member.email}</div>
                                        </div>
                                    </div>
                                </td>

                                {/* Editable Role */}
                                <td className="px-6 py-4">
                                    {editingId === member.id ? (
                                        <select
                                            className="px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
                                            value={editRole}
                                            onChange={(e) => setEditRole(e.target.value)}
                                        >
                                            <option value="VIDEO_EDITOR">Video Editor</option>
                                            <option value="CREATIVE_STRATEGIST">Creative Strategist</option>
                                            <option value="OWNER">Owner</option>
                                            <option value="CREATOR">Creator</option>
                                        </select>
                                    ) : (
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${member.role === 'OWNER' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                                                member.role === 'VIDEO_EDITOR' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                                    member.role === 'CREATIVE_STRATEGIST' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' :
                                                        'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
                                            }`}>
                                            {member.role.replace("_", " ")}
                                        </span>
                                    )}
                                </td>

                                {/* Editable Rate */}
                                <td className="px-6 py-4">
                                    {editingId === member.id ? (
                                        <div className="flex items-center gap-1">
                                            <span className="text-zinc-500">$</span>
                                            <input
                                                type="number"
                                                className="w-20 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
                                                value={editRate}
                                                onChange={(e) => setEditRate(e.target.value)}
                                            />
                                        </div>
                                    ) : (
                                        <span className="text-zinc-600 dark:text-zinc-300 font-mono">
                                            {member.ratePerBatch ? `$${member.ratePerBatch.toFixed(2)}` : "-"}
                                        </span>
                                    )}
                                </td>

                                <td className="px-6 py-4 text-right">
                                    {editingId === member.id ? (
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => saveEdit(member.id)} className="p-1 text-green-600 hover:bg-green-50 rounded"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></button>
                                            <button onClick={() => setEditingId(null)} className="p-1 text-red-600 hover:bg-red-50 rounded"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                        </div>
                                    ) : (
                                        <div className="flex justify-end gap-2 text-zinc-400">
                                            <button onClick={() => startEditing(member)} className="p-1 hover:text-indigo-600 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                                            <button onClick={() => deleteMember(member.id)} className="p-1 hover:text-red-600 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
