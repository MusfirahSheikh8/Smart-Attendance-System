"use client";

import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Users, CheckCircle, Clock, ShieldAlert, Activity } from "lucide-react";

export default function StatsCards() {
  const { stats } = useSelector((state: RootState) => state.attendance);

  // Animation helper
  const renderAnimatedValue = (value: number | string) => {
    return <span className="animate-countUp inline-block">{value}</span>;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex items-center justify-between transition-all hover:border-blue-500">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Students</p>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
            {renderAnimatedValue(stats.totalStudents)}
          </h2>
        </div>
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
          <Users size={24} />
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex items-center justify-between transition-all hover:border-green-500">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Present Today</p>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
            {renderAnimatedValue(stats.presentToday)}
          </h2>
        </div>
        <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl">
          <CheckCircle size={24} />
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex items-center justify-between transition-all hover:border-yellow-500">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Late Arrivals</p>
          <h2 className="text-2xl font-bold text-yellow-600 mt-1">
            {renderAnimatedValue(stats.lateArrivals)}
          </h2>
        </div>
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 rounded-xl">
          <Clock size={24} />
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex items-center justify-between transition-all hover:border-red-500">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Proxy Alerts</p>
          <h2 className="text-2xl font-bold text-red-600 mt-1">
            {renderAnimatedValue(stats.proxyAlerts)}
          </h2>
        </div>
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl">
          <ShieldAlert size={24} />
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex items-center justify-between transition-all hover:border-purple-500">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Avg Confidence</p>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
            {renderAnimatedValue(`${stats.avgConfidence}%`)}
          </h2>
        </div>
        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-xl">
          <Activity size={24} />
        </div>
      </div>
    </div>
  );
}
