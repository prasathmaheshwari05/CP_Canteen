import { useState, useEffect, useRef } from "react";
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
  RefreshCw,
  Mail,
} from "lucide-react";
import { useAppStore, User } from "@/store/appStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import ApiService from "@/api/apiServices";

const ITEMS_PER_PAGE = 10;

const emptyForm = {
  emp_id: "",
  emp_name: "",
  emp_mail: "",
  password: "",
  role: "user" as "superadmin" | "admin" | "user",
};
const emptyErrors = { emp_id: "", emp_name: "", emp_mail: "", password: "" };

const passwordChecks = (pwd: string) => [
  { label: "8+ characters", ok: pwd.length >= 8 },
  { label: "Uppercase letter", ok: /[A-Z]/.test(pwd) },
  { label: "Number", ok: /[0-9]/.test(pwd) },
  { label: "Special character", ok: /[!@#$%^&*]/.test(pwd) },
];

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
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const roleDropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!roleDropOpen) return;
    const handler = (e: MouseEvent) => {
      if (roleDropRef.current && !roleDropRef.current.contains(e.target as Node)) {
        setRoleDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [roleDropOpen]);

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
    const roleMap: Record<string, string> = {
      "Super Admin": "superadmin",
      "Admin": "admin",
      "User": "user",
    };
    const matchRole =
      filterRole === "All" || u.role === (roleMap[filterRole] || filterRole.toLowerCase());
    return matchSearch && matchRole;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const pageStart = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(currentPage * pageSize, filtered.length);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages]);

  const setField = (key: keyof typeof form, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const validate = () => {
    const e = { emp_id: "", emp_name: "", emp_mail: "", password: "" };
    let ok = true;

    if (!editing) {
      if (!form.emp_id.trim()) {
        e.emp_id = "Employee ID is required";
        ok = false;
      } else if (isNaN(Number(form.emp_id))) {
        e.emp_id = "Employee ID must be a number";
        ok = false;
      } else if (
        users.some((u) => u.emp_id === Number(form.emp_id)) ||
        apiUsers.some((u) => u.emp_id === Number(form.emp_id))
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
      (users.some((u) => u.emp_mail === form.emp_mail.trim()) ||
        apiUsers.some((u) => u.emp_mail === form.emp_mail.trim()))
    ) {
      e.emp_mail = "Email already registered";
      ok = false;
    }

    if (!editing) {
      if (!form.password.trim()) {
        e.password = "Password is required";
        ok = false;
      } else {
        const checks = passwordChecks(form.password);
        if (!checks.every((c) => c.ok)) {
          e.password = "Password requirements not met";
          ok = false;
        }
      }
    } else {
      if (form.password.trim()) {
        const checks = passwordChecks(form.password);
        if (!checks.every((c) => c.ok)) {
          e.password = "Password requirements not met";
          ok = false;
        }
      }
    }

    setErrors(e);
    return ok;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    if (editing) {
      try {
        const payload: any = {
          emp_name: form.emp_name.trim(),
          emp_mail: form.emp_mail.trim(),
          role: form.role,
        };
        if (form.password.trim()) {
          payload.password = form.password;
        }
        await ApiService.put(`/auth/users/${editing.emp_id}`, payload);
        updateUser(editing.id, { emp_name: form.emp_name.trim(), emp_mail: form.emp_mail.trim(), role: form.role });
        setApiUsers((prev) =>
          prev.map((u) =>
            u.emp_id === editing.emp_id
              ? { ...u, emp_name: form.emp_name.trim(), emp_mail: form.emp_mail.trim(), role: form.role }
              : u
          )
        );
        toast.success('User updated successfully!');
        setEditing(null);
        setForm(emptyForm);
        setErrors(emptyErrors);
      } catch (err: any) {
        toast.error(ApiService.handleAxiosError(err, 'Failed to update user'));
      } finally {
        setSubmitting(false);
      }
    } else {
      try {
        const payload = {
          emp_id: Number(form.emp_id),
          emp_name: form.emp_name.trim(),
          emp_mail: form.emp_mail.trim(),
          password: form.password,
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
        setForm(emptyForm);
        setErrors(emptyErrors);
      } catch (err: any) {
        toast.error(ApiService.handleAxiosError(err, 'Failed to create user'));
      } finally {
        setSubmitting(false);
      }
    }
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

  const passwordValidationFailures = !editing && form.password
    ? passwordChecks(form.password).filter((check) => !check.ok)
    : [];
  const firstPasswordValidationMessage =
    passwordValidationFailures.length > 0
      ? passwordValidationFailures[0].label
      : "";
  const passwordValidationComplete =
    !editing && form.password && passwordValidationFailures.length === 0;

  return (
    <>
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
            className="px-4 py-3 flex items-center justify-between rounded-t-2xl"
            style={{
              background: editing
                ? "linear-gradient(135deg,hsl(262 83% 58% / 0.18),hsl(291 64% 42% / 0.10))"
                : "linear-gradient(135deg,hsl(24 95% 53% / 0.15),hsl(43 96% 52% / 0.08))",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-2xl flex items-center justify-center shadow"
                style={{
                  background: editing
                    ? "linear-gradient(135deg,hsl(262 83% 58%),hsl(291 64% 42%))"
                    : "linear-gradient(135deg,hsl(24 95% 53%),hsl(43 96% 52%))",
                }}
              >
                {editing ? (
                  <Pencil className="w-4 h-4 text-white" />
                ) : (
                  <UserIcon className="w-4 h-4 text-white" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-sm">
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

          <div className="bg-card p-4 rounded-b-2xl">
            <form onSubmit={handleSubmit} noValidate autoComplete="off">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                {/* Employee ID */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <UserIcon className="w-3 h-3" />
                    Employee ID {!editing && <span className="text-red-400">*</span>}
                  </label>
                  <Input
                    placeholder="e.g. 101"
                    type="number"
                    value={form.emp_id}
                    onChange={(e) => setField("emp_id", e.target.value)}
                    disabled={!!editing}
                    className={`h-9 bg-muted/20 text-sm transition-colors ${
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
                        Must be unique
                      </p>
                    )
                  )}
                </div>

                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <UserIcon className="w-3 h-3" />
                    Full Name *
                  </label>
                  <Input
                    placeholder="e.g. John Doe"
                    value={form.emp_name}
                    onChange={(e) => setField("emp_name", e.target.value)}
                    className={`h-9 bg-muted/20 text-sm transition-colors ${
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
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    placeholder="e.g. john@cafe.com"
                    autoComplete="off"
                    value={form.emp_mail}
                    onChange={(e) => setField("emp_mail", e.target.value)}
                    className={`h-9 bg-muted/20 text-sm transition-colors ${
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
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <KeyRound className="w-3 h-3" />
                    Password{" "}
                    {!editing && <span className="text-red-400">*</span>}
                    {editing && (
                      <span className="normal-case font-normal text-muted-foreground/60">
                        (optional)
                      </span>
                    )}
                  </label>
                  <Input
                    type="password"
                    placeholder={
                      editing ? "Leave blank to keep current" : "Enter strong password"
                    }
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => setField("password", e.target.value)}
                    className={`h-9 bg-muted/20 text-sm transition-colors ${
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
                    !editing && form.password && (
                      <p
                        className={`text-[10px] flex items-center gap-1 ${
                          passwordValidationComplete
                            ? "text-emerald-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            passwordValidationComplete
                              ? "bg-emerald-400"
                              : "bg-border/40"
                          }`}
                        />
                        {passwordValidationComplete
                          ? "Password criteria met"
                          : firstPasswordValidationMessage}
                      </p>
                    )
                  )}
                </div>

                {/* Role — dropdown */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Role *
                  </label>
                  <div className="relative z-10" ref={roleDropRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setRoleDropOpen((v) => !v);
                        setQuickFillOpen(false);
                      }}
                      className={`w-full h-9 flex items-center justify-between px-3 rounded-xl border text-sm font-medium transition-all ${
                        form.role === "admin"
                          ? "bg-orange-500/10 border-orange-500/40 text-orange-500"
                          : form.role === "superadmin"
                          ? "bg-purple-500/10 border-purple-500/40 text-purple-500"
                          : "bg-emerald-500/10 border-emerald-500/40 text-emerald-600"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {form.role === "admin" ? (
                          <>
                            <Shield className="w-4 h-4" />
                            <span>Admin</span>
                          </>
                        ) : form.role === "superadmin" ? (
                          <>
                            <KeyRound className="w-4 h-4" />
                            <span>Super Admin</span>
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
                            {
                              value: "superadmin",
                              label: "Super Admin",
                              icon: KeyRound,
                              desc: "Full system access & control",
                              active: "bg-purple-500/10",
                              dot: "bg-purple-400",
                              text: "text-purple-500",
                            },
                          ].map((r) => (
                            <button
                              key={r.value}
                              type="button"
                              onClick={() => {
                                setForm((f) => ({
                                  ...f,
                                  role: r.value as "user" | "admin" | "superadmin",
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
                                    : r.value === "superadmin"
                                    ? "bg-purple-500/15"
                                    : "bg-emerald-500/15"
                                }`}
                              >
                                <r.icon
                                  className={`w-4 h-4 ${
                                    r.value === "admin"
                                      ? "text-orange-400"
                                      : r.value === "superadmin"
                                      ? "text-purple-400"
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
                                      : r.value === "superadmin"
                                      ? "border-purple-400"
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
              <div className="flex justify-end mt-4 pt-3 border-t border-border/40 pb-1">
                <motion.button
                  type="submit"
                  disabled={submitting}
                  whileTap={!submitting ? { scale: 0.96 } : {}}
                  whileHover={!submitting ? { scale: 1.03, boxShadow: editing ? "0 6px 24px hsl(262 83% 58% / 0.45)" : "0 6px 24px hsl(24 95% 53% / 0.45)" } : {}}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="relative overflow-hidden flex items-center justify-center gap-2 h-9 px-6 rounded-xl text-sm font-semibold text-white shadow-lg min-w-[140px] disabled:cursor-not-allowed"
                  style={{
                    background: submitting
                      ? editing
                        ? "linear-gradient(135deg,hsl(262 83% 48%),hsl(291 64% 32%))"
                        : "linear-gradient(135deg,hsl(24 95% 43%),hsl(43 96% 42%))"
                      : editing
                        ? "linear-gradient(135deg,hsl(262 83% 58%),hsl(291 64% 42%))"
                        : "linear-gradient(135deg,hsl(24 95% 53%),hsl(43 96% 52%))",
                  }}
                >
                  {/* shimmer sweep while loading */}
                  {submitting && (
                    <motion.span
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      initial={{ x: "-100%" }}
                      animate={{ x: "100%" }}
                      transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
                    />
                  )}

                  <AnimatePresence mode="wait" initial={false}>
                    {submitting ? (
                      <motion.span
                        key="loading"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                        className="flex items-center gap-2"
                      >
                        {/* three bouncing dots */}
                        <span className="flex items-center gap-[3px]">
                          {[0, 1, 2].map((i) => (
                            <motion.span
                              key={i}
                              className="w-1.5 h-1.5 rounded-full bg-white"
                              animate={{ y: [0, -4, 0] }}
                              transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.15, ease: "easeInOut" }}
                            />
                          ))}
                        </span>
                        <span>{editing ? "Updating..." : "Creating..."}</span>
                      </motion.span>
                    ) : editing ? (
                      <motion.span
                        key="update"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                        className="flex items-center gap-2"
                      >
                        <Pencil className="w-4 h-4" />
                        Update User
                      </motion.span>
                    ) : (
                      <motion.span
                        key="create"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                        className="flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Create User
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
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
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            {["All", "Super Admin", "Admin", "User"].map((r) => (
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
          <motion.div
            whileHover={{ rotate: 180, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.3 }}
            onClick={fetchUsers}
            title="Refresh users"
            className="h-11 w-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-orange-500/15 to-orange-400/15 hover:from-orange-500/25 hover:to-orange-400/25 transition-all cursor-pointer border border-orange-500/30 hover:border-orange-500/50 shadow-sm hover:shadow-md"
          >
            <RefreshCw className="w-4 h-4 text-orange-400" />
          </motion.div>
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
                          : u.role === "superadmin"
                          ? "bg-purple-500/10 text-purple-400 border-purple-500/25"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                      }`}>
                        {u.role === "admin" ? (
                          <>
                            <Shield className="w-3 h-3" />
                            Admin
                          </>
                        ) : u.role === "superadmin" ? (
                          <>
                            <KeyRound className="w-3 h-3" />
                            Super Admin
                          </>
                        ) : (
                          <>
                            <UserIcon className="w-3 h-3" />
                            User
                          </>
                        )}
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
                          onClick={() => {
                            setDeleteTarget(u);
                            setDeleteDialogOpen(true);
                          }}
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 py-3.5 border-t border-border/50 bg-muted/10 gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-3 text-xs text-muted-foreground">
              <span>
                Showing {pageStart}–{pageEnd} of {filtered.length}
              </span>
              <span>Page {currentPage} of {totalPages}</span>
              <label className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Rows per page
                </span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="h-8 rounded-lg border border-border/50 bg-card px-2 text-xs text-foreground outline-none"
                >
                  {[5, 10, 20, 50].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
            </div>
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
      </div>
    </div>

    <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
      setDeleteDialogOpen(open);
      if (!open) setDeleteTarget(null);
    }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete user?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this user? This action is permanent and will revoke access immediately.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => setDeleteTarget(null)}
            className="min-w-[120px]"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={async () => {
              if (!deleteTarget) return;
              setDeletingUser(true);
              try {
                await ApiService.delete(`/auth/users/${deleteTarget.emp_id}`);
                deleteUser(deleteTarget.id);
                setApiUsers((prev) => prev.filter((user) => user.emp_id !== deleteTarget.emp_id));
                toast.success("User deleted successfully");
                setDeleteDialogOpen(false);
                setDeleteTarget(null);
              } catch (err: any) {
                toast.error(ApiService.handleAxiosError(err, "Failed to delete user"));
              } finally {
                setDeletingUser(false);
              }
            }}
            className="min-w-[120px]"
            disabled={deletingUser}
          >
            Delete user
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
