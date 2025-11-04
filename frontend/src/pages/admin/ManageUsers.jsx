import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = roleFilter !== 'all' ? { role: roleFilter } : {};
      const response = await api.get('/admin/users', { params });
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDoctor = async (id) => {
    if (!window.confirm('Are you sure you want to approve this doctor?')) return;
    
    try {
      const response = await api.put(`/admin/users/${id}/approve`);
      alert('Doctor approved successfully');
      
      // Update the local state immediately for instant UI feedback
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === id 
            ? { ...user, approved: true, isApproved: true }
            : user
        )
      );
      
      // Also fetch fresh data from server
      await fetchUsers();
    } catch (error) {
      console.error('Error approving doctor:', error);
      alert(error.response?.data?.message || 'Failed to approve doctor');
    }
  };

  const handleRejectDoctor = async (id) => {
    if (!window.confirm('Are you sure you want to reject this doctor?')) return;
    
    try {
      const response = await api.put(`/admin/users/${id}/reject`);
      alert('Doctor rejected successfully');
      
      // Update the local state immediately for instant UI feedback
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === id 
            ? { ...user, approved: false, isApproved: false }
            : user
        )
      );
      
      // Also fetch fresh data from server
      await fetchUsers();
    } catch (error) {
      console.error('Error rejecting doctor:', error);
      alert(error.response?.data?.message || 'Failed to reject doctor');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    try {
      await api.delete(`/admin/users/${id}`);
      alert('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers([]);
    } else {
      // Only select users that match current role filter
      const usersToSelect = filteredUsers.filter(user => {
        if (roleFilter === 'all') return true;
        return user.role === roleFilter;
      }).map(user => user._id);
      setSelectedUsers(usersToSelect);
    }
    setSelectAll(!selectAll);
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleBulkApprove = async () => {
    if (selectedUsers.length === 0) {
      alert('Please select users to approve');
      return;
    }
    
    // Filter only doctors from selected users
    const selectedDoctors = users.filter(u => 
      selectedUsers.includes(u._id) && u.role === 'doctor'
    );
    
    if (selectedDoctors.length === 0) {
      alert('Please select doctors to approve. Only doctors can be approved.');
      return;
    }
    
    if (!window.confirm(`Are you sure you want to approve ${selectedDoctors.length} selected doctor(s)?`)) return;
    
    try {
      const response = await api.post('/admin/users/bulk-approve', { 
        userIds: selectedDoctors.map(d => d._id) 
      });
      alert(response.data.message);
      setSelectedUsers([]);
      setSelectAll(false);
      fetchUsers();
    } catch (error) {
      console.error('Error bulk approving doctors:', error);
      alert(error.response?.data?.message || 'Failed to approve selected doctors');
    }
  };

  const handleBulkReject = async () => {
    if (selectedUsers.length === 0) {
      alert('Please select users to reject');
      return;
    }
    
    // Filter only doctors from selected users
    const selectedDoctors = users.filter(u => 
      selectedUsers.includes(u._id) && u.role === 'doctor'
    );
    
    if (selectedDoctors.length === 0) {
      alert('Please select doctors to reject. Only doctors can be rejected.');
      return;
    }
    
    if (!window.confirm(`Are you sure you want to reject ${selectedDoctors.length} selected doctor(s)?`)) return;
    
    try {
      const response = await api.post('/admin/users/bulk-reject', { 
        userIds: selectedDoctors.map(d => d._id) 
      });
      alert(response.data.message);
      setSelectedUsers([]);
      setSelectAll(false);
      fetchUsers();
    } catch (error) {
      console.error('Error bulk rejecting doctors:', error);
      alert(error.response?.data?.message || 'Failed to reject selected doctors');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) {
      alert('Please select users to delete');
      return;
    }
    
    // Prevent deleting admins
    const selectedNonAdmins = users.filter(u => 
      selectedUsers.includes(u._id) && u.role !== 'admin'
    );
    
    if (selectedNonAdmins.length === 0) {
      alert('Cannot delete admin users. Please select other users.');
      return;
    }
    
    if (selectedNonAdmins.length !== selectedUsers.length) {
      alert(`Note: ${selectedUsers.length - selectedNonAdmins.length} admin user(s) will be skipped.`);
    }
    
    if (!window.confirm(`Are you sure you want to delete ${selectedNonAdmins.length} selected user(s)? This action cannot be undone.`)) return;
    
    try {
      const response = await api.post('/admin/users/bulk-delete', { 
        userIds: selectedNonAdmins.map(u => u._id) 
      });
      alert(response.data.message);
      setSelectedUsers([]);
      setSelectAll(false);
      fetchUsers();
    } catch (error) {
      console.error('Error bulk deleting users:', error);
      alert(error.response?.data?.message || 'Failed to delete selected users');
    }
  };

  const handleApproveAllDoctors = async () => {
    if (!window.confirm('Are you sure you want to approve ALL pending doctors?')) return;
    
    try {
      const response = await api.post('/admin/users/approve-all-doctors');
      alert(response.data.message);
      setSelectedUsers([]);
      setSelectAll(false);
      fetchUsers();
    } catch (error) {
      console.error('Error approving all doctors:', error);
      alert(error.response?.data?.message || 'Failed to approve all doctors');
    }
  };

  const viewUserDetails = async (id) => {
    try {
      const response = await api.get(`/admin/users/${id}`);
      setSelectedUser(response.data);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching user details:', error);
      alert('Failed to fetch user details');
    }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.includes(searchTerm)
  );

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'doctor':
        return 'bg-blue-100 text-blue-800';
      case 'patient':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Manage Users</h1>
          <p className="text-gray-600 mt-2">View and manage all system users</p>
        </div>

        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search users by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          <div className="flex gap-2">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                roleFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setRoleFilter('patient')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                roleFilter === 'patient'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Patients
            </button>
            <button
              onClick={() => setRoleFilter('doctor')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                roleFilter === 'doctor'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Doctors
            </button>
            <button
              onClick={() => setRoleFilter('admin')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                roleFilter === 'admin'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Admins
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-sm font-medium text-blue-900">
                {selectedUsers.length} user(s) selected
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleBulkApprove}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Approve Selected
                </button>
                <button
                  onClick={handleBulkReject}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                >
                  Reject Selected
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Delete Selected
                </button>
                <button
                  onClick={() => {
                    setSelectedUsers([]);
                    setSelectAll(false);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions - Only show for doctors filter */}
        {(roleFilter === 'doctor' || roleFilter === 'all') && (
          <div className="mb-6 flex flex-wrap gap-3">
            <button
              onClick={handleApproveAllDoctors}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg font-medium"
            >
              ✓ Approve All Pending Doctors
            </button>
          </div>
        )}

        {filteredUsers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No users found</h3>
            <p className="text-gray-500">No users match your search criteria.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user._id)}
                          onChange={() => handleSelectUser(user._id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 font-medium">
                              {user.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            {user.specialization && (
                              <div className="text-sm text-gray-500">{user.specialization}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                        <div className="text-sm text-gray-500">{user.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.role === 'doctor' ? (
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.approved || user.isApproved
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.approved || user.isApproved ? '✓ Approved' : '⏳ Pending'}
                          </span>
                        ) : (
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => viewUserDetails(user._id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </button>
                          {user.role === 'doctor' && (
                            <>
                              {!user.approved && !user.isApproved ? (
                                <>
                                  <button
                                    onClick={() => handleApproveDoctor(user._id)}
                                    className="text-green-600 hover:text-green-900 font-medium"
                                  >
                                    ✓ Approve
                                  </button>
                                  <button
                                    onClick={() => handleRejectDoctor(user._id)}
                                    className="text-orange-600 hover:text-orange-900 font-medium"
                                  >
                                    ✕ Reject
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleRejectDoctor(user._id)}
                                  className="text-orange-600 hover:text-orange-900 font-medium"
                                >
                                  ✕ Revoke
                                </button>
                              )}
                            </>
                          )}
                          {user.role !== 'admin' && (
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">User Details</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold text-gray-800">{selectedUser.user.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold text-gray-800">{selectedUser.user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold text-gray-800">{selectedUser.user.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Role</p>
                  <p className="font-semibold text-gray-800 capitalize">{selectedUser.user.role}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Gender</p>
                  <p className="font-semibold text-gray-800 capitalize">{selectedUser.user.gender || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Age</p>
                  <p className="font-semibold text-gray-800">{selectedUser.user.age || 'Not specified'}</p>
                </div>
                {selectedUser.user.role === 'doctor' && (
                  <>
                    <div>
                      <p className="text-sm text-gray-600">Specialization</p>
                      <p className="font-semibold text-gray-800">{selectedUser.user.specialization || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Experience</p>
                      <p className="font-semibold text-gray-800">{selectedUser.user.experience || 0} years</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Consultation Fee</p>
                      <p className="font-semibold text-gray-800">₹{selectedUser.user.consultationFee || 500}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <p className={`font-semibold ${selectedUser.user.approved || selectedUser.user.isApproved ? 'text-green-600' : 'text-yellow-600'}`}>
                        {selectedUser.user.approved || selectedUser.user.isApproved ? '✓ Approved' : '⏳ Pending'}
                      </p>
                    </div>
                  </>
                )}
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-semibold text-gray-800">{selectedUser.user.address || 'Not provided'}</p>
                </div>
              </div>

              {selectedUser.user.education && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Education</p>
                  <p className="font-semibold text-gray-800">{selectedUser.user.education}</p>
                </div>
              )}

              {selectedUser.stats && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-3">Statistics</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Appointments</p>
                      <p className="text-2xl font-bold text-blue-600">{selectedUser.stats.totalAppointments}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Payments</p>
                      <p className="text-2xl font-bold text-green-600">{selectedUser.stats.totalPayments}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Revenue</p>
                      <p className="text-2xl font-bold text-purple-600">₹{selectedUser.stats.totalRevenue || 0}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageUsers;
