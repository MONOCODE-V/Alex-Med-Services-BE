import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';
import { FaClock, FaPlus, FaTrash } from 'react-icons/fa';

export default function ManageSchedules() {
  const [schedules, setSchedules] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ 
    clinicId: '', 
    dayOfWeek: 'MONDAY', 
    startTime: '09:00', 
    endTime: '17:00' 
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => { 
    fetchSchedules(); 
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    try {
      const res = await api.get('/doctor/clinics');
      const clinicsList = res.data.data.clinics || [];
      setClinics(clinicsList);
      // Set first clinic as default if available
      if (clinicsList.length > 0 && !formData.clinicId) {
        setFormData(prev => ({ ...prev, clinicId: clinicsList[0].clinic.id }));
      }
    } catch (e) {
      console.error('Failed to fetch clinics:', e);
    }
  };

  const fetchSchedules = async () => {
    try {
      const res = await api.get('/doctor/schedules');
      // Backend returns schedules grouped by day, need to flatten them
      const schedulesByDay = res.data.data.schedulesByDay;
      const allSchedules = [];
      Object.keys(schedulesByDay).forEach(day => {
        schedulesByDay[day].forEach(schedule => {
          allSchedules.push({
            ...schedule,
            dayOfWeek: day
          });
        });
      });
      setSchedules(allSchedules);
    } catch (e) {
      console.error('Failed to fetch schedules:', e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.clinicId) {
      alert('Please select a clinic first');
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        clinicId: parseInt(formData.clinicId),
        dayOfWeek: formData.dayOfWeek,
        startTime: formData.startTime,
        endTime: formData.endTime
      };
      
      console.log('Submitting schedule:', payload);
      
      await api.post('/doctor/schedules', payload);
      alert('Schedule created successfully!');
      setShowForm(false);
      setFormData({ 
        clinicId: clinics.length > 0 ? clinics[0].clinic.id : '', 
        dayOfWeek: 'MONDAY', 
        startTime: '09:00', 
        endTime: '17:00' 
      });
      fetchSchedules();
    } catch (error) {
      console.error('Schedule creation error:', error.response?.data);
      alert(error.response?.data?.error?.message || 'Failed to create schedule');
    } finally {
      setLoading(false);
    }
  };

  const deleteSchedule = async (id) => {
    if (!confirm('Delete this schedule?')) return;
    try {
      await api.delete(`/doctor/schedules/${id}`);
      fetchSchedules();
    } catch (e) {}
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container px-6 py-8 mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold text-gray-800">Manage Schedules</h1>
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 flex items-center gap-2">
            <FaPlus /> Add Schedule
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Create New Schedule</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Clinic</label>
                <select 
                  value={formData.clinicId} 
                  onChange={(e) => setFormData({...formData, clinicId: e.target.value ? parseInt(e.target.value) : ''})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg" 
                  required
                >
                  <option value="">Select Clinic</option>
                  {clinics.map(dc => (
                    <option key={dc.id} value={dc.clinic.id}>
                      {dc.clinic.name} - {dc.clinic.area}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Day of Week</label>
                <select value={formData.dayOfWeek} onChange={(e) => setFormData({...formData, dayOfWeek: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg">
                  {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                <input type="time" value={formData.startTime} onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                <input type="time" value={formData.endTime} onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg" required />
              </div>
              <div className="md:col-span-4 flex gap-2">
                <button type="submit" disabled={loading} className="px-6 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50">
                  {loading ? 'Creating...' : 'Create Schedule'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid gap-6">
          {schedules.length === 0 ? <div className="bg-white rounded-lg shadow p-12 text-center">
            <FaClock className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No schedules yet</p>
          </div> : schedules.map(schedule => (
            <div key={schedule.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{schedule.dayOfWeek}</h3>
                  <p className="text-gray-600">{schedule.startTime} - {schedule.endTime}</p>
                  {schedule.clinic && (
                    <p className="text-sm text-gray-500">📍 {schedule.clinic.name} - {schedule.clinic.area}</p>
                  )}
                </div>
                <button onClick={() => deleteSchedule(schedule.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
