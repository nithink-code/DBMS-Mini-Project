import React from 'react';

const ImageTest = () => {
  const testImages = [
    '/images/hosts/ranveer-allahbadia.jpg',
    '/images/hosts/nikhil-kamath.jpg',
    '/images/hosts/raj-shamani.jpg',
    '/images/hosts/varun-mayya.jpg',
    '/images/hosts/tanmay-bhat.jpg',
    '/images/hosts/ankur-warikoo.jpg'
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h2>Image Loading Test</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        {testImages.map((imagePath, index) => {
          const fullPath = `${process.env.PUBLIC_URL || ''}${imagePath}`;
          return (
            <div key={index} style={{ border: '1px solid #ccc', padding: '10px' }}>
              <h4>{imagePath.split('/').pop()}</h4>
              <p>Full path: {fullPath}</p>
              <img 
                src={fullPath}
                alt={`Test ${index}`}
                style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                onLoad={() => console.log(`✓ Loaded: ${fullPath}`)}
                onError={(e) => {
                  console.error(`✗ Failed: ${fullPath}`);
                  e.target.style.border = '2px solid red';
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ImageTest;