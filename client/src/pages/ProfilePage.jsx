import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  BadgeCheck,
  Clock3,
  Heart,
  LogOut,
  Mail,
  MessageSquare,
  Plus,
  ShieldCheck,
  Star,
  TrendingUp,
} from 'lucide-react';

import AccountNav from '@/components/ui/AccountNav';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import EditProfileDialog from '@/components/ui/EditProfileDialog';
import MLFeaturedListings from '@/components/ui/MLFeaturedListings';
import axiosInstance from '@/utils/axios';

import { useAuth } from '../../hooks';

const profileTabs = ['Listings', 'Bookings', 'Reviews', 'Saved'];

const formatDisplay = (value) => {
  if (value === null || value === undefined || value === '' || Number.isNaN(value)) return '—';
  return value;
};

const parseCityFromPlace = (booking) => {
  const place = booking?.place || {};
  if (place.city) return String(place.city).trim();
  if (place.district) return String(place.district).trim();

  const location = place.address || place.location || '';
  const firstSegment = String(location).split(',')[0]?.trim();
  return firstSegment || null;
};

const ProfilePage = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const { user, logout } = auth;

  const [redirect, setRedirect] = useState(null);
  const [activeTab, setActiveTab] = useState('Listings');
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState(null);
  const [metrics, setMetrics] = useState({
    messages_received: null,
    responses_sent: null,
    avg_response_time_minutes: null,
  });

  const [listings, setListings] = useState([]);
  const [hostBookings, setHostBookings] = useState([]);
  const [guestBookings, setGuestBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const [meRes, listingsRes, bookingsRes, reviewsRes, savedRes] = await Promise.all([
          axiosInstance.get('/users/me'),
          axiosInstance.get('/users/me/listings'),
          axiosInstance.get('/users/me/bookings'),
          axiosInstance.get('/users/me/reviews'),
          axiosInstance.get('/users/me/saved'),
        ]);

        setProfile(meRes?.data?.user || null);
        setMetrics(meRes?.data?.metrics || {});
        setListings(Array.isArray(listingsRes?.data?.listings) ? listingsRes.data.listings : []);
        setHostBookings(Array.isArray(bookingsRes?.data?.hostBookings) ? bookingsRes.data.hostBookings : []);
        setGuestBookings(Array.isArray(bookingsRes?.data?.guestBookings) ? bookingsRes.data.guestBookings : []);
        setReviews(Array.isArray(reviewsRes?.data?.reviews) ? reviewsRes.data.reviews : []);
        setSaved(Array.isArray(savedRes?.data?.saved) ? savedRes.data.saved : []);
      } catch (error) {
        console.error('Profile data load failed:', error);
        toast.error('Could not load profile data right now.');
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [user]);

  const handleLogout = async () => {
    const response = await logout();
    if (response.success) {
      toast.success(response.message);
      setRedirect('/');
      return;
    }
    toast.error(response.message);
  };

  const memberSince = useMemo(() => {
    const source = profile?.createdAt || user?.createdAt;
    if (!source) return '—';

    const date = new Date(source);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  }, [profile?.createdAt, user?.createdAt]);

  const averageRating = useMemo(() => {
    if (!reviews.length) return null;

    const numericRatings = reviews
      .map((review) => Number(review?.rating))
      .filter((rating) => Number.isFinite(rating) && rating > 0);

    if (!numericRatings.length) return null;
    return Number((numericRatings.reduce((sum, rating) => sum + rating, 0) / numericRatings.length).toFixed(2));
  }, [reviews]);

  const responseRate = useMemo(() => {
    const received = Number(metrics?.messages_received);
    const sent = Number(metrics?.responses_sent);

    if (!Number.isFinite(received) || received <= 0 || !Number.isFinite(sent)) return null;
    return `${Math.round((sent / received) * 100)}%`;
  }, [metrics?.messages_received, metrics?.responses_sent]);

  const responseTime = useMemo(() => {
    const minutes = Number(metrics?.avg_response_time_minutes);
    if (!Number.isFinite(minutes) || minutes < 0) return null;

    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = minutes / 60;
    if (hours < 24) return `${hours.toFixed(1)} hrs`;

    return `${(hours / 24).toFixed(1)} days`;
  }, [metrics?.avg_response_time_minutes]);

  const explorerCityCount = useMemo(() => {
    const citySet = new Set();
    guestBookings.forEach((booking) => {
      const city = parseCityFromPlace(booking);
      if (city) citySet.add(city.toLowerCase());
    });
    return citySet.size;
  }, [guestBookings]);

  const achievements = useMemo(() => {
    const earned = [];
    const bookingCount = hostBookings.length;
    const reviewCount = reviews.length;

    if (averageRating !== null && averageRating >= 4.8 && bookingCount >= 10) {
      earned.push('Super Host');
    }

    if (explorerCityCount >= 3) {
      earned.push('Explorer');
    }

    if (bookingCount >= 50) {
      earned.push('50+ Bookings');
    }

    if (averageRating !== null && averageRating >= 4.9 && reviewCount >= 20) {
      earned.push('Top Rated Host');
    }

    return earned;
  }, [averageRating, explorerCityCount, hostBookings.length, reviews.length]);

  const trustBadges = useMemo(() => {
    const source = profile || user || {};
    const items = [];

    if (source.email_verified) items.push('Email verified');
    if (source.phone_verified) items.push('Phone verified');
    if (source.id_verified) items.push('ID verified');

    return items;
  }, [profile, user]);

  const stats = useMemo(() => {
    const meId = profile?.id || user?.id;

    const listingsCount = meId
      ? listings.filter((listing) => String(listing?.owner || '') === String(meId)).length || listings.length
      : listings.length;

    return [
      {
        label: 'Listings posted',
        value: listingsCount,
        icon: <TrendingUp className="h-4 w-4 text-[#C9A96E]" />,
      },
      {
        label: 'Total bookings',
        value: hostBookings.length,
        icon: <BadgeCheck className="h-4 w-4 text-[#C9A96E]" />,
      },
      {
        label: 'Reviews received',
        value: reviews.length,
        icon: <MessageSquare className="h-4 w-4 text-[#C9A96E]" />,
      },
      {
        label: 'Response rate',
        value: formatDisplay(responseRate),
        icon: <Mail className="h-4 w-4 text-[#C9A96E]" />,
      },
      {
        label: 'Response time',
        value: formatDisplay(responseTime),
        icon: <Clock3 className="h-4 w-4 text-[#C9A96E]" />,
      },
    ];
  }, [hostBookings.length, listings, profile?.id, responseRate, responseTime, reviews.length, user?.id]);

  const recommendationSeed = useMemo(() => {
    if (saved.length > 0) {
      const firstSaved = saved[0];
      return firstSaved?.title || firstSaved?.name || 'Goa';
    }

    if (listings.length > 0) {
      return listings[0]?.title || listings[0]?.name || 'Goa';
    }

    return 'Goa';
  }, [listings, saved]);

  if (!user && !redirect) {
    return <Navigate to="/login" />;
  }

  if (redirect) {
    return <Navigate to={redirect} />;
  }

  const profileName = profile?.name || user?.name || 'Traveler';
  const profileEmail = profile?.email || user?.email || '—';
  const profileImage = profile?.picture || user?.picture;

  return (
    <div className="min-h-screen pb-16">
      <AccountNav />

      <div className="mx-auto mt-4 max-w-7xl space-y-6 px-4 md:px-6">
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6 shadow-2xl backdrop-blur-xl md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-5">
              <Avatar className="h-24 w-24 border border-white/20 md:h-28 md:w-28">
                {profileImage ? (
                  <AvatarImage src={profileImage} />
                ) : (
                  <AvatarFallback>{profileName?.slice(0, 1) || 'U'}</AvatarFallback>
                )}
              </Avatar>

              <div className="space-y-1">
                <h1 className="text-2xl font-semibold text-white md:text-3xl">{profileName}</h1>
                <p className="text-sm text-[#E5E7EB]/80">{profileEmail}</p>
                <p className="text-sm text-[#E5E7EB]/70">Member since {memberSince}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {trustBadges.length > 0 ? (
                    trustBadges.map((badge) => (
                      <span
                        key={badge}
                        className="inline-flex items-center gap-1 rounded-full border border-[#C9A96E]/30 bg-[#C9A96E]/10 px-2.5 py-1 text-xs text-[#EED7AF]"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" /> {badge}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[#E5E7EB]/60">No verifications yet.</span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-[#E5E7EB]">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[#E5E7EB]/80">Average rating</span>
                  <span className="inline-flex items-center gap-1 text-[#C9A96E]">
                    <Star className="h-4 w-4 fill-current" /> {formatDisplay(averageRating)}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <EditProfileDialog />
                <Button variant="secondary" className="bg-white/10 text-white hover:bg-white/20" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg">
              <div className="mb-2 flex items-center justify-between text-xs text-[#E5E7EB]/70">
                <span>{stat.label}</span>
                {stat.icon}
              </div>
              <div className="text-xl font-semibold text-white">{formatDisplay(stat.value)}</div>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {profileTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-xl px-3 py-2 text-sm transition ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-[#C9A96E] to-[#D4B896] text-[#0B1220] font-semibold'
                    : 'bg-white/5 text-[#E5E7EB] hover:bg-white/10'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {loading && <p className="text-sm text-[#E5E7EB]/70">Loading profile data...</p>}

          {!loading && activeTab === 'Listings' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Your Listings</h2>
                <Button
                  type="button"
                  className="bg-gradient-to-r from-[#C9A96E] to-[#D4B896] text-[#0B1220]"
                  onClick={() => navigate('/account/places/new')}
                >
                  <Plus className="mr-2 h-4 w-4" /> + Add Listing
                </Button>
              </div>

              {listings.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-[#E5E7EB]/70">
                  No listings yet.
                  <br />
                  Add your first unique space to start hosting.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {listings.map((listing, index) => {
                    const image =
                      listing?.photos?.[0] ||
                      listing?.images?.[0] ||
                      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=900&q=80';

                    return (
                      <article key={listing?._id || `listing-${index + 1}`} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                        <img src={image} alt={listing?.title || 'Listing'} className="h-44 w-full object-cover" />
                        <div className="space-y-2 p-4">
                          <h3 className="text-base font-medium text-white">{listing?.title || listing?.name || 'Untitled Listing'}</h3>
                          <p className="text-xs text-[#E5E7EB]/70">{listing?.address || 'Location unavailable'}</p>
                          <p className="text-sm text-[#C9A96E]">₹{listing?.price || '—'}/day</p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {!loading && activeTab === 'Bookings' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Bookings</h2>
              {hostBookings.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-[#E5E7EB]/70">
                  No bookings yet.
                  <br />
                  Once someone books your space it will appear here.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {hostBookings.map((booking, index) => {
                    const place = booking?.place || {};
                    const image =
                      place?.photos?.[0] ||
                      place?.images?.[0] ||
                      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=900&q=80';

                    const checkIn = booking?.checkIn ? new Date(booking.checkIn) : null;
                    const bookingDate = checkIn && !Number.isNaN(checkIn.getTime())
                      ? checkIn.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : 'N/A';

                    return (
                      <article key={booking?._id || `booking-${index + 1}`} className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                        <img src={image} alt={place?.title || 'Booked place'} className="h-24 w-24 rounded-xl object-cover" />
                        <div className="flex-1 space-y-1">
                          <h3 className="text-sm font-medium text-white">{place?.title || 'Booked Space'}</h3>
                          <p className="text-xs text-[#E5E7EB]/70">Check-in: {bookingDate}</p>
                          <p className="text-xs text-[#E5E7EB]/70">Guest: {booking?.name || '—'}</p>
                          <p className="text-xs text-[#E5E7EB]/70">Price: ₹{booking?.price || place?.price || '—'}</p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {!loading && activeTab === 'Reviews' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Reviews</h2>
              {reviews.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-[#E5E7EB]/70">
                  No reviews yet.
                  <br />
                  Reviews will appear after your first booking.
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((review, index) => (
                    <article key={review?.id || `review-${index + 1}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="font-medium text-white">{review?.reviewer || 'Guest'}</p>
                        <p className="text-xs text-[#E5E7EB]/60">
                          {review?.date ? new Date(review.date).toLocaleDateString('en-IN') : '—'}
                        </p>
                      </div>
                      <p className="text-sm text-[#E5E7EB]/80">{review?.comment || 'No written comment.'}</p>
                      <p className="mt-2 text-xs text-[#C9A96E]">Rating: {formatDisplay(review?.rating)}</p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {!loading && activeTab === 'Saved' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Saved / Wishlist</h2>
              {saved.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-[#E5E7EB]/70">
                  No saved places yet ❤️
                  <br />
                  Start exploring and tap the heart icon to save spaces.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {saved.map((place, index) => {
                    const image =
                      place?.photos?.[0] ||
                      place?.images?.[0] ||
                      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80';

                    return (
                      <article key={place?._id || place?.id || `saved-${index + 1}`} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                        <img src={image} alt={place?.title || place?.name || 'Saved Place'} className="h-40 w-full object-cover" />
                        <div className="space-y-1 p-4">
                          <h3 className="text-sm font-medium text-white">{place?.title || place?.name || 'Saved Place'}</h3>
                          <p className="text-xs text-[#E5E7EB]/70">{place?.address || place?.location || 'India'}</p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[#C9A96E]">₹{place?.price || '—'}/day</span>
                            <span className="inline-flex items-center gap-1 text-[#E5E7EB]">
                              <Heart className="h-4 w-4 fill-[#C9A96E] text-[#C9A96E]" />
                              {formatDisplay(place?.rating)}
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="mb-3 text-lg font-semibold text-white">Trust & Verification</h3>
            {trustBadges.length > 0 ? (
              <div className="space-y-2 text-sm text-[#E5E7EB]/85">
                {trustBadges.map((badge) => (
                  <div key={`trust-${badge}`} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1">
                    <ShieldCheck className="h-4 w-4 text-emerald-300" /> {badge}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#E5E7EB]/70">No verification badges yet.</p>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="mb-3 text-lg font-semibold text-white">Achievements</h3>
            {achievements.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {achievements.map((badge) => (
                  <span
                    key={`achievement-${badge}`}
                    className="rounded-full border border-[#C9A96E]/30 bg-[#C9A96E]/10 px-3 py-1 text-xs text-[#EED7AF]"
                  >
                    🏅 {badge}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#E5E7EB]/70">
                No achievements yet.
                <br />
                Complete bookings to unlock host badges.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h3 className="mb-2 text-lg font-semibold text-white">Recommended for You (ML)</h3>
          <p className="mb-4 text-sm text-[#E5E7EB]/70">
            Personalized using your real activity (saved places, bookings, and hosting data).
          </p>
          <MLFeaturedListings query={recommendationSeed} fallbackDestination="Goa" limit={4} />
        </section>
      </div>
    </div>
  );
};

export default ProfilePage;
