import React, { useState } from 'react';
import { 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Smartphone,
  Building2,
  FileText
} from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';

export default function AutomatedPayouts() {
  const { isDarkMode } = useThemeStore();
  const [selectedPayouts, setSelectedPayouts] = useState<number[]>([]);

  const payouts = [
    { id: 'PAY-8842', supplier: 'Kamau Logistics', amount: '45,200', type: 'M-PESA', time: '10 mins ago', status: 'Pending' },
    { id: 'PAY-8843', supplier: 'Jane Doe', amount: '2,450', type: 'M-PESA', time: '15 mins ago', status: 'Pending' },
    { id: 'PAY-8844', supplier: 'Pioneer Waste', amount: '124,000', type: 'Bank Transfer', time: '1 hour ago', status: 'Pending' },
    { id: 'PAY-8845', supplier: 'Eco-Klect', amount: '84,500', type: 'Bank Transfer', time: '2 hours ago', status: 'Processing' },
    { id: 'PAY-8846', supplier: 'GreenCity Recyclers', amount: '210,000', type: 'Bank Transfer', time: '3 hours ago', status: 'Completed' },
  ];

  const toggleSelect = (index: number) => {
    setSelectedPayouts(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const selectAll = () => {
    if (selectedPayouts.length === payouts.filter(p => p.status === 'Pending').length) {
      setSelectedPayouts([]);
    } else {
      setSelectedPayouts(payouts.map((p, i) => p.status === 'Pending' ? i : -1).filter(i => i !== -1));
    }
  };

  return (
    <div className="p-6 md:p-8 w-full max-w-[1600px] mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Automated Payouts</h1>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Review and authorize bulk supplier payments.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Left Column: Payout Queue */}
        <div className="lg:col-span-8 space-y-6">
           
           <div className={`rounded-3xl border overflow-hidden flex flex-col ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
              <div className={`p-4 border-b flex items-center justify-between ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
                 <h2 className={`font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                   <Clock className="font-medium w-5 h-5 text-amber-500" />
                   Pending Approvals
                 </h2>
                 {selectedPayouts.length > 0 && (
                   <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium text-xs rounded-full">
                     {selectedPayouts.length} Selected
                   </span>
                 )}
              </div>

              <div className="overflow-x-auto">
                <table className="font-medium w-full text-left text-sm">
                  <thead className={`text-xs uppercase tracking-wider font-medium ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                    <tr>
                      <th className="px-6 py-4">
                        <input 
                          type="checkbox" 
                          checked={selectedPayouts.length > 0 && selectedPayouts.length === payouts.filter(p => p.status === 'Pending').length}
                          onChange={selectAll}
                          className="font-medium rounded text-emerald-500 focus:ring-emerald-500 bg-transparent border-slate-300 dark:border-slate-600"
                        />
                      </th>
                      <th className="px-6 py-4">Payout ID</th>
                      <th className="px-6 py-4">Supplier</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Method</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {payouts.map((pay, i) => (
                      <tr key={i} className={`hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${selectedPayouts.includes(i) ? (isDarkMode ? 'bg-emerald-500/5' : 'bg-emerald-50') : ''}`}>
                        <td className="px-6 py-4">
                          {pay.status === 'Pending' && (
                            <input 
                              type="checkbox" 
                              checked={selectedPayouts.includes(i)}
                              onChange={() => toggleSelect(i)}
                              className="font-medium rounded text-emerald-500 focus:ring-emerald-500 bg-transparent border-slate-300 dark:border-slate-600"
                            />
                          )}
                        </td>
                        <td className="px-6 py-4 font-mono font-semibold text-slate-500">{pay.id}</td>
                        <td className={`px-6 py-4 font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{pay.supplier}</td>
                        <td className={`px-6 py-4 font-medium font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>KES {pay.amount}</td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                              {pay.type === 'M-PESA' ? <Smartphone className="font-medium w-4 h-4 text-emerald-500" /> : <Building2 className="font-medium w-4 h-4 text-indigo-500" />}
                              {pay.type}
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`px-2 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                             pay.status === 'Pending' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                             pay.status === 'Processing' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                             'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                           }`}>
                             {pay.status}
                           </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        </div>

        {/* Right Column: Execution Panel */}
        <div className="lg:col-span-4 space-y-6">
           <div className={`p-6 rounded-3xl border sticky top-24 ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
              <h3 className={`font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Bulk Execution</h3>
              
              <div className={`p-4 rounded-xl border mb-6 flex items-center justify-between ${isDarkMode ? 'bg-slate-800 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                 <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Selected Total</span>
                 <span className={`text-xl font-medium font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                   KES {selectedPayouts.length > 0 ? '171,650' : '0'}
                 </span>
              </div>

              <div className="space-y-3">
                 <button 
                   disabled={selectedPayouts.length === 0}
                   className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
                 >
                   <Send className="w-5 h-5" /> Authorize Payouts
                 </button>
                 <button 
                   disabled={selectedPayouts.length === 0}
                   className="w-full flex items-center justify-center gap-2 py-4 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium transition-colors border border-transparent dark:hover:border-white/5"
                 >
                   <AlertCircle className="w-5 h-5" /> Hold Selected
                 </button>
              </div>

              <div className="mt-8">
                 <h4 className={`text-xs font-medium uppercase tracking-wider mb-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Execution Rules</h4>
                 <ul className="font-medium space-y-3 text-xs">
                    <li className={`flex items-center gap-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                       <CheckCircle2 className="font-medium w-4 h-4 text-emerald-500" /> Amounts &lt; 50K processed instantly via M-PESA.
                    </li>
                    <li className={`flex items-center gap-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                       <CheckCircle2 className="font-medium w-4 h-4 text-emerald-500" /> Amounts &gt; 50K routed via RTGS.
                    </li>
                    <li className={`flex items-center gap-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                       <FileText className="w-4 h-4 text-indigo-500" /> Digital receipts sent to suppliers automatically.
                    </li>
                 </ul>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
