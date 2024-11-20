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
  
  const UploadEmotionImages = () => {
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
  
    const handleSubmit = (event) => {
      event.preventDefault();
      // Process the uploaded images (e.g., send to server)
      console.log('Uploaded images:', images);
    };
  
    return (
      <div className="max-w-7xl mx-auto p-10 border-4 border-gray-300 rounded-lg shadow-xl bg-gray-100 text-center relative top-10">
        <h2 className="text-3xl font-semibold mb-8">Upload Emotion Images</h2>
        <form onSubmit={handleSubmit}>
          {/* Top row with 4 emotion boxes */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            {emotions.slice(0, 4).map((emotion) => (
              <div
                key={emotion}
                className="flex flex-col items-center justify-center border border-gray-300 rounded-lg p-4 w-72 h-72 bg-white shadow-md"
              >
                <label className="text-lg font-bold mb-3">{emotion}</label>
                {images[emotion] ? (
                  <img
                    src={URL.createObjectURL(images[emotion])}
                    alt={`${emotion} preview`}
                    className="w-56 h-56 object-cover rounded-lg mb-3" // ขยายขนาดภาพที่แสดง
                  />
                ) : (
                  <div className="w-56 h-56 bg-gray-200 mb-3" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(emotion, e)}
                  className="block w-full p-1 text-white bg-purple-400 border-none rounded-lg cursor-pointer mt-3"
                />
              </div>
            ))}
          </div>
  
          {/* Bottom row with 3 emotion boxes */}
          <div className="grid grid-cols-3 gap-6">
            {emotions.slice(4).map((emotion) => (
              <div
                key={emotion}
                className="flex flex-col items-center justify-center border border-gray-300 rounded-lg p-4 w-72 h-72 bg-white shadow-md"
              >
                <label className="text-lg font-bold mb-3">{emotion}</label>
                {images[emotion] ? (
                  <img
                    src={URL.createObjectURL(images[emotion])}
                    alt={`${emotion} preview`}
                    className="w-56 h-56 object-cover rounded-lg mb-3" // ขยายขนาดภาพที่แสดง
                  />
                ) : (
                  <div className="w-56 h-56 bg-gray-200 mb-3" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(emotion, e)}
                  className="block w-full p-1 text-white bg-purple-400 border-none rounded-lg cursor-pointer mt-3"
                />
              </div>
            ))}
          </div>
  
          <button
            type="submit"
            className="mt-8 px-6 py-3 bg-pink-500 text-white font-semibold rounded-lg hover:bg-pink-300 transition-colors"
          >
            Save
          </button>
        </form>
      </div>
    );
  };
  
  export default UploadEmotionImages;
  