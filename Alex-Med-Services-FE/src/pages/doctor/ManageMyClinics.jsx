import { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaMapMarkerAlt, FaPhone, FaCalendar, FaDollarSign } from 'react-icons/fa';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';

export default function ManageMyClinics() {
  const [myClinics, setMyClinics] = useState([]);
  const [allClinics, setAllClinics] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ clinicId: '', consultationFee: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMyClinics();
    fetchAllClinics();
  }, []);

  const fetchMyClinics = async () => {
    try {
      const res = await api.get('/doctor/clinics');
      setMyClinics(res.data.data.clinics || []);
    } catch (e) {
      console.error('Failed to fetch my clinics:', e);
    }
  };

  const fetchAllClinics = async () => {
    try {
      const res = await api.get('/clinics', { params: { limit: 100 } });
      setAllClinics(res.data.data.clinics || []);
    } catch (e) {
      console.error('Failed to fetch clinics:', e);
    }
  };

  const handleAddClinic = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/doctor/clinics', {
        clinicId: parseInt(formData.clinicId),
        consultationFee: formData.consultationFee ? parseFloat(formData.consultationFee) : null
      });
      alert('Clinic added successfully!');
      setFormData({ clinicId: '', consultationFee: '' });
      setShowAddForm(false);
      fetchMyClinics();
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Failed to add clinic');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveClinic = async (doctorClinicId, clinicName) => {
    if (!confirm(`Remove ${clinicName} from your clinics?`)) return;

    try {
      await api.delete(`/doctor/clinics/${doctorClinicId}`);
      alert('Clinic removed successfully');
      fetchMyClinics();
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Failed to remove clinic');
    }
  };

  const handleUpdateFee = async (doctorClinicId, currentFee) => {
    const newFee = prompt('Enter new consultation fee:', currentFee || '');
    if (newFee === null) return;

    try {
      await api.patch(`/doctor/clinics/${doctorClinicId}`, {
        consultationFee: newFee ? parseFloat(newFee) : null
      });
      alert('Consultation fee updated');
      fetchMyClinics();
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Failed to update fee');
    }
  };

  // Filter out already assigned clinics
  const availableClinics = allClinics.filter(
    clinic => !myClinics.some(mc => mc.clinic.id === clinic.id)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container px-6 py-8 mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-gray-800">My Clinics</h1>
            <p className="text-gray-600 mt-1">Manage the clinics where you practice</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 flex items-center gap-2"
          >
            <FaPlus /> Add Clinic
          </button>
        </div>

        {/* Add Clinic Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Add Clinic to Your Profile</h2>
            <form onSubmit={handleAddClinic} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Clinic *
                  </label>
                  <select
                    value={formData.clinicId}
                    onChange={(e) => setFormData({ ...formData, clinicId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    required
                  >
                    <option value="">Choose a clinic...</option>
                    {availableClinics.map(clinic => (
                      <option key={clinic.id} value={clinic.id}>
                        {clinic.name} - {clinic.area}, {clinic.city}
                      </option>
                    ))}
                  </select>
                  {availableClinics.length === 0 && (
                    <p className="text-sm text-amber-600 mt-1">
                      All available clinics have been added. Contact admin to add more clinics.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Consultation Fee (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.consultationFee}
                    onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })}
                    placeholder="e.g., 150.00"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading || availableClinics.length === 0}
                  className="px-6 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Clinic'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* My Clinics List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {myClinics.map((dc) => (
            <div key={dc.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">{dc.clinic.name}</h3>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    {dc.activeSchedules} schedules
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <FaMapMarkerAlt className="mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{dc.clinic.area}, {dc.clinic.city}</p>
                    <p className="text-xs">{dc.clinic.address}</p>
                  </div>
                </div>

                {dc.clinic.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaPhone className="flex-shrink-0" />
                    <p>{dc.clinic.phone}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <FaDollarSign className="flex-shrink-0 text-green-600" />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-gray-600">
                      Consultation Fee: {dc.consultationFee ? `$${dc.consultationFee}` : 'Not set'}
                    </span>
                    <button
                      onClick={() => handleUpdateFee(dc.id, dc.consultationFee)}
                      className="text-xs text-blue-500 hover:text-blue-600"
                    >
                      Update
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FaCalendar className="flex-shrink-0" />
                  <p>
                    {dc.statistics.upcomingAppointments} upcoming • {dc.statistics.totalAppointments} total appointments
                  </p>
                </div>
              </div>

              {/* Schedules */}
              {dc.schedules && dc.schedules.length > 0 && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-700 mb-2">Your Schedule:</p>
                  <div className="space-y-1">
                    {dc.schedules.map(schedule => (
                      <div key={schedule.id} className="text-xs text-gray-600 flex items-center justify-between">
                        <span className="font-medium">{schedule.dayOfWeek}</span>
                        <span>{schedule.startTime} - {schedule.endTime}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {dc.clinic.mapUrl && (
                <a
                  href={dc.clinic.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-blue-500 hover:text-blue-600 mb-4"
                >
                  📍 View on Map
                </a>
              )}

              <button
                onClick={() => handleRemoveClinic(dc.id, dc.clinic.name)}
                className="w-full px-3 py-2 text-sm text-red-600 bg-red-50 rounded hover:bg-red-100 flex items-center justify-center gap-2"
              >
                <FaTrash /> Remove Clinic
              </button>
            </div>
          ))}
        </div>

        {myClinics.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <FaMapMarkerAlt className="mx-auto text-gray-300 text-5xl mb-4" />
            <p className="text-gray-500 mb-2">You haven't added any clinics yet</p>
            <p className="text-sm text-gray-400 mb-4">
              Add clinics where you practice to start receiving appointments
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
            >
              Add Your First Clinic
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
