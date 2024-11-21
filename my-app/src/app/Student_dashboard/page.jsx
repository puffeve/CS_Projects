'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const emotions = [
  'Happy',
  'Sad',
  'Angry',
  'Surprised',
  'Fearful',
  'Disgusted',
  'Neutral'
];

const UploadEmotionImages = ({ userName }) => {
  const [images, setImages] = useState({
    Happy: null,
    Sad: null,
    Angry: null,
    Surprised: null,
    Fearful: null,
    Disgusted: null,
    Neutral: null,
  });

  const handleFileChange = (emotion, event) => {
    const file = event.target.files[0];
    if (file) {
      setImages({
        ...images,
        [emotion]: file,
      });
    }
  };

  const handleLogout = () => {
    // Add logout functionality here
    console.log('Logout clicked');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    // Process the uploaded images (e.g., send to server)
    console.log('Uploaded images:', images);
  };

  return (
    <div className="flex h-screen">
      {/* Left Sidebar */}
      <div className="w-1/6 bg-sky-200 text-black flex flex-col justify-between p-4">
        <div>
          <h1 className="text-2xl font-bold mb-4">ClassMood Insight</h1>
          <h2 className="text-xl font-semibold mb-6">{userName}</h2>
          <hr className="border-sky-300 mb-6" />
        </div>
        <button
          onClick={handleLogout}
          className="bg-pink-400 py-2 px-4 rounded-lg mt-auto hover:bg-pink-200 transition-colors"
        >
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto border-4 border-pink-100 rounded-lg shadow-xl bg-pink-50 p-8">
          <h2 className="text-3xl font-semibold mb-8 text-center">Upload Emotion Images</h2>
          <form onSubmit={handleSubmit}>
            {/* Top row with 4 emotion boxes */}
            <div className="grid grid-cols-4 gap-8 mb-8">
              {emotions.slice(0, 4).map((emotion) => (
                <div
                  key={emotion}
                  className="flex flex-col items-center justify-center border border-gray-300 rounded-lg p-4 w-64 h-64 bg-white shadow-md"
                >
                  <label className="text-lg font-bold mb-3">{emotion}</label>
                  {images[emotion] ? (
                    <img
                      src={URL.createObjectURL(images[emotion])}
                      alt={`${emotion} preview`}
                      className="w-48 h-48 object-cover rounded-lg mb-3"
                    />
                  ) : (
                    <div className="w-48 h-48 bg-gray-200 mb-3" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(emotion, e)}
                    className="block w-full p-2 text-white bg-pink-200 border-none rounded-lg cursor-pointer mt-3"
                  />
                </div>
              ))}
            </div>

            {/* Bottom row with 3 emotion boxes */}
            <div className="grid grid-cols-3 gap-8 mb-12">
              {emotions.slice(4).map((emotion) => (
                <div
                  key={emotion}
                  className="flex flex-col items-center justify-center border border-gray-300 rounded-lg p-4 w-64 h-64 bg-white shadow-md"
                >
                  <label className="text-lg font-bold mb-3">{emotion}</label>
                  {images[emotion] ? (
                    <img
                      src={URL.createObjectURL(images[emotion])}
                      alt={`${emotion} preview`}
                      className="w-48 h-48 object-cover rounded-lg mb-3"
                    />
                  ) : (
                    <div className="w-48 h-48 bg-gray-200 mb-3" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(emotion, e)}
                    className="block w-full p-2 text-white bg-pink-200 border-none rounded-lg cursor-pointer mt-3"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                className="px-8 py-3 bg-pink-400 text-white font-semibold rounded-lg hover:bg-pink-200 transition-colors"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UploadEmotionImages;