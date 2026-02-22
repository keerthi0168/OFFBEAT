import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import AccountNav from '@/components/ui/AccountNav';
import PlaceImg from '@/components/ui/PlaceImg';
import BookingDates from '@/components/ui/BookingDates';
import Spinner from '@/components/ui/Spinner';
import axiosInstance from '@/utils/axios';

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getBookings = async () => {
      try {
        const { data } = await axiosInstance.get('/bookings');
        setBookings(data.booking);
        setLoading(false);
      } catch (error) {
        console.log('Error: ', error);
        setLoading(false);
      }
    };
    getBookings();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="min-h-screen bg-[#0B1220] text-white">
      <AccountNav />
      <div className="mx-auto max-w-6xl px-6 py-10">
        {bookings?.length > 0 ? (
          bookings.map((booking) => (
            <Link
              to={`/account/bookings/${booking._id}`}
              className="my-8 flex h-28 gap-4 overflow-hidden rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 md:h-40"
              key={booking._id}
            >
              <div className="w-2/6 md:w-1/6">
                {booking?.place?.photos[0] && (
                  <PlaceImg
                    place={booking?.place}
                    className={'h-full w-full object-cover'}
                  />
                )}
              </div>
              <div className="grow py-3 pr-3">
                <h2 className="md:text-2xl font-light">{booking?.place?.title}</h2>
                <div className="md:text-xl">
                  <div className="flex gap-2 border-t border-white/10"></div>
                  <div className="md:text-xl">
                    <BookingDates
                      booking={booking}
                      className="mb-2 mt-4 hidden items-center text-[#E5E7EB]/60 md:flex"
                    />

                    <div className="my-2 flex items-center gap-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="h-7 w-7"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                        />
                      </svg>
                      <span className="text-xl md:text-2xl text-[#C9A96E]">
                        Total price: ₹{booking.price}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="">
            <div className="flex flex-col justify-start">
              <h1 className="my-6 text-3xl font-light text-white">Trips</h1>
              <hr className="border border-white/10" />
              <h3 className="pt-6 text-2xl font-light text-white">
                No trips booked... yet!
              </h3>
              <p className="text-[#E5E7EB]/60 font-light">
                Time to dust off you bags and start planning your next adventure
              </p>
              <Link to="/" className="my-6">
                <div className="flex w-48 justify-center rounded-2xl bg-gradient-to-r from-[#C9A96E] to-[#D4B896] p-3 text-lg font-semibold text-[#0B1220] hover:from-[#D4B896] hover:to-[#E0C5A0] transition-all duration-300 hover:-translate-y-0.5">
                  Start Searching
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingsPage;
