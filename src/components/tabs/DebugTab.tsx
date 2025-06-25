import React, { useState, useEffect } from 'react';
import { Bug, Filter, Trash2, Eye, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { ApiLog } from '../../types';
import { getApiLogs, clearApiLogs, subscribeToLogs } from '../../utils/apiLogger';
import { Modal } from '../Modal';

export const DebugTab: React.FC = () => {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<ApiLog | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);

  useEffect(() => {
    setLogs(getApiLogs());
    const unsubscribe = subscribeToLogs(setLogs);
    return unsubscribe;
  }, []);

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    if (filter === 'success') return log.status === 'success';
    if (filter === 'error') return log.status === 'error';
    return log.action === filter;
  });

  const handleViewLog = (log: ApiLog) => {
    setSelectedLog(log);
    setShowLogModal(true);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getUniqueActions = () => {
    const actions = Array.from(new Set(logs.map(log => log.action)));
    return actions;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center space-x-2">
            <Bug className="w-5 h-5" />
            <span>Debug Console</span>
          </h2>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-1 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Logs</option>
                <option value="success">Success Only</option>
                <option value="error">Errors Only</option>
                {getUniqueActions().map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>
            
            <button
              onClick={clearApiLogs}
              className="flex items-center space-x-2 px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        <div className="text-sm text-slate-600 mb-4">
          Total logs: {logs.length} | Showing: {filteredLogs.length}
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Bug className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No API logs yet</p>
              <p className="text-sm">Logs will appear here when you interact with Cognito</p>
            </div>
          ) : (
            filteredLogs.map(log => (
              <div
                key={log.id}
                className={`p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors ${
                  log.status === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
                onClick={() => handleViewLog(log)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {log.status === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    )}
                    <span className="font-medium text-slate-900">{log.action}</span>
                    <div className="flex items-center space-x-1 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimestamp(log.timestamp)}</span>
                    </div>
                  </div>
                  
                  <button className="flex items-center space-x-1 text-blue-600 hover:text-blue-700">
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </button>
                </div>
                
                {log.error && (
                  <div className="mt-2 text-sm text-red-700">
                    Error: {log.error}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <Modal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        title={`API Log: ${selectedLog?.action}`}
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-slate-700">Timestamp:</span>
                <p className="text-slate-900">{formatTimestamp(selectedLog.timestamp)}</p>
              </div>
              <div>
                <span className="font-medium text-slate-700">Status:</span>
                <p className={`font-medium ${
                  selectedLog.status === 'success' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {selectedLog.status.toUpperCase()}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-slate-700 mb-2">Request:</h4>
              <pre className="bg-slate-100 p-3 rounded-lg text-xs overflow-x-auto">
                {JSON.stringify(selectedLog.request, null, 2)}
              </pre>
            </div>

            <div>
              <h4 className="font-medium text-slate-700 mb-2">Response:</h4>
              <pre className="bg-slate-100 p-3 rounded-lg text-xs overflow-x-auto">
                {selectedLog.response 
                  ? JSON.stringify(selectedLog.response, null, 2)
                  : 'No response data'
                }
              </pre>
            </div>

            {selectedLog.error && (
              <div>
                <h4 className="font-medium text-red-700 mb-2">Error:</h4>
                <pre className="bg-red-50 p-3 rounded-lg text-xs text-red-800">
                  {selectedLog.error}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};