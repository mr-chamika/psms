"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { StatCard } from "@/components/StatCard";
import Modal from "@/components/Modal";
import { PriorityBadge } from "@/components/priority-badge";
import { StatusBadge } from "@/components/status-badge";
import { Wand2, AlertCircle, X, Loader2 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import axios from "axios";
import { PAGE_CONTENT } from "@/lib/list-page-styles";

interface Job {
  id: string;
  orderId: string;
  itemId: string;
  title: string;
  client: string;
  totalPhotos: number;
  editedPhotos: number;
  priority: string;
  deadline: string;
  assignedTo: string;
  status: string;
  editorStatus?: string | null;
  photographerStatus?: string | null;
  editorAssignedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface WorkProgress {
  completed: number;
  inProgress: number;
  pending: number;
  overdue: number;
}

interface DashboardStats {
  pendingJobs: number;
  inProgressJobs: number;
  completedTodayJobs: number;
  urgentJobs: number;
  workProgress: WorkProgress;
}

export default function EditorDashboard() {
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showInProgressModal, setShowInProgressModal] = useState(false);
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [showDueModal, setShowDueModal] = useState(false);
  const [showUrgentOnly, setShowUrgentOnly] = useState(false);
  const [showUrgentAssignedOnly, setShowUrgentAssignedOnly] = useState(false);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  const [stats, setStats] = useState<DashboardStats>({
    pendingJobs: 0,
    inProgressJobs: 0,
    completedTodayJobs: 0,
    urgentJobs: 0,
    workProgress: { completed: 0, inProgress: 0, pending: 0, overdue: 0 },
  });

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const jobStatus = (job: Job) => job.editorStatus || job.status || "pending";

  const isDueToday = (deadline?: string) => {
    if (!deadline) return false;
    // Just compare literal YYYY-MM-DD
    const today = new Date();
    const tzOffset = today.getTimezoneOffset() * 60000; //offset in milliseconds
    const localISOTime = (new Date(Date.now() - tzOffset)).toISOString().slice(0, 10);
    return deadline.slice(0, 10) === localISOTime;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, queueRes] = await Promise.all([
          axios.get("/api/editorDashboard/stats"),
          axios.get("/api/editorDashboard/queue"),
        ]);

        setStats(statsRes.data);
        setJobs(queueRes.data.jobs || []);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set today's date on component mount
    const today = new Date().toISOString().split("T")[0];
    setDateRange({ from: today, to: today });
  }, []);

  // Filter jobs for modals
  const dueTodayJobs = jobs.filter((j) => isDueToday(j.deadline));
  const pendingJobsList = dueTodayJobs.filter((j) => (j.editorStatus || 'pending').toLowerCase() === "pending");
  const inProgressJobsList = dueTodayJobs.filter((j) => (j.editorStatus || 'pending').toLowerCase() === "in-progress" || (j.editorStatus || 'pending').toLowerCase().replace(/\s+/g, '-') === "in-progress");
  const completedJobsList = dueTodayJobs.filter((j) => (j.editorStatus || 'pending').toLowerCase() === "completed");
  const urgentJobsList = dueTodayJobs.filter((j) => (j.priority || '').toLowerCase() === "urgent");
  // Filter editing queue based on urgent checkbox (Limit to Pending or In Progress generally for the board)
  const activeJobs = jobs.filter(
    (j) => j.status === "Pending" || j.status === "In Progress"
  );

  const filteredQueue = activeJobs.filter((job) => {
    // 1. Urgent Filter
    if (showUrgentOnly && (job.priority || '').toLowerCase() !== "urgent") return false;
    if (showUrgentOnly && (job.priority || '').toLowerCase() !== "urgent") return false;

    // 2. Due Today Filter
    return isDueToday(job.deadline);
  });

  const assignedTodayQueue = jobs.filter((job) => {
    // 1. Urgent Filter
    if (showUrgentAssignedOnly && (job.priority || '').toLowerCase() !== "urgent") return false;

    // 2. Assigned Today Filter
    // Fallback to createdAt if editorAssignedAt is not available
    const assignedDate = job.editorAssignedAt || job.createdAt;
    if (!assignedDate) return false;
    return isDueToday(assignedDate);
  });

  // Calculate work progress based on filtered jobs
  const progressFilteredJobs = jobs.filter(job => {
    if (!job.deadline) return false;


    // Convert deadline to comparable date format (YYYY-MM-DD)
    // Assuming deadline is ISO string or YYYY-MM-DD
    const jobDate = job.deadline.split('T')[0];


    let inRange = true;
    if (dateRange.from) {
      inRange = inRange && jobDate >= dateRange.from;
    }
    if (dateRange.to) {
      inRange = inRange && jobDate <= dateRange.to;
    }
    return inRange;
  });

  const progressStats = {
    completed: progressFilteredJobs.filter(j => (j.editorStatus || 'pending').toLowerCase() === 'completed').length,
    inProgress: progressFilteredJobs.filter(j => {
      const p = (j.editorStatus || 'pending').toLowerCase();
      return p === 'in-progress' || p === 'in progress';
    }).length,
    pending: progressFilteredJobs.filter(j => (j.editorStatus || 'pending').toLowerCase() === 'pending').length,
    cancelled: progressFilteredJobs.filter(j => (j.editorStatus || 'pending').toLowerCase() === 'cancelled').length,
  };

  // Work progress data
  const workProgressData = [
    { name: "Completed", value: progressStats.completed, color: "#10b981" },
    { name: "In Progress", value: progressStats.inProgress, color: "#8b5cf6" },
    { name: "Pending", value: progressStats.pending, color: "#f59e0b" },
    { name: "Cancelled", value: progressStats.cancelled, color: "#ef4444" },
    { name: "Cancelled", value: progressStats.cancelled, color: "#ef4444" },
  ];

  const totalProgressJobs = workProgressData.reduce((sum, d) => sum + d.value, 0);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className={PAGE_CONTENT}>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          onClick={() => setShowPendingModal(true)}
          className="cursor-pointer hover:scale-105 transition-transform"
        >
          <StatCard
            title="Pending Jobs"
            value={stats.pendingJobs}
            icon="ClipboardList"
            color="warning"
            delay={0}
            subtitle={`${stats.urgentJobs} urgent`}
            subtitleClassName="text-gray-600"
          />
        </div>

        <div
          onClick={() => setShowInProgressModal(true)}
          className="cursor-pointer hover:scale-105 transition-transform"
        >
          <StatCard
            title="In Progress Jobs"
            value={stats.inProgressJobs}
            icon="Wand2"
            color="accent"
            delay={100}
            subtitle="Currently editing"
            subtitleClassName="text-gray-600"
          />
        </div>

        <div
          onClick={() => setShowCompletedModal(true)}
          className="cursor-pointer hover:scale-105 transition-transform"
        >
          <StatCard
            title="Completed Jobs"
            value={completedJobsList.length}
            icon="CheckCircle"
            color="success"
            delay={200}
            subtitle="Great job!"
            subtitleClassName="text-green-600"
          />
        </div>

        <div
          onClick={() => setShowDueModal(true)}
          className="cursor-pointer hover:scale-105 transition-transform"
        >
          <StatCard
            title="Urgent Jobs"
            value={stats.urgentJobs}
            icon="CalendarClock"
            color="info"
            delay={300}
            subtitle="Needs attention"
            subtitleClassName="text-red-600"
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Today's Due Jobs Card */}
        <div className="bg-white rounded-2xl shadow-2xs border border-gray-100 p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-purple-50 text-purple-700 rounded-xl p-2">
                <Wand2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Today&apos;s Due Jobs
                </h2>
                <p className="text-sm text-gray-600">{filteredQueue.length} jobs</p>
              </div>
            </div>
            {/* Urgent Filter Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors shrink-0">
              <input
                type="checkbox"
                checked={showUrgentOnly}
                onChange={(e) => setShowUrgentOnly(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500"
              />
              <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                Urgent
              </span>
              <AlertCircle className="h-4 w-4 text-red-600 sm:hidden" />
            </label>
          </div>

          {/* Queue Items */}
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {filteredQueue.map((job) => (
              <Link
                href={`/editor/item/${job.itemId}?orderId=${job.orderId}`}
                key={job.id}
                className="block border border-gray-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 font-mono">{job.itemId}</h3>
                    <p className="text-sm text-gray-600 font-mono">{job.orderId}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <PriorityBadge priority={job.priority} />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm mt-3 pt-3 border-t border-gray-100">
                  <StatusBadge status={jobStatus(job)} />
                  <span className="text-gray-500 text-xs">Due Today</span>
                </div>
              </Link>
            ))}
          </div>

          {filteredQueue.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>No jobs due today</p>
            </div>
          )}
        </div>

        {/* Today's Assigned Jobs Card */}
        <div className="bg-white rounded-2xl shadow-2xs border border-gray-100 p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 text-blue-700 rounded-xl p-2">
                <Wand2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Today's Assigned Jobs
                </h2>
                <p className="text-sm text-gray-600">{assignedTodayQueue.length} jobs</p>
              </div>
            </div>
            {/* Urgent Filter Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors shrink-0">
              <input
                type="checkbox"
                checked={showUrgentAssignedOnly}
                onChange={(e) => setShowUrgentAssignedOnly(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500"
              />
              <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                Urgent
              </span>
              <AlertCircle className="h-4 w-4 text-red-600 sm:hidden" />
            </label>
          </div>

          {/* Queue Items */}
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {assignedTodayQueue.map((job) => (
              <Link
                href={`/editor/item/${job.itemId}?orderId=${job.orderId}`}
                key={job.id}
                className="block border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 font-mono">{job.itemId}</h3>
                    <p className="text-sm text-gray-600 font-mono">{job.orderId}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <PriorityBadge priority={job.priority} />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm mt-3 pt-3 border-t border-gray-100">
                  <StatusBadge status={jobStatus(job)} />
                  <span className="text-gray-500 text-xs">Assigned Today</span>
                </div>
              </Link>
            ))}
          </div>

          {assignedTodayQueue.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>No jobs assigned today</p>
            </div>
          )}
        </div>

        {/* Work Progress Chart */}
        <div className="bg-white rounded-2xl shadow-2xs border border-gray-100 p-6 animate-slide-up">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Work Progress
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Overall task distribution
            </p>

            {/* Date Range Selection */}
            <div className="flex flex-col gap-3 mb-4 bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 w-full">
                <span className="text-sm font-medium text-gray-600 min-w-[3rem]">
                  From:
                </span>
                <input
                  type="date"
                  value={dateRange.from}
                  max={dateRange.to}
                  onChange={(e) =>
                    setDateRange((prev) => ({
                      ...prev,
                      from: e.target.value,
                      // If new 'from' date is after 'to' date, update 'to' date as well
                      to: e.target.value > prev.to ? e.target.value : prev.to
                    }))
                  }
                  className="flex-1 w-full px-3 py-2 text-sm font-medium bg-white border border-gray-200 rounded-md outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-200 text-purple-700 shadow-sm"
                />
              </div>
              <div className="flex items-center gap-2 w-full">
                <span className="text-sm font-medium text-gray-600 min-w-[3rem]">
                  To:
                </span>
                <input
                  type="date"
                  value={dateRange.to}
                  min={dateRange.from}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, to: e.target.value }))
                  }
                  className="flex-1 w-full px-3 py-2 text-sm font-medium bg-white border border-gray-200 rounded-md outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-200 text-purple-700 shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="h-72 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={workProgressData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  labelLine={false}
                  label={({ value, cx, cy, midAngle, innerRadius, outerRadius }) => {
                    if (value === 0 || midAngle == null || cx == null || cy == null || innerRadius == null || outerRadius == null) return null;
                    const RADIAN = Math.PI / 180;
                    const radius = innerRadius + (outerRadius - innerRadius) / 2;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    return (
                      <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600} fill="#ffffff">
                        {totalProgressJobs > 0 ? Math.round((value / totalProgressJobs) * 100) : 0}% ({value})
                      </text>
                    );
                  }}
                >
                  {workProgressData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0, 0%, 100%)',
                    border: '1px solid hsl(220, 13%, 91%)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)',
                  }}
                  formatter={(value: number | undefined) => [`${value} jobs`, '']}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Overlay total in donut center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-gray-900">{totalProgressJobs}</span>
              <span className="text-xs text-gray-500">Total</span>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            {workProgressData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-gray-600 truncate">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Jobs Modal */}
        <Modal show={showPendingModal} setShow={setShowPendingModal}>
          <div className="bg-white rounded-2xl flex flex-col max-h-[85vh] max-w-3xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-2xl font-bold text-gray-900">Pending Jobs</h2>
              <button
                onClick={() => setShowPendingModal(false)}
                className="text-gray-400 hover:text-gray-600 outline-none"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto min-h-0">
              <div className="space-y-4">
                {pendingJobsList.map((job) => (
                  <Link
                    href={`/editor/item/${job.itemId}?orderId=${job.orderId}`}
                    key={job.id}
                    className="block border border-gray-200 rounded-xl p-4 hover:border-purple-300 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 font-mono">{job.itemId}</h3>
                        <p className="text-sm text-gray-600 font-mono">{job.orderId}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <PriorityBadge priority={job.priority} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={jobStatus(job)} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs text-right">Due Date</span>
                        <span className="font-medium text-gray-900 text-right">
                          {job.deadline && job.deadline !== 'No Date' ? new Date(job.deadline).toLocaleDateString() : 'No Date'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
                {pendingJobsList.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No pending jobs.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Modal>

        {/* In Progress Modal */}
        <Modal show={showInProgressModal} setShow={setShowInProgressModal}>
          <div className="bg-white rounded-2xl flex flex-col max-h-[85vh] max-w-3xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-2xl font-bold text-gray-900">
                In Progress Jobs
              </h2>
              <button
                onClick={() => setShowInProgressModal(false)}
                className="text-gray-400 hover:text-gray-600 outline-none"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto min-h-0">
              <div className="space-y-4">
                {inProgressJobsList.map((job) => (
                  <Link
                    href={`/editor/item/${job.itemId}?orderId=${job.orderId}`}
                    key={job.id}
                    className="block border border-gray-200 rounded-xl p-4 hover:border-purple-300 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 font-mono">{job.itemId}</h3>
                        <p className="text-sm text-gray-600 font-mono">{job.orderId}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <PriorityBadge priority={job.priority} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={jobStatus(job)} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs text-right">Due Date</span>
                        <span className="font-medium text-gray-900 text-right">
                          {job.deadline && job.deadline !== 'No Date' ? new Date(job.deadline).toLocaleDateString() : 'No Date'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
                {inProgressJobsList.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No jobs currently in progress.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Modal>

        {/* Completed Modal */}
        <Modal show={showCompletedModal} setShow={setShowCompletedModal}>
          <div className="bg-white rounded-2xl flex flex-col max-h-[85vh] max-w-3xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-2xl font-bold text-gray-900">
                Completed Jobs
              </h2>
              <button
                onClick={() => setShowCompletedModal(false)}
                className="text-gray-400 hover:text-gray-600 outline-none"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto min-h-0">
              <div className="space-y-4">
                {completedJobsList.map((job) => (
                  <Link
                    href={`/editor/item/${job.itemId}?orderId=${job.orderId}`}
                    key={job.id}
                    className="block border border-gray-200 rounded-xl p-4 hover:border-purple-300 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 font-mono">{job.itemId}</h3>
                        <p className="text-sm text-gray-600 font-mono">{job.orderId}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <PriorityBadge priority={job.priority} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={jobStatus(job)} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs text-right">Due Date</span>
                        <span className="font-medium text-gray-900 text-right">
                          {job.deadline && job.deadline !== 'No Date' ? new Date(job.deadline).toLocaleDateString() : 'No Date'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}

                {completedJobsList.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No jobs completed yet today.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Modal>

        {/* Due This Week/Urgent Modal */}
        <Modal show={showDueModal} setShow={setShowDueModal}>
          <div className="bg-white rounded-2xl flex flex-col max-h-[85vh] max-w-3xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-2xl font-bold text-gray-900">
                Urgent Jobs
              </h2>
              <button
                onClick={() => setShowDueModal(false)}
                className="text-gray-400 hover:text-gray-600 outline-none"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto min-h-0">
              <div className="space-y-4">
                {urgentJobsList.map((job) => (
                  <Link
                    href={`/editor/item/${job.itemId}?orderId=${job.orderId}`}
                    key={job.id}
                    className="block border border-red-100 rounded-xl p-4 hover:border-red-300 transition-all bg-red-50/20 cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 font-mono">{job.itemId}</h3>
                        <p className="text-sm text-gray-600 font-mono">{job.orderId}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <PriorityBadge priority={job.priority} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm mt-3 pt-3 border-t border-red-100">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={jobStatus(job)} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-red-600 text-xs text-right">Due Date</span>
                        <span className="font-medium text-red-700 text-right">
                          {job.deadline && job.deadline !== 'No Date' ? new Date(job.deadline).toLocaleDateString() : 'No Date'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
                {urgentJobsList.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No urgent jobs due soon.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Modal>
      </div >
    </div >
  );
}
