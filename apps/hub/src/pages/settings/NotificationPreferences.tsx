import React, { useState } from 'react';
import { Bell, Mail, Smartphone, Globe } from 'lucide-react';

export default function NotificationPreferences() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [pushAlerts, setPushAlerts] = useState(true);

  return (
    <>
      <div className="flex h-full w-full relative bg-transparent overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-6 animate-fade-in pb-20">
          <div className="max-w-3xl mx-auto w-full space-y-6">
            
            <div className="flex flex-col gap-1 pb-4">
              <h1 className="text-3xl font-bold tracking-tight text-slate-600 dark:text-white">Notification Preferences</h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Control how and when you receive system alerts and updates.</p>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl flex flex-col overflow-hidden">
              <div className="px-6 py-5 border-b border-[#e0e3eb] dark:border-slate-700/50 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#131722] dark:text-white">Alert Delivery Methods</h3>
                </div>
              </div>
              <div className="flex flex-col divide-y divide-[#e0e3eb] dark:divide-slate-700/50">
                
                {/* Email Alerts */}
                <div className="px-6 py-5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5"><Mail className="w-4 h-4 text-slate-400" /></div>
                    <div>
                      <p className="text-base font-bold text-[#131722] dark:text-white">Email Alerts</p>
                      <p className="text-[14px] text-slate-500 leading-relaxed max-w-sm mt-0.5">Receive daily digests, weekly reports, and critical system alerts directly to your inbox.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" className="sr-only peer" checked={emailAlerts} onChange={() => setEmailAlerts(!emailAlerts)} />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {/* SMS Alerts */}
                <div className="px-6 py-5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5"><Smartphone className="w-4 h-4 text-slate-400" /></div>
                    <div>
                      <p className="text-base font-bold text-[#131722] dark:text-white">SMS Alerts</p>
                      <p className="text-[14px] text-slate-500 leading-relaxed max-w-sm mt-0.5">Get immediate text messages for urgent operational events, delayed dispatches, or anomalies.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" className="sr-only peer" checked={smsAlerts} onChange={() => setSmsAlerts(!smsAlerts)} />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {/* Push Notifications */}
                <div className="px-6 py-5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5"><Globe className="w-4 h-4 text-slate-400" /></div>
                    <div>
                      <p className="text-base font-bold text-[#131722] dark:text-white">In-App Notifications</p>
                      <p className="text-[14px] text-slate-500 leading-relaxed max-w-sm mt-0.5">Real-time alerts inside the dashboard for workflow approvals, transfer requests, and system updates.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" className="sr-only peer" checked={pushAlerts} onChange={() => setPushAlerts(!pushAlerts)} />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
