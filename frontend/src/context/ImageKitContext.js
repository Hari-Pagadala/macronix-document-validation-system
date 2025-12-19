import React from 'react';

/**
 * ImageKit Context provider for Super Admin
 * Provides configuration for ImageKit image display
 * (Simplified - uses regular image optimization)
 */
export const ImageKitContext = React.createContext({
  publicKey: 'public_jnmn+DPEtMjBKnAKHgFbNRN4OxA=',
  urlEndpoint: 'https://ik.imagekit.io/g6rdi7spf',
  transformationPosition: 'path',
});

export const ImageKitProvider = ({ children }) => {
  const imageKitConfig = {
    publicKey: 'public_jnmn+DPEtMjBKnAKHgFbNRN4OxA=',
    urlEndpoint: 'https://ik.imagekit.io/g6rdi7spf',
    transformationPosition: 'path',
  };

  return (
    <ImageKitContext.Provider value={imageKitConfig}>
      {children}
    </ImageKitContext.Provider>
  );
};

export default ImageKitProvider;
