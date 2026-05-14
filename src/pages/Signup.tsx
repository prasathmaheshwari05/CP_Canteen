import { useState, useRef, MouseEvent, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, UserPlus, ArrowRight, CircleCheck as CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ApiService from '@/api/apiServices';

interface FieldProps {
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  suffix?: React.ReactNode;
  autoComplete?: string;
}

function Field({ label, type, placeholder, value, onChange, onBlur, error, suffix, autoComplete }: FieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-white uppercase tracking-wider">{label}</label>
      <div className={`relative rounded-lg border transition-all duration-200 ${
        error ? 'border-red-400 bg-red-500/10' : focused ? 'border-orange-400 bg-white/25' : 'border-white/30 bg-white/20'
      }`}>
        <input
          type={type}
          value={value}
          autoComplete={autoComplete}
          placeholder={focused ? '' : (error ? error : placeholder)}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); onBlur?.(); }}
          onChange={e => onChange(e.target.value)}
          className={`w-full bg-transparent text-white text-sm outline-none px-3 py-2.5 ${suffix ? 'pr-10' : ''} ${
            error && !focused ? 'placeholder:text-red-400 placeholder:font-medium' : 'placeholder:text-white/40'
          }`}
        />
        {suffix && <div className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</div>}
      </div>
    </div>
  );
}

export default function Signup() {
  const [form, setForm] = useState({ empId: '', name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();

  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientY - rect.top - rect.height / 2) / 25;
    const y = -(e.clientX - rect.left - rect.width / 2) / 25;
    setRotation({ x: Math.max(-8, Math.min(8, x)), y: Math.max(-8, Math.min(8, y)) });
  }, []);

  const handleMouseLeave = useCallback(() => setRotation({ x: 0, y: 0 }), []);

  const update = (key: string, val: string) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: '' }));
  };

  const passwordChecks = [
    { label: '8+ characters', ok: form.password.length >= 8 },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(form.password) },
    { label: 'Number', ok: /[0-9]/.test(form.password) },
    { label: 'Special character', ok: /[!@#$%^&*]/.test(form.password) },
  ];

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const errs: Record<string, string> = {};

    if (!form.empId.trim() || isNaN(Number(form.empId))) errs.empId = 'Valid Employee ID required';
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Valid email is required';
    if (!passwordChecks.every(c => c.ok)) errs.password = 'Password requirements not met';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setIsLoading(true);
    try {
      await ApiService.post('/auth/register', {
        emp_id: Number(form.empId),
        emp_name: form.name,
        emp_mail: form.email,
        password: form.password,
        role: 'user',
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch {
      setErrors({ api: 'Registration failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden p-4 pb-10">
      <div className="absolute inset-0 cafe-bg-slider" />
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md z-10 my-auto"
        style={{ perspective: '1200px' }}
      >
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl overflow-hidden transition-transform duration-200"
          style={{
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
            transformStyle: 'preserve-3d',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.3), 0 0 40px -10px rgba(255,255,255,0.1)',
          }}
        >
          <div className="absolute inset-0 rounded-2xl opacity-30 pointer-events-none"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1), transparent 50%, rgba(255,255,255,0.05))' }}
          />

          <div className="relative p-6 space-y-3">
            <div className="text-center space-y-2">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white drop-shadow-lg">Create Account</h1>
              <p className="text-sm text-white/90 font-medium">Join the Smart Cafeteria</p>
            </div>

            {success ? (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-4 py-8">
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5 }}>
                  <CheckCircle className="w-16 h-16 mx-auto text-emerald-400" />
                </motion.div>
                <p className="text-lg font-semibold text-white">Account Created!</p>
                <p className="text-sm text-white/90">Redirecting to login...</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSignup} className="space-y-2.5" noValidate>
                <Field label="Employee ID" type="text" placeholder="e.g. 101" value={form.empId} autoComplete="off" onChange={v => update('empId', v)} error={errors.empId} />
                <Field label="Full Name" type="text" placeholder="John Doe" value={form.name} autoComplete="name" onChange={v => update('name', v)} error={errors.name} />
                <Field label="Email" type="email" placeholder="you@company.com" value={form.email}
                  autoComplete="email"
                  onChange={v => update('email', v)}
                  onBlur={() => {
                    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                      setErrors(e => ({ ...e, email: 'Enter a valid email (e.g. you@company.com)' }));
                  }}
                  error={errors.email} />
                <Field
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  autoComplete="new-password"
                  onChange={v => update('password', v)}
                  error={errors.password}
                  suffix={
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-white/70 hover:text-white transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />

                <div className="grid grid-cols-2 gap-1">
                  {passwordChecks.map(c => (
                    <span key={c.label} className={`text-[10px] flex items-center gap-1 ${c.ok ? 'text-emerald-400' : 'text-white/60'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${c.ok ? 'bg-emerald-400' : 'bg-white/40'}`} />
                      {c.label}
                    </span>
                  ))}
                </div>

                <Field
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={form.confirmPassword}
                  autoComplete="new-password"
                  onChange={v => update('confirmPassword', v)}
                  onBlur={() => {
                    if (form.confirmPassword && form.password !== form.confirmPassword)
                      setErrors(e => ({ ...e, confirmPassword: 'Passwords do not match' }));
                  }}
                  error={errors.confirmPassword}
                  suffix={
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-white/70 hover:text-white transition-colors">
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
                {/* Match indicator */}
                {form.confirmPassword.length > 0 && (
                  <p className={`text-[11px] flex items-center gap-1.5 -mt-1 ${
                    form.password === form.confirmPassword ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full inline-block ${
                      form.password === form.confirmPassword ? 'bg-emerald-400' : 'bg-red-400'
                    }`} />
                    {form.password === form.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                  </p>
                )}

                {errors.api && (
                  <div className="bg-red-500 text-white text-sm font-medium rounded-lg px-4 py-2.5">
                    ⚠ {errors.api}
                  </div>
                )}

                <Button type="submit" disabled={isLoading}
                  className="w-full h-11 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-semibold group relative overflow-hidden hover:shadow-[0_0_30px_rgba(249,115,22,0.4)] transition-shadow">
                  {isLoading ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                  ) : (
                    <span className="flex items-center gap-2">Create Account <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
                  )}
                </Button>
              </form>
            )}

            <div className="text-center">
              <p className="text-sm text-white/90">
                Already have an account?{' '}
                <Link to="/login" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">Sign In</Link>
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <p className="relative z-10 mt-4 text-center text-xs text-white/75 tracking-wide select-none px-4" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
        © 2026 Changepond. All rights reserved.
      </p>
    </div>
  );
}
