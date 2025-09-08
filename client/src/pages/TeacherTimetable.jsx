import React, { useState } from 'react';
import { createTimetableEntry } from '../services/apiServices';
import { Calendar, Clock, PlusCircle } from 'lucide-react';

const TeacherTimetable = () => {
  const [form, setForm] = useState({
    title: '',
    description: 'Scheduled exam',
    department: 'Computer Science',
    year: '1',
    semester: '1',
    section: 'A',
    batch: '2024-2028',
    date: '',
    startTime: '',
    endTime: '',
    durationMinutes: 60,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Basic validation
    if (!form.title || !form.date || !form.startTime || !form.endTime) {
      setError('Please fill all required fields.');
      return;
    }

    // Combine date and time for backend
    const submissionData = {
        ...form,
        startTime: `${form.date}T${form.startTime}:00`,
        endTime: `${form.date}T${form.endTime}:00`,
    };

    try {
      await createTimetableEntry(submissionData);
      setSuccess(`Successfully scheduled "${form.title}" for section ${form.section}.`);
      // Optionally reset form
      // setForm({ ...initial state ... });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create schedule.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-blue-100 p-3 rounded-xl">
          <Calendar className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Schedule an Exam</h1>
          <p className="text-gray-500">Create a new entry in the student timetable.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-8 shadow-lg space-y-6">
        {error && <p className="text-red-500 bg-red-100 p-3 rounded-lg">{error}</p>}
        {success && <p className="text-green-500 bg-green-100 p-3 rounded-lg">{success}</p>}

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">Exam Title / Subject</label>
            <input type="text" name="title" value={form.title} onChange={handleChange} className="w-full border border-gray-300 rounded p-2" placeholder="e.g., Mid-Term Physics" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Department</label>
            <select name="department" value={form.department} onChange={handleChange} className="w-full border border-gray-300 rounded p-2 bg-white">
              <option>Computer Science</option>
              <option>Information Technology</option>
              <option>Electronics</option>
              <option>Mechanical</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Year</label>
            <select name="year" value={form.year} onChange={handleChange} className="w-full border border-gray-300 rounded p-2 bg-white">
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Semester</label>
            <select name="semester" value={form.semester} onChange={handleChange} className="w-full border border-gray-300 rounded p-2 bg-white">
              {[...Array(8).keys()].map(i => <option key={i+1} value={i+1}>Semester {i+1}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Section</label>
            <input type="text" name="section" value={form.section} onChange={handleChange} className="w-full border border-gray-300 rounded p-2" placeholder="e.g., A" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Exam Date</label>
            <input type="date" name="date" value={form.date} onChange={handleChange} className="w-full border border-gray-300 rounded p-2" required />
          </div>
          <div className="flex gap-4">
            <div className="w-1/2">
              <label className="block text-sm font-medium mb-1">Start Time</label>
              <input type="time" name="startTime" value={form.startTime} onChange={handleChange} className="w-full border border-gray-300 rounded p-2" required />
            </div>
            <div className="w-1/2">
              <label className="block text-sm font-medium mb-1">End Time</label>
              <input type="time" name="endTime" value={form.endTime} onChange={handleChange} className="w-full border border-gray-300 rounded p-2" required />
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button type="submit" className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold">
            <PlusCircle size={20} />
            Add to Timetable
          </button>
        </div>
      </form>
    </div>
  );
};

export default TeacherTimetable;
