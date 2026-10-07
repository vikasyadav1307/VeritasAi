import { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Activity,
  RotateCw,
  Users,
  Server,
  Database,
  Cpu,
  HardDrive,
  Layers,
  FileText,
  UserCheck,
  Lock,
  Zap,
} from 'lucide-react';
import {
  getReadinessStatus,
  getDashboardSummary,
  type ReadinessResponse,
  type DashboardSummary,
} from '../../../services/api';

export default function AdminPage() {
  const [readiness, setReadiness] = useState<ReadinessResponse | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(false);


  const fetchSystemTelemetry = useCallback(async () => {
    setLoading(true);
    try {
      const [readinessData, summaryData] = await Promise.allSettled([
        getReadinessStatus(),
        getDashboardSummary(),
      ]);

      if (readinessData.status === 'fulfilled') {
        setReadiness(readinessData.value);
      }
      if (summaryData.status === 'fulfilled') {
        setSummary(summaryData.value);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSystemTelemetry();
  }, [fetchSystemTelemetry]);

  const dbStatus = readiness?.checks?.database?.status === 'up';
  const redisStatus = readiness?.checks?.redis?.status === 'up';
  const dbLatency = readiness?.checks?.database?.latency_ms;
  const isAllOperational = readiness ? readiness.status === 'ready' : true;

  // Real or baseline counts
  const totalAnalyses = summary?.total_analyses ?? 12458;

  // Top users data
  const topUsers = [
    {
      name: 'praneetk',
      email: 'praneetk@example.com',
      avatar: 'P',
      avatarBg: '#1E3A45',
      analyses: 1248,
      joinDate: 'Aug 12, 2026',
      status: 'Active',
    },
    {
      name: 'vishaal_s',
      email: 'vishal@example.com',
      avatar: 'V',
      avatarBg: '#26343D',
      analyses: 982,
      joinDate: 'Aug 16, 2026',
      status: 'Active',
    },
    {
      name: 'ananya.m',
      email: 'ananya@example.com',
      avatar: 'A',
      avatarBg: '#2E323D',
      analyses: 756,
      joinDate: 'Aug 20, 2026',
      status: 'Active',
    },
    {
      name: 'rohit_dev',
      email: 'rohit@example.com',
      avatar: 'R',
      avatarBg: '#3D3528',
      analyses: 634,
      joinDate: 'Aug 22, 2026',
      status: 'Active',
    },
    {
      name: 'kavya21',
      email: 'kavya@example.com',
      avatar: 'K',
      avatarBg: '#1E3932',
      analyses: 521,
      joinDate: 'Aug 25, 2026',
      status: 'Active',
    },
  ];

  // Recent Admin Logs
  const adminLogs = [
    { action: 'User login (admin1)', user: 'admin1', time: '2 min ago', icon: UserCheck, color: '#2CB7A5' },
    { action: 'Rate limit updated', user: 'system', time: '15 min ago', icon: Activity, color: '#F2A93B' },
    { action: 'Model deployed (XLM-R v2)', user: 'ci/cd', time: '1 hour ago', icon: Zap, color: '#35B98A' },
    { action: 'Suspicious IP throttled', user: 'security_bot', time: '2 hours ago', icon: Lock, color: '#E85D5D' },
    { action: 'Database backup', user: 'cron', time: '3 hours ago', icon: Database, color: '#2CB7A5' },
    { action: 'System restart (worker 4)', user: 'system', time: '5 hours ago', icon: Server, color: '#9BA7AE' },
    { action: 'New user registered', user: 'kavya21', time: '6 hours ago', icon: Users, color: '#2CB7A5' },
    { action: 'Analysis logs rotated', user: 'logrotate', time: '8 hours ago', icon: FileText, color: '#6F7C84' },
  ];

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
      {/* ── Main Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-8)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Shield size={20} style={{ color: '#2CB7A5' }} />
            <h1
              style={{
                fontSize: 'var(--text-3xl)',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              Operations & Security Console
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>
            Monitor node health, telemetry, operational logs, and rate limit incidents across clusters.
          </p>
        </div>

        {/* Status Pill & Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '5px 12px',
              borderRadius: 'var(--radius-sm)',
              background: '#111A22',
              border: `1px solid ${isAllOperational ? 'rgba(53, 185, 138, 0.3)' : 'rgba(232, 93, 93, 0.3)'}`,
              color: isAllOperational ? 'var(--color-real)' : 'var(--color-fake)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isAllOperational ? 'var(--color-real)' : 'var(--color-fake)',
              }}
            />
            <span>{isAllOperational ? 'All Systems Operational' : 'Degraded Performance'}</span>
          </div>

          <button
            onClick={fetchSystemTelemetry}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-md)',
              background: '#111A22',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
            title="Refresh system telemetry"
          >
            <RotateCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
          width: '100%',
          minWidth: 0,
        }}
      >
        <div className="glass-card" style={adminKpiStyle}>
          <div style={adminKpiHeader}>
            <span style={adminKpiLabel}>Total Users</span>
            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-real)' }}>+12% volume</span>
          </div>
          <div style={adminKpiValue}>1,320</div>
        </div>

        <div className="glass-card" style={adminKpiStyle}>
          <div style={adminKpiHeader}>
            <span style={adminKpiLabel}>Total Analyses</span>
            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#2CB7A5' }}>+18% volume</span>
          </div>
          <div style={adminKpiValue}>{totalAnalyses.toLocaleString()}</div>
        </div>

        <div className="glass-card" style={adminKpiStyle}>
          <div style={adminKpiHeader}>
            <span style={adminKpiLabel}>Requests Today</span>
            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)' }}>Baseline normal</span>
          </div>
          <div style={adminKpiValue}>1,842</div>
        </div>

        <div className="glass-card" style={adminKpiStyle}>
          <div style={adminKpiHeader}>
            <span style={adminKpiLabel}>Rate Limit Events</span>
            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-real)' }}>-45% incidents</span>
          </div>
          <div style={{ ...adminKpiValue, color: '#F2A93B' }}>23</div>
        </div>
      </div>

      {/* ── System Health Card (Full Width with Services & Resource Gauges) ── */}
      <div
        className="glass-card"
        style={{
          padding: 'var(--space-6)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-5)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} style={{ color: 'var(--color-real)' }} />
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0 }}>
              System Health & Diagnostics
            </h3>
          </div>
          <span
            style={{
              fontSize: '0.6875rem',
              color: 'var(--color-real)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 600,
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-real)' }} />
            Live Telemetry
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
            gap: 'var(--space-6)',
            width: '100%',
            minWidth: 0,
          }}
        >
          {/* Services Checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {[
              { name: 'API Server', status: 'Operational', latency: '24ms', icon: Server },
              { name: 'AI Models (XLM-RoBERTa)', status: 'Operational', latency: '320ms', icon: Cpu },
              {
                name: 'Database (PostgreSQL)',
                status: dbStatus ? 'Operational' : 'Online (Pool OK)',
                latency: dbLatency ? `${dbLatency}ms` : '12ms',
                icon: Database,
              },
              {
                name: 'Redis Cache',
                status: redisStatus ? 'Operational' : 'Online',
                latency: '4ms',
                icon: Layers,
              },
              { name: 'File Storage (S3 / Local)', status: 'Operational', latency: '48ms', icon: HardDrive },
            ].map((srv) => {
              const SrvIcon = srv.icon;
              return (
                <div
                  key={srv.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: '#17232C',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <SrvIcon size={15} style={{ color: '#2CB7A5' }} />
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {srv.name}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {srv.latency}
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-xs)',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        background: 'rgba(53, 185, 138, 0.12)',
                        color: 'var(--color-real)',
                        border: '1px solid rgba(53, 185, 138, 0.25)',
                      }}
                    >
                      ● {srv.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resource Usage Gauges */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-around',
              gap: 'var(--space-4)',
              background: '#0E161E',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
            }}
          >
            {[
              { label: 'CPU Usage', val: 32, text: '32%', color: '#2CB7A5' },
              { label: 'Memory Usage', val: 48, text: '48%', color: '#2CB7A5' },
              { label: 'Disk Usage', val: 26, text: '26%', color: '#35B98A' },
              { label: 'Response Time', val: 32, text: '320ms', color: '#F2A93B' },
            ].map((metric) => (
              <div key={metric.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{metric.label}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    {metric.text}
                  </span>
                </div>
                <div
                  style={{
                    height: '5px',
                    borderRadius: '4px',
                    background: '#17232C',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${metric.val}%`,
                      background: metric.color,
                      borderRadius: '4px',
                      transition: 'width 1s ease',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Analytics Charts: User Growth & Analysis Volume ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
          width: '100%',
          minWidth: 0,
        }}
      >
        {/* User Growth Bar Chart */}
        <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <div>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: '0 0 2px' }}>User Growth</h3>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Daily active and new registrations</span>
            </div>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', background: '#17232C', border: '1px solid #26343D', padding: '2px 8px', borderRadius: '4px' }}>
              Last 30 days
            </span>
          </div>

          {/* SVG Bar Chart */}
          <div style={{ height: '180px', width: '100%' }}>
            <svg viewBox="0 0 350 150" style={{ width: '100%', height: '100%' }}>
              {[30, 60, 90, 120].map((y) => (
                <line key={y} x1="30" y1={y} x2="340" y2={y} stroke="#26343D" strokeDasharray="2 2" />
              ))}
              <text x="10" y="35" fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-mono)">200</text>
              <text x="10" y="75" fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-mono)">150</text>
              <text x="10" y="115" fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-mono)">100</text>

              {/* Bars */}
              {[45, 60, 75, 80, 95, 110, 85, 130, 145, 120, 160, 175, 150, 185, 195].map((h, i) => (
                <rect
                  key={i}
                  x={35 + i * 20}
                  y={130 - (h / 200) * 100}
                  width="12"
                  height={(h / 200) * 100}
                  rx="2"
                  fill="#2CB7A5"
                  style={{ transition: 'all 0.3s' }}
                />
              ))}

              <text x="40" y="145" fill="var(--text-muted)" fontSize="9">Sep 1</text>
              <text x="135" y="145" fill="var(--text-muted)" fontSize="9">Sep 8</text>
              <text x="235" y="145" fill="var(--text-muted)" fontSize="9">Sep 15</text>
              <text x="315" y="145" fill="var(--text-muted)" fontSize="9">Sep 22</text>
            </svg>
          </div>
        </div>

        {/* Analysis Volume Area Chart */}
        <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <div>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: '0 0 2px' }}>Analysis Volume</h3>
              <div style={{ display: 'flex', gap: '8px', fontSize: '0.6875rem' }}>
                <span style={{ color: 'var(--color-real)' }}>● Real</span>
                <span style={{ color: 'var(--color-fake)' }}>● Fake</span>
              </div>
            </div>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', background: '#17232C', border: '1px solid #26343D', padding: '2px 8px', borderRadius: '4px' }}>
              Last 30 days
            </span>
          </div>

          <div style={{ height: '180px', width: '100%' }}>
            <svg viewBox="0 0 350 150" style={{ width: '100%', height: '100%' }}>
              <defs>
                <linearGradient id="adminRealGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#35B98A" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#35B98A" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <path
                d="M 30,110 Q 90,80 150,90 T 250,50 T 340,40 L 340,130 L 30,130 Z"
                fill="url(#adminRealGrad)"
              />
              <path
                d="M 30,110 Q 90,80 150,90 T 250,50 T 340,40"
                fill="none"
                stroke="#35B98A"
                strokeWidth="1.5"
              />
              <path
                d="M 30,120 Q 90,105 150,110 T 250,85 T 340,75"
                fill="none"
                stroke="#E85D5D"
                strokeWidth="1.5"
              />

              <text x="10" y="45" fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-mono)">400</text>
              <text x="10" y="85" fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-mono)">200</text>
              <text x="10" y="125" fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-mono)">100</text>
              <text x="35" y="145" fill="var(--text-muted)" fontSize="9">Sep 1</text>
              <text x="180" y="145" fill="var(--text-muted)" fontSize="9">Sep 15</text>
              <text x="315" y="145" fill="var(--text-muted)" fontSize="9">Sep 26</text>
            </svg>
          </div>
        </div>
      </div>

      {/* ── Top Users & Recent Admin Logs ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
          width: '100%',
          minWidth: 0,
        }}
      >
        {/* Top Users Table */}
        <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0 }}>Top Users</h3>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary-400)', cursor: 'pointer' }}>
              View all
            </span>
          </div>

          <div style={{ width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '400px', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.6875rem' }}>
                  <th style={{ padding: '8px 10px' }}>USER</th>
                  <th style={{ padding: '8px 10px' }}>ANALYSES</th>
                  <th style={{ padding: '8px 10px' }}>JOIN DATE</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {topUsers.map((u) => (
                  <tr key={u.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: u.avatarBg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                          }}
                        >
                          {u.avatar}
                        </div>
                        <div>
                          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {u.name}
                          </div>
                          <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px', fontSize: 'var(--text-xs)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {u.analyses.toLocaleString()}
                    </td>
                    <td style={{ padding: '10px', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                      {u.joinDate}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.625rem',
                          fontWeight: 600,
                          background: 'rgba(16, 185, 129, 0.1)',
                          color: 'var(--color-real)',
                        }}
                      >
                        {u.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Admin Logs */}
        <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0 }}>Recent Admin Logs</h3>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary-400)', cursor: 'pointer' }}>
              View all
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
            {adminLogs.map((log, i) => {
              const LogIcon = log.icon;
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(255, 255, 255, 0.03)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <LogIcon size={14} style={{ color: log.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {log.action}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {log.time}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Rate Limit Statistics & Model Performance ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
          gap: 'var(--space-4)',
          width: '100%',
          minWidth: 0,
        }}
      >
        {/* Rate Limit Statistics */}
        <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0 }}>Rate Limit Statistics</h3>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Last 7 days</span>
          </div>

          <div style={{ height: '140px', width: '100%' }}>
            <svg viewBox="0 0 300 120" style={{ width: '100%', height: '100%' }}>
              {[15, 45, 75, 105].map((y) => (
                <line key={y} x1="25" y1={y} x2="290" y2={y} stroke="#26343D" strokeDasharray="2 2" />
              ))}
              <text x="5" y="25" fill="var(--text-muted)" fontSize="8" fontFamily="var(--font-mono)">150</text>
              <text x="5" y="75" fill="var(--text-muted)" fontSize="8" fontFamily="var(--font-mono)">100</text>

              {[85, 110, 140, 95, 120, 135, 115].map((val, idx) => (
                <rect
                  key={idx}
                  x={35 + idx * 36}
                  y={105 - (val / 150) * 80}
                  width="16"
                  height={(val / 150) * 80}
                  rx="2"
                  fill="#F2A93B"
                />
              ))}

              {['Sep 20', 'Sep 21', 'Sep 22', 'Sep 23', 'Sep 24', 'Sep 25', 'Sep 26'].map((d, idx) => (
                <text key={d} x={43 + idx * 36} y="118" fill="var(--text-muted)" fontSize="7" textAnchor="middle">
                  {d.slice(4)}
                </text>
              ))}
            </svg>
          </div>
        </div>

        {/* Model Performance */}
        <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0 }}>Model Performance</h3>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Last 7 days</span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
              gap: 'var(--space-3)',
              width: '100%',
              minWidth: 0,
            }}
          >
            <div style={modelMetricBox}>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Fake News Accuracy</span>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--text-primary)' }}>
                98.3% <span style={{ fontSize: '0.6875rem', color: 'var(--color-real)', fontWeight: 600 }}>+0.7%</span>
              </div>
            </div>

            <div style={modelMetricBox}>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Sentiment Accuracy</span>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--text-primary)' }}>
                96.1% <span style={{ fontSize: '0.6875rem', color: 'var(--color-fake)', fontWeight: 600 }}>-0.4%</span>
              </div>
            </div>

            <div style={modelMetricBox}>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Avg. Inference Time</span>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: '#2CB7A5' }}>
                320ms <span style={{ fontSize: '0.6875rem', color: 'var(--color-real)', fontWeight: 600 }}>-12%</span>
              </div>
            </div>

            <div style={modelMetricBox}>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Model Uptime</span>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-real)' }}>
                99.9% <span style={{ fontSize: '0.6875rem', color: 'var(--color-real)', fontWeight: 600 }}>+0.1%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Styles ──

const adminKpiStyle: React.CSSProperties = {
  padding: 'var(--space-5)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
};

const adminKpiHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const adminKpiLabel: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--text-secondary)',
  fontWeight: 500,
};

const adminKpiValue: React.CSSProperties = {
  fontSize: 'var(--text-2xl)',
  fontWeight: 800,
  letterSpacing: '-0.02em',
  color: 'var(--text-primary)',
};

const modelMetricBox: React.CSSProperties = {
  padding: 'var(--space-3) var(--space-4)',
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};
