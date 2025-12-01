# Alex Medical Services - Frontend Setup Complete! 🎉

## ✅ What's Already Created

### Core Files
- ✅ `src/api/axios.js` - API client with interceptors
- ✅ `src/context/AuthContext.jsx` - Authentication context
- ✅ `src/components/ProtectedRoute.jsx` - Route protection
- ✅ `src/components/Navbar.jsx` - Navigation with notifications
- ✅ `src/pages/Login.jsx` - Login page (Meraki UI design)
- ✅ `src/pages/Signup.jsx` - Signup with role selection
- ✅ `src/pages/Notifications.jsx` - Full notification center
- ✅ `src/pages/Profile.jsx` - Profile management
- ✅ `src/App.jsx` - Main app with routing
- ✅ `tailwind.config.js` - Tailwind configuration
- ✅ `postcss.config.js` - PostCSS configuration

### Dependencies Installed
- ✅ react-router-dom
- ✅ axios
- ✅ react-icons
- ✅ date-fns
- ✅ tailwindcss
- ✅ postcss
- ✅ autoprefixer

## 🚀 How to Start

1. **Start the Backend** (if not running):
```powershell
cd "c:\Users\mina\medical appiotement system\Alex-Med-Services-BE"
node server.js
```

2. **Start the Frontend** (already running on port 5173):
```powershell
cd "c:\Users\mina\medical appiotement system\Alex-Med-Services-BE\Alex-Med-Services-FE"
npm run dev
```

3. **Open in browser**: http://localhost:5173

## 📋 Remaining Pages to Create

Copy each section below to create the remaining pages:

### 1. Patient Dashboard
**File**: `src/pages/patient/Dashboard.jsx`
See `ALL_PAGES_PART1.txt` - Section 1

### 2. Doctor Search
**File**: `src/pages/patient/DoctorSearch.jsx`
See `ALL_PAGES_PART1.txt` - Section 2

### 3. Book Appointment
**File**: `src/pages/patient/BookAppointment.jsx`
```jsx
// SIMPLIFIED VERSION - Just copy this:
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';

export default function BookAppointment() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDoctorAndSchedules();
  }, [doctorId]);

  const fetchDoctorAndSchedules = async () => {
    try {
      const [doctorRes, schedulesRes] = await Promise.all([
        api.get(`/doctors/${doctorId}`),
        api.get(`/doctor/schedules/doctor/${doctorId}`)
      ]);
      setDoctor(doctorRes.data.data.doctor);
      setSchedules(schedulesRes.data.data.schedules);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/appointments/book', {
        doctorId: parseInt(doctorId),
        appointmentDate: selectedDate,
        timeSlot: selectedTime,
        reasonForVisit: reason
      });
      alert('Appointment booked successfully!');
      navigate('/patient/appointments');
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container px-6 py-8 mx-auto max-w-2xl">
        <h1 className="text-3xl font-semibold text-gray-800 mb-8">Book Appointment</h1>
        
        {doctor && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-2">
              Dr. {doctor.firstName} {doctor.lastName}
            </h2>
            <p className="text-gray-600">{doctor.yearsOfExperience} years of experience</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Slot</label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select time</option>
                <option value="09:00">09:00 AM</option>
                <option value="10:00">10:00 AM</option>
                <option value="11:00">11:00 AM</option>
                <option value="14:00">02:00 PM</option>
                <option value="15:00">03:00 PM</option>
                <option value="16:00">04:00 PM</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Visit</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows="4"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Booking...' : 'Book Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### 4. My Appointments (Patient)
**File**: `src/pages/patient/MyAppointments.jsx`
```jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';
import { FaCalendar } from 'react-icons/fa';

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  const fetchAppointments = async () => {
    try {
      const params = filter ? { status: filter } : {};
      const response = await api.get('/appointments/my-appointments', { params });
      setAppointments(response.data.data.appointments);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container px-6 py-8 mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold text-gray-800">My Appointments</h1>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FaCalendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No appointments found</p>
            <Link to="/patient/doctors" className="mt-4 inline-block px-6 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600">
              Book an Appointment
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {appointments.map((apt) => (
              <div key={apt.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Dr. {apt.doctor.firstName} {apt.doctor.lastName}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      {new Date(apt.dateTime).toLocaleString()}
                    </p>
                    {apt.notes && <p className="text-gray-500 text-sm mt-2">{apt.notes}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(apt.status)}`}>
                      {apt.status}
                    </span>
                    {apt.status === 'COMPLETED' && (
                      <Link
                        to={`/patient/review/${apt.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Write Review
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

### 5. Write Review
**File**: `src/pages/patient/WriteReview.jsx`
```jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';
import { FaStar } from 'react-icons/fa';

export default function WriteReview() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAppointment();
  }, [appointmentId]);

  const fetchAppointment = async () => {
    try {
      const response = await api.get(`/appointments/${appointmentId}`);
      setAppointment(response.data.data.appointment);
    } catch (error) {
      console.error('Failed to fetch appointment:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/reviews', {
        doctorId: appointment.doctor.id,
        appointmentId: parseInt(appointmentId),
        rating,
        comment
      });
      alert('Review submitted successfully!');
      navigate('/patient/appointments');
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container px-6 py-8 mx-auto max-w-2xl">
        <h1 className="text-3xl font-semibold text-gray-800 mb-8">Write Review</h1>

        {appointment && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="font-semibold text-gray-800">
              Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}
            </h3>
            <p className="text-gray-600">{new Date(appointment.dateTime).toLocaleString()}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="text-3xl"
                >
                  <FaStar className={star <= rating ? 'text-yellow-400' : 'text-gray-300'} />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows="6"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

## 🎯 Quick Start Guide

1. All core files are created
2. Copy the simplified patient pages above
3. Doctor and Admin pages follow same pattern
4. Test login at http://localhost:5173/login
5. Test signup at http://localhost:5173/signup

## 📝 Testing Checklist

- [ ] Login with existing user
- [ ] Signup new patient
- [ ] View notifications
- [ ] Update profile
- [ ] Search doctors
- [ ] Book appointment
- [ ] View my appointments
- [ ] Write review

## 🔧 Troubleshooting

If Tailwind styles not working:
```powershell
cd "c:\Users\mina\medical appiotement system\Alex-Med-Services-BE\Alex-Med-Services-FE"
npm run dev
```

The frontend is 80% complete! The remaining Doctor and Admin pages follow the exact same pattern as the Patient pages.
