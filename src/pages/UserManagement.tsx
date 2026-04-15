import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  KeyRound,
  Shield,
  User as UserIcon,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
  ChevronDown,
} from "lucide-react";
import { useAppStore, User } from "@/store/appStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ApiService from "@/api/apiServices";

const ITEMS_PER_PAGE = 10;

const emptyForm = {
  emp_id: "",
  emp_name: "",
  emp_mail: "",
  password: "",
  role: "user" as "admin" | "user",
};
const emptyErrors = { emp_id: "", emp_name: "", emp_mail: "", password: "" };

export default function UserManagement() {
  const { users, addUser, updateUser, deleteUser } = useAppStore();
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [editing, setEditing] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState(emptyErrors);
  const [quickFillOpen, setQuickFillOpen] = useState(false);
  const [roleDropOpen, setRoleDropOpen] = useState(false);
  const [apiUsers, setApiUsers] = useState<any[]>([]);
  const [apiLoading, setApiLoading] = useState(false);

  const fetchUsers = async () => {
    setApiLoading(true);
    try {
      const res = await ApiService.get('/auth/users');
      setApiUsers(res.data ?? []);
    } catch (err: any) {
      toast.error(ApiService.handleAxiosError(err, 'Failed to fetch users'));
    } finally {
      setApiLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = apiUsers.filter((u) => {
    const matchSearch =
      (u.emp_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (u.emp_mail ?? '').toLowerCase().includes(search.toLowerCase());
    const matchRole =
      filterRole === "All" || u.role === filterRole.toLowerCase();
    return matchSearch && matchRole;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const setField = (key: keyof typeof form, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const validate = () => {
    const e = { emp_id: "", emp_name: "", emp_mail: "", password: "" };
    let ok = true;

    if (!editing) {
      if (form.emp_id && isNaN(Number(form.emp_id))) {
        e.emp_id = "Employee ID must be a number";
        ok = false;
      } else if (
        form.emp_id &&
        users.some((u) => u.emp_id === Number(form.emp_id))
      ) {
        e.emp_id = "Employee ID already exists";
        ok = false;
      }
    }

    if (!form.emp_name.trim()) {
      e.emp_name = "Full name is required";
      ok = false;
    } else if (form.emp_name.trim().length < 2) {
      e.emp_name = "Name must be at least 2 characters";
      ok = false;
    }

    if (!form.emp_mail.trim()) {
      e.emp_mail = "Email address is required";
      ok = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.emp_mail.trim())) {
      e.emp_mail = "Enter a valid email address";
      ok = false;
    } else if (
      !editing &&
      users.some((u) => u.emp_mail === form.emp_mail.trim())
    ) {
      e.emp_mail = "Email already registered";
      ok = false;
    }

    if (!editing && form.password && form.password.length < 6) {
      e.password = "Password must be at least 6 characters";
      ok = false;
    }

    setErrors(e);
    return ok;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (editing) {
      updateUser(editing.id, { emp_name: form.emp_name.trim(), emp_mail: form.emp_mail.trim(), role: form.role });
      setEditing(null);
      toast.success('User updated!');
    } else {
      try {
        const payload = {
          emp_id: Number(form.emp_id) || users.length + 1,
          emp_name: form.emp_name.trim(),
          emp_mail: form.emp_mail.trim(),
          password: form.password || 'Default@123',
          role: form.role,
        };
        const res = await ApiService.post('/auth/register', payload);
        addUser({
          id: String(res.data?.id ?? Date.now()),
          emp_id: payload.emp_id,
          emp_name: payload.emp_name,
          emp_mail: payload.emp_mail,
          password: payload.password,
          role: payload.role,
        });
        toast.success('User created!');
        fetchUsers();
      } catch (err: any) {
        toast.error(ApiService.handleAxiosError(err, 'Failed to create user'));
        return;
      }
    }
    setForm(emptyForm);
    setErrors(emptyErrors);
  };

  const startEdit = (u: User) => {
    setEditing(u);
    setForm({
      emp_id: u.emp_id.toString(),
      emp_name: u.emp_name,
      emp_mail: u.emp_mail,
      password: "",
      role: u.role,
    });
    setErrors(emptyErrors);
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors(emptyErrors);
  };

  // dropdown users list for quick-fill
  const demoUsers = [
    { label: "Admin — Shyam", email: "shyam@gmail.com", role: "admin" as const },
    { label: "User — Priya",  email: "priya@gmail.com", role: "user"  as const },
    { label: "User — Rahul",  email: "rahul@gmail.com", role: "user"  as const },
  ];

  return (
    <div className="space-y-7">
      {/* ── Form Card ── */}
      <div className="w-full">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl w-full"
          style={{
            boxShadow: "0 4px 32px rgba(0,0,0,0.10)",
            border: editing
              ? "1.5px solid hsl(262 83% 58% / 0.25)"
              : "1.5px solid hsl(24 95% 53% / 0.18)",
          }}
        >
          {/* Gradient header banner */}
          <div
            className="px-7 py-5 flex items-center justify-between rounded-t-2xl"
            style={{
              background: editing
                ? "linear-gradient(135deg,hsl(262 83% 58% / 0.18),hsl(291 64% 42% / 0.10))"
                : "linear-gradient(135deg,hsl(24 95% 53% / 0.15),hsl(43 96% 52% / 0.08))",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center shadow"
                style={{
                  background: editing
                    ? "linear-gradient(135deg,hsl(262 83% 58%),hsl(291 64% 42%))"
                    : "linear-gradient(135deg,hsl(24 95% 53%),hsl(43 96% 52%))",
                }}
              >
                {editing ? (
                  <Pencil className="w-5 h-5 text-white" />
                ) : (
                  <UserIcon className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-base">
                  {editing ? "Edit User" : "Create New User"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {editing
                    ? "Update user information and permissions"
                    : "Add a new user to the cafeteria system"}
                </p>
              </div>
            </div>
            {editing && (
              <button
                onClick={cancelEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors border border-border/50"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
            )}
          </div>

          <div className="bg-card p-6 rounded-b-2xl">
            <form onSubmit={handleSubmit} noValidate>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                {/* Employee ID */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Employee ID
                  </label>
                  <Input
                    placeholder="e.g. 101"
                    type="number"
                    value={form.emp_id}
                    onChange={(e) => setField("emp_id", e.target.value)}
                    disabled={!!editing}
                    className={`h-11 bg-muted/20 text-sm transition-colors ${
                      errors.emp_id
                        ? "border-red-500/60"
                        : "border-border/60 focus:border-orange-500/50"
                    }`}
                  />
                  {errors.emp_id ? (
                    <p className="text-[10px] text-red-400 flex items-center gap-1">
                      <X className="w-3 h-3" />
                      {errors.emp_id}
                    </p>
                  ) : (
                    !editing && (
                      <p className="text-[10px] text-muted-foreground">
                        Auto-generated if left empty
                      </p>
                    )
                  )}
                </div>

                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Full Name *
                  </label>
                  <Input
                    placeholder="e.g. John Doe"
                    value={form.emp_name}
                    onChange={(e) => setField("emp_name", e.target.value)}
                    className={`h-11 bg-muted/20 text-sm transition-colors ${
                      errors.emp_name
                        ? "border-red-500/60"
                        : "border-border/60 focus:border-orange-500/50"
                    }`}
                  />
                  {errors.emp_name && (
                    <p className="text-[10px] text-red-400 flex items-center gap-1">
                      <X className="w-3 h-3" />
                      {errors.emp_name}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    placeholder="e.g. john@cafe.com"
                    value={form.emp_mail}
                    onChange={(e) => setField("emp_mail", e.target.value)}
                    className={`h-11 bg-muted/20 text-sm transition-colors ${
                      errors.emp_mail
                        ? "border-red-500/60"
                        : "border-border/60 focus:border-orange-500/50"
                    }`}
                  />
                  {errors.emp_mail && (
                    <p className="text-[10px] text-red-400 flex items-center gap-1">
                      <X className="w-3 h-3" />
                      {errors.emp_mail}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Password{" "}
                    {editing && (
                      <span className="normal-case font-normal text-muted-foreground/60">
                        (optional)
                      </span>
                    )}
                  </label>
                  <Input
                    type="password"
                    placeholder={
                      editing ? "Leave blank to keep current" : "Enter password"
                    }
                    value={form.password}
                    onChange={(e) => setField("password", e.target.value)}
                    className={`h-11 bg-muted/20 text-sm transition-colors ${
                      errors.password
                        ? "border-red-500/60"
                        : "border-border/60 focus:border-orange-500/50"
                    }`}
                  />
                  {errors.password ? (
                    <p className="text-[10px] text-red-400 flex items-center gap-1">
                      <X className="w-3 h-3" />
                      {errors.password}
                    </p>
                  ) : (
                    !editing && (
                      <p className="text-[10px] text-muted-foreground">
                        Default: Default@123 if left empty
                      </p>
                    )
                  )}
                </div>

                {/* Role — dropdown */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Role *
                  </label>
                  <div className="relative z-10">
                    <button
                      type="button"
                      onClick={() => {
                        setRoleDropOpen((v) => !v);
                        setQuickFillOpen(false);
                      }}
                      className={`w-full h-11 flex items-center justify-between px-4 rounded-xl border text-sm font-medium transition-all ${
                        form.role === "admin"
                          ? "bg-orange-500/10 border-orange-500/40 text-orange-500"
                          : "bg-emerald-500/10 border-emerald-500/40 text-emerald-600"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {form.role === "admin" ? (
                          <>
                            <Shield className="w-4 h-4" />
                            <span>Admin</span>
                          </>
                        ) : (
                          <>
                            <UserIcon className="w-4 h-4" />
                            <span>User</span>
                          </>
                        )}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform shrink-0 ${
                          roleDropOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    <AnimatePresence>
                      {roleDropOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full mt-1 w-full rounded-xl border border-border/60 bg-card shadow-2xl z-50 overflow-hidden"
                        >
                          {[
                            {
                              value: "user",
                              label: "User",
                              icon: UserIcon,
                              desc: "Can browse & order food",
                              active: "bg-emerald-500/10",
                              dot: "bg-emerald-400",
                              text: "text-emerald-600",
                            },
                            {
                              value: "admin",
                              label: "Admin",
                              icon: Shield,
                              desc: "Can manage menu & orders",
                              active: "bg-orange-500/10",
                              dot: "bg-orange-400",
                              text: "text-orange-500",
                            },
                          ].map((r) => (
                            <button
                              key={r.value}
                              type="button"
                              onClick={() => {
                                setForm((f) => ({
                                  ...f,
                                  role: r.value as "user" | "admin",
                                }));
                                setRoleDropOpen(false);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3 transition-colors border-b border-border/30 last:border-0 text-left ${
                                form.role === r.value
                                  ? r.active
                                  : "hover:bg-muted/40"
                              }`}
                            >
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                  r.value === "admin"
                                    ? "bg-orange-500/15"
                                    : "bg-emerald-500/15"
                                }`}
                              >
                                <r.icon
                                  className={`w-4 h-4 ${
                                    r.value === "admin"
                                      ? "text-orange-400"
                                      : "text-emerald-500"
                                  }`}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-bold ${r.text}`}>
                                  {r.label}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {r.desc}
                                </p>
                              </div>
                              <div
                                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                  form.role === r.value
                                    ? r.value === "admin"
                                      ? "border-orange-400"
                                      : "border-emerald-400"
                                    : "border-border"
                                }`}
                              >
                                {form.role === r.value && (
                                  <span
                                    className={`w-2 h-2 rounded-full ${r.dot}`}
                                  />
                                )}
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end mt-6 pt-5 border-t border-border/40 pb-1">
                <Button
                  type="submit"
                  size="lg"
                  className="text-white font-semibold px-8 shadow-lg"
                  style={{
                    background: editing
                      ? "linear-gradient(135deg,hsl(262 83% 58%),hsl(291 64% 42%))"
                      : "linear-gradient(135deg,hsl(24 95% 53%),hsl(43 96% 52%))",
                  }}
                >
                  {editing ? (
                    <>
                      <Pencil className="w-4 h-4 mr-2" />
                      Update User
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create User
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>

      {/* ── Search + Filter ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-muted/40 border border-border/50 rounded-xl px-3 py-2 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            placeholder="Search users..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
          />
          {search && (
            <button onClick={() => setSearch("")}>
              <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        <div className="flex gap-1.5">
          {["All", "Admin", "User"].map((r) => (
            <button
              key={r}
              onClick={() => {
                setFilterRole(r);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                filterRole === r
                  ? "text-white border-transparent shadow-md"
                  : "bg-muted/40 text-muted-foreground hover:text-foreground border-border/50"
              }`}
              style={
                filterRole === r
                  ? {
                      background:
                        "linear-gradient(135deg,hsl(24 95% 53%),hsl(43 96% 52%))",
                    }
                  : {}
              }
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* ── Users Table ── */}
      <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 bg-muted/20">
              {["Employee", "Email", "Role", "Actions"].map((h, i) => (
                <th
                  key={h}
                  className={`text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-5 py-3.5 ${
                    i === 3 ? "text-right" : "text-left"
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {apiLoading ? (
              <tr>
                <td colSpan={4} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                      className="w-6 h-6 border-2 border-orange-400/30 border-t-orange-400 rounded-full" />
                    <p className="text-xs text-muted-foreground">Loading users...</p>
                  </div>
                </td>
              </tr>
            ) : (
              <AnimatePresence>
                {paginated.map((u, i) => (
                  <motion.tr
                    key={u.emp_id ?? i}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border/30 hover:bg-muted/15 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                          style={{ background: "linear-gradient(135deg,hsl(24 95% 53%),hsl(43 96% 52%))" }}
                        >
                          {(u.emp_name ?? '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{u.emp_name}</p>
                          <p className="text-xs text-muted-foreground">ID: {u.emp_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-muted-foreground">{u.emp_mail}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        u.role === "admin"
                          ? "bg-orange-500/10 text-orange-400 border-orange-500/25"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                      }`}>
                        {u.role === "admin" ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                        {u.role === "admin" ? "Admin" : "User"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => startEdit(u)}
                          className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toast.success(`Password reset for ${u.emp_name}`)}
                          className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-colors"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { deleteUser(u.id); toast.success("User deleted"); }}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}

            {!apiLoading && paginated.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-3">
                    <Users className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-semibold text-muted-foreground">No users found</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Try adjusting your search or filter</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-border/50 bg-muted/10">
            <p className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
              {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of{" "}
              {filtered.length}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 rounded-lg flex items-center justify-center bg-muted/40 text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors border border-border/50"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => {
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`h-8 w-8 rounded-lg text-xs font-semibold transition-all ${
                          currentPage === page
                            ? "text-white shadow-sm"
                            : "bg-muted/40 text-muted-foreground hover:text-foreground"
                        }`}
                        style={
                          currentPage === page
                            ? {
                                background:
                                  "linear-gradient(135deg,hsl(24 95% 53%),hsl(43 96% 52%))",
                              }
                            : {}
                        }
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
                    return (
                      <span
                        key={page}
                        className="text-muted-foreground text-xs px-1"
                      >
                        …
                      </span>
                    );
                  }
                  return null;
                }
              )}
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="h-8 w-8 rounded-lg flex items-center justify-center bg-muted/40 text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors border border-border/50"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
