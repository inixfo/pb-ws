import React, { useState, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import PageMeta from '../../components/common/PageMeta';
import { useAuth } from '../../context/AuthContext';
import { vendorPaymentService } from '../../services/api';

interface BankAccount {
  id?: number;
  account_name: string;
  account_number: string;
  bank_name: string;
  branch_name: string;
  routing_number?: string;
  swift_code?: string;
  is_primary: boolean;
}

interface PayPalAccount {
  id?: number;
  email: string;
  is_primary: boolean;
}

const VendorPaymentSettings: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [paypalAccounts, setPaypalAccounts] = useState<PayPalAccount[]>([]);
  const [activeTab, setActiveTab] = useState<'bank' | 'paypal'>('bank');
  const [isAddingBank, setIsAddingBank] = useState(false);
  const [isAddingPaypal, setIsAddingPaypal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Bank account form state
  const [bankForm, setBankForm] = useState<BankAccount>({
    account_name: '',
    account_number: '',
    bank_name: '',
    branch_name: '',
    routing_number: '',
    swift_code: '',
    is_primary: false
  });
  
  // PayPal form state
  const [paypalForm, setPaypalForm] = useState<PayPalAccount>({
    email: '',
    is_primary: false
  });

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch bank accounts and PayPal accounts in parallel
      const [bankData, paypalData] = await Promise.all([
        vendorPaymentService.getBankAccounts(),
        vendorPaymentService.getPaypalAccounts()
      ]);

      setBankAccounts(bankData);
      setPaypalAccounts(paypalData);
    } catch (err) {
      console.error('Error fetching payment methods:', err);
      setError('Failed to load payment methods. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBankFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setBankForm({
      ...bankForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handlePaypalFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setPaypalForm({
      ...paypalForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const resetBankForm = () => {
    setBankForm({
      account_name: '',
      account_number: '',
      bank_name: '',
      branch_name: '',
      routing_number: '',
      swift_code: '',
      is_primary: false
    });
    setIsEditing(false);
    setEditingId(null);
  };

  const resetPaypalForm = () => {
    setPaypalForm({
      email: '',
      is_primary: false
    });
    setIsEditing(false);
    setEditingId(null);
  };

  const handleAddBankAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      // If this is set as primary, update all other accounts to non-primary
      if (bankForm.is_primary && bankAccounts.some(account => account.is_primary)) {
        await Promise.all(
          bankAccounts
            .filter(account => account.is_primary)
            .map(account => vendorPaymentService.updateBankAccount(account.id!, { ...account, is_primary: false }))
        );
      }
      
      if (isEditing && editingId) {
        await vendorPaymentService.updateBankAccount(editingId, bankForm);
        toast.success('Bank account updated successfully');
      } else {
        await vendorPaymentService.addBankAccount(bankForm);
        toast.success('Bank account added successfully');
      }
      
      // Reset form and refresh data
      resetBankForm();
      setIsAddingBank(false);
      await fetchPaymentMethods();
    } catch (err) {
      console.error('Error saving bank account:', err);
      toast.error('Failed to save bank account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPaypalAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      // If this is set as primary, update all other accounts to non-primary
      if (paypalForm.is_primary && paypalAccounts.some(account => account.is_primary)) {
        await Promise.all(
          paypalAccounts
            .filter(account => account.is_primary)
            .map(account => vendorPaymentService.updatePaypalAccount(account.id!, { ...account, is_primary: false }))
        );
      }
      
      if (isEditing && editingId) {
        await vendorPaymentService.updatePaypalAccount(editingId, paypalForm);
        toast.success('PayPal account updated successfully');
      } else {
        await vendorPaymentService.addPaypalAccount(paypalForm);
        toast.success('PayPal account added successfully');
      }
      
      // Reset form and refresh data
      resetPaypalForm();
      setIsAddingPaypal(false);
      await fetchPaymentMethods();
    } catch (err) {
      console.error('Error saving PayPal account:', err);
      toast.error('Failed to save PayPal account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditBankAccount = (account: BankAccount) => {
    setBankForm(account);
    setIsEditing(true);
    setEditingId(account.id!);
    setIsAddingBank(true);
  };

  const handleEditPaypalAccount = (account: PayPalAccount) => {
    setPaypalForm(account);
    setIsEditing(true);
    setEditingId(account.id!);
    setIsAddingPaypal(true);
  };

  const handleDeleteBankAccount = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this bank account?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      await vendorPaymentService.deleteBankAccount(id);
      toast.success('Bank account deleted successfully');
      await fetchPaymentMethods();
    } catch (err) {
      console.error('Error deleting bank account:', err);
      toast.error('Failed to delete bank account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePaypalAccount = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this PayPal account?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      await vendorPaymentService.deletePaypalAccount(id);
      toast.success('PayPal account deleted successfully');
      await fetchPaymentMethods();
    } catch (err) {
      console.error('Error deleting PayPal account:', err);
      toast.error('Failed to delete PayPal account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPrimaryBankAccount = async (id: number) => {
    try {
      setIsLoading(true);
      
      // Update all accounts to non-primary first
      await Promise.all(
        bankAccounts
          .filter(account => account.is_primary)
          .map(account => vendorPaymentService.updateBankAccount(account.id!, { ...account, is_primary: false }))
      );
      
      // Set the selected account as primary
      const account = bankAccounts.find(acc => acc.id === id);
      if (account) {
        await vendorPaymentService.updateBankAccount(id, { ...account, is_primary: true });
        toast.success('Primary bank account updated');
        await fetchPaymentMethods();
      }
    } catch (err) {
      console.error('Error setting primary bank account:', err);
      toast.error('Failed to update primary bank account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPrimaryPaypalAccount = async (id: number) => {
    try {
      setIsLoading(true);
      
      // Update all accounts to non-primary first
      await Promise.all(
        paypalAccounts
          .filter(account => account.is_primary)
          .map(account => vendorPaymentService.updatePaypalAccount(account.id!, { ...account, is_primary: false }))
      );
      
      // Set the selected account as primary
      const account = paypalAccounts.find(acc => acc.id === id);
      if (account) {
        await vendorPaymentService.updatePaypalAccount(id, { ...account, is_primary: true });
        toast.success('Primary PayPal account updated');
        await fetchPaymentMethods();
      }
    } catch (err) {
      console.error('Error setting primary PayPal account:', err);
      toast.error('Failed to update primary PayPal account');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !bankAccounts.length && !paypalAccounts.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Payment Settings - Vendor Dashboard"
        description="Manage your payment methods and preferences"
      />
      
      <Toaster position="top-right" />
      
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Payment Settings
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Manage your payment methods and preferences
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('bank')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'bank'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Bank Accounts
            </button>
            <button
              onClick={() => setActiveTab('paypal')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'paypal'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              PayPal
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Bank Accounts Tab */}
          {activeTab === 'bank' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  Bank Accounts
                </h2>
                {!isAddingBank && (
                  <button
                    onClick={() => {
                      resetBankForm();
                      setIsAddingBank(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Bank Account
                  </button>
                )}
              </div>
              
              {error && !bankAccounts.length && (
                <div className="text-center py-4">
                  <p className="text-red-500">{error}</p>
                  <button 
                    onClick={fetchPaymentMethods} 
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg"
                  >
                    Try Again
                  </button>
                </div>
              )}
              
              {/* Add/Edit Bank Account Form */}
              {isAddingBank && (
                <div className="mb-8 p-6 border border-gray-200 rounded-lg dark:border-gray-700">
                  <h3 className="text-lg font-medium mb-4">
                    {isEditing ? 'Edit Bank Account' : 'Add Bank Account'}
                  </h3>
                  
                  <form onSubmit={handleAddBankAccount}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Account Holder Name *
                        </label>
                        <input
                          type="text"
                          name="account_name"
                          value={bankForm.account_name}
                          onChange={handleBankFormChange}
                          required
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Account Number *
                        </label>
                        <input
                          type="text"
                          name="account_number"
                          value={bankForm.account_number}
                          onChange={handleBankFormChange}
                          required
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Bank Name *
                        </label>
                        <input
                          type="text"
                          name="bank_name"
                          value={bankForm.bank_name}
                          onChange={handleBankFormChange}
                          required
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Branch Name *
                        </label>
                        <input
                          type="text"
                          name="branch_name"
                          value={bankForm.branch_name}
                          onChange={handleBankFormChange}
                          required
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Routing Number
                        </label>
                        <input
                          type="text"
                          name="routing_number"
                          value={bankForm.routing_number || ''}
                          onChange={handleBankFormChange}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          SWIFT Code
                        </label>
                        <input
                          type="text"
                          name="swift_code"
                          value={bankForm.swift_code || ''}
                          onChange={handleBankFormChange}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="is_primary_bank"
                          name="is_primary"
                          checked={bankForm.is_primary}
                          onChange={handleBankFormChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is_primary_bank" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                          Set as primary account
                        </label>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          resetBankForm();
                          setIsAddingBank(false);
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        {isEditing ? 'Update' : 'Save'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
              {/* Bank Accounts List */}
              {bankAccounts.length === 0 && !isLoading && !error ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    No bank accounts added yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bankAccounts.map((account) => (
                    <div 
                      key={account.id} 
                      className={`border ${account.is_primary ? 'border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'} rounded-lg p-4`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <h3 className="font-medium text-gray-800 dark:text-white">
                              {account.bank_name}
                            </h3>
                            {account.is_primary && (
                              <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-300">
                                Primary
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {account.account_name} • {account.account_number.replace(/\d(?=\d{4})/g, '*')}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Branch: {account.branch_name}
                          </p>
                          {account.routing_number && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              Routing: {account.routing_number}
                            </p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          {!account.is_primary && (
                            <button
                              onClick={() => handleSetPrimaryBankAccount(account.id!)}
                              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              Set as Primary
                            </button>
                          )}
                          <button
                            onClick={() => handleEditBankAccount(account)}
                            className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteBankAccount(account.id!)}
                            className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PayPal Tab */}
          {activeTab === 'paypal' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  PayPal Accounts
                </h2>
                {!isAddingPaypal && (
                  <button
                    onClick={() => {
                      resetPaypalForm();
                      setIsAddingPaypal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add PayPal Account
                  </button>
                )}
              </div>
              
              {error && !paypalAccounts.length && (
                <div className="text-center py-4">
                  <p className="text-red-500">{error}</p>
                  <button 
                    onClick={fetchPaymentMethods} 
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg"
                  >
                    Try Again
                  </button>
                </div>
              )}
              
              {/* Add/Edit PayPal Form */}
              {isAddingPaypal && (
                <div className="mb-8 p-6 border border-gray-200 rounded-lg dark:border-gray-700">
                  <h3 className="text-lg font-medium mb-4">
                    {isEditing ? 'Edit PayPal Account' : 'Add PayPal Account'}
                  </h3>
                  
                  <form onSubmit={handleAddPaypalAccount}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        PayPal Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={paypalForm.email}
                        onChange={handlePaypalFormChange}
                        required
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="is_primary_paypal"
                          name="is_primary"
                          checked={paypalForm.is_primary}
                          onChange={handlePaypalFormChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is_primary_paypal" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                          Set as primary account
                        </label>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          resetPaypalForm();
                          setIsAddingPaypal(false);
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        {isEditing ? 'Update' : 'Save'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
              {/* PayPal Accounts List */}
              {paypalAccounts.length === 0 && !isLoading && !error ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    No PayPal accounts added yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paypalAccounts.map((account) => (
                    <div 
                      key={account.id} 
                      className={`border ${account.is_primary ? 'border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'} rounded-lg p-4`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center">
                            <h3 className="font-medium text-gray-800 dark:text-white">
                              {account.email}
                            </h3>
                            {account.is_primary && (
                              <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-300">
                                Primary
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {!account.is_primary && (
                            <button
                              onClick={() => handleSetPrimaryPaypalAccount(account.id!)}
                              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              Set as Primary
                            </button>
                          )}
                          <button
                            onClick={() => handleEditPaypalAccount(account)}
                            className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePaypalAccount(account.id!)}
                            className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default VendorPaymentSettings; 