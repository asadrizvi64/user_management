import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Download, 
  Eye, 
  Clock, 
  Zap, 
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  TrendingUp,
  ImageIcon
} from 'lucide-react';

const TrainingProgress = ({ productId, onStatusChange }) => {
  const [status, setStatus] = useState(null);
  const [logs, setLogs] = useState('');
  const [showLogs, setShowLogs] = useState(false);
  const [sampleImages, setSampleImages] = useState([]);
  const [selectedSample, setSelectedSample] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const wsRef = useRef(null);
  const logsEndRef = useRef(null);

  const statusColors = {
    'not_started': 'gray',
    'pending': 'yellow',
    'training': 'blue',
    'completed': 'green',
    'failed': 'red',
    'stopped': 'orange',
    'cancelled': 'gray'
  };

  const statusIcons = {
    'not_started': Clock,
    'pending': Clock,
    'training': RefreshCw,
    'completed': CheckCircle,
    'failed': XCircle,
    'stopped': Pause,
    'cancelled': Square
  };

  useEffect(() => {
    // Initial status fetch
    fetchStatus();

    // Setup WebSocket for real-time updates
    setupWebSocket();

    // Auto-refresh interval as fallback
    const interval = autoRefresh ? setInterval(fetchStatus, 5000) : null;

    return () => {
      if (interval) clearInterval(interval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [productId, autoRefresh]);

  useEffect(() => {
    // Scroll logs to bottom when new content is added
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const setupWebSocket = () => {
    try {
      const wsUrl = `ws://localhost:8000/ws/training/${productId}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected for training updates');
      };

      wsRef.current.onmessage = (event) => {
        const update = JSON.parse(event.data);
        
        if (update.type === 'status') {
          setStatus(prev => ({ ...prev, ...update.data }));
          if (onStatusChange) {
            onStatusChange(update.data);
          }
        } else if (update.type === 'progress') {
          setStatus(prev => ({ 
            ...prev, 
            progress: update.progress,
            current_epoch: update.current_epoch,
            current_step: update.current_step
          }));
        } else if (update.type === 'sample') {
          setSampleImages(prev => [update.image, ...prev]);
        } else if (update.type === 'log') {
          setLogs(prev => prev + update.message + '\n');
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        // Attempt to reconnect after 3 seconds if training is active
        if (status?.status === 'training') {
          setTimeout(setupWebSocket, 3000);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to setup WebSocket:', error);
    }
  };

  const fetchStatus = async () => {
    try {
      const response = await fetch(`/api/training/products/${productId}/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        setSampleImages(data.sample_images || []);
        
        if (onStatusChange) {
          onStatusChange(data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch training status:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch(`/api/training/products/${productId}/logs`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  };

  const stopTraining = async () => {
    try {
      const response = await fetch(`/api/training/products/${productId}/stop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        fetchStatus();
      } else {
        const error = await response.json();
        alert(`Failed to stop training: ${error.detail}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const downloadModel = async () => {
    try {
      const response = await fetch(`/api/training/products/${productId}/model/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${status?.config?.product_name || 'product'}_lora.safetensors`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const error = await response.json();
        alert(`Failed to download model: ${error.detail}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  if (!status) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-200 h-10 w-10"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  const StatusIcon = statusIcons[status.status] || Clock;
  const statusColor = statusColors[status.status] || 'gray';

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full bg-${statusColor}-100`}>
              <StatusIcon className={`w-6 h-6 text-${statusColor}-600 ${status.status === 'training' ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold capitalize">
                {status.status.replace('_', ' ')}
              </h3>
              <p className="text-gray-600">
                {status.status === 'training' && 'Training in progress...'}
                {status.status === 'completed' && 'Training completed successfully'}
                {status.status === 'failed' && 'Training failed'}
                {status.status === 'pending' && 'Waiting to start...'}
                {status.status === 'not_started' && 'Ready to train'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {status.status === 'training' && (
              <button
                onClick={stopTraining}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
              >
                <Square className="w-4 h-4" />
                <span>Stop</span>
              </button>
            )}
            
            {status.status === 'completed' && (
              <button
                onClick={downloadModel}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Model</span>
              </button>
            )}
            
            <button
              onClick={fetchStatus}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {(status.status === 'training' || status.status === 'completed') && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{status.progress || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  status.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${status.progress || 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Training Details */}
        {status.config && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Trigger Word</span>
              <p className="font-medium">{status.config.trigger_word}</p>
            </div>
            <div>
              <span className="text-gray-500">Base Model</span>
              <p className="font-medium">{status.config.base_model}</p>
            </div>
            <div>
              <span className="text-gray-500">Epochs</span>
              <p className="font-medium">
                {status.current_epoch || 0} / {status.config.max_epochs}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Started</span>
              <p className="font-medium">{formatTime(status.started_at)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Sample Images */}
      {sampleImages.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <ImageIcon className="w-5 h-5" />
              <span>Sample Images</span>
            </h3>
            <span className="text-sm text-gray-500">
              {sampleImages.length} samples generated
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {sampleImages.map((image, index) => (
              <div
                key={index}
                className="relative group cursor-pointer"
                onClick={() => setSelectedSample(image)}
              >
                <img
                  src={image}
                  alt={`Sample ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border hover:border-blue-500 transition-colors"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-opacity flex items-center justify-center">
                  <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Training Logs */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Training Logs</h3>
            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span>Auto-refresh</span>
              </label>
              <button
                onClick={() => {
                  setShowLogs(!showLogs);
                  if (!showLogs && !logs) {
                    fetchLogs();
                  }
                }}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                {showLogs ? 'Hide' : 'Show'} Logs
              </button>
            </div>
          </div>
        </div>
        
        {showLogs && (
          <div className="p-4">
            <div className="bg-gray-900 text-green-400 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
              {logs ? (
                <pre className="whitespace-pre-wrap">{logs}</pre>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
                    <p>Loading logs...</p>
                  </div>
                </div>
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* Sample Image Modal */}
      {selectedSample && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedSample(null)}
        >
          <div className="max-w-4xl max-h-full">
            <img
              src={selectedSample}
              alt="Sample image"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingProgress;