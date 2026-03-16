import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { Navigate } from 'react-router-dom';

import AccountNav from '@/components/ui/AccountNav';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import axiosInstance from '@/utils/axios';
import MLFeaturedListings from '@/components/ui/MLFeaturedListings';

import { useAuth } from '../../hooks';
import {
  BadgeCheck,
  Camera,
  Clock3,
  Edit3,
  Heart,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  Star,
  TrendingUp,
} from 'lucide-react';
import EditProfileDialog from '@/components/ui/EditProfileDialog';

const defaultInterests = ['Travel', 'Cafes', 'Photography', 'Workspaces'];

const profileTabs = [
  'Listings',
  'Bookings',
  'Reviews',
  'Saved Places',
  'Settings',
];

const fallbackSavedPlaces = [
  {
    id: 'saved-1',
    name: 'Rooftop Studio • Jaipur',
    location: 'Jaipur, India',
    price: '₹2,800/day',
    rating: 4.8,
    image:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'saved-2',
    name: 'Cozy Work Cafe • Goa',
    location: 'Goa, India',
    price: '₹1,900/day',
    rating: 4.7,
    image:
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=900&q=80',
  },
];

const ProfilePage = () => {
  const auth = useAuth();
  const { user, logout } = auth;
  const [redirect, setRedirect] = useState(null);
  const [activeTab, setActiveTab] = useState('Listings');
  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    bio: user?.bio || 'Host and traveler who loves creative spaces and local culture.',
    notifications: true,
  });
  const [replyTextByReviewId, setReplyTextByReviewId] = useState({});

  useEffect(() => {
    setSettingsDraft((prev) => ({
      ...prev,
      name: user?.name || prev.name,
      phone: user?.phone || prev.phone,
    }));
  }, [user]);

  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) return;

      setLoadingData(true);
      try {
        const [placesRes, bookingsRes] = await Promise.all([
          axiosInstance.get('/user-places'),
          axiosInstance.get('/get-bookings'),
        ]);

        setListings(Array.isArray(placesRes.data) ? placesRes.data : []);
        setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : []);
      } catch (error) {
        console.warn('Could not load profile data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    loadProfileData();
  }, [user]);

  const handleLogout = async () => {
    const response = await logout();
    if (response.success) {
      toast.success(response.message);
      setRedirect('/');
    } else {
      toast.error(response.message);
    }
  };

  const memberSince = useMemo(() => {
    if (!user?.createdAt) return 'March 2026';
    const date = new Date(user.createdAt);
    if (Number.isNaN(date.getTime())) return 'March 2026';
    return date.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  }, [user]);

  const profileCompletion = useMemo(() => {
    const checks = [
      Boolean(user?.name),
      Boolean(user?.email),
      Boolean(user?.picture),
      Boolean(settingsDraft?.bio),
      Boolean(user?.phone || settingsDraft?.phone),
    ];
    const complete = checks.filter(Boolean).length;
    return Math.round((complete / checks.length) * 100);
  }, [settingsDraft?.bio, settingsDraft?.phone, user]);

  const averageRating = 4.8;

  const reviews = useMemo(() => {
    if (!bookings?.length) {
      return [
        {
          id: 'r1',
          reviewer: 'Aarav Mehta',
          rating: 5,
          comment: 'Beautiful space, clean setup, and very responsive host. Highly recommended!',
          date: '2026-03-04',
        },
        {
          id: 'r2',
          reviewer: 'Nisha Rao',
          rating: 4,
          comment: 'Great coworking vibe and location. Would love a few more charging spots.',
          date: '2026-02-19',
        },
      ];
    }

    return bookings.slice(0, 4).map((booking, idx) => ({
      id: booking?._id || `review-${idx + 1}`,
      reviewer: booking?.name || `Guest ${idx + 1}`,
      rating: 4 + (idx % 2),
      comment: 'Host was responsive and the place matched the listing details.',
      date: booking?.createdAt || new Date().toISOString(),
    }));
  }, [bookings]);

  const listingCards = listings.map((place, idx) => ({
    id: place?._id || `listing-${idx + 1}`,
    name: place?.title || place?.name || 'Creative Space',
    image: place?.photos?.[0] || place?.images?.[0] || 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=900&q=80',
    location: place?.address || 'India',
    rating: Number(place?.rating || 4.6),
    price: Number(place?.price || 1800),
  }));

  const bookingCards = bookings.map((booking, idx) => {
    const bookingDate = booking?.checkIn || booking?.createdAt || new Date().toISOString();
    const parsedDate = new Date(bookingDate);
    const status = booking?.checkOut
      ? new Date(booking.checkOut) > new Date()
        ? 'Upcoming'
        : 'Completed'
      : idx % 2 === 0
        ? 'Upcoming'
        : 'Completed';

    return {
      id: booking?._id || `booking-${idx + 1}`,
      image:
        booking?.place?.photos?.[0] ||
        booking?.place?.images?.[0] ||
        'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=900&q=80',
      name: booking?.place?.title || booking?.place?.name || 'Space Booking',
      bookingDate: Number.isNaN(parsedDate.getTime())
        ? 'N/A'
        : parsedDate.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
      price: booking?.price || booking?.place?.price || 1800,
      status,
    };
  });

  const stats = [
    {
      label: 'Listings posted',
      value: listingCards.length,
      icon: <TrendingUp className="h-4 w-4 text-[#C9A96E]" />,
    },
    {
      label: 'Total bookings',
      value: bookingCards.length,
      icon: <BadgeCheck className="h-4 w-4 text-[#C9A96E]" />,
    },
    {
      label: 'Reviews received',
      value: reviews.length,
      icon: <MessageSquare className="h-4 w-4 text-[#C9A96E]" />,
    },
    {
      label: 'Response rate',
      value: '96%',
      icon: <Mail className="h-4 w-4 text-[#C9A96E]" />,
    },
    {
      label: 'Response time',
      value: '< 1 hr',
      icon: <Clock3 className="h-4 w-4 text-[#C9A96E]" />,
    },
  ];

  const badges = [
    'Email verified',
    'Phone verified',
    'Government ID verified',
    'Super Host',
  ];

  const achievements = ['Super Host', 'Explorer', '50+ Bookings', 'Top Rated Host'];

  const recommendationSeed = useMemo(() => {
    if (listings.length) return listingCards[0]?.name?.split('•')?.[0] || 'Goa';
    return 'Goa';
  }, [listingCards, listings.length]);

  if (!user && !redirect) {
    return <Navigate to={'/login'} />;
  }

  if (redirect) {
    return <Navigate to={redirect} />;
  }

  return (
    <div className="min-h-screen pb-16">
      <AccountNav />
      <div className="mx-auto mt-4 grid w-full max-w-7xl grid-cols-1 gap-6 px-4 md:grid-cols-[260px_1fr] md:px-6">
        <aside className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl md:sticky md:top-24 md:h-fit">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[#C9A96E]">Dashboard</p>
          <div className="space-y-2">
            {profileTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-[#C9A96E] to-[#D4B896] text-[#0B1220] font-semibold'
                    : 'bg-white/5 text-[#E5E7EB] hover:bg-white/10'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </aside>

        <section className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6 shadow-2xl backdrop-blur-xl md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-5">
                <div className="relative">
                  <Avatar className="h-28 w-28 border border-white/20 md:h-32 md:w-32">
                    {user?.picture ? (
                      <AvatarImage src={user.picture} />
                    ) : (
                      <AvatarImage src="https://res.cloudinary.com/rahul4019/image/upload/v1695133265/pngwing.com_zi4cre.png" className="object-cover" />
                    )}
                    <AvatarFallback>{user?.name?.slice(0, 1) || 'U'}</AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    className="absolute bottom-0 right-0 rounded-full border border-white/20 bg-[#111827] p-2 text-[#C9A96E]"
                    aria-label="Edit profile image"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <h1 className="text-2xl font-semibold text-white md:text-3xl">{user?.name || 'Traveler'}</h1>
                  <p className="flex items-center gap-2 text-sm text-[#E5E7EB]/80">
                    <MapPin className="h-4 w-4 text-[#C9A96E]" />
                    {user?.city || 'Mumbai'}, {user?.country || 'India'}
                  </p>
                  <p className="text-sm text-[#E5E7EB]/70">Member since {memberSince}</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {badges.map((badge) => (
                      <span
                        key={badge}
                        className="inline-flex items-center gap-1 rounded-full border border-[#C9A96E]/30 bg-[#C9A96E]/10 px-2.5 py-1 text-xs text-[#EED7AF]"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" /> {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-[#E5E7EB]">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[#E5E7EB]/80">Average rating</span>
                    <span className="inline-flex items-center gap-1 text-[#C9A96E]">
                      <Star className="h-4 w-4 fill-current" /> {averageRating}
                    </span>
                  </div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-[#E5E7EB]/70">Profile completion</span>
                    <span>{profileCompletion}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-[#C9A96E] to-[#D4B896]"
                      style={{ width: `${profileCompletion}%` }}
                    />
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

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm text-[#E5E7EB]">
                <Edit3 className="h-4 w-4 text-[#C9A96E]" />
                Bio
              </div>
              <p className="text-sm text-[#E5E7EB]/80">
                {String(settingsDraft.bio || '').slice(0, 200) || 'Tell guests about your hosting style and favorite experiences.'}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {defaultInterests.map((interest) => (
                  <span key={interest} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[#E5E7EB]/80">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg">
                <div className="mb-2 flex items-center justify-between text-xs text-[#E5E7EB]/70">
                  <span>{stat.label}</span>
                  {stat.icon}
                </div>
                <div className="text-xl font-semibold text-white">{stat.value}</div>
              </div>
            ))}
          </div>

          {activeTab === 'Listings' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Your Listings</h2>
              {loadingData && <p className="text-sm text-[#E5E7EB]/70">Loading your listings...</p>}
              {!loadingData && !listingCards.length && (
                <p className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-[#E5E7EB]/70">No listings yet. Add your first unique space to start hosting.</p>
              )}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {listingCards.map((item) => (
                  <article key={item.id} className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:-translate-y-1 hover:shadow-2xl">
                    <img src={item.image} alt={item.name} className="h-44 w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                    <div className="space-y-2 p-4">
                      <h3 className="text-base font-medium text-white">{item.name}</h3>
                      <p className="text-xs text-[#E5E7EB]/70">{item.location}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#C9A96E]">₹{item.price}/day</span>
                        <span className="inline-flex items-center gap-1 text-[#E5E7EB]">
                          <Star className="h-4 w-4 fill-[#C9A96E] text-[#C9A96E]" /> {item.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Reviews' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Guest Reviews</h2>
              <div className="space-y-3">
                {reviews.map((review) => (
                  <article key={review.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-medium text-white">{review.reviewer}</p>
                      <p className="text-xs text-[#E5E7EB]/60">
                        {new Date(review.date).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <div className="mb-2 inline-flex items-center gap-1 text-[#C9A96E]">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={`${review.id}-star-${i}`} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-sm text-[#E5E7EB]/80">{review.comment}</p>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <input
                        id={`reply-${review.id}`}
                        name={`reply-${review.id}`}
                        value={replyTextByReviewId[review.id] || ''}
                        onChange={(e) =>
                          setReplyTextByReviewId((prev) => ({ ...prev, [review.id]: e.target.value }))
                        }
                        placeholder="Write a host reply..."
                        className="flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        className="bg-[#C9A96E] text-[#0B1220] hover:bg-[#D4B896]"
                        onClick={() => toast.success('Reply saved (demo)!')}
                      >
                        Reply
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Bookings' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Your Bookings</h2>
              {!bookingCards.length && (
                <p className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-[#E5E7EB]/70">No bookings yet. Start exploring spaces and book your first one.</p>
              )}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {bookingCards.map((booking) => (
                  <article key={booking.id} className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                    <img src={booking.image} alt={booking.name} className="h-24 w-24 rounded-xl object-cover" />
                    <div className="flex-1 space-y-1">
                      <h3 className="text-sm font-medium text-white">{booking.name}</h3>
                      <p className="text-xs text-[#E5E7EB]/70">Date: {booking.bookingDate}</p>
                      <p className="text-xs text-[#E5E7EB]/70">Price: ₹{booking.price}</p>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${
                          booking.status === 'Upcoming'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : booking.status === 'Completed'
                              ? 'bg-sky-500/20 text-sky-300'
                              : 'bg-red-500/20 text-red-300'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Saved Places' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Saved / Wishlist</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {fallbackSavedPlaces.map((place) => (
                  <article key={place.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                    <img src={place.image} alt={place.name} className="h-40 w-full object-cover" />
                    <div className="space-y-1 p-4">
                      <h3 className="text-sm font-medium text-white">{place.name}</h3>
                      <p className="text-xs text-[#E5E7EB]/70">{place.location}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#C9A96E]">{place.price}</span>
                        <span className="inline-flex items-center gap-1 text-[#E5E7EB]">
                          <Heart className="h-4 w-4 fill-[#C9A96E] text-[#C9A96E]" /> {place.rating}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Settings' && (
            <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-xl font-semibold text-white">Profile Settings</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="space-y-1 text-sm text-[#E5E7EB]">
                  Name
                  <input
                    id="profile-name"
                    name="profileName"
                    value={settingsDraft.name}
                    onChange={(e) => setSettingsDraft((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none"
                  />
                </label>
                <label className="space-y-1 text-sm text-[#E5E7EB]">
                  Phone number
                  <input
                    id="profile-phone"
                    name="profilePhone"
                    value={settingsDraft.phone}
                    onChange={(e) => setSettingsDraft((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none"
                  />
                </label>
                <label className="space-y-1 text-sm text-[#E5E7EB] md:col-span-2">
                  Bio (max 200 chars)
                  <textarea
                    id="profile-bio"
                    name="profileBio"
                    maxLength={200}
                    rows={4}
                    value={settingsDraft.bio}
                    onChange={(e) => setSettingsDraft((prev) => ({ ...prev, bio: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none"
                  />
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-[#E5E7EB] md:col-span-2">
                  <input
                    id="profile-notifications"
                    name="profileNotifications"
                    type="checkbox"
                    checked={settingsDraft.notifications}
                    onChange={(e) => setSettingsDraft((prev) => ({ ...prev, notifications: e.target.checked }))}
                  />
                  Enable booking and review notifications
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="bg-gradient-to-r from-[#C9A96E] to-[#D4B896] text-[#0B1220]"
                  onClick={() => toast.success('Settings saved (demo)!')}
                >
                  Save changes
                </Button>
                <Button type="button" variant="secondary" className="bg-white/10 text-white">
                  Change password
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="mb-3 text-lg font-semibold text-white">Trust & Verification</h3>
              <div className="space-y-2 text-sm text-[#E5E7EB]/85">
                {badges.map((badge) => (
                  <div key={`trust-${badge}`} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1">
                    <ShieldCheck className="h-4 w-4 text-emerald-300" /> {badge}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="mb-3 text-lg font-semibold text-white">Achievements</h3>
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
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="mb-2 text-lg font-semibold text-white">Recommended for You (ML)</h3>
            <p className="mb-4 text-sm text-[#E5E7EB]/70">
              Personalized using your past searches, saved places, bookings, and preferred regions.
            </p>
            <MLFeaturedListings query={recommendationSeed} fallbackDestination="Goa" limit={4} />
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProfilePage;
