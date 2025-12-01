import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaMapMarkerAlt, FaPhone, FaBuilding } from 'react-icons/fa';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';

export default function ManageClinics() {
  const [clinics, setClinics] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingClinic, setEditingClinic] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    area: '',
    address: '',
    phone: '',
    mapUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ city: '', area: '', search: '' });

  useEffect(() => {
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    try {
      const params = {};
      if (filters.city) params.city = filters.city;
      if (filters.area) params.area = filters.area;
      if (filters.search) params.search = filters.search;

      const res = await api.get('/clinics', { params });
      setClinics(res.data.data.clinics || []);
    } catch (e) {
      console.error('Failed to fetch clinics:', e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingClinic) {
        await api.patch(`/clinics/${editingClinic.id}`, formData);
        alert('Clinic updated successfully!');
      } else {
        await api.post('/clinics', formData);
        alert('Clinic created successfully!');
      }
      
      resetForm();
      fetchClinics();
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (clinic) => {
    setEditingClinic(clinic);
    setFormData({
      name: clinic.name,
      city: clinic.city,
      area: clinic.area,
      address: clinic.address,
      phone: clinic.phone || '',
      mapUrl: clinic.mapUrl || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (clinic) => {
    if (!confirm(`Delete ${clinic.name}? This cannot be undone.`)) return;

    try {
      await api.delete(`/clinics/${clinic.id}`);
      alert('Clinic deleted successfully');
      fetchClinics();
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Failed to delete clinic');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', city: '', area: '', address: '', phone: '', mapUrl: '' });
    setEditingClinic(null);
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container px-6 py-8 mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-gray-800">Manage Clinics</h1>
            <p className="text-gray-600 mt-1">Create and manage clinic locations</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 flex items-center gap-2"
          >
            <FaPlus /> Add Clinic
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Search by name or address..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="px-4 py-2 border border-gray-200 rounded-lg"
            />
            <input
              type="text"
              placeholder="Filter by city..."
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              className="px-4 py-2 border border-gray-200 rounded-lg"
            />
            <input
              type="text"
              placeholder="Filter by area..."
              value={filters.area}
              onChange={(e) => setFilters({ ...filters, area: e.target.value })}
              className="px-4 py-2 border border-gray-200 rounded-lg"
            />
          </div>
          <button
            onClick={fetchClinics}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Apply Filters
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {editingClinic ? 'Edit Clinic' : 'Create New Clinic'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Clinic Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Area *
                  </label>
                  <input
                    type="text"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Map URL (Google Maps link)
                </label>
                <input
                  type="url"
                  value={formData.mapUrl}
                  onChange={(e) => setFormData({ ...formData, mapUrl: e.target.value })}
                  placeholder="https://maps.google.com/..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingClinic ? 'Update Clinic' : 'Create Clinic'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Clinics List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clinics.map((clinic) => (
            <div key={clinic.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FaBuilding className="text-blue-500 text-xl" />
                  <h3 className="text-lg font-semibold text-gray-800">{clinic.name}</h3>
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  {clinic.doctorCount || 0} doctors
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <FaMapMarkerAlt className="mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{clinic.area}, {clinic.city}</p>
                    <p className="text-xs">{clinic.address}</p>
                  </div>
                </div>
                
                {clinic.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaPhone className="flex-shrink-0" />
                    <p>{clinic.phone}</p>
                  </div>
                )}
              </div>

              {clinic.mapUrl && (
                <a
                  href={clinic.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-blue-500 hover:text-blue-600 mb-4"
                >
                  📍 View on Map
                </a>
              )}

              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleEdit(clinic)}
                  className="flex-1 px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded hover:bg-blue-100 flex items-center justify-center gap-2"
                >
                  <FaEdit /> Edit
                </button>
                <button
                  onClick={() => handleDelete(clinic)}
                  className="flex-1 px-3 py-2 text-sm text-red-600 bg-red-50 rounded hover:bg-red-100 flex items-center justify-center gap-2"
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {clinics.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <FaBuilding className="mx-auto text-gray-300 text-5xl mb-4" />
            <p className="text-gray-500">No clinics found</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 px-6 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
            >
              Create First Clinic
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
