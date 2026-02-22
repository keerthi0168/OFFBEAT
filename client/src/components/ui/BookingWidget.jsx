import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { differenceInDays } from 'date-fns';
import { toast } from 'react-toastify';

import { useAuth } from '../../../hooks';
import axiosInstance from '@/utils/axios';
import DatePickerWithRange from './DatePickerWithRange';

const BookingWidget = ({ place }) => {
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [bookingData, setBookingData] = useState({
    noOfGuests: 1,
    name: '',
    phone: '',
  });
  const [redirect, setRedirect] = useState('');
  const { user } = useAuth();

  const { noOfGuests, name, phone } = bookingData;
  const { _id: id, price } = place;

  useEffect(() => {
    if (user) {
      setBookingData({ ...bookingData, name: user.name });
    }
  }, [user]);

  const numberOfNights =
    dateRange.from && dateRange.to
      ? differenceInDays(
          new Date(dateRange.to).setHours(0, 0, 0, 0),
          new Date(dateRange.from).setHours(0, 0, 0, 0),
        )
      : 0;

  // handle booking form
  const handleBookingData = (e) => {
    setBookingData({
      ...bookingData,
      [e.target.name]: e.target.value,
    });
  };

  const handleBooking = async () => {
    // User must be signed in to book place
    if (!user) {
      return setRedirect(`/login`);
    }

    // BOOKING DATA VALIDATION
    if (numberOfNights < 1) {
      return toast.error('Please select valid dates');
    } else if (noOfGuests < 1) {
      return toast.error("No. of guests can't be less than 1");
    } else if (noOfGuests > place.maxGuests) {
      return toast.error(`Allowed max. no. of guests: ${place.maxGuests}`);
    } else if (name.trim() === '') {
      return toast.error("Name can't be empty");
    } else if (phone.trim() === '') {
      return toast.error("Phone can't be empty");
    }

    try {
      const response = await axiosInstance.post('/bookings', {
        checkIn: dateRange.from,
        checkOut: dateRange.to,
        noOfGuests,
        name,
        phone,
        place: id,
        price: numberOfNights * price,
      });

      const bookingId = response.data.booking._id;

      setRedirect(`/account/bookings/${bookingId}`);
      toast('Congratulations! Enjoy your trip.');
    } catch (error) {
      toast.error('Something went wrong!');
      console.log('Error: ', error);
    }
  };

  if (redirect) {
    return <Navigate to={redirect} />;
  }

  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-4 shadow-xl">
      <div className="text-center text-xl text-[#E5E7EB]">
        Price: <span className="font-semibold text-[#C9A96E]">₹{place.price}</span> / per night
      </div>
      <div className="mt-4 rounded-2xl border border-white/10">
        <div className="flex w-full ">
          <DatePickerWithRange setDateRange={setDateRange} />
        </div>
        <div className="border-t border-white/10 py-3 px-4">
          <label className="text-[#E5E7EB]/70">Number of guests: </label>
          <input
            type="number"
            name="noOfGuests"
            placeholder={`Max. guests: ${place.maxGuests}`}
            min={1}
            max={place.maxGuests}
            value={noOfGuests}
            onChange={handleBookingData}
            className="luxury-input"
          />
        </div>
        <div className="border-t border-white/10 py-3 px-4">
          <label className="text-[#E5E7EB]/70">Your full name: </label>
          <input
            type="text"
            name="name"
            value={name}
            onChange={handleBookingData}
            className="luxury-input"
          />
          <label className="text-[#E5E7EB]/70">Phone number: </label>
          <input
            type="tel"
            name="phone"
            value={phone}
            onChange={handleBookingData}
            className="luxury-input"
          />
        </div>
      </div>
      <button onClick={handleBooking} className="luxury-button mt-4 w-full">
        Book this place
        {numberOfNights > 0 && <span> ₹{numberOfNights * place.price}</span>}
      </button>
    </div>
  );
};

export default BookingWidget;
