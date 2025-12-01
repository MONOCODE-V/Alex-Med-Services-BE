import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';

export default function BookAppointment() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);

  useEffect(() => {
    fetchDoctor();
  }, [doctorId]);

  useEffect(() => {
    if (selectedClinic && selectedDate) {
      generateTimeSlots();
    }
  }, [selectedClinic, selectedDate]);

  const fetchDoctor = async () => {
    try {
      const res = await api.get(`/doctors/${doctorId}`);
      const doctorData = res.data.data.doctor;
      setDoctor(doctorData);
      // Auto-select first clinic if available
      if (doctorData.clinics && doctorData.clinics.length > 0) {
        setSelectedClinic(doctorData.clinics[0]);
      }
    } catch (e) {
      console.error('Failed to fetch doctor:', e);
    }
  };

  const generateTimeSlots = () => {
    if (!selectedClinic || !selectedDate) {
      setAvailableTimeSlots([]);
      return;
    }

    const date = new Date(selectedDate);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });

    // Find schedules for the selected day
    const daySchedules = selectedClinic.schedules?.filter(
      s => s.dayOfWeek === dayOfWeek
    ) || [];

    if (daySchedules.length === 0) {
      setAvailableTimeSlots([]);
      return;
    }

    // Generate time slots based on schedules
    const slots = [];
    daySchedules.forEach(schedule => {
      const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
      const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
      
      let currentHour = startHour;
      let currentMinute = startMinute;
      
      while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
        const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
        const displayTime = formatTime(timeString);
        slots.push({ value: timeString, display: displayTime });
        
        // Increment by 30 minutes
        currentMinute += 30;
        if (currentMinute >= 60) {
          currentMinute = 0;
          currentHour++;
        }
      }
    });

    setAvailableTimeSlots(slots);
    setSelectedTime(''); // Reset selected time when slots change
  };

  const formatTime = (time) => {
    const [hour, minute] = time.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedClinic) {
      alert('Please select a clinic');
      return;
    }

    if (availableTimeSlots.length === 0) {
      alert('Doctor is not available on the selected date. Please choose another date.');
      return;
    }

    setLoading(true);
    try {
      // Combine date and time into ISO datetime string
      const dateTime = `${selectedDate}T${selectedTime}:00`;
      
      const payload = {
        doctorId: parseInt(doctorId),
        dateTime: dateTime,
        notes: reason
      };

      console.log('Booking appointment with payload:', payload);
      
      await api.post('/appointments/book', payload);
      alert(`Appointment booked successfully at ${selectedClinic.name}!`);
      navigate('/patient/appointments');
    } catch (error) {
      console.error('Booking error:', error.response?.data);
      alert(error.response?.data?.error?.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container px-6 py-8 mx-auto max-w-4xl">
        <h1 className="text-3xl font-semibold text-gray-800 mb-8">Book Appointment</h1>
        
        {doctor && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-start gap-4">
              {doctor.profileImage && (
                <img src={doctor.profileImage} alt={doctor.name} className="w-20 h-20 rounded-full object-cover" />
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-2">{doctor.name}</h2>
                <div className="flex flex-wrap gap-2 mb-2">
                  {doctor.specializations?.map(spec => (
                    <span key={spec.id} className={`px-3 py-1 rounded-full text-sm ${spec.isPrimary ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                      {spec.name}
                    </span>
                  ))}
                </div>
                <p className="text-gray-600">{doctor.yearsOfExperience} years of experience</p>
                {doctor.statistics && (
                  <p className="text-sm text-gray-500 mt-1">
                    ⭐ {doctor.statistics.averageRating} ({doctor.statistics.totalReviews} reviews)
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Clinic Selection */}
        {doctor && doctor.clinics && doctor.clinics.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Clinic</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {doctor.clinics.map((clinic) => (
                <div
                  key={clinic.id}
                  onClick={() => {
                    setSelectedClinic(clinic);
                    setSelectedTime('');
                  }}
                  className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-all ${
                    selectedClinic?.id === clinic.id
                      ? 'ring-2 ring-blue-500 border-blue-500'
                      : 'hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-800">{clinic.name}</h4>
                    {selectedClinic?.id === clinic.id && (
                      <span className="text-blue-500 text-xl">✓</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{clinic.area}, {clinic.city}</p>
                  <p className="text-sm text-gray-500 mt-1">{clinic.address}</p>
                  {clinic.consultationFee && (
                    <p className="text-sm font-medium text-blue-600 mt-2">
                      Fee: ${clinic.consultationFee}
                    </p>
                  )}
                  
                  {/* Show available days */}
                  {clinic.schedules && clinic.schedules.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Available Days:</p>
                      <div className="flex flex-wrap gap-1">
                        {[...new Set(clinic.schedules.map(s => s.dayOfWeek))].map(day => (
                          <span key={day} className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded">
                            {day}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Booking Form */}
        {selectedClinic && (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Booking at {selectedClinic.name}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" 
                  required 
                />
              </div>
              
              {selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Slot
                    {availableTimeSlots.length === 0 && (
                      <span className="ml-2 text-xs text-red-500">
                        (Doctor not available on this day)
                      </span>
                    )}
                  </label>
                  <select 
                    value={selectedTime} 
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" 
                    required
                    disabled={availableTimeSlots.length === 0}
                  >
                    <option value="">
                      {availableTimeSlots.length === 0 ? 'No slots available' : 'Select time'}
                    </option>
                    {availableTimeSlots.map((slot) => (
                      <option key={slot.value} value={slot.value}>
                        {slot.display}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Visit</label>
                <textarea 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)} 
                  rows="4"
                  placeholder="Describe your symptoms or reason for visit..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" 
                  required 
                />
              </div>
              
              <button 
                type="submit" 
                disabled={loading || availableTimeSlots.length === 0}
                className="w-full px-6 py-3 text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Booking...' : 'Book Appointment'}
              </button>
            </div>
          </form>
        )}

        {!selectedClinic && doctor && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-blue-800">👆 Please select a clinic above to continue booking</p>
          </div>
        )}
      </div>
    </div>
  );
}
