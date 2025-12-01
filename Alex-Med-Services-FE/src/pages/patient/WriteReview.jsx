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

  useEffect(() => { fetchAppointment(); }, [appointmentId]);

  const fetchAppointment = async () => {
    try {
      const res = await api.get(`/appointments/${appointmentId}`);
      setAppointment(res.data.data.appointment);
    } catch (e) {}
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
            <h3 className="font-semibold text-gray-800">Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}</h3>
            <p className="text-gray-600">{new Date(appointment.dateTime).toLocaleString()}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} type="button" onClick={() => setRating(star)} className="text-3xl">
                  <FaStar className={star <= rating ? 'text-yellow-400' : 'text-gray-300'} />
                </button>
              ))}
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows="6"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" required />
          </div>
          <button type="submit" disabled={loading}
            className="w-full px-6 py-3 text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50">
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  );
}
