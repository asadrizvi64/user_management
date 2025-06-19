import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  Eye,
  MoreVertical,
  Settings,
  AlertTriangle,
  Zap,
  TrendingUp,
  Upload,
  Search,
  Filter,
  Calendar,
  User,
  Globe,
  Lock,
  Activity,
  BarChart3,
  FileText,
  Image,
  Cpu,
  HardDrive,
  X
} from 'lucide-react';

import TrainingConfigModal from './TrainingConfigModal';
import TrainingProgress from './TrainingProgress';

const ProductDashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchStats();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchProducts();
      fetchStats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/training/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleTrainingStart = (result) => {
    // Refresh products after training starts
    fetchProducts();
    setShowTrainingModal(false);
  };

  const handleStatusChange = (productId, status) => {
    setProducts(prev => prev.map(product => 
      product.id === productId ? { ...product, ...status } : product
    ));
  };

  const deleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product? This will also cancel any ongoing training.')) return;
    
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        fetchProducts();
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const stopTraining = async (productId) => {
    if (!confirm('Are you sure you want to stop the training? Progress will be lost.')) return;
    
    try {
      const response = await fetch(`/api/training/products/${productId}/stop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        fetchProducts();
      }
    } catch (error) {
      console.error('Failed to stop training:', error);
    }
  };

  const retrain = (product) => {
    setSelectedProduct(product);
    setShowTrainingModal(true);
  };

  const viewProgress = (product) => {
    setSelectedProduct(product);
    setShowProgressModal(true);
  };

  const downloadModel = async (productId, productName) => {
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
        a.download = `${productName}_lora.safetensors`;
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

  const getStatusColor = (status) => {
    const colors = {
      'not_started': 'gray',
      'pending': 'yellow',
      'training': 'blue',
      'completed': 'green',
      'failed': 'red',
      'stopped': 'orange',
      'cancelled': 'gray'
    };
    return colors[status] || 'gray';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'not_started': Clock,
      'pending': Clock,
      'training': RefreshCw,
      'completed': CheckCircle,
      'failed': XCircle,
      'stopped': Pause,
      'cancelled': XCircle
    };
    const Icon = icons[status] || Clock;
    return <Icon className={`w-4 h-4 ${status === 'training' ? 'animate-spin' : ''}`} />;
  };

  const getFilteredAndSortedProducts = () => {
    let filtered = products.filter(product => {
      // Filter by status
      if (filter === 'trained' && product.training_status !== 'completed') return false;
      if (filter === 'training' && product.training_status !== 'training') return false;
      if (filter === 'untrained' && product.training_status && product.training_status !== 'not_started') return false;
      if (filter === 'failed' && product.training_status !== 'failed') return false;
      
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          product.name.toLowerCase().includes(searchLower) ||
          (product.training_config?.trigger_word || '').toLowerCase().includes(searchLower) ||
          (product.description || '').toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });

    // Sort products
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'status':
          aValue = a.training_status || 'not_started';
          bValue = b.training_status || 'not_started';
          break;
        case 'progress':
          aValue = a.training_progress || 0;
          bValue = b.training_progress || 0;
          break;
        case 'created_at':
        default:
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  const filteredProducts = getFilteredAndSortedProducts();

  const getStats = () => {
    const total = products.length;
    const trained = products.filter(p => p.training_status === 'completed').length;
    const training = products.filter(p => p.training_status === 'training').length;
    const failed = products.filter(p => p.training_status === 'failed').length;
    const untrained = products.filter(p => !p.training_status || p.training_status === 'not_started').length;
    
    return { total, trained, training, failed, untrained };
  };

  const statsData = getStats();

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8">
        <div className="mb-4 lg:mb-0">
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">Manage your product models and AI training</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Product</span>
          </button>
          
          <button
            onClick={fetchProducts}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{statsData.total}</p>
              <p className="text-sm text-gray-600">Total Products</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-600">{statsData.trained}</p>
              <p className="text-sm text-gray-600">Trained</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-600 animate-pulse" />
            <div>
              <p className="text-2xl font-bold text-blue-600">{statsData.training}</p>
              <p className="text-sm text-gray-600">Training</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-2xl font-bold text-red-600">{statsData.failed}</p>
              <p className="text-sm text-gray-600">Failed</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-2xl font-bold text-gray-600">{statsData.untrained}</p>
              <p className="text-sm text-gray-600">Untrained</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                />
              </div>
              
              {/* Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Products</option>
                  <option value="trained">Trained</option>
                  <option value="training">Training</option>
                  <option value="untrained">Untrained</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Sort */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="created_at">Date Created</option>
                  <option value="name">Name</option>
                  <option value="status">Status</option>
                  <option value="progress">Progress</option>
                </select>
                
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                  title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                >
                  <TrendingUp className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                </button>
              </div>
              
              {/* View Mode */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1 rounded ${viewMode === 'grid' ? 'bg-white shadow' : ''}`}
                >
                  <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                  </div>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1 rounded ${viewMode === 'list' ? 'bg-white shadow' : ''}`}
                >
                  <div className="w-4 h-4 flex flex-col space-y-0.5">
                    <div className="h-1 bg-current rounded-sm"></div>
                    <div className="h-1 bg-current rounded-sm"></div>
                    <div className="h-1 bg-current rounded-sm"></div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Filters */}
        <div className="p-4">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All', count: statsData.total },
              { key: 'trained', label: 'Trained', count: statsData.trained },
              { key: 'training', label: 'Training', count: statsData.training },
              { key: 'untrained', label: 'Untrained', count: statsData.untrained },
              { key: 'failed', label: 'Failed', count: statsData.failed }
            ].map(filterItem => (
              <button
                key={filterItem.key}
                onClick={() => setFilter(filterItem.key)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === filterItem.key
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filterItem.label} ({filterItem.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid/List */}
      {filteredProducts.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => {
              const statusColor = getStatusColor(product.training_status || 'not_started');
              
              return (
                <div key={product.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                  {/* Product Header */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                          {product.name}
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>Created {new Date(product.created_at).toLocaleDateString()}</span>
                        </div>
                        {product.description && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {product.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-${statusColor}-100 text-${statusColor}-800`}>
                          {getStatusIcon(product.training_status || 'not_started')}
                          <span className="capitalize">
                            {(product.training_status || 'not_started').replace('_', ' ')}
                          </span>
                        </div>
                        
                        <div className="relative group">
                          <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          {/* Dropdown Menu */}
                          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <div className="py-1">
                              <button
                                onClick={() => viewProgress(product)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                              >
                                <Eye className="w-4 h-4" />
                                <span>View Details</span>
                              </button>
                              
                              <button
                                onClick={() => retrain(product)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                              >
                                <Settings className="w-4 h-4" />
                                <span>Edit Settings</span>
                              </button>
                              
                              {product.training_status === 'training' && (
                                <button
                                  onClick={() => stopTraining(product.id)}
                                  className="w-full px-4 py-2 text-left text-sm text-orange-600 hover:bg-orange-50 flex items-center space-x-2"
                                >
                                  <Pause className="w-4 h-4" />
                                  <span>Stop Training</span>
                                </button>
                              )}
                              
                              <hr className="my-1" />
                              
                              <button
                                onClick={() => deleteProduct(product.id)}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Training Progress */}
                    {product.training_status === 'training' && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Training Progress</span>
                          <span>{product.training_progress || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                            style={{ width: `${product.training_progress || 0}%` }}
                          />
                        </div>
                        {product.training_config && (
                          <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                            <span>Epoch {product.current_epoch || 0}/{product.training_config.max_epochs || 16}</span>
                            <span>ETA: {product.estimated_completion ? new Date(product.estimated_completion).toLocaleTimeString() : 'Calculating...'}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Training Info */}
                    {product.training_config && (
                      <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 mb-4">
                        <div>
                          <span className="font-medium">Trigger:</span>
                          <p className="text-gray-800 truncate">{product.training_config.trigger_word}</p>
                        </div>
                        <div>
                          <span className="font-medium">Model:</span>
                          <p className="text-gray-800 truncate">{product.training_config.base_model}</p>
                        </div>
                        <div>
                          <span className="font-medium">VRAM:</span>
                          <p className="text-gray-800">{product.training_config.vram}</p>
                        </div>
                        <div>
                          <span className="font-medium">Rank:</span>
                          <p className="text-gray-800">{product.training_config.network_dim}</p>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                      {!product.training_status || product.training_status === 'not_started' ? (
                        <button
                          onClick={() => retrain(product)}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2 text-sm transition-colors"
                        >
                          <Play className="w-4 h-4" />
                          <span>Start Training</span>
                        </button>
                      ) : product.training_status === 'training' ? (
                        <button
                          onClick={() => viewProgress(product)}
                          className="flex-1 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center justify-center space-x-2 text-sm transition-colors"
                        >
                          <TrendingUp className="w-4 h-4" />
                          <span>View Progress</span>
                        </button>
                      ) : product.training_status === 'completed' ? (
                        <button
                          onClick={() => downloadModel(product.id, product.name)}
                          className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2 text-sm transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </button>
                      ) : product.training_status === 'failed' ? (
                        <button
                          onClick={() => retrain(product)}
                          className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center space-x-2 text-sm transition-colors"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>Retry Training</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => viewProgress(product)}
                          className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center space-x-2 text-sm transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Status</span>
                        </button>
                      )}
                      
                      <button
                        onClick={() => viewProgress(product)}
                        className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center transition-colors"
                        title="View Details"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Training Timeline (for completed products) */}
                  {product.training_status === 'completed' && product.training_started_at && (
                    <div className="px-6 pb-4 border-t bg-gray-50">
                      <div className="flex items-center justify-between text-xs text-gray-600 pt-3">
                        <div className="flex items-center space-x-4">
                          <div>
                            <span className="font-medium">Started:</span> {new Date(product.training_started_at).toLocaleDateString()}
                          </div>
                          {product.training_completed_at && (
                            <div>
                              <span className="font-medium">Duration:</span> {
                                Math.round((new Date(product.training_completed_at) - new Date(product.training_started_at)) / (1000 * 60))
                              }m
                            </div>
                          )}
                        </div>
                        {product.model_path && (
                          <div className="flex items-center space-x-1 text-green-600">
                            <CheckCircle className="w-3 h-3" />
                            <span>Model Ready</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Error Message (for failed products) */}
                  {product.training_status === 'failed' && (
                    <div className="px-6 pb-4 border-t bg-red-50">
                      <div className="flex items-center space-x-2 pt-3">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span className="text-xs text-red-700">Training failed. Check logs for details.</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Configuration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map(product => {
                    const statusColor = getStatusColor(product.training_status || 'not_started');
                    
                    return (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <span className="text-white font-medium text-sm">
                                  {product.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{product.name}</div>
                              {product.description && (
                                <div className="text-sm text-gray-500 truncate max-w-xs">{product.description}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-${statusColor}-100 text-${statusColor}-800`}>
                            {getStatusIcon(product.training_status || 'not_started')}
                            <span className="capitalize">
                              {(product.training_status || 'not_started').replace('_', ' ')}
                            </span>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          {product.training_status === 'training' ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${product.training_progress || 0}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-900">{product.training_progress || 0}%</span>
                            </div>
                          ) : product.training_status === 'completed' ? (
                            <div className="flex items-center space-x-1 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-sm">Complete</span>
                            </div>
                          ) : product.training_status === 'failed' ? (
                            <div className="flex items-center space-x-1 text-red-600">
                              <XCircle className="w-4 h-4" />
                              <span className="text-sm">Failed</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">Not started</span>
                          )}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.training_config ? (
                            <div className="space-y-1">
                              <div><span className="font-medium">Trigger:</span> {product.training_config.trigger_word}</div>
                              <div><span className="font-medium">Model:</span> {product.training_config.base_model}</div>
                              <div><span className="font-medium">VRAM:</span> {product.training_config.vram}</div>
                            </div>
                          ) : (
                            <span className="text-gray-500">Not configured</span>
                          )}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>{new Date(product.created_at).toLocaleDateString()}</div>
                          <div>{new Date(product.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            {!product.training_status || product.training_status === 'not_started' ? (
                              <button
                                onClick={() => retrain(product)}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center space-x-1"
                              >
                                <Play className="w-3 h-3" />
                                <span>Train</span>
                              </button>
                            ) : product.training_status === 'training' ? (
                              <>
                                <button
                                  onClick={() => viewProgress(product)}
                                  className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 flex items-center space-x-1"
                                >
                                  <TrendingUp className="w-3 h-3" />
                                  <span>Progress</span>
                                </button>
                                <button
                                  onClick={() => stopTraining(product.id)}
                                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                  title="Stop Training"
                                >
                                  <Pause className="w-3 h-3" />
                                </button>
                              </>
                            ) : product.training_status === 'completed' ? (
                              <button
                                onClick={() => downloadModel(product.id, product.name)}
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center space-x-1"
                              >
                                <Download className="w-3 h-3" />
                                <span>Download</span>
                              </button>
                            ) : product.training_status === 'failed' ? (
                              <button
                                onClick={() => retrain(product)}
                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 flex items-center space-x-1"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>Retry</span>
                              </button>
                            ) : null}
                            
                            <button
                              onClick={() => viewProgress(product)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => deleteProduct(product.id)}
                              className="p-1 text-red-400 hover:text-red-600"
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Empty State */
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="mb-4">
              {filter === 'all' ? (
                <Zap className="w-16 h-16 text-gray-400 mx-auto" />
              ) : (
                <Search className="w-16 h-16 text-gray-400 mx-auto" />
              )}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'all' 
                ? 'No products yet' 
                : searchTerm 
                  ? `No products found for "${searchTerm}"`
                  : `No ${filter} products`
              }
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? 'Get started by creating your first product and training a custom model.'
                : searchTerm
                  ? 'Try adjusting your search terms or filters.'
                  : `No products match the ${filter} filter. Try a different filter or create a new product.`
              }
            </p>
            {(filter === 'all' || !searchTerm) && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                <span>Create First Product</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">Create New Product</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Choose how you'd like to create your new product:
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedProduct(null);
                    setShowTrainingModal(true);
                  }}
                  className="w-full p-4 border-2 border-blue-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <Zap className="w-6 h-6 text-blue-600" />
                    <div>
                      <div className="font-medium text-gray-900">Start with AI Training</div>
                      <div className="text-sm text-gray-600">Upload images and train a custom model</div>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    // Redirect to basic product creation form
                    window.location.href = '/products/create';
                  }}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <Plus className="w-6 h-6 text-gray-600" />
                    <div>
                      <div className="font-medium text-gray-900">Create Basic Product</div>
                      <div className="text-sm text-gray-600">Set up product details first, train later</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Training Configuration Modal */}
      {showTrainingModal && (
        <TrainingConfigModal
          isOpen={showTrainingModal}
          onClose={() => {
            setShowTrainingModal(false);
            setSelectedProduct(null);
          }}
          productId={selectedProduct?.id}
          productName={selectedProduct?.name}
          onTrainingStart={handleTrainingStart}
        />
      )}

      {/* Training Progress Modal */}
      {showProgressModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-semibold">{selectedProduct.name}</h2>
                <p className="text-gray-600">Training Progress & Details</p>
              </div>
              <button
                onClick={() => {
                  setShowProgressModal(false);
                  setSelectedProduct(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <TrainingProgress
                productId={selectedProduct.id}
                onStatusChange={(status) => handleStatusChange(selectedProduct.id, status)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDashboard;