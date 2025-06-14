import React, { useState, useEffect } from 'react';
import PageMeta from '../../components/common/PageMeta';
import { emiService } from '../../services/api';
import { toast } from 'react-hot-toast';

interface EMIPlan {
  id: number;
  name: string;
  description?: string;
  emi_type: 'normal' | 'cardless';
  duration_months: number;
  interest_rate: number;
  min_price: number;
  max_price?: number;
  down_payment_percentage: number;
  processing_fee_percentage: number;
  processing_fee_fixed: number;
  is_active: boolean;
}

const EMIPlans: React.FC = () => {
  const [emiPlans, setEmiPlans] = useState<EMIPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [newPlan, setNewPlan] = useState<Omit<EMIPlan, 'id'>>({
    name: '',
    description: '',
    emi_type: 'normal',
    duration_months: 12,
    interest_rate: 0,
    min_price: 0,
    max_price: 0,
    down_payment_percentage: 0,
    processing_fee_percentage: 0,
    processing_fee_fixed: 0,
    is_active: true
  });
  
  // Edit state
  const [editMode, setEditMode] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState<number | null>(null);

  useEffect(() => {
    fetchEMIPlans();
  }, []);

  const fetchEMIPlans = async () => {
    try {
      setIsLoading(true);
      const data = await emiService.getPlans();
      
      // Ensure we're working with an array
      const plansArray = Array.isArray(data) 
        ? data 
        : data.results && Array.isArray(data.results) 
          ? data.results 
          : [];
          
      setEmiPlans(plansArray);
      console.log('EMI Plans data:', plansArray);
      setError(null);
    } catch (err) {
      setError('Failed to load EMI plans');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    // Handle different input types
    if (type === 'number') {
      setNewPlan(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else if (type === 'checkbox') {
      setNewPlan(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else if (name === 'is_active' && type === 'select-one') {
      setNewPlan(prev => ({
        ...prev,
        [name]: value === 'active'
      }));
    } else {
      setNewPlan(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editMode && currentPlanId) {
        await emiService.updatePlan(currentPlanId, newPlan);
        toast.success('EMI plan updated successfully');
      } else {
        await emiService.createPlan(newPlan);
        toast.success('EMI plan created successfully');
      }
      
      // Reset form and fetch updated plans
      resetForm();
      fetchEMIPlans();
    } catch (err) {
      toast.error(editMode ? 'Failed to update EMI plan' : 'Failed to create EMI plan');
      console.error(err);
    }
  };

  const resetForm = () => {
    setNewPlan({
      name: '',
      description: '',
      emi_type: 'normal',
      duration_months: 12,
      interest_rate: 0,
      min_price: 0,
      max_price: 0,
      down_payment_percentage: 0,
      processing_fee_percentage: 0,
      processing_fee_fixed: 0,
      is_active: true
    });
    setEditMode(false);
    setCurrentPlanId(null);
  };

  const handleEdit = (plan: EMIPlan) => {
    setNewPlan({
      name: plan.name,
      description: plan.description || '',
      emi_type: plan.emi_type,
      duration_months: plan.duration_months,
      interest_rate: plan.interest_rate,
      min_price: plan.min_price,
      max_price: plan.max_price || 0,
      down_payment_percentage: plan.down_payment_percentage,
      processing_fee_percentage: plan.processing_fee_percentage,
      processing_fee_fixed: plan.processing_fee_fixed,
      is_active: plan.is_active
    });
    setEditMode(true);
    setCurrentPlanId(plan.id);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this EMI plan?')) {
      try {
        await emiService.deletePlan(id);
        setEmiPlans(emiPlans.filter(plan => plan.id !== id));
        toast.success('EMI plan deleted successfully');
      } catch (err) {
        toast.error('Failed to delete EMI plan');
        console.error(err);
      }
    }
  };

  // Filter plans based on search query
  const filteredPlans = emiPlans.filter(plan =>
    plan.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <PageMeta
        title="EMI Plans - Phone Bay Admin"
        description="Manage EMI plans of Phone Bay e-commerce platform"
      />
      
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          EMI Plans Management
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Configure and manage installment payment plans
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
              {editMode ? 'Edit EMI Plan' : 'Add New EMI Plan'}
            </h3>
            
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Plan Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={newPlan.name}
                  onChange={handleFormChange}
                  placeholder="e.g. 6 Months Plan"
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={newPlan.description}
                  onChange={handleFormChange}
                  placeholder="Short description of this EMI plan"
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  EMI Type *
                </label>
                <select
                  name="emi_type"
                  value={newPlan.emi_type}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  required
                >
                  <option value="normal">Normal EMI</option>
                  <option value="cardless">Cardless EMI</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Duration (months) *
                </label>
                <input
                  type="number"
                  name="duration_months"
                  value={newPlan.duration_months}
                  onChange={handleFormChange}
                  min="1"
                  max="60"
                  placeholder="e.g. 12"
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Interest Rate (%) *
                </label>
                <input
                  type="number"
                  name="interest_rate"
                  value={newPlan.interest_rate}
                  onChange={handleFormChange}
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="e.g. 5.5"
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Min Price ($) *
                  </label>
                  <input
                    type="number"
                    name="min_price"
                    value={newPlan.min_price}
                    onChange={handleFormChange}
                    min="0"
                    step="0.01"
                    placeholder="e.g. 10000"
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Price ($)
                  </label>
                  <input
                    type="number"
                    name="max_price"
                    value={newPlan.max_price}
                    onChange={handleFormChange}
                    min="0"
                    step="0.01"
                    placeholder="e.g. 100000"
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Down Payment (%) *
                </label>
                <input
                  type="number"
                  name="down_payment_percentage"
                  value={newPlan.down_payment_percentage}
                  onChange={handleFormChange}
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="e.g. 10"
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Processing Fee (%) *
                  </label>
                  <input
                    type="number"
                    name="processing_fee_percentage"
                    value={newPlan.processing_fee_percentage}
                    onChange={handleFormChange}
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="e.g. 2"
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fixed Processing Fee ($) *
                  </label>
                  <input
                    type="number"
                    name="processing_fee_fixed"
                    value={newPlan.processing_fee_fixed}
                    onChange={handleFormChange}
                    min="0"
                    step="0.01"
                    placeholder="e.g. 25"
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status *
                </label>
                <select
                  name="is_active"
                  value={newPlan.is_active ? 'active' : 'inactive'}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <div className="pt-2 flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {editMode ? 'Update Plan' : 'Create Plan'}
                </button>
                {editMode && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
            <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                EMI Plans List
              </h3>
              <input
                type="text"
                placeholder="Search plans..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-500">{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
                >
                  Try Again
                </button>
              </div>
            ) : filteredPlans.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No EMI plans found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Type</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Duration</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Interest</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                    {filteredPlans.map((plan) => (
                      <tr key={plan.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{plan.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">{plan.emi_type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{plan.duration_months} months</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{plan.interest_rate}%</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            plan.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {plan.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <button 
                            className="text-blue-600 hover:text-blue-900 mr-3"
                            onClick={() => handleEdit(plan)}
                          >
                            Edit
                          </button>
                          <button 
                            className="text-red-600 hover:text-red-900"
                            onClick={() => handleDelete(plan.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default EMIPlans; 