import React, { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import axiosInstance from '@/utils/axios';

import AccountNav from '@/components/ui/AccountNav';
import Perks from '@/components/ui/Perks';
import PhotosUploader from '@/components/ui/PhotosUploader';
import Spinner from '@/components/ui/Spinner';

const PlacesFormPage = () => {
  const { id } = useParams();
  const [redirect, setRedirect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addedPhotos, setAddedPhotos] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    address: '',
    description: '',
    perks: [],
    extraInfo: '',
    checkIn: '',
    checkOut: '',
    maxGuests: 10,
    price: 500,
  });

  const {
    title,
    address,
    description,
    perks,
    extraInfo,
    checkIn,
    checkOut,
    maxGuests,
    price,
  } = formData;

  const fieldClass =
    'mt-2 w-full rounded-xl border border-[#2E4D67] bg-[#10273A] px-4 py-3 text-[#E6EDF3] placeholder:text-[#6B7C93] focus:border-[#D4AF7F] focus:outline-none focus:ring-2 focus:ring-[#D4AF7F]/40';
  const areaClass = `${fieldClass} min-h-[160px] resize-y`;

  const isValidPlaceData = () => {
    if (title.trim() === '') {
      toast.error("Title can't be empty!");
      return false;
    } else if (address.trim() === '') {
      toast.error("Address can't be empty!");
      return false;
    } else if (addedPhotos.length < 5) {
      toast.error('Upload at least 5 photos!');
      return false;
    } else if (description.trim() === '') {
      toast.error("Description can't be empty!");
      return false;
    } else if (maxGuests < 1) {
      toast.error('At least one guests is required!');
      return false;
    } else if (maxGuests > 10) {
      toast.error("Max. guests can't be greater than 10");
      return false;
    }

    return true;
  };

  const handleFormData = (e) => {
    const { name, value, type } = e.target;
    // If the input is not a checkbox, update 'formData' directly
    if (type !== 'checkbox') {
      setFormData({ ...formData, [name]: value });
      return;
    }

    // If type is checkbox (perks)
    if (type === 'checkbox') {
      const currentPerks = [...perks];
      let updatedPerks = [];

      // Check if the perk is already in perks array
      if (currentPerks.includes(name)) {
        updatedPerks = currentPerks.filter((perk) => perk !== name);
      } else {
        updatedPerks = [...currentPerks, name];
      }
      setFormData({ ...formData, perks: updatedPerks });
    }
  };

  useEffect(() => {
    if (!id) {
      return;
    }
    setLoading(true);
    axiosInstance.get(`/places/${id}`).then((response) => {
      const { place } = response.data;
      // update the state of formData
      for (let key in formData) {
        if (place.hasOwnProperty(key)) {
          setFormData((prev) => ({
            ...prev,
            [key]: place[key],
          }));
        }
      }

      // update photos state separately
      setAddedPhotos([...place.photos]);

      setLoading(false);
    });
  }, [id]);

  const preInput = (header, description) => {
    return (
      <>
        <h2 className="mt-6 text-2xl font-semibold text-[#E6EDF3]">{header}</h2>
        <p className="mt-1 text-sm text-[#A9B4C2]">{description}</p>
      </>
    );
  };

  const savePlace = async (e) => {
    e.preventDefault();

    const formDataIsValid = isValidPlaceData();
    // console.log(isValidPlaceData());
    const placeData = { ...formData, addedPhotos };

    // Make API call only if formData is valid
    if (formDataIsValid) {
      if (id) {
        // update existing place
        const { data } = await axiosInstance.put('/update-place', {
          id,
          ...placeData,
        });
      } else {
        // new place
        const { data } = await axiosInstance.post(
          '/add-place',
          placeData,
        );
      }
      setRedirect(true);
    }
  };

  if (redirect) {
    return <Navigate to={'/account/places'} />;
  }

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="min-h-screen bg-[#0B1C2C] p-4 text-[#E6EDF3]">
      <AccountNav />
      <form onSubmit={savePlace} className="mx-auto mt-4 max-w-6xl space-y-6 rounded-2xl border border-[#24415A] bg-[#10273A] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
        {preInput(
          'Title',
          'Title for your place. Keep it short, meaningful, and traveler-friendly.',
        )}
        <input
          type="text"
          name="title"
          value={title}
          onChange={handleFormData}
          placeholder="title, for example: My lovely apt"
          className={fieldClass}
        />

        {preInput('Address', 'address to this place')}
        <input
          type="text"
          name="address"
          value={address}
          onChange={handleFormData}
          placeholder="address"
          className={fieldClass}
        />

        {preInput('Photos', 'Upload at least 5 clear photos to help users trust your listing.')}

        <PhotosUploader
          addedPhotos={addedPhotos}
          setAddedPhotos={setAddedPhotos}
        />

        {preInput('Description', 'Describe your place for users: vibe, nearby attractions, and what makes it special.')}
        <textarea
          value={description}
          name="description"
          onChange={handleFormData}
          className={areaClass}
        />

        {preInput('Perks', 'Select all the perks available at your place.')}
        <Perks selected={perks} handleFormData={handleFormData} />

        {preInput('Extra info', 'House rules, check-in details, safety notes, etc.')}
        <textarea
          value={extraInfo}
          name="extraInfo"
          onChange={handleFormData}
          className={areaClass}
        />

        {preInput(
          'Number of guests & Price',
          // 'add check in and out times, remember to have some time window forcleaning the room between guests. '
          'Specify the maximum number of guests so that the client stays within the limit.',
        )}
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <h3 className="mt-2 -mb-1 text-sm text-[#A9B4C2]">Max no. of guests</h3>
            <input
              type="text"
              name="maxGuests"
              value={maxGuests}
              onChange={handleFormData}
              placeholder="1"
              className={fieldClass}
            />
          </div>
          <div>
            <h3 className="mt-2 -mb-1 text-sm text-[#A9B4C2]">Price per night</h3>
            <input
              type="number"
              name="price"
              value={price}
              onChange={handleFormData}
              placeholder="1"
              className={fieldClass}
            />
          </div>
        </div>
        <button className="mx-auto my-6 flex rounded-xl bg-gradient-to-r from-[#D4AF7F] to-[#E2C59C] py-3 px-20 text-xl font-semibold text-[#0B1C2C] shadow-lg transition hover:brightness-105">
          Save
        </button>
      </form>
    </div>
  );
};

export default PlacesFormPage;
